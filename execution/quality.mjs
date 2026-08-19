#!/usr/bin/env node
// Code-quality analyzer — dependency-free Node ESM. Sibling to analyze.mjs.
//
//   node <playbook>/execution/quality.mjs [productRepoRoot]
//
// analyze.mjs measures the pipeline's COST (tokens, density) from trace.json.
// This measures the code's SHAPE from the source itself: module size,
// approximate complexity, and a test-presence signal. Four external write-ups
// (Google's New-SDLC paper, Monaco, DoorDash, Anthropic's AI-native-org talk)
// all assume an automated code-quality layer as table stakes; we had none.
// This is that layer, measure-only for now — it renders QUALITY.md and never
// gates. Whether any of these metrics earns a gate is a decision for a real
// slice where a reviewer agent looked, not for this tool to presume.
//
// HONESTY — what these numbers are and are NOT:
//  - "sloc" strips blank lines and comments; string contents are not stripped.
//  - "complexity" is an APPROXIMATION: 1 + decision points per file, counted by
//    token match with comments removed first. It counts if/for/while/case/catch
//    and && / ||. It deliberately OMITS the ternary and optional-chaining `?`,
//    which cannot be told apart from each other without an AST — undercounting
//    honestly beats overcounting on noise. It is per FILE, not per function:
//    attributing complexity to a function needs a real parser this has no
//    business bundling.
//  - "test ratio" is test-SLOC / source-SLOC. It is a PRESENCE signal, NOT
//    coverage. Real coverage needs an instrumented test run (c8 / node --test
//    --experimental-test-coverage); this tool never executes anything.
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.argv[2] || process.cwd();
const srcDir = join(root, "src");
if (!existsSync(srcDir)) { console.error(`no src/ dir at ${root}`); process.exit(1); }

// Thresholds are calibrated from observed seed-repo code, the same way the
// density caps in analyze.mjs were set from observed runs — not pulled from the
// air. A flag means "worth a human glance", never "broken".
// `densityFloor`: below this SLOC, decisions/SLOC is noise on a tiny denominator
// (a 2-line file with one `||` is not "dense"). Added after the tool flagged
// exactly that false positive on real seed code — the calibration the run bought.
const T = { largeFileSloc: 250, highComplexity: 60, denseRatio: 0.30, densityFloor: 20 };

const isSource = (f) => /\.(js|mjs)$/.test(f);

// Recursively collect files under a dir, skipping the usual noise.
const walk = (dir, acc = []) => {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (isSource(name)) acc.push(p);
  }
  return acc;
};

// Strip block and line comments so JSDoc prose ("if the value…", "true or
// false") cannot be miscounted as branches. Not a tokenizer — it does not
// understand strings — but it removes the dominant source of false positives.
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const sloc = (s) => s.split("\n").filter((l) => l.trim() !== "").length;

// Approximate decision-point count — see the header for exactly what it counts
// and what it omits.
const decisionPoints = (s) => {
  let n = 0;
  for (const re of [/\bif\b/g, /\bfor\b/g, /\bwhile\b/g, /\bcase\b/g, /\bcatch\b/g, /&&/g, /\|\|/g]) {
    n += (s.match(re) || []).length;
  }
  return n;
};

// Heuristic "function-ish" count: `function` keyword + arrow forms. Rough on
// purpose — it is a density denominator, not a precise inventory.
const functionish = (s) =>
  (s.match(/\bfunction\b/g) || []).length + (s.match(/=>/g) || []).length;

const srcFiles = walk(srcDir).sort();
const files = srcFiles.map((p) => {
  const stripped = stripComments(readFileSync(p, "utf8"));
  const s = sloc(stripped);
  const complexity = 1 + decisionPoints(stripped);
  return {
    file: relative(root, p),
    sloc: s,
    complexity,
    functions: functionish(stripped),
    density: s > 0 ? +(complexity / s).toFixed(3) : 0,
    flags: [
      s > T.largeFileSloc ? "large" : "",
      complexity > T.highComplexity ? "complex" : "",
      s >= T.densityFloor && complexity / s > T.denseRatio ? "dense" : "",
    ].filter(Boolean),
  };
});

