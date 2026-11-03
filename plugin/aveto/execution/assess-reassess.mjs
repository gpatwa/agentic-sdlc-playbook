#!/usr/bin/env node
// assess-reassess.mjs — the before-and-after table of a re-assessment (docs/REVIEW_MODE_PLAN.md, M7). No model.
//
//   node assess-reassess.mjs --before <FINDINGS.md|records-dir> --after <FINDINGS.md|records-dir> [--after ...]
//        [--repo <git-dir> --from <sha> --to <sha>] [--seeds seeds.json] [--prs prs.json] [--date YYYY-MM-DD] [--out file]
//
// WHAT IT DOES. Takes the findings of an earlier assessment (with the owner's dispositions) and the findings of a new
// assessment of the same scope, and gives every earlier finding a status, keeping the earlier ids:
//   closed             was fixed, and no new finding describes it
//   still open         was open, deferred or accepted, and a new finding describes it again
//   NOT FIXED          was marked fixed, but a new finding describes it again: the fix is incomplete or it regressed
//   re-raised          was rejected or intentional, and a reviewer raised it again (the reason may need a second look)
//   not re-found       was open, deferred or accepted and no new finding describes it, the file HAS changed since (probably
//                      fixed; the owner confirms)
//   NOT RE-FOUND, FILE UNCHANGED   was open or deferred, no new finding, and the file did not change: a reviewer miss or an
//                      earlier false claim, not a fix. It is listed first so it is not read as progress.
//   unchanged          was rejected or intentional and is not raised again
// New findings that no earlier finding explains are listed separately as `new`.
//
// HOW A NEW FINDING IS PAIRED WITH AN EARLIER ONE. Same file, and the finding texts share enough words (Jaccard on words of four
// letters or more: at least 0.15 when the lines are within 10 of each other, at least 0.30 otherwise). That is a heuristic: lines move when
// code is fixed. The pairs are printed so the owner can check them; nothing is hidden behind a score. Findings that match a
// planted bug (--seeds) are left out of the earlier set, since the planted bug is not in the real code.
//
// WHAT IT DOES NOT DO. It does not review anything, so it cannot say the new run covered the same ground; the report says
// whether a changed-file list was supplied and leaves the scope comparison to the reader of the two reports.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseFindings, hasFileAndLine } from "./assess-report.mjs";
import { locate } from "./assess-calibrate.mjs";

