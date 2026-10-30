#!/usr/bin/env node
// assess-plan.mjs — the area runner's planner (docs/REVIEW_MODE_PLAN.md, M3 with the M3b exclusions). No model.
//
//   node assess-plan.mjs <dir> --out <records-dir> [--area-tokens N] [--cap-tokens N] [--scope <subdir>]... [--rules <file>] [--date YYYY-MM-DD]
//
// It splits the files worth reviewing into AREAS (a directory, or a slice of one, up to a size cap), orders them by risk,
// keeps adding areas until the token cap is reached, and lists everything else as NOT REVIEWED with the reason. It writes
//   AREAS.md       the plan: order, size, tier, and what is not reviewed, out of scope, excluded or held back
//   areas/NN-*.md  one prompt per planned area: file PATHS and instructions, never file contents
//   FINDINGS.md    the empty findings record, with the id scheme
// It never fixes anything and never writes into <dir>.
//
// WHAT NEVER REACHES A REVIEWER. Paths on the secret-path list (the map marks them denied) are not in any area. Files whose
// text matches a high-confidence secret pattern are HELD BACK: listed by path and pattern name, never by value, and left out of
// every area until the owner decides. The scan reads the files it is pointed at, so run it on the review copy.
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildMap } from "./repo-map.mjs";

