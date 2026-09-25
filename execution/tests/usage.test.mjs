// usage.mjs turns harness-written logs into per-stage token usage. The two
// ways it can quietly lie are double counting (streamed rows repeat a
// request's usage; overlapping log dirs repeat a spawn) and attributing work
// to the wrong slice. Most of this suite is aimed at those. It also pins the
// distinction the tool exists for: peak context is not consumption.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { sumSubagent, sliceOf, collect, totals, encodeDir, WEIGHTS } from "../usage.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "usage.mjs");

const usage = (o = {}) => ({
  input_tokens: 10, cache_read_input_tokens: 1000, cache_creation_input_tokens: 100,
  output_tokens: 50, cache_creation: { ephemeral_1h_input_tokens: 0 }, ...o,
});
const req = (requestId, u = usage(), model = "claude-sonnet-5") => ({ requestId, message: { model, usage: u } });

describe("sumSubagent", () => {
  test("streamed copies of one request are counted once", () => {
    const t = sumSubagent([req("r1"), req("r1"), req("r1"), req("r2")]);
    assert.equal(t.requests, 2);
    assert.equal(t.cacheRead, 2000);
  });
  test("processed is every token type summed", () => {
    const t = sumSubagent([req("r1")]);
    assert.equal(t.processed, 10 + 1000 + 100 + 50);
  });
  test("1-hour cache writes are split out and weighted at 2x, not 1.25x", () => {
    const t = sumSubagent([req("r1", usage({ cache_creation_input_tokens: 100, cache_creation: { ephemeral_1h_input_tokens: 40 } }))]);
    assert.equal(t.cacheWrite1h, 40);
    assert.equal(t.cacheWrite5m, 60);
    assert.equal(t.inputEquivalents, Math.round(10 + 1000 * 0.1 + 60 * 1.25 + 40 * 2 + 50 * 5));
  });
  test("rows without usage, and the synthetic model, are ignored", () => {
    const t = sumSubagent([{ message: { model: "x" } }, req("r1", usage(), "<synthetic>"), req("r2")]);
    assert.equal(t.requests, 2);
    assert.deepEqual(t.models, ["claude-sonnet-5"]);
  });
  test("weights are the published ratios", () => {
    assert.deepEqual(WEIGHTS, { input: 1, cacheRead: 0.1, cacheWrite5m: 1.25, cacheWrite1h: 2, output: 5 });
  });
});

describe("sliceOf", () => {
  const known = new Set(["alpha", "beta"]);
  test("picks the slice the prompt names", () => {
    assert.equal(sliceOf("Read runs/alpha/intent.md and write runs/alpha/02.md", known), "alpha");
  });
  test("ignores runs/<id>/ that does not exist in this repo", () => {
    assert.equal(sliceOf("see runs/gamma/x.md", known), null);
  });
  test("takes the most-named slice when a prompt mentions two", () => {
    assert.equal(sliceOf("runs/beta/a runs/beta/b runs/alpha/c", known), "beta");
  });
  test("no prompt, no slice", () => {
    assert.equal(sliceOf(undefined, known), null);
  });
});

