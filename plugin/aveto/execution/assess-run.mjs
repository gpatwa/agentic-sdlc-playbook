#!/usr/bin/env node
// assess-run.mjs — one command for a whole assessment (docs/REVIEW_MODE_PLAN.md, M1 to M5 chained).
//
//   node assess-run.mjs <repo> --reviewer codex|claude [--scratch <dir>] [--model <name>] [--effort <level>]
//        [--seeds <seeds.json>] [--cap-tokens N] [--area-tokens N] [--scope <subdir>]... [--date YYYY-MM-DD] [--dry-run]
//
// It chains the pieces that already exist and adds no review logic of its own:
//   prepare (assess-guard) -> map (repo-map) -> plan (assess-plan) -> one read-only reviewer call per area -> verify (assess-guard) -> report
//   (assess-report) -> score (assess-calibrate, only when --seeds is given).
// The reviewers cannot write (sandbox read-only for Codex; permission rules in the copy for Claude), so the area prompt is
// extended to ask for findings as table rows in the reply, and this script appends them to reviews/FINDINGS.md.
//
// The model is never taken from the reviewer tool's own configuration: a default the account cannot use fails before any code
// is read (seen with Codex on 2026-11-02). Pass --model, or accept the default named below, and the choice is recorded in
// reviews/RUN.md next to the tool version.
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { prepare, verify } from "./assess-guard.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const today = () => new Date().toISOString().slice(0, 10);

export const REVIEWERS = {
  codex: { family: "openai", model: "gpt-5.6-sol", effort: "medium", version: ["codex", ["--version"]] },
  claude: { family: "anthropic", model: "claude-sonnet-5-5", effort: "high", version: ["claude", ["--version"]] },
};

export const OUTPUT_RULES = `
## How to report (overrides step 4 above)

You cannot write files. Reply with findings only, one table row per finding, in exactly this form and nothing else on the row:

| id | P0|P1|P2|P3 | path/to/file.py:LINE | what is wrong and what triggers it | evidence: the exact code you read |

Use any id (it is renumbered). Report only findings you confirmed in the code, each with a file and line. If there are none, reply
with the single line "No findings." After the rows, list the listed files you did not read and why.
`;

/** The command line for one area. The prompt goes in on stdin; the reply is read from stdout (claude) or the -o file (codex). */
export function reviewerCommand(reviewer, { clone, model, effort, outFile }) {
  if (reviewer === "codex") {
    return { cmd: "codex", args: ["exec", "-m", model, "-c", `model_reasoning_effort=${effort}`, "-c", "service_tier=default",
      "-s", "read-only", "--skip-git-repo-check", "--ephemeral", "-C", clone, "-o", outFile, "-"], reply: "file" };
  }
  if (reviewer === "claude") {
    return { cmd: "claude", args: ["-p", "--model", model, "--effort", effort, "--allowedTools", "Read,Grep,Glob",
      "--disallowedTools", "Edit,Write,NotebookEdit,Bash"], reply: "stdout" };
  }
  throw new Error(`unknown reviewer "${reviewer}": use codex or claude`);
}

/** Cells of a table row, splitting on pipes that are not inside a backtick span. A pipe left inside a cell would add a
 * column and shift the reviewer and disposition, so those are replaced by a broken bar. */
export function splitCells(text) {
  const cells = []; let cur = "", code = false;
  for (const ch of text) {
    if (ch === "`") code = !code;
    if (ch === "|" && !code) { cells.push(cur.trim()); cur = ""; } else cur += ch === "|" ? "\u00a6" : ch;
  }
  cells.push(cur.trim());
  return cells;
}

export const LIMIT = /usage limit|rate limit|quota|too many requests|credits/i;

const ROW = /^\|\s*[^|]*\|\s*(P[0-3]|note)\s*\|\s*([^|]*?:\d[^|]*?)\s*\|(.*)$/i;