// Test-presence signal (NOT coverage — see header).
const testDir = join(root, "test");
const testFiles = existsSync(testDir) ? walk(testDir) : [];
const testSloc = testFiles.reduce((a, p) => a + sloc(stripComments(readFileSync(p, "utf8"))), 0);
const srcSloc = files.reduce((a, f) => a + f.sloc, 0);
// No test files → "—" (not measured), which is honestly different from a real
// low ratio. Only compute a number when tests actually exist.
const testRatio = testFiles.length && srcSloc > 0 ? +(testSloc / srcSloc).toFixed(2) : null;

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const flagged = files.filter((f) => f.flags.length);

// ── render QUALITY.md ────────────────────────────────────────────────────────
const ts = new Date().toISOString().replace(/\.\d+Z$/, "Z");
let md = `# Code Quality — generated\n\n`;
md += `_Generated ${ts}. **Do not edit by hand** — regenerate with \`node <playbook>/execution/quality.mjs .\`._\n\n`;
md += `> **Measure-only.** These metrics never gate a release. They describe the\n`;
md += `> code's shape so a reviewer can look where it matters; whether any of them\n`;
md += `> should block a slice is a decision earned by evidence, not asserted here.\n\n`;

md += `## Summary\n\n`;
md += `- Source files: **${files.length}** · Source SLOC: **${srcSloc.toLocaleString("en-US")}**\n`;
md += `- Approx. complexity: median **${median(files.map((f) => f.complexity))}**, max **${Math.max(...files.map((f) => f.complexity), 0)}**\n`;
md += `- Largest file: **${Math.max(...files.map((f) => f.sloc), 0)}** SLOC\n`;
md += `- Test:source SLOC ratio: **${testRatio === null ? "—" : testRatio + "×"}** (${testFiles.length} test file(s)) — *presence signal, not coverage*\n`;
md += `- Files flagged for a glance: **${flagged.length}/${files.length}**\n\n`;

md += `## Per file\n\n`;
md += `| File | SLOC | Approx. cx | Fns | Cx/SLOC | Flags |\n|------|------|-----------|-----|---------|-------|\n`;
for (const f of [...files].sort((a, b) => b.complexity - a.complexity)) {
  md += `| ${f.file} | ${f.sloc} | ${f.complexity} | ${f.functions} | ${f.density} | ${f.flags.join(", ") || "—"} |\n`;
}

md += `\n## Flags\n\n`;
if (!flagged.length) md += `None — every file is under the size, complexity, and density thresholds.\n`;
else {
  md += `A flag is "worth a human glance", never "broken".\n\n`;
  for (const f of flagged) {
    const why = f.flags.map((fl) =>
      fl === "large" ? `${f.sloc} SLOC (> ${T.largeFileSloc})`
      : fl === "complex" ? `approx. complexity ${f.complexity} (> ${T.highComplexity})`
      : `${f.density} decisions/SLOC (> ${T.denseRatio})`).join("; ");
    md += `- **${f.file}** — ${why}\n`;
  }
}

md += `\n## Thresholds\n\n`;
md += `- Large file: **> ${T.largeFileSloc}** SLOC · High complexity: **> ${T.highComplexity}** · Dense: **> ${T.denseRatio}** decisions/SLOC (files ≥ ${T.densityFloor} SLOC only)\n`;
md += `- Calibrated from observed seed-repo code, not pulled from the air — the same discipline as analyze.mjs's density caps.\n`;

md += `\n## What this is NOT\n\n`;
md += `- **Not coverage.** The test ratio is test-SLOC / source-SLOC — a presence signal. Real coverage needs an instrumented run; this tool never executes code.\n`;
md += `- **Not a parser.** Complexity is a per-file decision-point approximation; it omits ternary/optional-chaining \`?\` to avoid false positives, and does not attribute complexity to individual functions.\n`;
md += `- **Not a gate.** Nothing here fails a build. That decision waits on a real slice.\n`;

writeFileSync(join(root, "QUALITY.md"), md);
console.log(
  `quality: ${files.length} files, ${srcSloc.toLocaleString("en-US")} SLOC, ` +
  `${flagged.length} flagged, test:source ${testRatio === null ? "—" : testRatio + "×"} → QUALITY.md`,
);
