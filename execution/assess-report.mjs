#!/usr/bin/env node
// assess-report.mjs — turns the records of an assessment into reviews/REPORT.md (docs/REVIEW_MODE_PLAN.md, M5). No model.
//
//   node assess-report.mjs <records-dir> --reviewers "<name>:<family>[,...]" [--guard <guard.json>] [--date YYYY-MM-DD] [--allow-unverified]
//
// <records-dir> holds what repo-map.mjs, assess-plan.mjs and the reviewers wrote: map.json, plan.json, FINDINGS.md.
// The report is the same words every time for the same records. It will not be written:
//   - if --guard is given and the read-only check fails (the target moved, or the review copy differs), unless --allow-unverified,
//     which puts the failure at the top of the report;
//   - if its own text matches a secret pattern (the reviewers' evidence may have quoted one).
// It never says "secure", "compliant" or "certified" about the code.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { verify } from "./assess-guard.mjs";
import { secretHits } from "./assess-plan.mjs";

const SEV = ["P0", "P1", "P2", "P3", "note"];
const fmt = (n) => Number(n).toLocaleString("en-US");

// A markdown table row split on unescaped pipes.
const cells = (line) => line.replace(/^\s*\||\|\s*$/g, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));

export function parseFindings(md) {
  const rows = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) continue;
    const c = cells(line);
    if (c.length < 7 || !/^F-[\w-]+$/.test(c[0])) continue;
    rows.push({ id: c[0], severity: c[1], where: c[2], finding: c[3], evidence: c[4], reviewer: c[5], disposition: c[6] });
  }
  return rows;
}

export const hasFileAndLine = (w) => /\S+:\d+/.test(w);

// "Delivery health from history" (T42 P4): figures computed by outcomes.mjs from the target's git history, read only, no model call.
// A description of how the repo has been changed, not a verdict on it. Nothing here is scored or compared with another repo.
export function renderHealth(h) {
  if (!h || !h.n || !h.n.mergedChanges) return ["## Delivery health from history", "", "No merged pull requests were found in the assessed history (merge or squash commits naming a pull request), so no delivery figure is given.", ""];
  const f1 = (v) => (typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : "not recorded");
  const d1 = h.delivery.D1_leadTime_gitOnly, q = h.quality.Q2_postMergeWithin, b = h.humanAttention.H4_reviewBurden;
  const pct = (v) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "not recorded");
  const weeks = Object.keys(h.delivery.D2_mergedPerWeek.weeks).length;
  return ["## Delivery health from history", "",
    `Read from the git history of \`${h.repo.branch}\` up to \`${h.repo.tip}\` (${h.repo.tipAt.slice(0, 10)}); nothing was fetched and no model was asked. **${h.n.mergedChanges} merged pull request(s)** over ${weeks} calendar week(s) with at least one merge. This describes how the repo has been changed. It is not a verdict on the code and is not comparable with another repo.`, "",
    table(["Measure", "Value", "Read it with"], [
      ["Lead time, first commit to merge (hours)", `median ${f1(d1.median)} over ${d1.n} merge(s)`, "the revert rate and the review size below; a short lead time with more reverts is not an improvement"],
      [`Reverted within ${q.windowDays} days`, `${q.reverted} of ${q.closedWindowN} with a closed window (${pct(q.revertRate)}); ${q.openWindowN} too recent to judge`, "certain: a revert commit names the merge"],
      ["Fix candidates within the same window", `${q.fixCandidates} (heuristic, a lower bound)`, "a Fix-titled commit after the merge that names the pull request or touches a file it changed"],
      ["Changed lines a reader was asked to read, per merge", `median ${f1(b.median)} (generated files, lockfiles and \`runs/\` left out)`, "whether the unit was small enough to review well"],
      ["Merged with no GitHub review", "not read here", "needs the GitHub API; run \`outcomes.mjs --gh\` on the repo"],
    ]), "",
    "Not shown because the history cannot show it: time to restore service, defects nobody found, whether a review was careful, and how many people the team has. Figures for one operator merging their own work will show no reviews; that is a fact about the team, not a fault to score.", ""];
}

// Health of the measure itself (T42 P6): a judge that never rejects anything is not checking anything. The dictionary's rule:
// report the rejection rate with every judged sample, and flag zero rejections over ten or more judged findings.
export function renderJudge(j) {
  if (!j || !Array.isArray(j.verdicts)) return [];
  const v = j.verdicts.filter((x) => x.verdict && x.verdict !== "not judged");
  const c = (k) => v.filter((x) => x.verdict === k).length;
  const judged = v.length, rej = c("rejected");
  const L = ["## Judge check", "",
    `A judge (${j.judge ?? "judge"}, ${j.family ?? "second"} model family) read a seeded sample of ${j.sampled?.length ?? judged} finding(s); ${judged} were judged: ${c("confirmed")} confirmed, ${rej} rejected, ${c("intentional")} intentional, ${c("unclear")} unclear. **Rejection rate ${judged ? Math.round((rej / judged) * 100) + "%" : "not available"} (${rej} of ${judged}).** The verdicts are provisional; the owner's disposition outranks the judge's.`, ""];
  if (judged >= 10 && rej === 0) L.push("> **Flag: the judge rejected nothing across " + judged + " findings.** A judge that agrees with every finding may be too lenient, or the reviewers may be precise; this run cannot tell which. Treat the confirmations as unchecked until a few are read by hand.", "");
  else if (judged > 0 && judged < 10) L.push(`The sample is below ten judged findings, so the rejection rate is shown but not interpreted.`, "");
  return L;
}

