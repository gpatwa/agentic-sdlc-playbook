// The quality analyzer reports numbers a reviewer will trust to decide where to
// look. A silent miscount sends attention to the wrong file, or hides the right
// one — so these assertions pin the metric definitions, and the honesty labels
// that keep the numbers from being read as more than they are.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const quality = join(here, "..", "quality.mjs");

let n = 0;
// Build a throwaway repo with the given { "src/x.js": "...", "test/y.js": "..." }
// files, run the analyzer, return { stdout, md }.
const run = (files) => {
  const dir = join(tmpdir(), `quality-test-${process.pid}-${n++}`);
  rmSync(dir, { recursive: true, force: true });
  for (const [rel, body] of Object.entries(files)) {
    const p = join(dir, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
  }
  let stdout = "", code = 0;
  try { stdout = execFileSync("node", [quality, dir], { encoding: "utf8", stdio: "pipe" }); }
  catch (e) { code = e.status ?? 1; stdout = e.stdout ?? ""; }
  let md = "";
  try { md = readFileSync(join(dir, "QUALITY.md"), "utf8"); } catch { /* none */ }
  rmSync(dir, { recursive: true, force: true });
  return { stdout, md, code };
};

const row = (md, file) =>
  md.split("\n").find((l) => l.includes(`| ${file} |`))?.split("|").map((c) => c.trim());

describe("quality.mjs — metric definitions", () => {
  test("sloc excludes blank lines and comments", () => {
    const { md } = run({
      "src/a.js": "const x = 1;\n\n// a comment line\n/* block\n comment */\nconst y = 2;\n",
    });
    // Two real statements; comments and blank are not counted.
    assert.equal(row(md, "src/a.js")[2], "2");
  });

  test("a branch keyword inside a comment is not counted", () => {
    const clean = run({ "src/a.js": "export const x = 1;\n" });
    const commented = run({ "src/a.js": "export const x = 1;\n// if for while && ||\n" });
    // Both have base complexity 1 — the comment's keywords must not register.
    assert.equal(row(clean.md, "src/a.js")[3], "1");
    assert.equal(row(commented.md, "src/a.js")[3], "1");
  });

  test("complexity is 1 + decision points", () => {
    const { md } = run({
      "src/a.js": "export function f(a) {\n  if (a) return 1;\n  for (;;) {}\n  return a && a || 0;\n}\n",
    });
    // if + for + && + || = 4 decision points, +1 base = 5.
    assert.equal(row(md, "src/a.js")[3], "5");
  });

  test("ternary and optional-chaining are deliberately not counted", () => {
    const { md } = run({ "src/a.js": "export const f = (a) => a?.b ? 1 : 0;\n" });
    // `?.` and the ternary `?` are omitted by design — base complexity 1.
    assert.equal(row(md, "src/a.js")[3], "1");
  });
});

describe("quality.mjs — flags", () => {
  const big = (sloc) => "export const x = 1;\n".repeat(sloc);

  test("a file over the size threshold flags large", () => {
    const { md } = run({ "src/big.js": big(300) });
    assert.match(md, /\*\*src\/big\.js\*\* — 300 SLOC/);
  });

  test("a small file with a high decision ratio does NOT flag dense", () => {
    // The exact false positive real seed code exposed: a 2-line file with one
    // `||` is 0.5 decisions/SLOC but is not a smell. The density floor gates it.
    const { md } = run({ "src/tiny.js": "export const x = a || b;\nexport const y = 1;\n" });
    assert.doesNotMatch(md, /tiny\.js.*dense/);
    assert.match(md, /None — every file is under/);
  });

  test("a substantial dense file DOES flag", () => {
    // 25 lines, each carrying a branch — above the floor and over the ratio.
    const body = "export function f(a) { return a && a || 0; }\n".repeat(25);
    const { md } = run({ "src/dense.js": body });
    assert.match(md, /dense\.js.*dense/);
  });

  test("clean code produces no flags", () => {
    const { md } = run({ "src/a.js": "export const x = 1;\nexport const y = 2;\n" });
    assert.match(md, /None — every file is under/);
  });
});

describe("quality.mjs — test-presence signal", () => {
  test("computes test:source ratio and never calls it coverage", () => {
    const { md } = run({
      "src/a.js": "export const x = 1;\nexport const y = 2;\n",
      "test/a.test.js": "test x\ntest y\ntest z\ntest w\n",
    });
    assert.match(md, /Test:source SLOC ratio: \*\*2×\*\*/);
    assert.match(md, /presence signal, not coverage/i);
  });

  test("no test dir renders a dash, not a zero or a crash", () => {
    const { md } = run({ "src/a.js": "export const x = 1;\n" });
    assert.match(md, /Test:source SLOC ratio: \*\*—\*\*/);
  });
});

describe("quality.mjs — honesty and contract", () => {
  test("states plainly what it is NOT", () => {
    const { md } = run({ "src/a.js": "export const x = 1;\n" });
    assert.match(md, /Not coverage/);
    assert.match(md, /Not a parser/);
    assert.match(md, /Not a gate/);
  });

  test("is measure-only — never exits non-zero on flagged code", () => {
    const { code } = run({ "src/big.js": "export const x = 1;\n".repeat(300) });
    assert.equal(code, 0, "flags must not fail the build — that decision waits on a slice");
  });

  test("errors cleanly when there is no src/ directory", () => {
    const { code } = run({ "lib/a.js": "export const x = 1;\n" });
    assert.equal(code, 1);
  });
});
