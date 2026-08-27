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

// trace@1's `stages` array meant "stages spawned as subagents" — stages the
// Orchestrator ran itself were dropped, or logged in an ad-hoc
// notes.orchestratorExecuted array nothing read. Every figure for those runs
// was computed over a partial list with nothing saying so.
describe("analyze.mjs — untraced stages", () => {
  test("says so plainly when every stage reported telemetry", () => {
    const { md } = analyze({
      ok: trace([{ stage: "QA", archetype: "build", model: "sonnet", effort: "high", tokens: 10000, toolCalls: 10, retries: 0 }]),
    });
    assert.match(md, /None — every stage in every run reported its own telemetry/);
  });

  test("surfaces trace@1 notes.orchestratorExecuted rather than ignoring it", () => {
    const { md } = analyze({
      old: trace(
        [{ stage: "QA", archetype: "build", model: "sonnet", tokens: 10000, toolCalls: 10, retries: 0 }],
        { notes: { orchestratorExecuted: ["Release", "Post-Launch"] } },
      ),
    });
    assert.match(md, /Untraced stages: 2/);
    assert.match(md, /\| s \| Release \|/);
    assert.match(md, /\| s \| Post-Launch \|/);
    assert.match(md, /trace@1/);
  });

  test("surfaces trace@2 executor: orchestrator stages", () => {
    const { md } = analyze({
      neu: trace([
        { stage: "QA", archetype: "build", executor: "subagent", model: "sonnet", effort: "high", tokens: 10000, toolCalls: 10, retries: 0 },
        { stage: "Release", executor: "orchestrator" },
      ]),
    });
    assert.match(md, /Untraced stages: 1/);
    assert.match(md, /\| s \| Release \|/);
    assert.match(md, /trace@2/);
  });

  // The per-run summary row used to sum `run.stages` directly, unfiltered.
  // trace@1 never exposed this: untraced stages lived only in `notes`, never
  // in `stages`. trace@2 puts them in `stages` with no tokens/toolCalls, so
  // `undefined + number` produced NaN the first time a real run mixed a
  // traced and an untraced stage — found on streak-seed's security-hardening
  // run (2026-08-22): 8 stages, 3 orchestrator-executed, tokens rendered NaN.
  test("a run mixing traced and untraced stages sums real numbers, not NaN", () => {
    const { md } = analyze({
      s: trace([
        { stage: "Intake", executor: "orchestrator" },
        { stage: "QA", archetype: "build", executor: "subagent", model: "sonnet", effort: "high", tokens: 10000, toolCalls: 10, retries: 0 },
        { stage: "Release", executor: "orchestrator" },
      ]),
    });
    assert.doesNotMatch(md, /NaN/);
    assert.match(md, /\| s \| 2 \| 3 \| 10,000 \| 10 \|/);
  });

  // A zero that means "not measured" is not the same as a zero that means
  // "free" — averaging them together understates every density figure.
  test("an untraced stage never dilutes the measured averages", () => {
    const measured = analyze({
      a: trace([{ stage: "QA", archetype: "build", executor: "subagent", model: "sonnet", effort: "high", tokens: 10000, toolCalls: 10, retries: 0 }]),
    });
    const withUntraced = analyze({
      a: trace([
        { stage: "QA", archetype: "build", executor: "subagent", model: "sonnet", effort: "high", tokens: 10000, toolCalls: 10, retries: 0 },
        { stage: "Release", archetype: "review", executor: "orchestrator" },
      ]),
    });
    assert.match(measured.stdout, /1 stages/);
    assert.match(withUntraced.stdout, /1 stages/);
  });

  test("an orchestrator-executed stage WITH telemetry still counts as measured", () => {
    const { md, stdout } = analyze({
      a: trace([{ stage: "Release", archetype: "review", executor: "orchestrator", model: "opus", effort: "high", tokens: 5000, toolCalls: 5, retries: 0 }]),
    });
    assert.match(stdout, /1 stages/);
    assert.match(md, /None — every stage in every run reported its own telemetry/);
  });
});