/** Table rows out of a reviewer's reply, as FINDINGS.md rows for area `area`. Rows without a file and line are dropped. */
export function extractRows(text, area, reviewerName, startAt = 1) {
  const rows = [];
  for (const line of String(text).split("\n")) {
    const m = line.trim().match(ROW);
    if (!m) continue;
    const [, sev, where, rest] = m;
    const cells = splitCells(rest.replace(/\|\s*$/, ""));
    const finding = cells[0] ?? "";
    const evidence = cells.slice(1).join(" / ");
    if (!finding) continue;
    rows.push(`| F-${String(area).padStart(2, "0")}-${startAt + rows.length} | ${sev.toUpperCase()} | ${where} | ${finding} | ${evidence} | ${reviewerName} | open |`);
  }
  return rows;
}

const node = (script, args) => execFileSync(process.execPath, [join(here, script), ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

function toolVersion(reviewer) {
  const [cmd, args] = REVIEWERS[reviewer].version;
  try { return execFileSync(cmd, args, { encoding: "utf8" }).trim(); } catch { return "unknown"; }
}

/**
 * Runs the whole assessment. `runner(command, prompt, cwd)` must return {status, stdout}; tests pass a fake one.
 * Returns {clone, reportPath, scorePath, failed, rows, verified}.
 */
export function run(repo, opts, runner = defaultRunner) {
  const { reviewer, scratch, date = today(), seeds, scope = [], capTokens, areaTokens, dryRun = false } = opts;
  if (!REVIEWERS[reviewer]) throw new Error(`--reviewer must be codex or claude`);
  const model = opts.model ?? REVIEWERS[reviewer].model;
  const effort = opts.effort ?? REVIEWERS[reviewer].effort;
  const guard = prepare(repo, scratch);
  const records = join(guard.clone, "reviews");
  const mapArgs = [guard.clone, "--out", records, "--date", date];
  for (const sc of scope) mapArgs.push("--scope", sc);
  node("repo-map.mjs", mapArgs);
  const planArgs = [guard.clone, "--out", records, "--date", date];
  if (capTokens) planArgs.push("--cap-tokens", String(capTokens));
  if (areaTokens) planArgs.push("--area-tokens", String(areaTokens));
  for (const s of scope) planArgs.push("--scope", s);
  node("assess-plan.mjs", planArgs);

  const areaFiles = readdirSync(join(records, "areas")).filter((f) => /^\d+-.*\.md$/.test(f)).sort();
  const name = `${reviewer}`;
  let rows = 0; const failed = [];
  const log = [`# Run record`, ``, `- reviewer: ${reviewer} (${REVIEWERS[reviewer].family} family), model \`${model}\`, reasoning \`${effort}\``,
    `- tool: ${toolVersion(reviewer)}`, `- repo: ${guard.repo} at ${guard.sha}`, `- date: ${date}`, `- areas planned: ${areaFiles.length}`, ``];
  if (dryRun) { writeFileSync(join(records, "RUN.md"), log.join("\n") + "\n- dry run: no reviewer was called\n"); return { clone: guard.clone, areas: areaFiles.length, dryRun: true }; }

  for (const f of areaFiles) {
    const area = Number(f.match(/^(\d+)/)[1]);
    const prompt = readFileSync(join(records, "areas", f), "utf8") + OUTPUT_RULES;
    const outFile = join(records, `reply-${f}`);
    const spec = reviewerCommand(reviewer, { clone: guard.clone, model, effort, outFile });
    const res = runner(spec, prompt, guard.clone);
    const reply = spec.reply === "file" && existsSync(outFile) ? readFileSync(outFile, "utf8") : res.stdout ?? "";
    if (res.status !== 0 || !reply.trim()) {
      const why = String(res.stderr ?? res.stdout ?? "").replace(/\s+/g, " ").trim().slice(-200);
      failed.push(f); log.push(`- area ${f}: FAILED (exit ${res.status}); not reviewed${why ? `; reviewer said: ${why}` : ""}`);
      if (LIMIT.test(why)) { // a usage or rate limit will fail every remaining area too: stop, and say so
        for (const rest of areaFiles.slice(areaFiles.indexOf(f) + 1)) { failed.push(rest); log.push(`- area ${rest}: not attempted (reviewer usage limit)`); }
        break;
      }
      continue;
    }
    writeFileSync(join(records, `reply-${f}`), reply);
    const found = extractRows(reply, area, name);
    if (found.length) appendFileSync(join(records, "FINDINGS.md"), found.join("\n") + "\n");
    rows += found.length;
    log.push(`- area ${f}: ${found.length} finding(s)`);
  }
  writeFileSync(join(records, "RUN.md"), log.join("\n") + "\n");

  const verified = verify(guard);
  const reportArgs = [records, "--reviewers", `${name}:${REVIEWERS[reviewer].family}`, "--guard", join(resolve(scratch), "guard.json"), "--date", date];
  let reportPath = null, scorePath = null, reportError = null;
  try { node("assess-report.mjs", reportArgs); reportPath = join(records, "REPORT.md"); } catch (e) { reportError = String(e.stderr || e.message).trim(); }
  if (seeds && existsSync(seeds)) {
    scorePath = join(records, "SCORE.md");
    writeFileSync(scorePath, node("assess-calibrate.mjs", ["--seeds", resolve(seeds), "--findings", join(records, "FINDINGS.md")]));
  }
  return { clone: guard.clone, records, reportPath, scorePath, failed, rows, verified, reportError, areas: areaFiles.length };
}

export function defaultRunner(spec, prompt, cwd) {
  const r = spawnSync(spec.cmd, spec.args, { input: prompt, cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status ?? 1, stdout: r.stdout, stderr: r.stderr };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const val = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const multi = (k) => a.flatMap((x, i) => (x === k ? [a[i + 1]] : []));
  const flagged = new Set(["--reviewer", "--scratch", "--model", "--effort", "--seeds", "--cap-tokens", "--area-tokens", "--scope", "--date"]);
  const repo = a.find((x, i) => !x.startsWith("--") && !flagged.has(a[i - 1]));
  const reviewer = val("--reviewer");
  if (!repo || !REVIEWERS[reviewer]) { console.error("usage: node assess-run.mjs <repo> --reviewer codex|claude [--scratch dir] [--model m] [--effort e] [--seeds seeds.json] [--cap-tokens N] [--area-tokens N] [--scope dir]... [--date YYYY-MM-DD] [--dry-run]"); process.exit(2); }
  const scratch = val("--scratch") ?? join(process.env.TMPDIR ?? "/tmp", `assess-${Date.now()}`);
  try {
    const r = run(repo, { reviewer, scratch, model: val("--model"), effort: val("--effort"), seeds: val("--seeds"), date: val("--date"),
      scope: multi("--scope"), capTokens: val("--cap-tokens"), areaTokens: val("--area-tokens"), dryRun: a.includes("--dry-run") });
    if (r.dryRun) { console.log(`dry run: ${r.areas} area(s) planned in ${r.clone}/reviews`); process.exit(0); }
    console.log(`reviewed ${r.areas - r.failed.length} of ${r.areas} area(s); ${r.rows} finding(s)`);
    console.log(r.verified.ok ? "read-only check: ok" : `read-only check FAILED:\n- ${r.verified.problems.join("\n- ")}`);
    if (r.failed.length) console.log(`not reviewed (reviewer failed): ${r.failed.join(", ")}`);
    if (r.reportPath) console.log(`report: ${r.reportPath}`); else console.log(`report not written: ${r.reportError}`);
    if (r.scorePath) console.log(`score: ${r.scorePath}`);
    process.exit(r.verified.ok && !r.failed.length && r.reportPath ? 0 : 1);
  } catch (e) { console.error(`! ${e.message}`); process.exit(2); }
}
