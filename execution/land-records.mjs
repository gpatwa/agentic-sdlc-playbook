#!/usr/bin/env node
// land-records.mjs — set `landed`, `landedAt` and `mergedPr` in a repo's runs/*/trace.json from its git merge history (T42 PM1a).
//
//   node land-records.mjs <repo> [--branch main] [--not-shipped <slice>=<reason>]... [--write]
//
// Why: the pipeline analytics read `landed` and `landedAt` (analyze.mjs), but nothing set them after a pull request merged,
// so the lead-time, deployment-frequency and change-failure rows were empty. Git knows when each run's trace first reached the
// branch, so the facts come from there, never from a guess.
//
//   • For each runs/<slice>/trace.json, find the first-parent commit on the branch that introduced it. If that commit is a
//     "Merge pull request #N" commit, `mergedPr` = N and `landedAt` = the merge commit's time (UTC). Otherwise the run is
//     reported as "no merge found" and nothing is written for it.
//   • `landed` becomes true only for runs that merged AND are not named in --not-shipped. A run that merged but did not ship
//     (a failed gate, a proof run) keeps `landed: false` and gets `landedNote` with the reason given on the command line. The
//     judgement "did not ship" is the owner's, passed in explicitly, and printed.
//   • Dry run by default: prints the table and changes nothing. --write edits the files in place with a text edit, so the
//     file's existing indentation is kept and the diff is only the added lines. Re-running changes nothing.
//   • A trace already holding `landed: true` or a `landedAt` is never overwritten; nothing is removed.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const git = (repo, args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/** Merge facts for each runs/<slice>/trace.json: { slice, file, sha, mergedPr, landedAt } or { slice, file, none: true }. */
export function mergeFacts(repo, branch = "main") {
  const runsDir = join(repo, "runs");
  if (!existsSync(runsDir)) return [];
  const slices = readdirSync(runsDir).filter((d) => existsSync(join(runsDir, d, "trace.json"))).sort();
  return slices.map((slice) => {
    const rel = `runs/${slice}/trace.json`;
    // The oldest first-parent commit that adds the file; with --diff-merges a merge commit shows what it brought in.
    const out = git(repo, ["log", branch, "--first-parent", "--diff-merges=first-parent", "--diff-filter=A", "--name-only", "--format=@@%H%x09%cI%x09%s", "--", rel])
      .split("\n").filter((l) => l.startsWith("@@"));
    const last = out[out.length - 1]?.slice(2);
    if (!last) return { slice, file: rel, none: true };
    const [sha, when, subject] = last.split("\t");
    const m = /^Merge pull request #(\d+)\b/.exec(subject);
    if (!m) return { slice, file: rel, none: true, sha, subject };
    return { slice, file: rel, sha, mergedPr: Number(m[1]), landedAt: new Date(when).toISOString().replace(".000Z", "Z") };
  });
}

/** Text edit for one trace file. Returns the new text, or null when there is nothing to add. */
export function editTrace(text, fact, shipped, note) {
  const t = JSON.parse(text);
  if (t.landed === true || t.landedAt) return null;
  const re = /^([ \t]*)"landed":\s*(?:true|false)(,?)[ \t]*$/m;
  const m = re.exec(text);
  if (!m) return null;
  const ind = m[1];
  const lines = [`${ind}"landed": ${shipped ? "true" : "false"},`, `${ind}"landedAt": ${JSON.stringify(fact.landedAt)},`, `${ind}"mergedPr": ${fact.mergedPr}${note ? "," : m[2]}`];
  if (note) lines.push(`${ind}"landedNote": ${JSON.stringify(note)}${m[2]}`);
  const out = text.replace(re, lines.join("\n"));
  JSON.parse(out); // never write a file that stopped being JSON
  return out;
}

export function plan(repo, { branch = "main", notShipped = {} } = {}) {
  return mergeFacts(repo, branch).map((f) => {
    if (f.none) return { ...f, action: "no merge found; nothing written" };
    const reason = notShipped[f.slice];
    const text = readFileSync(join(repo, f.file), "utf8");
    const next = editTrace(text, f, !reason, reason ? `Reached ${branch} in PR #${f.mergedPr} but not counted as landed: ${reason}` : null);
    return { ...f, shipped: !reason, reason, next, action: next === null ? "already set; unchanged" : reason ? "set landed=false, landedAt, mergedPr, landedNote" : "set landed=true, landedAt, mergedPr" };
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const repo = args.find((a) => !a.startsWith("--"));
  const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  if (!repo) { console.error("usage: land-records.mjs <repo> [--branch main] [--not-shipped slice=reason]... [--write]"); process.exit(2); }
  const notShipped = {};
  args.forEach((a, i) => { if (a === "--not-shipped") { const [k, ...v] = (args[i + 1] ?? "").split("="); if (k && v.length) notShipped[k] = v.join("="); } });
  const rows = plan(repo, { branch: opt("--branch") ?? "main", notShipped });
  const write = args.includes("--write");
  for (const r of rows) {
    console.log(`${r.slice.padEnd(28)} ${r.none ? "-".padEnd(26) : (`PR #${r.mergedPr} ${r.landedAt}`).padEnd(26)} ${r.action}${r.reason ? `  [${r.reason}]` : ""}`);
    if (write && r.next) writeFileSync(join(repo, r.file), r.next);
  }
  const n = rows.filter((r) => r.next).length;
  console.log(write ? `\nwrote ${n} trace.json file(s).` : `\ndry run: ${n} file(s) would change. Add --write to apply.`);
}
