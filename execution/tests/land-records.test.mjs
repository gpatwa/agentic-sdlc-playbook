import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mergeFacts, plan, editTrace } from "../land-records.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "..", "land-records.mjs");
const g = (d, ...a) => execFileSync("git", ["-C", d, ...a], { encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
const trace = (slice, indent) => JSON.stringify({ schema: "agentic-sdlc/trace@2", slice, tier: 2, landed: false, started: "2026-10-01T00:00:00Z", approvals: [] }, null, indent) + "\n";

function repoWithMerges() {
  const d = mkdtempSync(join(tmpdir(), "land-"));
  g(d, "init", "-q", "-b", "main");
  writeFileSync(join(d, "README"), "x"); g(d, "add", "."); g(d, "commit", "-qm", "init");
  for (const [n, slice, indent] of [[1, "alpha", 2], [2, "beta", 1], [3, "gamma-proof", 2]]) {
    g(d, "checkout", "-qb", `b${n}`);
    mkdirSync(join(d, "runs", slice), { recursive: true });
    writeFileSync(join(d, "runs", slice, "trace.json"), trace(slice, indent));
    g(d, "add", "."); g(d, "commit", "-qm", `work ${slice}`);
    g(d, "checkout", "-q", "main");
    g(d, "merge", "--no-ff", "-qm", `Merge pull request #${n} from x/b${n}`, `b${n}`);
  }
  // a run committed straight to main, never merged by a pull request
  mkdirSync(join(d, "runs", "direct"), { recursive: true });
  writeFileSync(join(d, "runs", "direct", "trace.json"), trace("direct", 2));
  g(d, "add", "."); g(d, "commit", "-qm", "direct to main");
  return d;
}

describe("land-records", () => {
  test("finds the pull request and merge time each trace arrived with", () => {
    const d = repoWithMerges();
    const f = Object.fromEntries(mergeFacts(d).map((x) => [x.slice, x]));
    assert.equal(f.alpha.mergedPr, 1);
    assert.equal(f.beta.mergedPr, 2);
    assert.match(f.alpha.landedAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/);
    assert.equal(f.direct.none, true, "a commit straight to main is not a merged pull request");
    rmSync(d, { recursive: true });
  });

  test("dry run changes nothing; --write sets the fields and keeps each file's indentation", () => {
    const d = repoWithMerges();
    const before = readFileSync(join(d, "runs/beta/trace.json"), "utf8");
    execFileSync("node", [script, d, "--not-shipped", "gamma-proof=a proof run, not a new change"], { encoding: "utf8" });
    assert.equal(readFileSync(join(d, "runs/beta/trace.json"), "utf8"), before);
    const out = execFileSync("node", [script, d, "--write", "--not-shipped", "gamma-proof=a proof run, not a new change"], { encoding: "utf8" });
    assert.match(out, /wrote 3 trace\.json/);
    const beta = readFileSync(join(d, "runs/beta/trace.json"), "utf8");
    const t = JSON.parse(beta);
    assert.equal(t.landed, true); assert.equal(t.mergedPr, 2); assert.ok(t.landedAt);
    assert.match(beta, /^ "landedAt"/m, "one-space indent kept");
    const gamma = JSON.parse(readFileSync(join(d, "runs/gamma-proof/trace.json"), "utf8"));
    assert.equal(gamma.landed, false); assert.match(gamma.landedNote, /PR #3 but not counted as landed: a proof run/);
    assert.equal(JSON.parse(readFileSync(join(d, "runs/direct/trace.json"), "utf8")).landed, false, "unmerged run untouched");
    rmSync(d, { recursive: true });
  });

  test("running it again changes nothing", () => {
    const d = repoWithMerges();
    execFileSync("node", [script, d, "--write"], { encoding: "utf8" });
    const again = plan(d);
    assert.equal(again.filter((r) => r.next).length, 0);
    rmSync(d, { recursive: true });
  });

  test("never overwrites a landed trace or breaks JSON", () => {
    const already = trace("z", 2).replace('"landed": false', '"landed": true');
    assert.equal(editTrace(already, { landedAt: "2026-10-02T00:00:00Z", mergedPr: 9 }, true, null), null);
    const out = editTrace(trace("z", 2), { landedAt: "2026-10-02T00:00:00Z", mergedPr: 9 }, false, "n");
    assert.equal(JSON.parse(out).landedNote, "n");
  });
});