export const SECRET_PATTERNS = [
  ["AWS access key id", /\b(AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["private key block", /-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ["Anthropic or OpenAI style key", /\bsk-(ant-)?[A-Za-z0-9_-]{32,}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["hard-coded password", /\b(password|passwd|secret|api[_-]?key)\s*[:=]\s*["'][^"'\s]{12,}["']/i],
];
export const secretHits = (text) => SECRET_PATTERNS.filter(([, re]) => re.test(text)).map(([name]) => name);

const RANK = { high: 0, medium: 1, low: 2 };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "root";

// Split `files` (all under `dir`) into areas no bigger than `max` tokens, as far as directories allow.
function split(dir, files, max) {
  const total = files.reduce((s, f) => s + f.tokens, 0);
  if (total <= max) return [{ dir, files }];
  const depth = dir ? dir.split("/").length : 0;
  const direct = files.filter((f) => f.path.split("/").length === depth + 1);
  const sub = new Map();
  for (const f of files.filter((x) => x.path.split("/").length > depth + 1)) {
    const key = f.path.split("/")[depth];
    sub.set(key, [...(sub.get(key) ?? []), f]);
  }
  const out = [];
  for (const [k, fs] of [...sub.entries()].sort((a, b) => a[0].localeCompare(b[0]))) out.push(...split(dir ? `${dir}/${k}` : k, fs, max));
  // files directly in this directory, or in a directory that cannot be split further, are chunked in path order
  const chunk = (list, label) => {
    let cur = [], size = 0, n = 1;
    for (const f of [...list].sort((a, b) => a.path.localeCompare(b.path))) {
      if (cur.length && size + f.tokens > max) { out.push({ dir: `${label}#${n++}`, files: cur }); cur = []; size = 0; }
      cur.push(f); size += f.tokens;
    }
    if (cur.length) out.push({ dir: n > 1 ? `${label}#${n}` : label, files: cur });
  };
  if (direct.length) chunk(direct, dir || "(root)");
  return out;
}

export function planAreas(map, { areaTokens = 60000, capTokens = 400000, heldBack = new Map() } = {}) {
  const held = [...heldBack.entries()].map(([path, patterns]) => ({ path, patterns }));
  // A file bigger than an area cannot be read in one pass (generated pages, data dumps): named, never silently dropped.
  const oversize = map.files.filter((f) => f.status === "review" && !heldBack.has(f.path) && f.tokens > areaTokens).map((f) => ({ path: f.path, tokens: f.tokens }));
  const big = new Set(oversize.map((f) => f.path));
  const reviewable = map.files.filter((f) => f.status === "review" && !heldBack.has(f.path) && !big.has(f.path));
  const areas = split("", reviewable, areaTokens).map((a) => {
    const tier = a.files.reduce((t, f) => (RANK[f.tier] < RANK[t] ? f.tier : t), "low");
    return { dir: a.dir, files: a.files.map((f) => f.path), tier, tokens: a.files.reduce((s, f) => s + f.tokens, 0), commits: a.files.reduce((s, f) => s + f.commits, 0), highFiles: a.files.filter((f) => f.tier === "high").map((f) => f.path) };
  });
  areas.sort((a, b) => RANK[a.tier] - RANK[b.tier] || b.commits - a.commits || a.dir.localeCompare(b.dir));
  let used = 0, stopped = false;
  areas.forEach((a, i) => {
    a.id = String(i + 1).padStart(2, "0");
    a.slug = `${a.id}-${slug(a.dir)}`;
    if (!stopped && used + a.tokens <= capTokens) { a.status = "planned"; used += a.tokens; }
    else { stopped = true; a.status = "not reviewed"; a.reason = used + a.tokens > capTokens ? "token cap reached" : "after the cap"; }
  });
  return {
    areas, usedTokens: used, capTokens, areaTokens, held, oversize,
    outOfScope: map.files.filter((f) => f.status === "out of scope").length,
    excluded: map.files.filter((f) => f.status === "denied").length,
    skipped: map.files.filter((f) => f.status === "skipped").length,
  };
}

// Reads the text of review-status files in `dir` and returns Map(path -> pattern names). Names only, never the match.
export function scanForSecrets(map, dir) {
  const hits = new Map();
  for (const f of map.files.filter((x) => x.status === "review")) {
    let text;
    try { text = readFileSync(join(dir, f.path), "utf8"); } catch { continue; }
    const found = secretHits(text);
    if (found.length) hits.set(f.path, found);
  }
  return hits;
}

const fmt = (n) => n.toLocaleString("en-US");

export function renderAreas(plan, map) {
  const L = [`# Assessment plan: ${map.repo}`, "",
    `> Commit \`${map.sha}\`, planned ${map.date} by \`execution/assess-plan.mjs\`. Deterministic, no model.`,
    `> Cap: ${fmt(plan.capTokens)} tokens of source (estimate: bytes / 4); an area holds at most ${fmt(plan.areaTokens)}. Areas run in order of risk, then churn, and the plan **stops at the cap**: the rest is listed as not reviewed, never skipped silently.`, "",
    "## Summary", "",
    `- Planned: ${plan.areas.filter((a) => a.status === "planned").length} areas, about ${fmt(plan.usedTokens)} tokens.`,
    `- **Not reviewed:** ${plan.areas.filter((a) => a.status === "not reviewed").length} areas, about ${fmt(plan.areas.filter((a) => a.status === "not reviewed").reduce((s, a) => s + a.tokens, 0))} tokens.`,
    `- Out of scope: ${plan.outOfScope} files. Excluded as secret paths: ${plan.excluded}. Skipped (vendored, binary, lock): ${plan.skipped}. Held back for a possible secret: ${plan.held.length}. Too large for one pass: ${plan.oversize.length}.`, "",
    "## Areas, in review order", "",
    "| # | Area | Tier | Files | Approx. tokens | Status |", "|---|---|---|---|---|---|",
    ...plan.areas.map((a) => `| ${a.id} | \`${a.dir}\` | ${a.tier} | ${a.files.length} | ${fmt(a.tokens)} | ${a.status}${a.reason ? ` (${a.reason})` : ""} |`), ""];
  if (plan.held.length) L.push("## Held back: a possible secret (owner decides)", "", "These files matched a secret pattern. They are in no area. The match itself is not recorded here.", "", ...plan.held.map((h) => `- \`${h.path}\`: ${h.patterns.join(", ")}`), "");
  if (plan.oversize.length) L.push(`## Too large to review in one pass (named, not reviewed)`, "", `Each is larger than one area (${fmt(plan.areaTokens)} tokens). They are usually generated pages or data. Split or sample them by hand if they matter.`, "", ...plan.oversize.map((f) => `- \`${f.path}\` (about ${fmt(f.tokens)} tokens)`), "");
  L.push("## What this plan does not say", "", "Reviewing an area finds issues; it does not show their absence. Anything in a **not reviewed** area, a held-back file or a secret path was not looked at.", "");
  return L.join("\n");
}

export function renderAreaPrompt(a, map) {
  return [`# Review area ${a.id}: \`${a.dir}\` (${a.tier} risk)`, "",
    `Repository \`${map.repo}\` at commit \`${map.sha}\`. You are in a **read-only review copy**: you cannot edit, write, commit or push, and secret paths are not in it. Do not try to get around that. If a file you need is missing, say so.`, "",
    "## What to do", "",
    "1. Read every file listed below. Review the area as a whole, as if it were a new change against an empty tree (`/code-review` at `high`).",
    a.tier === "high" ? "2. This area has high-risk files. Also run the Security Review over them (`.claude/agents/security-privacy.md` if present, otherwise your own checklist for authentication, access, injection, secrets and data exposure)." : "2. No Security Review is needed unless you find a security issue.",
    "3. Report only findings with a **file and line**, what triggers them, the evidence you read, and a suggested fix. Drop style-only and cleanup-only findings (`docs/CODE_REVIEW.md` rule 1).",
    "4. **Never fix.** Add each finding to `reviews/FINDINGS.md` as a new row with disposition `open`, id `F-" + a.id + "-<n>`, and your reviewer name.",
    "5. When done, say which listed files you did **not** read, and why.", "",
    `## Files (${a.files.length}, about ${fmt(a.tokens)} tokens)`, "",
    ...(a.highFiles.length ? ["High-risk (read first):", ...a.highFiles.map((p) => `- \`${p}\``), "", "All files:"] : []),
    ...a.files.map((p) => `- \`${p}\``), ""].join("\n");
}

export const FINDINGS_HEADER = `# Findings

Ids are \`F-<area>-<n>\`. Severity is P0, P1, P2, P3 or note. **Disposition starts as \`open\`**; only the owner changes it (fixed, rejected, intentional, deferred). A finding without a file and line is not recorded.

| id | severity | file:line | finding | evidence | reviewer | disposition |
|---|---|---|---|---|---|---|
`;

export function writeRecords(plan, map, outDir) {
  mkdirSync(join(outDir, "areas"), { recursive: true });
  writeFileSync(join(outDir, "AREAS.md"), renderAreas(plan, map));
  for (const a of plan.areas.filter((x) => x.status === "planned")) writeFileSync(join(outDir, "areas", `${a.slug}.md`), renderAreaPrompt(a, map));
  if (!existsSync(join(outDir, "FINDINGS.md"))) writeFileSync(join(outDir, "FINDINGS.md"), FINDINGS_HEADER);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const val = (f) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : undefined; };
  const dir = a.find((x, i) => !x.startsWith("--") && !["--out", "--area-tokens", "--cap-tokens", "--scope", "--rules", "--date"].includes(a[i - 1]));
  const out = val("--out");
  if (!dir || !out) { console.error("usage: node assess-plan.mjs <dir> --out <records-dir> [--area-tokens N] [--cap-tokens N] [--scope <subdir>]... [--rules <file>] [--date YYYY-MM-DD]"); process.exit(1); }
  const inside = resolve(out).startsWith(resolve(dir) + "/") || resolve(out) === resolve(dir);
  if (inside && !resolve(out).startsWith(resolve(dir, "reviews"))) console.error("note: --out is inside the directory being planned. For a review copy use its reviews/ folder (excluded from git); for the real repo use a folder elsewhere, or the repo changes.");
  const map = buildMap(dir, { scopes: a.flatMap((x, i) => (x === "--scope" ? [a[i + 1]] : [])), rulesText: val("--rules") ? readFileSync(val("--rules"), "utf8") : undefined, date: val("--date") });
  const plan = planAreas(map, { areaTokens: Number(val("--area-tokens") ?? 60000), capTokens: Number(val("--cap-tokens") ?? 400000), heldBack: scanForSecrets(map, resolve(dir)) });
  writeRecords(plan, map, out);
  console.log(`planned ${plan.areas.filter((x) => x.status === "planned").length} areas (${fmt(plan.usedTokens)} tokens), not reviewed ${plan.areas.filter((x) => x.status === "not reviewed").length}, held back ${plan.held.length}, records in ${resolve(out)}`);
}
