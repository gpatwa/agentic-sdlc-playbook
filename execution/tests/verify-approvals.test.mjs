// verify-approvals.mjs exists to turn a self-authored PR link into a checked
// claim. If it reports "verified" when GitHub disagrees, it is worse than not
// checking — it launders a false claim with the appearance of a third-party
// check. Every test here is a way that could happen.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync, chmodSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

// Node resolves an execFileSync command against options.env.PATH, not the
// parent process's — so spreading the real PATH into the child env, as the
// "gh not installed" test first did, lets the REAL gh on this machine answer
// instead of proving absence. nodeDir keeps `node` resolvable (needed for the
// fake-gh script's own #!/usr/bin/env node shebang) without contributing any
// directory that could contain a real gh.
const nodeDir = dirname(process.execPath);

const here = dirname(fileURLToPath(import.meta.url));
const tool = join(here, "..", "verify-approvals.mjs");
const fakeGhSrc = join(here, "fixtures", "fake-gh");

let n = 0;

const PR_FULL = {
  merged: true,
  merged_by: { login: "alice" },
  user: { login: "bob" },
  merge_commit_sha: "abc1234abc1234abc1234abc1234abc1234abc1",
  merged_at: "2026-01-01T00:00Z",
  state: "MERGED",
};

const run = (opts) => {
  const {
    stateMdRows = [],
    fixtures = {},
    unauthenticated = false,
    noGhOnPath = false,
    args = [],
  } = opts;

  const dir = join(tmpdir(), `verify-approvals-test-${process.pid}-${n++}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "runs", "s"), { recursive: true });
  const rows = stateMdRows
    .map((r) => `| ${r.action} | rule | t | ${r.decision} | ${r.approver} | t | ${r.record} |`)
    .join("\n");
  writeFileSync(
    join(dir, "runs", "s", "STATE.md"),
    `# Slice State — s\n\n## Approvals\n\n| Action | Rule | Requested | Decision | Approver | When | Record |\n|--|--|--|--|--|--|--|\n${rows}\n\n## Budget\n`,
  );

  const fixDir = join(dir, "fixtures");
  mkdirSync(fixDir, { recursive: true });
  for (const [path, body] of Object.entries(fixtures)) {
    writeFileSync(join(fixDir, path.replace(/\//g, "_") + ".json"), JSON.stringify(body));
  }

  const binDir = join(dir, "bin");
  mkdirSync(binDir, { recursive: true });
  if (!noGhOnPath) {
    const dst = join(binDir, "gh");
    writeFileSync(dst, `#!/usr/bin/env node\n${readFileSync(fakeGhSrc, "utf8").split("\n").slice(1).join("\n")}`);
    chmodSync(dst, 0o755);
  }

  let stdout = "", status = 0;
  try {
    stdout = execFileSync("node", [tool, dir, ...args], {
      encoding: "utf8",
      env: {
        ...process.env,
        // noGhOnPath: no system PATH at all, so nothing but our own fixture
        // dir (empty here) and node itself are reachable — a real gh
        // elsewhere on this machine cannot leak in and answer instead.
        PATH: noGhOnPath ? `${binDir}:${nodeDir}` : `${binDir}:${nodeDir}:${process.env.PATH}`,
        FAKE_GH_FIXTURES: fixDir,
        ...(unauthenticated ? { FAKE_GH_UNAUTHENTICATED: "1" } : {}),
      },
    });
  } catch (e) {
    stdout = e.stdout || "";
    status = e.status;
  }
  const report = readFileSync(join(dir, "runs", "APPROVAL_VERIFICATION.md"), "utf8");
  rmSync(dir, { recursive: true, force: true });
  return { stdout, status, report };
};

describe("verify-approvals.mjs — the honest distinction", () => {
  test("a self-merged PR is reported verified, but flagged self-merged, not silently passed", () => {
    const { report } = run({
      stateMdRows: [{ action: "Ship it", decision: "approved", approver: "bob", record: "https://github.com/o/r/pull/6" }],
      fixtures: {
        "repos/o/r/pulls/6": { ...PR_FULL, merged_by: { login: "bob" }, user: { login: "bob" } },
        [`repos/o/r/commits/${PR_FULL.merge_commit_sha}/check-runs`]: { check_runs: [{ name: "CI", conclusion: "success" }] },
      },
    });
    assert.match(report, /\*\*verified\*\* · self-merged/);
    assert.match(report, /bob \(= author\)/);
    assert.match(report, /self-merged.*same identity authored and merged/s);
  });

  test("a PR merged by someone other than its author is verified without the self-merge flag", () => {
    const { report } = run({
      stateMdRows: [{ action: "Ship it", decision: "approved", approver: "alice", record: "https://github.com/o/r/pull/6" }],
      fixtures: {
        "repos/o/r/pulls/6": PR_FULL, // merged_by: alice, user: bob
        [`repos/o/r/commits/${PR_FULL.merge_commit_sha}/check-runs`]: { check_runs: [] },
      },
    });
    // The report's own legend text always contains the word "self-merged" —
    // asserting against the whole report would pass or fail independent of
    // this claim's actual result. Scope to the row and the Gaps section,
    // the only two places a real self-merge would show up.
    assert.match(report, /\| \*\*verified\*\* \|/);
    const row = report.split("\n").find((l) => l.includes("[#6]"));
    assert.doesNotMatch(row, /self-merged/, "row must not flag a distinct-reviewer merge as self-merged");
    assert.doesNotMatch(report, /## Gaps/, "no gap section when nothing here is a gap");
  });
});

describe("verify-approvals.mjs — catching a false claim", () => {
  test("a mismatched merge commit is reported MISMATCH, not verified", () => {
    const { report, status } = run({
      stateMdRows: [{ action: "Ship it", decision: "approved", approver: "bob", record: "https://github.com/o/r/pull/6 — merged as `deadbeef`" }],
      fixtures: {
        "repos/o/r/pulls/6": PR_FULL, // real sha starts abc1234...
        [`repos/o/r/commits/${PR_FULL.merge_commit_sha}/check-runs`]: { check_runs: [] },
      },
      args: ["--strict"],
    });
    assert.match(report, /\*\*MISMATCH\*\*/);
    assert.match(report, /record claims `deadbeef`, GitHub's merge commit is `abc1234`/);
    assert.equal(status, 1, "--strict must fail the run on a mismatch");
  });

  test("a PR that GitHub says is not merged is not counted as verified", () => {
    const { report } = run({
      stateMdRows: [{ action: "Ship it", decision: "approved", approver: "bob", record: "https://github.com/o/r/pull/6" }],
      fixtures: { "repos/o/r/pulls/6": { ...PR_FULL, merged: false, state: "OPEN" } },
    });
    assert.match(report, /unverified/);
    assert.match(report, /is not merged/);
  });

  test("a PR GitHub has never heard of is reported unverified, not silently dropped", () => {
    const { report } = run({
      stateMdRows: [{ action: "Ship it", decision: "approved", approver: "bob", record: "https://github.com/o/r/pull/999" }],
      fixtures: {}, // no fixture for pull/999 — fake-gh exits nonzero
    });
    assert.match(report, /unverified/);
    assert.match(report, /GitHub API call failed/);
  });
});

describe("verify-approvals.mjs — honest about tooling absence", () => {
  test("gh not installed: every GitHub-referencing claim reports unverified with the real reason, not skipped", () => {
    const { report, stdout } = run({
      stateMdRows: [{ action: "Ship it", decision: "approved", approver: "bob", record: "https://github.com/o/r/pull/6" }],
      noGhOnPath: true,
    });
    assert.match(report, /gh CLI is not installed/);
    assert.match(report, /unverified/);
    assert.match(stdout, /1 unverified/);
  });

  test("gh installed but not authenticated: distinct reason from not-installed", () => {
    const { report } = run({
      stateMdRows: [{ action: "Ship it", decision: "approved", approver: "bob", record: "https://github.com/o/r/pull/6" }],
      unauthenticated: true,
    });
    assert.match(report, /gh is not authenticated/);
  });
});

describe("verify-approvals.mjs — what it does not overclaim", () => {
  test("an approval with no GitHub reference is listed, not treated as a gap", () => {
    const { report } = run({
      stateMdRows: [{ action: "Design review", decision: "approved", approver: "carol", record: "runs/s/APPROVAL_RECORD-1.md" }],
    });
    assert.match(report, /## Approved, but nothing to verify/);
    assert.match(report, /Design review/);
    assert.match(report, /not every gated action ships as a PR/);
  });

  test("a deferred (non-approved) row is not surfaced as either verified or a gap", () => {
    const { report } = run({
      stateMdRows: [{ action: "Wire real provider", decision: "deferred", approver: "—", record: "—" }],
    });
    assert.doesNotMatch(report, /Wire real provider/);
  });

  test("with nothing to check at all, both sections say so plainly", () => {
    const { report } = run({ stateMdRows: [] });
    assert.match(report, /No approval record in any run names a GitHub pull request/);
  });
});

describe("verify-approvals.mjs — --strict", () => {
  test("passes when every reference verifies clean", () => {
    const { status } = run({
      stateMdRows: [{ action: "Ship it", decision: "approved", approver: "bob", record: "https://github.com/o/r/pull/6" }],
      fixtures: {
        "repos/o/r/pulls/6": PR_FULL,
        [`repos/o/r/commits/${PR_FULL.merge_commit_sha}/check-runs`]: { check_runs: [] },
      },
      args: ["--strict"],
    });
    assert.equal(status, 0);
  });

  test("without --strict, an unverified claim reports but does not fail the run", () => {
    const { status } = run({
      stateMdRows: [{ action: "Ship it", decision: "approved", approver: "bob", record: "https://github.com/o/r/pull/999" }],
      fixtures: {},
    });
    assert.equal(status, 0);
  });
});
