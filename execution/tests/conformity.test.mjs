// The conformity export is handed to an auditor. Its failure mode is not a
// crash — it is reporting coverage that isn't there, or omitting a run it
// couldn't evidence so the document reads as complete. Every test here is a
// defect that actually occurred while building it against real run data.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const tool = join(here, "..", "conformity.mjs");

let n = 0;
// `runs` maps slice -> { trace?, stateMd? }. Either may be omitted, which is
// itself a case worth exercising: a run directory with no trace.json at all.
const run = (runs, args = []) => {
  const dir = join(tmpdir(), `conformity-test-${process.pid}-${n++}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "runs"), { recursive: true });
  for (const [slice, { trace, stateMd }] of Object.entries(runs)) {
    mkdirSync(join(dir, "runs", slice), { recursive: true });
    if (trace) writeFileSync(join(dir, "runs", slice, "trace.json"), JSON.stringify(trace));
    if (stateMd) writeFileSync(join(dir, "runs", slice, "STATE.md"), stateMd);
  }
  let stdout = "", status = 0;
  try {
    stdout = execFileSync("node", [tool, ...args], { cwd: dir, encoding: "utf8" });
  } catch (e) {
    stdout = e.stdout || "";
    status = e.status;
  }
  const md = readFileSync(join(dir, "runs", "CONFORMITY.md"), "utf8");
  rmSync(dir, { recursive: true, force: true });
  return { stdout, md, status };
};

const approvalsTable = (rows) => `# Slice State — x

## Approvals

| Action | Rule | Requested | Decision | Approver | When (UTC) | Record |
|--------|------|-----------|----------|----------|-----------|--------|
${rows.join("\n")}

## Budget
`;

const base = (over = {}) => ({ schema: "agentic-sdlc/trace@2", slice: "s", tier: 2, landed: true, stages: [], ...over });

describe("conformity.mjs — reading approvals out of STATE.md", () => {
  test("finds the Approvals table (the section split must not swallow it)", () => {
    const { md } = run({
      s: {
        trace: base(),
        stateMd: approvalsTable(["| Ship it | 1 | 2026-01-01T00:00Z | approved | alice | 2026-01-01T01:00Z | rec.md |"]),
      },
    });
    assert.match(md, /alice/, "a real approval in STATE.md was not read");
    assert.match(md, /\*\*Covered\*\* — 1\/1/);
  });

  test("counts a bold **APPROVED** decision — markdown emphasis is not meaning", () => {
    const { md, stdout } = run({
      s: {
        trace: base(),
        stateMd: approvalsTable(["| Ship it | 1 | — | **APPROVED** | **bob** | 2026-01-01T01:00Z | rec.md |"]),
      },
    });
    assert.match(stdout, /1 approval\(s\)/, "a bold-formatted approval was not counted");
    assert.match(md, /\*\*Covered\*\*/);
  });

  test("an uninstantiated template row is not mistaken for an approval", () => {
    const { stdout } = run({
      s: {
        trace: base(),
        stateMd: approvalsTable(["| <action> | <HAR rule #> | yes | <approved/denied/PENDING> | <name> | <ts> | <path> |"]),
      },
    });
    assert.match(stdout, /0 approval\(s\)/);
  });
});

describe("conformity.mjs — a decision is not an approval", () => {
  test("deferred rows are shown but neither counted nor flagged as unnamed", () => {
    const { md, stdout } = run({
      s: {
        trace: base(),
        stateMd: approvalsTable([
          "| Build it | 1 | — | approved | carol | 2026-01-01T01:00Z | rec.md |",
          "| Wire a real provider | 6 | — | deferred | — | — | — |",
        ]),
      },
    });
    assert.match(stdout, /1 approval\(s\)/, "a deferred row was counted as an approval");
    assert.match(md, /deferred/, "the deferred decision should still be visible in the register");
    assert.doesNotMatch(md, /do not name an individual/, "a deferred row has no approver and must not be flagged");
  });

  test("a PENDING approval is not counted as granted", () => {
    const { stdout } = run({
      s: { trace: base(), stateMd: approvalsTable(["| Ship it | 1 | — | PENDING | — | — | — |"]) },
    });
    assert.match(stdout, /0 approval\(s\)/);
  });

  test("an approval by a role rather than a person is reported as unnamed", () => {
    const { md } = run({
      s: { trace: base(), stateMd: approvalsTable(["| Ship it | 1 | — | approved | the team | 2026-01-01T01:00Z | r.md |"]) },
    });
    assert.match(md, /do not name an individual/);
  });
});

describe("conformity.mjs — honesty about what is missing", () => {
  test("a landed run with no approval evidence is named, not omitted", () => {
    const { md } = run({ s: { trace: base() } });
    assert.match(md, /\*\*Not covered\*\* — 0\/1/);
    assert.match(md, /carry no approval evidence/);
    assert.match(md, /`s`/, "the offending slice must be named");
  });

  test("an explicit 'no rule tripped' row counts as evidence, unlike silence", () => {
    const { md } = run({
      s: { trace: base(), stateMd: approvalsTable(["| (none — Intake scan found no rule tripped) | — | — | n/a | — | — | plan.md |"]) },
    });
    assert.match(md, /\*\*Covered\*\* — 1\/1/, "an explicit none-required record is evidence");
  });

  test("a run directory without trace.json appears as untraced rather than vanishing", () => {
    const { md } = run({ traced: { trace: base({ slice: "traced" }) }, ghost: {} });
    assert.match(md, /ghost/, "an untraced run must still appear in the register");
    assert.match(md, /\*\*untraced\*\*/);
  });

  test("CC3.2 is always reported as a gap, never quietly omitted", () => {
    const { md } = run({ s: { trace: base() } });
    assert.match(md, /CC3\.2/);
    assert.match(md, /Not instrumented/);
  });

  test("self-reported telemetry is disclaimed rather than presented as evidence", () => {
    const { md } = run({ s: { trace: base() } });
    assert.match(md, /agent's own report/);
  });
});

describe("conformity.mjs — sources and structure", () => {
  test("structured approvals in trace.json are preferred over STATE.md", () => {
    const { md } = run({
      s: {
        trace: base({ approvals: [{ action: "Ship", rule: "1", decision: "approved", approver: "dave", decidedAt: "2026-01-01T01:00Z", record: "r.md" }] }),
        stateMd: approvalsTable(["| Stale | 1 | — | approved | SHOULD_NOT_APPEAR | — | r.md |"]),
      },
    });
    assert.match(md, /dave/);
    assert.doesNotMatch(md, /SHOULD_NOT_APPEAR/, "trace.json must win over the markdown fallback");
    assert.match(md, /trace\.json/);
  });

  test("a pipe inside approval text does not break the table", () => {
    const { md } = run({
      s: {
        trace: base({ approvals: [{ action: "Ship a|b", rule: "1", decision: "approved", approver: "erin", decidedAt: "t", record: "r" }] }),
      },
    });
    assert.match(md, /Ship a\\\|b/, "a raw pipe would split the cell and corrupt the row");
  });

  test("least-privilege tiers are counted separately, and silence counted as neither", () => {
    const { stdout } = run({
      a: { trace: base({ slice: "a", leastPrivilegeEnforced: true }) },
      b: { trace: base({ slice: "b", leastPrivilegeEnforced: false }) },
      c: { trace: base({ slice: "c" }) },
    });
    assert.match(stdout, /1 enforced \/ 1 declared/);
  });

  test("legacy notes.leastPrivilegeEnforced is still read", () => {
    const { stdout } = run({ s: { trace: base({ notes: { leastPrivilegeEnforced: true } }) } });
    assert.match(stdout, /1 enforced/);
  });
});

describe("conformity.mjs — --strict", () => {
  test("exits non-zero when a landed run has no approval evidence", () => {
    const { status } = run({ s: { trace: base() } }, ["--strict"]);
    assert.equal(status, 1);
  });

  test("exits zero when every landed run is evidenced", () => {
    const { status } = run(
      { s: { trace: base(), stateMd: approvalsTable(["| Ship | 1 | — | approved | frank | t | r.md |"]) } },
      ["--strict"],
    );
    assert.equal(status, 0);
  });

  test("without --strict, missing evidence reports but does not fail", () => {
    const { status } = run({ s: { trace: base() } });
    assert.equal(status, 0);
  });
});
