#!/usr/bin/env node
// assess-calibrate.mjs — scores a reviewer against ground truth (docs/REVIEW_MODE_PLAN.md, M4). No model.
//
//   node assess-calibrate.mjs --seeds <seeds.json> --findings <FINDINGS.md> [--tolerance N] [--tokens N --lines N] [--json]
//
// seeds.json is a list of bugs planted by a DIFFERENT agent than the reviewer: {id, file, lineStart, lineEnd, class, severity,
// description}. A finding matches a seed when it names the same file and a line within the seed's range plus/minus the tolerance
// (default 5). Several findings on one seed count once.
//
// RECALL is seeds found / seeds planted, by class and severity, with the misses listed.
// PRECISION cannot be computed from seeds alone: a finding that matches no seed may be a real bug nobody planted. So it is
// reported as a range, and only the owner's dispositions narrow it: rejected or intentional = false positive; fixed, confirmed,
// accepted or deferred = true; open = unjudged. The plan's bar (70%, on a sample of 30) is reported as "not measured" until at
// least 30 findings have been judged.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseFindings } from "./assess-report.mjs";

const FALSE_POS = new Set(["rejected", "intentional"]);
const TRUE_POS = new Set(["fixed", "confirmed", "accepted", "deferred"]);
const normPath = (p) => p.replace(/^\.\//, "").replace(/\\/g, "/");

export function locate(where) {
  const m = where.match(/^(.+?):(\d+)(?:-(\d+))?/);
  return m ? { file: normPath(m[1].replace(/`/g, "").trim()), start: Number(m[2]), end: Number(m[3] ?? m[2]) } : null;
}

export function score(seeds, findings, { tolerance = 5, tokens, lines } = {}) {
  const placed = findings.map((f) => ({ f, at: locate(f.where) }));
  const matchOf = (seed) => placed.filter(({ at }) => at && at.file === normPath(seed.file) && at.start <= seed.lineEnd + tolerance && at.end >= seed.lineStart - tolerance);
  const results = seeds.map((s) => ({ seed: s, found: matchOf(s).map((m) => m.f.id) }));
  const matchedIds = new Set(results.flatMap((r) => r.found));
  const found = results.filter((r) => r.found.length);
  const by = (key) => Object.fromEntries([...new Set(seeds.map((s) => s[key]))].sort().map((k) => {
    const all = results.filter((r) => r.seed[key] === k);
    return [k, { found: all.filter((r) => r.found.length).length, of: all.length }];
  }));
  const unmatched = findings.filter((f) => !matchedIds.has(f.id));
  const valid = findings.filter((f) => locate(f.where));
  const judged = (list) => list.filter((f) => FALSE_POS.has(f.disposition) || TRUE_POS.has(f.disposition));
  const fp = valid.filter((f) => FALSE_POS.has(f.disposition));
  const unjudgedNonSeed = unmatched.filter((f) => locate(f.where) && !FALSE_POS.has(f.disposition) && !TRUE_POS.has(f.disposition));
  const total = valid.length;
  // A finding that matches a seed is true by construction; one the owner judged true is true; the rest are unknown.
  const lower = total ? (total - fp.length - unjudgedNonSeed.length) / total : null;
  const upper = total ? (total - fp.length) / total : null;
  const sample = judged(unmatched).length + found.length;
  return {
    seeds: seeds.length, found: found.length, recall: seeds.length ? found.length / seeds.length : null,
    byClass: by("class"), bySeverity: by("severity"), missed: results.filter((r) => !r.found.length).map((r) => r.seed),
    findings: total, unmatched: unmatched.map((f) => f.id), unjudgedNonSeed: unjudgedNonSeed.map((f) => f.id), falsePositives: fp.map((f) => f.id),
    precision: { lower, upper, judgedSample: sample, barMeasured: sample >= 30 },
    cost: tokens && lines ? { tokens, lines, tokensPer10kLines: Math.round(tokens / (lines / 10000)) } : null,
  };
}

const pct = (x) => (x == null ? "n/a" : `${(x * 100).toFixed(0)}%`);
export function renderScore(r, { label = "calibration" } = {}) {
  const L = [`# Calibration: ${label}`, "",
    `**Recall: ${r.found} of ${r.seeds} planted bugs found (${pct(r.recall)}).** ${r.seeds < 20 ? `With ${r.seeds} seeds one miss moves recall by ${pct(1 / Math.max(r.seeds, 1))}; treat it as indicative, not a measurement.` : ""}`, "",
    "| By | Found | Planted |", "|---|---|---|",
    ...Object.entries(r.byClass).map(([k, v]) => `| class: ${k} | ${v.found} | ${v.of} |`),
    ...Object.entries(r.bySeverity).map(([k, v]) => `| severity: ${k} | ${v.found} | ${v.of} |`), ""];
  if (r.missed.length) L.push("**Missed:**", ...r.missed.map((s) => `- ${s.id} (${s.class}, ${s.severity}) \`${s.file}:${s.lineStart}\`: ${s.description}`), "");
  L.push(`**Precision: ${pct(r.precision.lower)} to ${pct(r.precision.upper)}** of ${r.findings} finding(s). Lower bound counts every unjudged finding that matches no seed as false; upper bound counts them as true. ` +
    (r.precision.barMeasured ? "The judged sample reaches 30, so the plan's 70% bar can be read from the owner's dispositions." : `Only ${r.precision.judgedSample} finding(s) are judged, so **the plan's bar (70% on a sample of 30) is not measured.**`), "");
  if (r.unjudgedNonSeed.length) L.push(`Findings awaiting the owner's disposition (they match no seed, so they are real finds or false positives): ${r.unjudgedNonSeed.join(", ")}.`, "");
  if (r.falsePositives.length) L.push(`Judged false: ${r.falsePositives.join(", ")}.`, "");
  L.push(r.cost ? `**Cost:** ${r.cost.tokens.toLocaleString("en-US")} tokens over ${r.cost.lines.toLocaleString("en-US")} lines = ${r.cost.tokensPer10kLines.toLocaleString("en-US")} tokens per 10,000 lines (the figure supplied; see the record for what it counts).` : "**Cost:** not supplied.", "");
  return L.join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const val = (f) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : undefined; };
  if (!val("--seeds") || !val("--findings")) { console.error("usage: node assess-calibrate.mjs --seeds <seeds.json> --findings <FINDINGS.md> [--tolerance N] [--tokens N --lines N] [--json]"); process.exit(2); }
  const r = score(JSON.parse(readFileSync(val("--seeds"), "utf8")), parseFindings(readFileSync(val("--findings"), "utf8")),
    { tolerance: val("--tolerance") ? Number(val("--tolerance")) : 5, tokens: val("--tokens") ? Number(val("--tokens")) : undefined, lines: val("--lines") ? Number(val("--lines")) : undefined });
  console.log(a.includes("--json") ? JSON.stringify(r, null, 2) : renderScore(r));
}
