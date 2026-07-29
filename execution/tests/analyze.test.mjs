// The analyzer turns traces into the numbers we then reason about — budgets,
// density outliers, DORA. A silent defect here doesn't crash anything; it just
// makes every downstream conclusion quietly wrong, which is worse.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const analyzer = join(here, "..", "analyze.mjs");

let n = 0;
const analyze = (traces) => {
  const dir = join(tmpdir(), `analyze-test-${process.pid}-${n++}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "runs"), { recursive: true });
  for (const [slice, trace] of Object.entries(traces)) {
    mkdirSync(join(dir, "runs", slice), { recursive: true });
    writeFileSync(join(dir, "runs", slice, "trace.json"), JSON.stringify(trace));
  }
  const stdout = execFileSync("node", [analyzer], { cwd: dir, encoding: "utf8" });
  const md = readFileSync(join(dir, "runs", "ANALYTICS.md"), "utf8");
  const html = readFileSync(join(dir, "runs", "dashboard.html"), "utf8");
  rmSync(dir, { recursive: true, force: true });
  return { stdout, md, html };
};

const trace = (stages, extra = {}) => ({
  schema: "agentic-sdlc/trace@1",
  slice: "s", tier: 2, overlay: false, landed: true,
  started: "2026-07-01T00:00Z", landedAt: "2026-07-01T02:00Z",
  postLandingFixes: 0, reverted: false,
  stages, ...extra,
});

describe("analyze.mjs — effort column", () => {
  test("renders the effort a stage ran at", () => {
    const { md, html } = analyze({
      one: trace([{ stage: "QA", archetype: "review", model: "sonnet", effort: "high", tokens: 40000, toolCalls: 10, retries: 0 }]),
    });
    assert.match(md, /\| high \|/);
    assert.match(html, /<td>high<\/td>/);
  });

  // Eight traces predate the effort axis. They must read as "not recorded",
  // never as an invented level — their density figures were measured at
  // inherited effort and are not comparable.
  test("pre-effort traces render as not-recorded, never undefined", () => {
    const { md, html } = analyze({
      old: trace([{ stage: "QA", archetype: "review", model: "sonnet", tokens: 40000, toolCalls: 10, retries: 0 }]),
    });
    assert.doesNotMatch(md, /undefined/);
    assert.doesNotMatch(html, /undefined/);
    assert.match(md, /\| — \|/);
  });

  test("a mixed corpus renders both without crashing", () => {
    const { md } = analyze({
      old: trace([{ stage: "QA", archetype: "review", model: "sonnet", tokens: 40000, toolCalls: 10, retries: 0 }]),
      new: trace([{ stage: "QA", archetype: "review", model: "sonnet", effort: "high", tokens: 40000, toolCalls: 10, retries: 0 }]),
    });
    assert.doesNotMatch(md, /undefined/);
    assert.match(md, /\| high \|/);
    assert.match(md, /\| — \|/);
  });
});

describe("analyze.mjs — density is judged per archetype", () => {
  // The flat detector cut through two legitimate clusters; the whole point of
  // per-archetype caps is that the same tok/call is fine for design and an
  // outlier for build.
  test("9k tok/call is within cap for design but over cap for build", () => {
    const mk = (archetype) => trace([
      { stage: "X", archetype, model: "opus", effort: "high", tokens: 90000, toolCalls: 10, retries: 0 },
    ]);
    const design = analyze({ d: mk("design") });
    const build = analyze({ b: mk("build") });
    assert.doesNotMatch(design.md, /⚠ density/);
    assert.match(build.md, /⚠ density/);
  });

  test("a stage over the per-stage token cap is flagged", () => {
    const { md } = analyze({
      big: trace([{ stage: "X", archetype: "build", model: "sonnet", effort: "medium", tokens: 200000, toolCalls: 200, retries: 0 }]),
    });
    assert.match(md, /over cap/);
  });
});

describe("analyze.mjs — honesty about what it cannot measure", () => {
  test("reports FDRT as not captured rather than estimating it", () => {
    const { md } = analyze({ one: trace([{ stage: "X", archetype: "build", model: "sonnet", effort: "medium", tokens: 1000, toolCalls: 5, retries: 0 }]) });
    assert.match(md, /not captured/i);
  });

  test("counts a reverted slice as a change failure", () => {
    const { md } = analyze({
      good: trace([{ stage: "X", archetype: "build", model: "sonnet", effort: "medium", tokens: 1000, toolCalls: 5, retries: 0 }]),
      bad: trace([{ stage: "X", archetype: "build", model: "sonnet", effort: "medium", tokens: 1000, toolCalls: 5, retries: 0 }], { reverted: true }),
    });
    assert.doesNotMatch(md, /Change failure rate\s*\|\s*0%/);
  });
});

describe("analyze.mjs — degenerate input", () => {
  test("a stage with zero tool calls does not emit Infinity or NaN", () => {
    const { md } = analyze({
      z: trace([{ stage: "X", archetype: "build", model: "sonnet", effort: "medium", tokens: 1000, toolCalls: 0, retries: 0 }]),
    });
    assert.doesNotMatch(md, /Infinity|NaN/);
  });

  test("a trace with no stages does not crash the run", () => {
    const { md } = analyze({ empty: trace([]) });
    assert.ok(md.length > 0);
    assert.doesNotMatch(md, /undefined|NaN/);
  });
});

// The mechanism, not the policy: cost signals should not auto-block a release
// by default (that is why budget-guard fails open), but a product whose cost
// signals ARE load-bearing needs a way to gate. --strict supplies it.
describe("analyze.mjs — --strict exit code", () => {
  const runStrict = (traces) => {
    const dir = join(tmpdir(), `analyze-strict-${process.pid}-${n++}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(join(dir, "runs"), { recursive: true });
    for (const [slice, trace] of Object.entries(traces)) {
      mkdirSync(join(dir, "runs", slice), { recursive: true });
      writeFileSync(join(dir, "runs", slice, "trace.json"), JSON.stringify(trace));
    }
    let code = 0;
    try {
      execFileSync("node", [analyzer, "--strict"], { cwd: dir, encoding: "utf8", stdio: "pipe" });
    } catch (e) { code = e.status ?? 1; }
    rmSync(dir, { recursive: true, force: true });
    return code;
  };

  const cleanTrace = trace([
    { stage: "X", archetype: "build", model: "sonnet", effort: "medium", tokens: 10000, toolCalls: 10, retries: 0 },
  ]);
  const outlierTrace = trace([
    { stage: "X", archetype: "build", model: "sonnet", effort: "medium", tokens: 90000, toolCalls: 10, retries: 0 },
  ]);

  test("exits 0 on a clean fleet", () => {
    assert.equal(runStrict({ ok: cleanTrace }), 0);
  });

  test("exits non-zero when a stage is an outlier", () => {
    assert.equal(runStrict({ bad: outlierTrace }), 1);
  });

  test("without --strict an outlier still exits 0 — advisory by default", () => {
    const { stdout } = analyze({ bad: outlierTrace });
    assert.match(stdout, /outlier/);
  });
});
