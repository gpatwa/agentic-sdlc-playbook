// External review collector — dependency-free Node ESM except for the `gh` CLI.
//
//   node <playbook>/execution/external-review.mjs draft <owner/repo> <pr> [--bot <regex>] [--local <code-review.md>] [--mode blind|informed|github] [--out <file>]
//   node <playbook>/execution/external-review.mjs parse <pasted-review.md> [--pr <label>] [--local <code-review.md>] [--mode blind|informed|github] [--path A|B] [--out <file>]
//   node <playbook>/execution/external-review.mjs tally <record.md> [more.md ...] [--incidents N]
//
// For the Codex trial in docs/REVIEW_TRIAL_PLAN.md. Read-only: it never comments, reacts,
// approves, pushes or merges. `draft` reads a pull request's reviews and comments written by a
// reviewer bot; `parse` reads a review that was pasted (for example one Codex produced in its own
// app and did not post to GitHub). Both write rows with disposition `open`; a person or the role
// that owns the code sets each disposition. `tally` computes the trial's bars from the records.
//
// What it does NOT do: judge whether a finding is right. "Real" comes from a disposition a
// person set. The comment format of the real GitHub bot is NOT yet verified (the first live
// review will show it): priority is read from the first `P0` to `P3` in a comment, and a comment
// with none is recorded as `P?`.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename } from "node:path";

const HEADER = "| id | P | file:line | claim | disposition | also in our local review? |\n|---|---|---|---|---|---|";
const clean = (s) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\*\*|__|`/g, "").replace(/\s+/g, " ").replace(/\|/g, "/").trim();

// "* [P2] Title. [file.py, line 254](https://...) Body text"
export function parsePasted(text) {
  const out = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*[*-]\s*\[P([0-3])\]\s+(.+)$/);
    if (!m) continue;
    let rest = m[2];
    for (let j = i + 1; j < lines.length && /^\s+\S/.test(lines[j]) && !/^\s*[*-]\s*\[P[0-3]\]/.test(lines[j]); j++) rest += " " + lines[j].trim();
    const loc = rest.match(/\[([^\],]+?)(?:,\s*line\s+(\d+)(?:\s*-\s*\d+)?)?\]\([^)]*\)/);
    const file = loc ? loc[1].trim() : "";
    const line = loc && loc[2] ? loc[2] : "";
    const title = rest.split(/\s*\[[^\]]+\]\([^)]*\)/)[0].trim();
    const body = loc ? rest.slice(rest.indexOf(loc[0]) + loc[0].length).trim() : "";
    out.push({ p: `P${m[1]}`, file, line, claim: clean(`${title} ${body}`).slice(0, 260) });
  }
  return out;
}

// A bot's review comment from the GitHub API: { body, path, line, original_line } or a review body.
export function parseGithubComment(c) {
  const body = String(c.body ?? "");
  const p = body.match(/\bP([0-3])\b/);
  const first = clean(body.split("\n").find((l) => clean(l)) ?? "");
  return { p: p ? `P${p[1]}` : "P?", file: c.path ?? "", line: String(c.line ?? c.original_line ?? ""), claim: clean(body).slice(0, 260) || first };
}

export function localFindings(text) {
  const rows = [];
  for (const l of text.split("\n")) {
    if (!l.startsWith("|")) continue;
    const cells = l.split("|").map((c) => c.trim());
    const loc = l.match(/([\w./-]+\.[\w]+):(\d+)/);
    if (loc && /^[A-Z]{1,3}-?\d+/.test(cells[1] || "")) rows.push({ id: cells[1], file: loc[1], line: Number(loc[2]) });
  }
  return rows;
}

export function matchLocal(finding, local) {
  if (!local) return "unknown";
  const f = String(finding.file).split("/").pop();
  const hit = local.find((r) => r.file.split("/").pop() === f && (!finding.line || Math.abs(r.line - Number(finding.line)) <= 15));
  return hit ? `possible (${hit.id})` : "no";
}

export function renderRecord({ pr, source, date, findings, local, mode = "unspecified", path = "?" }) {
  const rows = findings.map((f, i) => `| c${String(i + 1).padStart(2, "0")} | ${f.p} | ${f.file}${f.line ? `:${f.line}` : ""} | ${f.claim} | open | ${matchLocal(f, local)} |`);
  return [
    `# External review: ${pr}`, "",
    `Mode: ${mode}. Path: ${path}.`, "",
    `Source: ${source}. Collected ${date}. Disposition \`open\` means nobody has judged it yet: set each to \`fixed <ref>\`, \`accepted <issue>\` (the finding is correct and is filed to fix later), \`intentional <reason>\` (the finding is correct and the behaviour is deliberate) or \`rejected <reason>\`. "Also in our local review?" is a heuristic (same file, within 15 lines); a person confirms it.`, "",
    findings.length ? HEADER : "0 findings.", ...(findings.length ? rows : []), "",
  ].join("\n");
}

export function parseRecord(text) {
  const rows = [];
  for (const l of text.split("\n")) {
    const c = l.split("|").map((x) => x.trim());
    if (c.length < 8 || !/^c\d+$/.test(c[1])) continue;
    rows.push({ id: c[1], p: c[2], where: c[3], claim: c[4], disposition: c[5].split(/\s+/)[0].toLowerCase(), alsoLocal: c[6].toLowerCase() });
  }
  return rows;
}

