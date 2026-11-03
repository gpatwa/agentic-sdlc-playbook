#!/usr/bin/env node
// assess-judge.mjs — judges a random sample of an assessment's open findings with a model from a DIFFERENT family
// than the one that wrote them (docs/REVIEW_MODE_PLAN.md, M4: the precision bar needs 30 judged findings).
//
//   node assess-judge.mjs <records-dir> --judge codex|claude [--n 30] [--seed N] [--seeds seeds.json] [--model m] [--effort e]
//        [--batch 10] [--ids F-01-1,F-02-3] [--allow-same-family] [--dry-run]
//
// <records-dir> is the reviews/ folder an assessment wrote (FINDINGS.md inside; the review copy is its parent). The sample is
// drawn with a fixed seed, balanced across reviewers, from findings that are still `open`, have a file and line, and (given
// --seeds) match no planted bug. Judgments are written to FINDINGS.md as dispositions confirmed, rejected or intentional
// ("unclear" stays open) and to JUDGED.json with the judge's model, effort, the prompt's sha256, the seed and each reason.
//
// A judge's verdict is PROVISIONAL. The owner's disposition outranks it: change a row in FINDINGS.md and the score follows.
// Judge and reviewer must be different families unless --allow-same-family, which is recorded.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseFindings, hasFileAndLine } from "./assess-report.mjs";
import { locate } from "./assess-calibrate.mjs";
import { REVIEWERS, reviewerCommand, defaultRunner } from "./assess-run.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const PROMPT_FILE = join(here, "..", "templates", "FINDING_JUDGE_PROMPT.md");
const VERDICTS = new Set(["confirmed", "rejected", "intentional", "unclear"]);