export function renderReport({ map, plan, findings, reviewers, guard, date, unverified, health, judged }) {
  const g = map.governance;
  const families = new Set(reviewers.map((r) => r.family));
  const valid = findings.filter((f) => hasFileAndLine(f.where));
  const dropped = findings.filter((f) => !hasFileAndLine(f.where));
  const bySev = (sev) => valid.filter((f) => f.severity === sev);
  const tiers = new Map();
  for (const f of map.files.filter((x) => x.status === "review")) { const e = tiers.get(f.tier) ?? { files: 0, tokens: 0 }; e.files++; e.tokens += f.tokens; tiers.set(f.tier, e); }
  const high = map.files.filter((f) => f.status === "review" && f.tier === "high");
  const notReviewed = plan.areas.filter((a) => a.status === "not reviewed");
  const L = [];
  if (unverified) L.push(`> **WARNING: the read-only check FAILED or was skipped.** ${unverified} Do not rely on this report until it passes.`, "");
  L.push(`# Assessment report: ${map.repo}`, "",
    `**Assessed against Aveto's gates on ${date}. This is an assessment, not a certification.** It records what the reviewers found in the parts listed below. It does not say the code is secure or compliant, and a finding's absence is not evidence of safety.`, "",
    table(["", ""], [
      ["Commit", `\`${map.sha}\``], ["Reviewers", reviewers.map((r) => `${r.name} (${r.family})`).join(", ") || "none recorded"],
      ["Independent second reviewer", families.size >= 2 ? `yes (${[...families].join(", ")})` : "**no**: one model family reviewed this. Treat it as a first pass."],
      ["Built under Aveto", g.governed ? `yes: ${g.charters} Charter record(s), ${g.runs} run folder(s)` : "no records found"],
      ["Read-only check", guard ? (unverified ? "FAILED" : "passed: the target's HEAD and working tree were unchanged, and the review copy differed from the commit only by the recorded removals") : "not run"],
      ["Source reviewed", `about ${fmt(plan.usedTokens)} of ${fmt(plan.usedTokens + notReviewed.reduce((s, a) => s + a.tokens, 0) + plan.oversize.reduce((s, f) => s + f.tokens, 0))} reviewable tokens (estimate: bytes / 4)`],
    ]), "");
  L.push("## Summary", "");
  const counts = SEV.map((s) => `${bySev(s).length} ${s}`).join(", ");
  L.push(valid.length ? `${valid.length} finding(s): ${counts}. ${valid.filter((f) => f.disposition === "open").length} are still open; the owner sets each disposition.` : "No findings were recorded.", "");
  if (dropped.length) L.push(`${dropped.length} recorded item(s) had no file and line and are not counted: ${dropped.map((f) => f.id).join(", ")}.`, "");
  L.push("## Risk map", "", table(["Tier", "Files", "Approx. tokens"], ["high", "medium", "low"].filter((t) => tiers.has(t)).map((t) => [t, fmt(tiers.get(t).files), fmt(tiers.get(t).tokens)])), "");
  const ownerless = high.filter((f) => !f.owners || f.owners.length === 0);
  if (high.length) L.push(`${ownerless.length} of ${high.length} high-risk file(s) have no owner in CODEOWNERS${map.codeowners ? "" : " (no CODEOWNERS file)"}. A change to one has no named person who may approve it.`, "");
  L.push(high.length ? `High-risk files (${high.length}): ${high.slice(0, 25).map((f) => `\`${f.path}\``).join(", ")}${high.length > 25 ? `, and ${high.length - 25} more (see \`map.json\`)` : ""}.` : "No high-risk files matched.", "");
  L.push("## Findings", "");
  for (const sev of SEV) {
    const list = bySev(sev);
    if (!list.length) continue;
    L.push(`### ${sev}`, "");
    for (const f of list) L.push(`**${f.id}** · \`${f.where}\` · ${f.reviewer} · ${f.disposition}`, "", f.finding, "", `*Evidence:* ${f.evidence || "none given"}`, "");
  }
  if (!valid.length) L.push("None recorded.", "");
  L.push(...renderJudge(judged));
  L.push(...renderHealth(health));
  L.push("## What was not reviewed, and why", "");
  const nr = [];
  for (const a of notReviewed) nr.push(`- Area \`${a.dir}\` (${a.tier}, about ${fmt(a.tokens)} tokens): ${a.reason}.`);
  for (const f of plan.oversize) nr.push(`- \`${f.path}\` (about ${fmt(f.tokens)} tokens): too large for one pass.`);
  for (const h of plan.held) nr.push(`- \`${h.path}\`: held back for a possible secret (${h.patterns.join(", ")}); the owner decides.`);
  if (plan.outOfScope) nr.push(`- ${plan.outOfScope} file(s) outside the requested scope.`);
  if (plan.excluded) nr.push(`- ${plan.excluded} file(s) on the secret-path list, never read.`);
  if (plan.skipped) nr.push(`- ${plan.skipped} file(s) vendored, binary, lock or minified.`);
  L.push(nr.length ? nr.join("\n") : "Everything reviewable was in a planned area.", "");
  L.push("## Tests and CI", "");
  const cmds = map.commands.filter((c) => c.kind !== "ci");
  L.push(cmds.length ? `Commands detected from manifests: ${cmds.map((c) => `${c.kind} \`${c.command.replace(/\s+#.*$/, "")}\``).join("; ")}. **They were not run by this assessment.**` : "**No tests found.** No test, lint or build command was detected from the manifests.", "");
  L.push(map.ci.length ? `CI files: ${map.ci.map((c) => `\`${c}\``).join(", ")}.` : "No CI files found.", "");
  L.push("## Proposed backlog", "", "Nothing below has been done. Each item is an intent the owner can turn into a Charter; none changes anything until the owner picks it.", "");
  const fix = valid.filter((f) => ["P0", "P1"].includes(f.severity));
  if (fix.length) {
    for (const f of fix) L.push(`- **Intent (${f.id}, ${f.severity}):** Fix the issue at \`${f.where}\`: ${f.finding.replace(/\.$/, "")}. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.`);
  } else L.push("No P0 or P1 finding to file.");
  const defer = valid.filter((f) => !["P0", "P1"].includes(f.severity));
  if (defer.length) L.push("", "**Recorded and deferred** (below P1; filing them is the owner's call):", ...defer.map((f) => `- ${f.id} (${f.severity}) \`${f.where}\`: ${f.finding.replace(/\.$/, "")}.`));
  L.push("", "## Method and limits", "",
    "- Files were mapped and tiered by a script from names, manifests and git history; reviewers read areas in order of risk until the cap.",
    "- Reviewers worked in a copy with write tools, pushes and secret reads denied; the read-only check above is the evidence, not the instruction.",
    "- Findings are from reading. None was reproduced unless its evidence says so.",
    "- Recall and precision of this reviewer are reported in the calibration record, not here; a repo's report is only as good as that record.", "");
  return L.join("\n");
}
const table = (head, rows) => [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");

export function buildReport(dir, { reviewers, guardPath, date, allowUnverified = false }) {
  const map = JSON.parse(readFileSync(join(dir, "map.json"), "utf8"));
  const plan = JSON.parse(readFileSync(join(dir, "plan.json"), "utf8"));
  const findings = parseFindings(readFileSync(join(dir, "FINDINGS.md"), "utf8"));
  let guard = null, unverified = null;
  if (guardPath) {
    guard = JSON.parse(readFileSync(guardPath, "utf8"));
    const r = verify(guard);
    if (!r.ok) {
      if (!allowUnverified) throw new Error(`the read-only check failed, so no report was written:\n- ${r.problems.join("\n- ")}`);
      unverified = r.problems.join("; ");
    }
  }
  const healthFile = join(dir, "health.json");
  const health = existsSync(healthFile) ? JSON.parse(readFileSync(healthFile, "utf8")) : null;
  const judgedFile = join(dir, "JUDGED.json");
  const judged = existsSync(judgedFile) ? JSON.parse(readFileSync(judgedFile, "utf8")) : null;
  const text = renderReport({ map, plan, findings, reviewers, guard, date: date ?? new Date().toISOString().slice(0, 10), unverified, health, judged });
  const hits = secretHits(text);
  if (hits.length) throw new Error(`the report text matches a secret pattern (${hits.join(", ")}): a finding's evidence quoted one. Remove it from FINDINGS.md and run again.`);
  return text;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const val = (f) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : undefined; };
  const dir = a.find((x, i) => !x.startsWith("--") && !["--reviewers", "--guard", "--date"].includes(a[i - 1]));
  if (!dir || !val("--reviewers")) { console.error('usage: node assess-report.mjs <records-dir> --reviewers "<name>:<family>[,...]" [--guard <guard.json>] [--date YYYY-MM-DD] [--allow-unverified]'); process.exit(2); }
  const reviewers = val("--reviewers").split(",").map((r) => { const [name, family] = r.split(":"); return { name: name.trim(), family: (family ?? name).trim() }; });
  try {
    const text = buildReport(resolve(dir), { reviewers, guardPath: val("--guard"), date: val("--date"), allowUnverified: a.includes("--allow-unverified") });
    writeFileSync(join(resolve(dir), "REPORT.md"), text);
    console.log(`wrote ${join(resolve(dir), "REPORT.md")}`);
  } catch (e) { console.error(`! ${e.message}`); process.exit(1); }
}