export function recordMode(text) {
  const m = text.match(/^Mode:\s*([\w-]+)\./m);
  return m ? m[1].toLowerCase() : "unspecified";
}

export function tally(records, { incidents = 0 } = {}) {
  const rows = records.flatMap((r) => parseRecord(r.text).map((x) => ({ ...x, pr: r.name, mode: recordMode(r.text) })));
  const modes = [...new Set(records.map((r) => recordMode(r.text)))];
  const blind = records.filter((r) => recordMode(r.text) === "blind").length;
  const judged = rows.filter((r) => r.disposition !== "open");
  const real = judged.filter((r) => ["fixed", "accepted", "intentional"].includes(r.disposition));
  const wrongMustFix = judged.filter((r) => r.disposition === "rejected" && /^P[01]$/.test(r.p));
  const newValue = real.filter((r) => r.alsoLocal === "no");
  const precision = judged.length ? real.length / judged.length : null;
  const bars = [
    ["New value: at least 1 real issue our local review missed", newValue.length >= 1, `${newValue.length}`],
    ["Precision: at least 70% real", precision !== null && precision >= 0.7, precision === null ? "nothing judged yet" : `${real.length}/${judged.length} = ${(precision * 100).toFixed(0)}%`],
    ["Safety: 0 wrong must-fix (P0 or P1 rejected)", wrongMustFix.length === 0, `${wrongMustFix.length}`],
    ["Discipline: 0 off-script actions by a review", incidents === 0, `${incidents}`],
    ["Independence: at least 1 blind review", blind >= 1, `${blind}`],
  ];
  return { modes, byMode: Object.fromEntries(modes.map((m) => [m, rows.filter((r) => r.mode === m).length])), prs: records.length, total: rows.length, open: rows.length - judged.length, judged: judged.length, real: real.length, newValue: newValue.length, wrongMustFix: wrongMustFix.length, precision, bars };
}

function gh(args) { return JSON.parse(execFileSync("gh", args, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 })); }

export function fetchBotFindings(repo, pr, botRe) {
  const mine = (u) => botRe.test(u?.login ?? "");
  const reviews = gh(["api", `repos/${repo}/pulls/${pr}/reviews`, "--paginate"]).filter((r) => mine(r.user) && String(r.body ?? "").trim());
  const inline = gh(["api", `repos/${repo}/pulls/${pr}/comments`, "--paginate"]).filter((c) => mine(c.user));
  const issue = gh(["api", `repos/${repo}/issues/${pr}/comments`, "--paginate"]).filter((c) => mine(c.user));
  return [...inline.map(parseGithubComment), ...reviews.map((r) => parseGithubComment({ body: r.body })), ...issue.map((c) => parseGithubComment({ body: c.body }))];
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  const opt = (k) => { const i = rest.indexOf(k); return i !== -1 ? rest[i + 1] : null; };
  const pos = rest.filter((a, i) => !a.startsWith("--") && !(i > 0 && rest[i - 1].startsWith("--")));
  const usage = () => { console.error("usage: external-review.mjs draft <owner/repo> <pr> [--bot re] [--local f] [--mode m] [--out f] | parse <file> [--pr label] [--local f] [--mode m] [--path A|B] [--out f] | tally <record.md ...> [--incidents N]"); process.exit(2); };
  const date = new Date().toISOString().slice(0, 10);
  const local = opt("--local") && existsSync(opt("--local")) ? localFindings(readFileSync(opt("--local"), "utf8")) : null;
  const emit = (text) => { if (opt("--out")) { writeFileSync(opt("--out"), text); console.log(`wrote ${opt("--out")}`); } else console.log(text); };
  if (cmd === "draft" && pos.length === 2) {
    const [repo, pr] = pos;
    const findings = fetchBotFindings(repo, pr, new RegExp(opt("--bot") || "codex", "i"));
    emit(renderRecord({ pr: `${repo}#${pr}`, source: `the pull request's reviews and comments by a login matching /${opt("--bot") || "codex"}/i`, date, findings, local, mode: opt("--mode") || "github", path: opt("--path") || "B" }));
  } else if (cmd === "parse" && pos.length === 1 && existsSync(pos[0])) {
    const findings = parsePasted(readFileSync(pos[0], "utf8"));
    emit(renderRecord({ pr: opt("--pr") || basename(pos[0]), source: "a pasted review (not posted to GitHub)", date, findings, local, mode: opt("--mode") || "unspecified", path: opt("--path") || "A" }));
  } else if (cmd === "tally" && pos.length >= 1 && pos.every(existsSync)) {
    const t = tally(pos.map((f) => ({ name: basename(f), text: readFileSync(f, "utf8") })), { incidents: Number(opt("--incidents") || 0) });
    console.log(`records ${t.prs}; findings ${t.total} (${t.open} open, ${t.judged} judged, ${t.real} real); by mode: ${Object.entries(t.byMode).map(([m, n]) => `${m} ${n}`).join(", ") || "none"}`);
    for (const [name, ok, val] of t.bars) console.log(`  ${ok ? "MET    " : "NOT MET"}  ${name}: ${val}`);
    console.log(t.open ? `  note: ${t.open} finding(s) still open; the bars are provisional until every one is judged` : "  every finding is judged");
  } else usage();
}