const LINE_TOLERANCE = 10;
const SIM_MIN = 0.30;
const NEAR_SIM_MIN = 0.15;
const norm = (p) => p.replace(/^\.\//, "");
const words = (t) => new Set((t.toLowerCase().match(/[a-z][a-z0-9_]{3,}/g) ?? []));
export function similarity(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

export function readFindings(path) {
  const file = existsSync(path) && statSync(path).isDirectory() ? join(path, "FINDINGS.md") : path;
  return parseFindings(readFileSync(file, "utf8")).filter((f) => hasFileAndLine(f.where));
}

const at = (f) => locate(f.where);
const sameIssue = (b, a) => {
  const x = at(b), y = at(a);
  if (!x || !y || x.file !== y.file) return false;
  // Nearby lines are not enough on their own: two different problems can sit in the same function. Near lines need some
  // shared words too; far lines need more.
  const sim = similarity(b.finding, a.finding);
  return Math.abs(x.start - y.start) <= LINE_TOLERANCE ? sim >= NEAR_SIM_MIN : sim >= SIM_MIN;
};

export const changedFiles = (repo, from, to) =>
  new Set(execFileSync("git", ["-C", repo, "diff", "--name-only", from, to], { encoding: "utf8" }).split("\n").filter(Boolean).map(norm));

/**
 * before: earlier findings (with dispositions). after: new findings. changed: Set of files changed between the two commits,
 * or null if unknown. prs: {id: "PR ref"} for closed findings. Returns {rows, fresh, counts}.
 */
export function reassess(before, after, { changed = null, prs = {} } = {}) {
  const used = new Set();
  const rows = before.map((b) => {
    const hits = after.filter((a) => sameIssue(b, a));
    hits.forEach((a) => used.add(a));
    const file = at(b).file;
    const fileChanged = changed ? changed.has(file) : null;
    const d = b.disposition;
    const wasFixed = d === "fixed";
    const wasRejected = d === "rejected" || d === "intentional";
    let status, note = "";
    if (hits.length) {
      status = wasFixed ? "NOT FIXED" : wasRejected ? "re-raised" : "still open";
      note = `new: ${hits.map((a) => `${a.id} (${a.reviewer})`).join(", ")}`;
    } else if (wasRejected) status = "unchanged";
    else if (wasFixed) {
      status = "closed";
      if (prs[b.id]) note = prs[b.id];
      if (fileChanged === false) note = (note ? note + "; " : "") + "CHECK: the file has not changed since the earlier commit";
    } else if (fileChanged === false) status = "NOT RE-FOUND, FILE UNCHANGED";
    else status = "not re-found";
    if (status === "not re-found" && fileChanged === null) note = "no changed-file list was supplied";
    return { id: b.id, severity: b.severity, where: b.where, was: d, status, note, finding: b.finding };
  });
  const fresh = after.filter((a) => !used.has(a));
  const counts = {};
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return { rows, fresh, counts };
}

const ORDER = ["NOT RE-FOUND, FILE UNCHANGED", "NOT FIXED", "re-raised", "still open", "not re-found", "closed", "unchanged"];

export function render({ rows, fresh, counts }, { date, from, to, reviewers, prsSupplied, changedSupplied }) {
  const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
  const L = [`# Re-assessment`, ``,
    `**Re-assessed against Aveto's gates on ${date}. This is an assessment, not a certification.** It compares an earlier assessment with a new one of the same scope; it does not say the code is secure or compliant.`, ``,
    `| | |`, `|---|---|`,
    `| Earlier commit | ${from ? `\`${from}\`` : "not supplied"} |`, `| New commit | ${to ? `\`${to}\`` : "not supplied"} |`,
    `| New reviewers | ${reviewers.length ? reviewers.join(", ") : "not stated"} |`,
    `| Changed-file list | ${changedSupplied ? "supplied (git diff between the two commits)" : "NOT supplied: findings that were not re-found cannot be told apart from reviewer misses"} |`, ``,
    `## Before and after`, ``,
    Object.entries(counts).sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0])).map(([k, n]) => `- **${k}:** ${n}`).join("\n"),
    `- **new:** ${fresh.length}`, ``,
    `Read the first four statuses first. "NOT RE-FOUND, FILE UNCHANGED" means the earlier finding was not raised again although the code did not change: that is a reviewer miss or an earlier false claim, **not** progress. "closed" means the earlier disposition was \`fixed\` and no reviewer raised it again; it is evidence the fix holds, not proof.`, ``,
    `| earlier id | sev | where | earlier disposition | status | note |`, `|---|---|---|---|---|---|`];
  const sorted = [...rows].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  for (const r of sorted) L.push(`| ${r.id} | ${r.severity} | ${cell(r.where)} | ${r.was} | **${r.status}** | ${cell(r.note)} |`);
  L.push(``, `## Pairs to check`, ``, `A new finding is paired with an earlier one when it names the same file and the texts share enough of their longer words (${Math.round(NEAR_SIM_MIN * 100)}% when the lines are within ${LINE_TOLERANCE}, ${Math.round(SIM_MIN * 100)}% otherwise). Check these pairs; the match is a heuristic.`, ``);
  const paired = sorted.filter((r) => r.note.startsWith("new:"));
  L.push(paired.length ? paired.map((r) => `- ${r.id} ↔ ${r.note.slice(5)}`).join("\n") : "None.");
  L.push(``, `## New findings`, ``, fresh.length ? `No earlier finding explains these ${fresh.length}.` : "None.", ``);
  if (fresh.length) {
    L.push(`| id | sev | where | finding | reviewer |`, `|---|---|---|---|---|`);
    for (const f of fresh) L.push(`| ${f.id} | ${f.severity} | ${cell(f.where)} | ${cell(f.finding)} | ${f.reviewer} |`);
  }
  if (!prsSupplied) L.push(``, `Pull request references were not supplied, so "closed" rows carry no link.`);
  return L.join("\n") + "\n";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const val = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const multi = (k) => a.flatMap((x, i) => (x === k ? [a[i + 1]] : []));
  const beforePath = val("--before"), afters = multi("--after");
  if (!beforePath || !afters.length) { console.error("usage: node assess-reassess.mjs --before <FINDINGS.md|dir> --after <FINDINGS.md|dir> [--after ...] [--repo <git-dir> --from <sha> --to <sha>] [--seeds seeds.json] [--prs prs.json] [--date YYYY-MM-DD] [--out file]"); process.exit(2); }
  try {
    let before = readFindings(beforePath);
    const seedsFile = val("--seeds");
    if (seedsFile) {
      const seeds = JSON.parse(readFileSync(seedsFile, "utf8"));
      before = before.filter((f) => { const p = at(f); return !seeds.some((s) => norm(s.file) === p.file && p.start <= s.lineEnd + 5 && p.end >= s.lineStart - 5); });
    }
    const after = afters.flatMap(readFindings);
    const repo = val("--repo"), from = val("--from"), to = val("--to");
    const changed = repo && from && to ? changedFiles(repo, from, to) : null;
    const prs = val("--prs") ? JSON.parse(readFileSync(val("--prs"), "utf8")) : {};
    const result = reassess(before, after, { changed, prs });
    const md = render(result, { date: val("--date") ?? new Date().toISOString().slice(0, 10), from, to, reviewers: [...new Set(after.map((f) => f.reviewer))], prsSupplied: !!val("--prs"), changedSupplied: !!changed });
    if (val("--out")) { writeFileSync(val("--out"), md); console.log(`wrote ${val("--out")}`); } else process.stdout.write(md);
    const bad = (result.counts["NOT FIXED"] ?? 0) + (result.counts["NOT RE-FOUND, FILE UNCHANGED"] ?? 0);
    process.exit(bad ? 1 : 0);
  } catch (e) { console.error(`! ${e.message}`); process.exit(2); }
}