// A throwaway product repo plus a fake ~/.claude/projects/<dir> with sessions.
let n = 0;
const fixture = () => {
  const root = join(tmpdir(), `usage-${process.pid}-${n++}`);
  rmSync(root, { recursive: true, force: true });
  const repo = join(root, "product");
  for (const s of ["alpha", "beta"]) mkdirSync(join(repo, "runs", s), { recursive: true });
  const logs = join(root, "logs");
  mkdirSync(logs, { recursive: true });
  const spawn = ({ session = "s1", agentId, slice, peak = 500, withLog = true, type = "software-architect", rows = [req("q1")] }) => {
    const line = { timestamp: `2026-09-2${n}T00:00:0${agentId.length % 9}Z`, toolUseResult: {
      agentId, agentType: type, prompt: slice ? `Write runs/${slice}/out.md` : "no path here", totalTokens: peak,
    } };
    writeFileSync(join(logs, `${session}.jsonl`), JSON.stringify(line) + "\n", { flag: "a" });
    if (withLog) {
      const sub = join(logs, session, "subagents");
      mkdirSync(sub, { recursive: true });
      writeFileSync(join(sub, `agent-${agentId}.jsonl`), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
      writeFileSync(join(sub, `agent-${agentId}.meta.json`), JSON.stringify({ agentType: type, description: `Stage for ${slice}` }));
    }
  };
  return { root, repo, logs, spawn };
};

describe("collect", () => {
  test("attributes spawns to their slice and measures them", () => {
    const f = fixture();
    f.spawn({ agentId: "a1", slice: "alpha" });
    f.spawn({ agentId: "b1", slice: "beta" });
    const r = collect({ repo: f.repo, logDirs: [f.logs] });
    assert.deepEqual(Object.keys(r).sort(), ["alpha", "beta"]);
    assert.equal(r.alpha[0].measured.requests, 1);
    assert.equal(r.alpha[0].role, "software-architect");
    assert.equal(r.alpha[0].generic, false);
  });
  test("a spawn with no slice path is not attributed anywhere", () => {
    const f = fixture();
    f.spawn({ agentId: "x1", slice: null });
    assert.deepEqual(collect({ repo: f.repo, logDirs: [f.logs] }), {});
  });
  test("the same log dir listed twice does not double count", () => {
    const f = fixture();
    f.spawn({ agentId: "a1", slice: "alpha" });
    const r = collect({ repo: f.repo, logDirs: [f.logs, f.logs] });
    assert.equal(r.alpha.length, 1);
  });
  test("a spawn without a subagent log is kept, but unmeasured", () => {
    const f = fixture();
    f.spawn({ agentId: "a1", slice: "alpha", withLog: false });
    const r = collect({ repo: f.repo, logDirs: [f.logs] });
    assert.equal(r.alpha[0].measured, null);
    assert.equal(totals(r.alpha).unmeasuredSpawns, 1);
  });
  test("a generic spawn is flagged — its role's tool restrictions did not bind", () => {
    const f = fixture();
    f.spawn({ agentId: "g1", slice: "alpha", type: "general-purpose" });
    const s = collect({ repo: f.repo, logDirs: [f.logs] }).alpha[0];
    assert.equal(s.generic, true);
    assert.equal(s.description, "Stage for alpha");
  });
  test("--slice filters to one slice", () => {
    const f = fixture();
    f.spawn({ agentId: "a1", slice: "alpha" });
    f.spawn({ agentId: "b1", slice: "beta" });
    assert.deepEqual(Object.keys(collect({ repo: f.repo, logDirs: [f.logs], only: "beta" })), ["beta"]);
  });
  test("a missing log dir is skipped, not fatal", () => {
    const f = fixture();
    assert.deepEqual(collect({ repo: f.repo, logDirs: [join(f.root, "nope")] }), {});
  });
});

describe("totals — peak context is not consumption", () => {
  test("processed and peak context are reported side by side, never merged", () => {
    const f = fixture();
    // 3 requests of 1,160 tokens each; the harness would report a peak of 500.
    f.spawn({ agentId: "a1", slice: "alpha", peak: 500, rows: [req("q1"), req("q2"), req("q3")] });
    const t = totals(collect({ repo: f.repo, logDirs: [f.logs] }).alpha);
    assert.equal(t.processed, 3 * 1160);
    assert.equal(t.peakContextSum, 500);
    assert.notEqual(t.processed, t.peakContextSum);
  });
  test("cache hit rate is reads over all input-side tokens", () => {
    const f = fixture();
    f.spawn({ agentId: "a1", slice: "alpha" });
    const t = totals(collect({ repo: f.repo, logDirs: [f.logs] }).alpha);
    assert.equal(t.cacheHitRate, +(1000 / (1000 + 10 + 100)).toFixed(4));
  });
});

describe("CLI", () => {
  test("encodeDir matches Claude Code's project-dir naming", () => {
    assert.equal(encodeDir("/Users/x/opt/stash-seed"), "-Users-x-opt-stash-seed");
  });
  test("--write creates runs/<slice>/usage.json and leaves trace.json alone", () => {
    const f = fixture();
    f.spawn({ agentId: "a1", slice: "alpha" });
    const trace = join(f.repo, "runs", "alpha", "trace.json");
    writeFileSync(trace, '{"untouched":true}\n');
    execFileSync("node", [cli, f.repo, "--logs", f.logs, "--write"], { encoding: "utf8", env: { ...process.env, HOME: f.root } });
    const u = JSON.parse(readFileSync(join(f.repo, "runs", "alpha", "usage.json"), "utf8"));
    assert.equal(u.schema, "aveto/usage@1");
    assert.equal(u.source, "harness-log");
    assert.equal(u.totals.measuredSpawns, 1);
    assert.equal(readFileSync(trace, "utf8"), '{"untouched":true}\n');
    assert.equal(existsSync(join(f.repo, "runs", "beta", "usage.json")), false);
  });
});
