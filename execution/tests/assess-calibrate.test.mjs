// The scorer decides whether a reviewer is trusted. It must not flatter: a finding in the wrong file does not count, several
// findings on one seed do not inflate recall, unjudged findings widen precision instead of being assumed true, and 30 judged
// findings are needed before the plan's bar is called measured.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { score, renderScore, locate } from "../assess-calibrate.mjs";

const seed = (id, file, a, b = a, cls = "authz", severity = "P1") => ({ id, file, lineStart: a, lineEnd: b, class: cls, severity, description: `bug ${id}` });
const finding = (id, where, disposition = "open") => ({ id, severity: "P2", where, finding: "x", evidence: "y", reviewer: "r", disposition });

describe("matching", () => {
  test("a finding matches by file and by line within the range plus tolerance", () => {
    const r = score([seed("S1", "a.py", 10, 12)], [finding("F-1", "a.py:14")]);
    assert.equal(r.found, 1);
    assert.equal(score([seed("S1", "a.py", 10, 12)], [finding("F-1", "a.py:18")]).found, 0, "just outside the tolerance");
    assert.equal(score([seed("S1", "a.py", 10, 12)], [finding("F-1", "b.py:11")]).found, 0, "wrong file");
    assert.equal(score([seed("S1", "a.py", 10, 12)], [finding("F-1", "./a.py:11")]).found, 1, "a leading ./ is ignored");
    assert.equal(score([seed("S1", "a.py", 10, 12)], [finding("F-1", "a.py:11")], { tolerance: 0 }).found, 1);
  });
  test("a range in the finding overlaps; a finding with no line never matches", () => {
    assert.equal(score([seed("S1", "a.py", 30)], [finding("F-1", "a.py:20-25")], { tolerance: 3 }).found, 0);
    assert.equal(score([seed("S1", "a.py", 30)], [finding("F-1", "a.py:20-40")]).found, 1);
    assert.equal(score([seed("S1", "a.py", 30)], [finding("F-1", "a.py")]).found, 0);
    assert.equal(locate("src/a.py:5-9").end, 9);
  });
  test("many findings on one seed count once, and recall is by class and severity", () => {
    const seeds = [seed("S1", "a.py", 10, 10, "authz", "P0"), seed("S2", "b.py", 5, 5, "injection", "P1"), seed("S3", "c.py", 1, 1, "logic", "P2")];
    const r = score(seeds, [finding("F-1", "a.py:10"), finding("F-2", "a.py:11"), finding("F-3", "b.py:5")]);
    assert.equal(r.found, 2);
    assert.equal(r.recall, 2 / 3);
    assert.deepEqual(r.byClass.authz, { found: 1, of: 1 });
    assert.deepEqual(r.bySeverity.P2, { found: 0, of: 1 });
    assert.deepEqual(r.missed.map((s) => s.id), ["S3"]);
  });
});

describe("precision is a range until the owner judges", () => {
  const seeds = [seed("S1", "a.py", 10)];
  test("unjudged findings that match no seed widen the range rather than being assumed true or false", () => {
    const r = score(seeds, [finding("F-1", "a.py:10"), finding("F-2", "z.py:3"), finding("F-3", "z.py:9")]);
    assert.equal(r.precision.lower, 1 / 3);
    assert.equal(r.precision.upper, 1);
    assert.deepEqual(r.unjudgedNonSeed, ["F-2", "F-3"]);
  });
  test("a rejected finding lowers the upper bound; an accepted one raises the lower bound", () => {
    const r = score(seeds, [finding("F-1", "a.py:10"), finding("F-2", "z.py:3", "rejected"), finding("F-3", "z.py:9", "fixed")]);
    assert.equal(r.precision.lower, 2 / 3);
    assert.equal(r.precision.upper, 2 / 3);
    assert.deepEqual(r.falsePositives, ["F-2"]);
  });
  test("the 70% bar is not called measured until 30 findings are judged", () => {
    const r = score(seeds, [finding("F-1", "a.py:10")]);
    assert.equal(r.precision.barMeasured, false);
    assert.match(renderScore(r), /not measured/);
    const many = Array.from({ length: 29 }, (_, i) => finding(`F-${i + 2}`, `z.py:${i + 1}`, "fixed"));
    assert.equal(score(seeds, [finding("F-1", "a.py:10"), ...many]).precision.barMeasured, true);
  });
  test("no findings gives no precision, and zero recall when seeds exist", () => {
    const r = score(seeds, []);
    assert.equal(r.precision.lower, null);
    assert.equal(r.recall, 0);
  });
});

describe("the written score", () => {
  test("it says a handful of seeds is indicative, lists misses, and shows cost per 10,000 lines", () => {
    const r = score([seed("S1", "a.py", 1), seed("S2", "b.py", 1)], [finding("F-1", "a.py:1")], { tokens: 500000, lines: 5000 });
    assert.equal(r.cost.tokensPer10kLines, 1000000);
    const t = renderScore(r, { label: "x" });
    assert.match(t, /1 of 2 planted bugs found \(50%\)/);
    assert.match(t, /indicative, not a measurement/);
    assert.match(t, /Missed:[^]*S2/);
    assert.match(t, /1,000,000 tokens per 10,000 lines/);
  });
});