/** mulberry32: a small seeded generator, so the same seed draws the same sample. */
export function prng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const shuffle = (list, rnd) => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Up to n findings, taken in turn from each reviewer's shuffled list so no reviewer dominates. */
export function drawSample(findings, { n = 30, seed = 1, seeds = [], tolerance = 5, ids = null } = {}) {
  const norm = (p) => p.replace(/^\.\//, "");
  const isSeed = (f) => { const at = locate(f.where); return !!at && seeds.some((s) => norm(s.file) === at.file && at.start <= s.lineEnd + tolerance && at.end >= s.lineStart - tolerance); };
  const pool = findings.filter((f) => (!ids || ids.has(f.id)) && f.disposition === "open" && hasFileAndLine(f.where) && !isSeed(f));
  const rnd = prng(seed);
  const by = new Map();
  for (const f of pool) by.set(f.reviewer, [...(by.get(f.reviewer) ?? []), f]);
  const lists = [...by.keys()].sort().map((k) => shuffle(by.get(k), rnd));
  const out = [];
  for (let i = 0; out.length < n && lists.some((l) => i < l.length); i++) for (const l of lists) if (i < l.length && out.length < n) out.push(l[i]);
  return out;
}

/** The judge's JSON array out of its reply (it may add prose or a code fence around it). */
export function parseVerdicts(text) {
  const start = text.indexOf("["), end = text.lastIndexOf("]");
  if (start < 0 || end < start) return [];
  try { return JSON.parse(text.slice(start, end + 1)).filter((v) => v && typeof v.id === "string"); } catch { return []; }
}

const family = (reviewer) => REVIEWERS[reviewer]?.family ?? reviewer;

export function judge(recordsDir, opts, runner = defaultRunner) {
  const { judge: who, n = 30, seed = 1, batch = 10, seedsFile, allowSameFamily = false, dryRun = false } = opts;
  if (!REVIEWERS[who]) throw new Error("--judge must be codex or claude");
  const dir = resolve(recordsDir), clone = dirname(dir);
  const md = readFileSync(join(dir, "FINDINGS.md"), "utf8");
  const all = parseFindings(md);
  const seeds = seedsFile && existsSync(seedsFile) ? JSON.parse(readFileSync(seedsFile, "utf8")) : [];
  const sample = drawSample(all, { n, seed, seeds, ids: opts.ids ? new Set(opts.ids) : null });
  const same = [...new Set(sample.map((f) => f.reviewer))].filter((r) => family(r) === REVIEWERS[who].family);
  if (same.length && !allowSameFamily) throw new Error(`judge ${who} is the same family as reviewer(s) ${same.join(", ")}; use the other reviewer or pass --allow-same-family (recorded)`);
  const model = opts.model ?? REVIEWERS[who].model, effort = opts.effort ?? REVIEWERS[who].effort;
  if (dryRun) return { sample, judged: 0, dryRun: true };
  const template = readFileSync(PROMPT_FILE, "utf8").split(/\n---\n/).slice(1).join("\n---\n").trim();
  const promptSha = createHash("sha256").update(template).digest("hex");
  const verdicts = new Map(), failedBatches = [];
  for (let i = 0; i < sample.length; i += batch) {
    const part = sample.slice(i, i + batch);
    const body = JSON.stringify(part.map(({ id, severity, where, finding, evidence }) => ({ id, severity, where, finding, evidence })), null, 1);
    const outFile = join(dir, `judge-reply-${i / batch + 1}.md`);
    const spec = reviewerCommand(who, { clone, model, effort, outFile });
    const res = runner(spec, `${template}\n\n## Findings\n\n${body}\n`, clone);
    const reply = spec.reply === "file" && existsSync(outFile) ? readFileSync(outFile, "utf8") : res.stdout ?? "";
    const got = res.status === 0 ? parseVerdicts(reply) : [];
    if (!got.length) { failedBatches.push(i / batch + 1); continue; }
    for (const v of got) if (part.some((f) => f.id === v.id) && VERDICTS.has(v.verdict)) verdicts.set(v.id, v);
  }
  // Apply: confirmed, rejected and intentional become dispositions; unclear and missing stay open.
  let out = md;
  const applied = [];
  for (const f of sample) {
    const v = verdicts.get(f.id);
    if (!v || v.verdict === "unclear") continue;
    const re = new RegExp(`^(\\| ${f.id.replace(/[-]/g, "\\-")} \\|.*\\| )open( \\|)$`, "m");
    if (re.test(out)) { out = out.replace(re, `$1${v.verdict}$2`); applied.push(f.id); }
  }
  writeFileSync(join(dir, "FINDINGS.md"), out);
  const record = {
    judge: who, family: REVIEWERS[who].family, model, effort, promptSha256: promptSha, seed, n, sampled: sample.map((f) => f.id), allowSameFamily,
    note: "Provisional: the owner's disposition outranks the judge's.",
    verdicts: sample.map((f) => ({ id: f.id, reviewer: f.reviewer, ...(verdicts.get(f.id) ?? { verdict: "not judged" }) })), failedBatches,
  };
  writeFileSync(join(dir, "JUDGED.json"), JSON.stringify(record, null, 2) + "\n");
  const count = (v) => record.verdicts.filter((x) => x.verdict === v).length;
  return { sample, judged: verdicts.size, applied, failedBatches, confirmed: count("confirmed"), rejected: count("rejected"), intentional: count("intentional"), unclear: count("unclear"), record };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const val = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  const flagged = new Set(["--judge", "--n", "--seed", "--seeds", "--model", "--effort", "--batch", "--ids"]);
  const dir = a.find((x, i) => !x.startsWith("--") && !flagged.has(a[i - 1]));
  if (!dir || !REVIEWERS[val("--judge")]) { console.error("usage: node assess-judge.mjs <records-dir> --judge codex|claude [--n 30] [--seed N] [--seeds seeds.json] [--model m] [--effort e] [--batch 10] [--allow-same-family] [--dry-run]"); process.exit(2); }
  try {
    const r = judge(dir, { judge: val("--judge"), n: Number(val("--n") ?? 30), seed: Number(val("--seed") ?? 1), batch: Number(val("--batch") ?? 10), ids: val("--ids")?.split(","), seedsFile: val("--seeds"), model: val("--model"), effort: val("--effort"), allowSameFamily: a.includes("--allow-same-family"), dryRun: a.includes("--dry-run") });
    if (r.dryRun) { console.log(`dry run: ${r.sample.length} finding(s) would be judged`); process.exit(0); }
    console.log(`judged ${r.judged} of ${r.sample.length}: ${r.confirmed} confirmed, ${r.rejected} rejected, ${r.intentional} intentional, ${r.unclear} unclear`);
    if (r.failedBatches.length) console.log(`batch(es) with no usable reply: ${r.failedBatches.join(", ")}`);
    console.log(`written: ${join(resolve(dir), "FINDINGS.md")} (dispositions), ${join(resolve(dir), "JUDGED.json")}`);
    process.exit(r.failedBatches.length ? 1 : 0);
  } catch (e) { console.error(`! ${e.message}`); process.exit(2); }
}