// Attribution is cheap to record now and impossible to reconstruct later. It is
// also only *information* once a fleet has more than one operator — on a
// single-operator fleet a per-operator table is a column of the same name.
describe("analyze.mjs — operator attribution", () => {
  const st = (stage, extra = {}) => ({
    stage, archetype: "build", executor: "subagent", model: "sonnet",
    effort: "medium", tokens: 10000, toolCalls: 10, retries: 0, ...extra,
  });

  test("stays silent on a single-operator fleet", () => {
    const { md } = analyze({ a: trace([st("QA")], { operator: "alice" }) });
    assert.doesNotMatch(md, /## By operator/);
  });

  test("stays silent when no trace names an operator at all", () => {
    const { md } = analyze({ a: trace([st("QA")]) });
    assert.doesNotMatch(md, /## By operator/);
  });

  test("breaks figures out once a fleet has two operators", () => {
    const { md } = analyze({
      a: trace([st("QA")], { operator: "alice" }),
      b: trace([st("QA")], { operator: "bob" }),
    });
    assert.match(md, /## By operator/);
    assert.match(md, /\| alice \| 1 \|/);
    assert.match(md, /\| bob \| 1 \|/);
  });

  test("a stage-level operator overrides the slice's", () => {
    const { md } = analyze({
      a: trace([st("QA"), st("Security", { operator: "bob" })], { operator: "alice" }),
    });
    assert.match(md, /## By operator/);
    assert.match(md, /\| alice \| 1 \|/);
    assert.match(md, /\| bob \| 1 \|/);
  });

  test("counts stages that predate the field rather than dropping them", () => {
    const { md } = analyze({
      a: trace([st("QA")], { operator: "alice" }),
      b: trace([st("QA")], { operator: "bob" }),
      old: trace([st("QA")]),
    });
    assert.match(md, /1 stage\(s\) carry no operator/);
  });
});

// Gate catches are the closest thing to an impact number: a defect a gate
// stopped before it shipped. Structured `gateCatches` (trace@2) is counted;
// legacy notes.gatesThatFired is surfaced but not counted; the total is a floor.
describe("analyze.mjs — gate catches", () => {
  test("counts and renders a structured catch", () => {
    const { md } = analyze({
      s: trace([{ stage: "QA", archetype: "build", executor: "subagent", model: "sonnet", effort: "high", tokens: 1000, toolCalls: 5, retries: 1 }],
        { gateCatches: [{ gate: "QA", verdict: "fail", severity: "blocker", finding: "a11y focus lost" }] }),
    });
    assert.match(md, /Structured catches: 1/);
    assert.match(md, /\| s \| QA \| fail \| blocker \| a11y focus lost \|/);
  });

  test("surfaces legacy notes.gatesThatFired but does not count it as structured", () => {
    const { md } = analyze({
      s: trace([{ stage: "QA", archetype: "build", executor: "subagent", model: "sonnet", effort: "high", tokens: 1000, toolCalls: 5, retries: 0 }],
        { notes: { gatesThatFired: ["QA round 1: FAIL"] } }),
    });
    assert.match(md, /surfaced, not counted/);
    assert.match(md, /QA round 1: FAIL/);
    assert.doesNotMatch(md, /Structured catches:/);
  });

  test("a run with no gateCatches array is called a floor", () => {
    // trace() helper omits gateCatches → predates the field.
    const { md } = analyze({ s: trace([{ stage: "QA", archetype: "build", model: "sonnet", effort: "high", tokens: 1000, toolCalls: 5, retries: 0 }]) });
    assert.match(md, /A floor, not a total/);
  });

  test("a clean slice that recorded [] is not called a floor", () => {
    const { md } = analyze({
      s: trace([{ stage: "QA", archetype: "build", executor: "subagent", model: "sonnet", effort: "high", tokens: 1000, toolCalls: 5, retries: 0 }],
        { gateCatches: [] }),
    });
    assert.doesNotMatch(md, /A floor, not a total/);
    assert.match(md, /None structurally recorded yet/);
  });
});

// FDRT (Failed-Deployment Recovery Time, DORA's 2025 MTTR rename): blocked→
// unblocked on a gate catch. Only a `gateCatches` entry with both
// `detectedAt` and `resolvedAt` is a sample; everything else stays "not
// captured" rather than guessed from stage Start/End (the wrong span — a
// stage's own runtime, not how long the slice sat blocked).
describe("analyze.mjs — FDRT", () => {
  test("a catch with detectedAt/resolvedAt reports the recovery window, not 'not captured'", () => {
    const { md, html } = analyze({
      s: trace([{ stage: "Security", archetype: "review", executor: "subagent", model: "opus", effort: "high", tokens: 1000, toolCalls: 5, retries: 1 }],
        { gateCatches: [{ gate: "Security", verdict: "fail", severity: "required-fix", finding: "F-5",
          detectedAt: "2026-08-22T22:03:00Z", resolvedAt: "2026-08-22T22:24:00Z" }] }),
    });
    assert.match(md, /Failed-deployment recovery time \| \*\*21m\*\* \|/);
    assert.match(md, /median across 1 recorded gate-catch recovery window/);
    assert.match(html, /Failed-deploy recovery<\/td><td class="n">21m<\/td>/);
    // The per-catch table gets its own Recovery column.
    assert.match(md, /\| Security \| fail \| required-fix \| F-5 \| 21m \|/);
  });

  test("a catch without detectedAt/resolvedAt still reports not captured", () => {
    const { md } = analyze({
      s: trace([{ stage: "Security", archetype: "review", executor: "subagent", model: "opus", effort: "high", tokens: 1000, toolCalls: 5, retries: 1 }],
        { gateCatches: [{ gate: "Security", verdict: "fail", severity: "required-fix", finding: "F-5" }] }),
    });
    assert.match(md, /Failed-deployment recovery time \| \*\*not captured\*\* \|/);
    // The per-catch row still renders; just no recovery figure for this one.
    assert.match(md, /\| Security \| fail \| required-fix \| F-5 \| — \|/);
  });

  test("median is taken across multiple recorded catches, not just the first", () => {
    const { md } = analyze({
      a: trace([{ stage: "Security", archetype: "review", model: "opus", effort: "high", tokens: 1000, toolCalls: 5, retries: 1 }],
        { gateCatches: [{ gate: "Security", verdict: "fail", finding: "x",
          detectedAt: "2026-08-01T00:00:00Z", resolvedAt: "2026-08-01T00:10:00Z" }] }),
      b: trace([{ stage: "QA", archetype: "build", model: "sonnet", effort: "high", tokens: 1000, toolCalls: 5, retries: 1 }],
        { gateCatches: [{ gate: "QA", verdict: "fail", finding: "y",
          detectedAt: "2026-08-01T00:00:00Z", resolvedAt: "2026-08-01T00:30:00Z" }] }),
    });
    // Sorted mins: [10, 30] → median index floor(2/2)=1 → 30m.
    assert.match(md, /Failed-deployment recovery time \| \*\*30m\*\* \|/);
    assert.match(md, /median across 2 recorded gate-catch recovery window/);
  });
});

// T9: pipeline topology as data. "always" nodes (Intake, Scope Review,
// Implementation, Release Gate) are required; "conditional" nodes may be a
// legitimate compression — listed, never flagged. Stage names vary in real
// traces (retries, output-name-as-stage-name), so matching is alias-based.
const stage = (name, extra = {}) => ({ stage: name, archetype: "build", executor: "subagent", model: "sonnet", effort: "medium", tokens: 1000, toolCalls: 5, retries: 0, ...extra });

describe("analyze.mjs — pipeline completeness (T9)", () => {
  test("a run with every always-node present (by alias) has no gap", () => {
    const { md } = analyze({
      s: trace([stage("Intake"), stage("Scope"), stage("Implementation"), stage("Release")]),
    });
    assert.match(md, /No run is missing an \*\*always\*\* node/);
    assert.match(md, /\| s \| — \|/);
  });

  test("a missing always-node is flagged with a warning marker", () => {
    const { md } = analyze({
      s: trace([stage("Intake"), stage("Scope"), stage("Release")]), // no Implementation
    });
    assert.match(md, /\| s \| ⚠ Implementation \|/);
    assert.doesNotMatch(md, /No run is missing an \*\*always\*\* node/);
  });

  test("a missing conditional node is listed, not flagged", () => {
    const { md } = analyze({
      s: trace([stage("Intake"), stage("Scope"), stage("Implementation"), stage("Release")]),
    });
    const section = md.split("## Pipeline completeness")[1].split("## DORA")[0];
    // Architecture is conditional and absent here — must appear in the
    // Skipped column, and must NOT trigger the always-node warning marker.
    assert.match(section, /\| s \| — \| [^|]*Architecture[^|]* \| — \|\n/);
  });

  test("trace@1's notes.orchestratorExecuted counts as present, not missing", () => {
    // Release recorded only in the legacy array, never in `stages` — this is
    // exactly the shape of the real browser-client / http-layer traces.
    const { md } = analyze({
      s: trace([stage("Implementation")], { notes: { orchestratorExecuted: ["Intake", "Scope", "Release"] } }),
    });
    assert.match(md, /\| s \| — \|/);
  });

  test("an unrecognized stage name is surfaced, not silently dropped", () => {
    const { md } = analyze({
      s: trace([stage("Intake"), stage("Scope"), stage("Implementation"), stage("Release"), stage("Mystery Stage")]),
    });
    assert.match(md, /Mystery Stage/);
  });

  test("an overlay role (e.g. FinOps) is recognized and never flagged unrecognized", () => {
    const { md } = analyze({
      s: trace([stage("Intake"), stage("Scope"), stage("Implementation"), stage("Release"), stage("FinOps")]),
    });
    const section = md.split("## Pipeline completeness")[1].split("## DORA")[0];
    // The Unrecognized column (last cell of the completeness row) is "—" —
    // FinOps matched an overlay alias, so it never reaches that column, even
    // though it legitimately appears elsewhere (the Per-stage table).
    assert.match(section, /\| s \| — \| [^|]+ \| — \|\n/);
    assert.doesNotMatch(section, /FinOps/);
  });
});
