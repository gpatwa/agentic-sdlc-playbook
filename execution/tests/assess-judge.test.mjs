// assess-judge.mjs turns a model's opinion into dispositions. What can go wrong: a judge from the same family as the
// reviewer, a seeded bug drawn into the sample, a sample that changes between runs, a verdict applied to the wrong row,
// and an "unclear" or an unparsable reply being recorded as a judgement. Each is tried here with a fake judge.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { judge, drawSample, parseVerdicts, prng } from "../assess-judge.mjs";
import { parseFindings } from "../assess-report.mjs";

const HEAD = "# Findings\n\n| id | severity | file:line | finding | evidence | reviewer | disposition |\n|---|---|---|---|---|---|---|\n";
const row = (id, where, reviewer, disp = "open") => `| ${id} | P2 | ${where} | claim ${id} | evidence ${id} | ${reviewer} | ${disp} |\n`;
let root, dir;

beforeEach(() => {
  root = join(tmpdir(), `assess-judge-${process.pid}-${Math.random().toString(36).slice(2)}`);
  dir = join(root, "reviews");
  mkdirSync(dir, { recursive: true });
  let rows = "";
  for (let i = 1; i <= 6; i++) rows += row(`F-01-${i}`, `src/a.js:${10 * i}`, "claude");
  for (let i = 1; i <= 6; i++) rows += row(`F-02-${i}`, `src/b.js:${10 * i}`, "codex");
  rows += row("F-03-1", "src/c.js:5", "claude", "fixed"); // already dispositioned
  rows += row("F-03-2", "no line", "claude"); // no file and line
  writeFileSync(join(dir, "FINDINGS.md"), HEAD + rows);
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const verdictsFor = (verdict, extra = {}) => (spec, prompt) => {
  const ids = [...prompt.matchAll(/"id": "(F-[\d-]+)"/g)].map((m) => m[1]);
  return { status: 0, stdout: JSON.stringify(ids.map((id) => ({ id, verdict, severity_view: "about right", reason: "checked", ...extra }))) };
};

describe("drawSample", () => {
  const all = () => parseFindings(readFileSync(join(dir, "FINDINGS.md"), "utf8"));
  test("only open findings with a file and line, balanced across reviewers, same seed same sample", () => {
    const a = drawSample(all(), { n: 6, seed: 7 }), b = drawSample(all(), { n: 6, seed: 7 }), c = drawSample(all(), { n: 6, seed: 8 });
    assert.deepEqual(a.map((f) => f.id), b.map((f) => f.id));
    assert.notDeepEqual(a.map((f) => f.id), c.map((f) => f.id));
    assert.equal(a.filter((f) => f.reviewer === "claude").length, 3);
    assert.ok(!a.some((f) => ["F-03-1", "F-03-2"].includes(f.id)));
  });
  test("a finding that matches a planted bug is never drawn", () => {
    const seeds = [{ file: "src/a.js", lineStart: 10, lineEnd: 10 }];
    const ids = drawSample(all(), { n: 12, seed: 1, seeds }).map((f) => f.id);
    assert.ok(!ids.includes("F-01-1"), "line 10 is the planted bug");
    assert.ok(ids.includes("F-01-2"), "line 20 is outside the tolerance of 5");
  });
  test("prng is deterministic", () => { const r1 = prng(3), r2 = prng(3); assert.equal(r1(), r2()); });
});

describe("parseVerdicts", () => {
  test("takes the array out of prose and a code fence, and returns nothing for junk", () => {
    assert.equal(parseVerdicts('Here:\n```json\n[{"id":"F-1","verdict":"confirmed"}]\n```').length, 1);
    assert.deepEqual(parseVerdicts("I could not do it"), []);
    assert.deepEqual(parseVerdicts("[not json]"), []);
  });
});

describe("judge", () => {
  test("a judge of the same family as a reviewer is refused unless allowed, and the allowance is recorded", () => {
    assert.throws(() => judge(dir, { judge: "claude", n: 4, seed: 1 }, verdictsFor("confirmed")), /same family/);
    const r = judge(dir, { judge: "claude", n: 4, seed: 1, allowSameFamily: true }, verdictsFor("confirmed"));
    assert.equal(r.record.allowSameFamily, true);
  });

  test("verdicts become dispositions on the right rows; unclear stays open; the prompt hides the reviewer", () => {
    let prompt = "";
    const run = (spec, p) => { prompt += p; return { status: 0, stdout: JSON.stringify([...p.matchAll(/"id": "(F-[\d-]+)"/g)].map((m, i) => ({ id: m[1], verdict: ["confirmed", "rejected", "unclear", "intentional"][i % 4], severity_view: "n/a", reason: "r" }))) }; };
    // claude findings only, so the codex judge is a different family
    writeFileSync(join(dir, "FINDINGS.md"), HEAD + [1, 2, 3, 4].map((i) => row(`F-01-${i}`, `src/a.js:${10 * i}`, "claude")).join("") + row("F-09-1", "src/z.js:1", "claude", "fixed"));
    const r = judge(dir, { judge: "codex", n: 4, seed: 1, batch: 10 }, run);
    const md = parseFindings(readFileSync(join(dir, "FINDINGS.md"), "utf8"));
    const disp = Object.fromEntries(md.map((f) => [f.id, f.disposition]));
    assert.deepEqual([r.confirmed, r.rejected, r.intentional, r.unclear], [1, 1, 1, 1]);
    assert.equal(Object.values(disp).filter((d) => d === "open").length, 1, "the unclear one stays open");
    assert.equal(disp["F-09-1"], "fixed", "an owner disposition is never overwritten");
    assert.ok(!/claude|codex|reviewer/i.test(prompt.split("## Findings")[1]), "the judge is not told who wrote a finding");
    const rec = JSON.parse(readFileSync(join(dir, "JUDGED.json"), "utf8"));
    assert.equal(rec.family, "openai");
    assert.match(rec.promptSha256, /^[0-9a-f]{64}$/);
  });

  test("an unusable reply leaves the findings open and says which batch failed", () => {
    writeFileSync(join(dir, "FINDINGS.md"), HEAD + [1, 2, 3].map((i) => row(`F-01-${i}`, `src/a.js:${10 * i}`, "claude")).join(""));
    const r = judge(dir, { judge: "codex", n: 3, seed: 1 }, () => ({ status: 0, stdout: "sorry" }));
    assert.deepEqual(r.failedBatches, [1]);
    assert.equal(parseFindings(readFileSync(join(dir, "FINDINGS.md"), "utf8")).filter((f) => f.disposition === "open").length, 3);
  });

  test("a verdict for an id that was not in the batch, or with an unknown verdict, is ignored", () => {
    writeFileSync(join(dir, "FINDINGS.md"), HEAD + row("F-01-1", "src/a.js:10", "claude"));
    const run = () => ({ status: 0, stdout: JSON.stringify([{ id: "F-77-7", verdict: "confirmed" }, { id: "F-01-1", verdict: "great" }]) });
    const r = judge(dir, { judge: "codex", n: 1, seed: 1 }, run);
    assert.equal(r.judged, 0);
    assert.equal(parseFindings(readFileSync(join(dir, "FINDINGS.md"), "utf8"))[0].disposition, "open");
  });

  test("a dry run changes nothing", () => {
    writeFileSync(join(dir, "FINDINGS.md"), HEAD + [1, 2].map((i) => row(`F-01-${i}`, `src/a.js:${10 * i}`, "claude")).join(""));
    const before = readFileSync(join(dir, "FINDINGS.md"), "utf8");
    const r = judge(dir, { judge: "codex", n: 4, seed: 1, dryRun: true }, () => { throw new Error("called"); });
    assert.ok(r.dryRun);
    assert.equal(readFileSync(join(dir, "FINDINGS.md"), "utf8"), before);
  });
});
