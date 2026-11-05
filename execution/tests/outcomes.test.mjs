import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { outcomes, median, NOT_RECORDED } from "../outcomes.mjs";

const AUTHOR = "Zed Uniqueperson";
let clock;
const g = (d, ...a) => execFileSync("git", ["-C", d, ...a], { encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: AUTHOR, GIT_AUTHOR_EMAIL: "z@example.test", GIT_COMMITTER_NAME: AUTHOR, GIT_COMMITTER_EMAIL: "z@example.test", GIT_AUTHOR_DATE: clock, GIT_COMMITTER_DATE: clock } });
const at = (iso) => { clock = iso; };
const lines = (n, tag) => Array.from({ length: n }, (_, i) => `${tag}${i}`).join("\n") + "\n";
const put = (d, p, text) => { mkdirSync(join(d, p, ".."), { recursive: true }); writeFileSync(join(d, p), text); };

// main: init at Oct 1. PR1 (first commit Oct 2 00:00, merged Oct 2 10:00): 30 source lines, 1000 lockfile lines, 50 record lines.
// PR2 merged Oct 5, reverted Oct 8. PR3 merged Oct 10, "Fix ..." touching its file Oct 12. PR4 merged Nov 8 (window still open at NOW).
function fixture({ withRevert = true } = {}) {
  const d = mkdtempSync(join(tmpdir(), "outc-"));
  at("2026-10-01T00:00:00Z"); g(d, "init", "-q", "-b", "main"); put(d, "README", "x\n"); g(d, "add", "."); g(d, "commit", "-qm", "init");
  const pr = (n, branch, start, merged, files) => {
    at(start); g(d, "checkout", "-qb", branch);
    for (const [p, t] of files) put(d, p, t);
    g(d, "add", "."); g(d, "commit", "-qm", `work on ${branch}`);
    at(merged); g(d, "checkout", "-q", "main"); g(d, "merge", "--no-ff", "-qm", `Merge pull request #${n} from x/${branch}`, branch);
    return g(d, "rev-parse", "HEAD").trim();
  };
  pr(1, "one", "2026-10-02T00:00:00Z", "2026-10-02T10:00:00Z", [["src/a.js", lines(30, "a")], ["package-lock.json", lines(1000, "l")], ["runs/s/evidence.txt", lines(50, "e")]]);
  const m2 = pr(2, "two", "2026-10-05T08:00:00Z", "2026-10-05T09:00:00Z", [["src/b.js", lines(10, "b")]]);
  if (withRevert) { at("2026-10-08T00:00:00Z"); g(d, "revert", "-m", "1", "--no-edit", m2); }
  pr(3, "three", "2026-10-10T08:00:00Z", "2026-10-10T09:00:00Z", [["src/c.js", lines(5, "c")]]);
  at("2026-10-12T00:00:00Z"); put(d, "src/c.js", lines(6, "c")); g(d, "add", "."); g(d, "commit", "-qm", "Fix an off-by-one in c");
  pr(4, "four", "2026-11-08T08:00:00Z", "2026-11-08T09:00:00Z", [["src/d.js", lines(4, "d")]]);
  return d;
}
const NOW = "2026-11-10T00:00:00Z";
const listing = (d) => { const out = []; const walk = (p) => { for (const e of readdirSync(p, { withFileTypes: true })) { const f = join(p, e.name); const s = statSync(f); out.push(`${f}:${s.mtimeMs}:${s.size}`); if (e.isDirectory()) walk(f); } }; walk(d); return out.sort(); };

describe("outcomes.mjs", () => {
  test("lead time, lines read, excluded lines and record lines come out as built", async () => {
    const d = fixture(); const o = await outcomes(d, { now: NOW });
    assert.equal(o.n.mergedChanges, 4);
    const l1 = o.delivery.D1_leadTime_gitOnly.items.find((i) => i.pr === 1);
    assert.equal(l1.hours, 10);
    const h = o.humanAttention.H4_reviewBurden.items.find((i) => i.pr === 1);
    assert.deepEqual([h.readLines, h.excludedLines, h.recordLines], [30, 1000, 50]);
    assert.equal(o.delivery.D1_leadTime_gitOnly.slowestTenth, "not drawn below ten merged changes");
    rmSync(d, { recursive: true });
  });

  test("a revert is certain, a fix is a candidate, an open window is not counted", async () => {
    const d = fixture(); const o = await outcomes(d, { now: NOW });
    const q = o.quality.Q2_postMergeWithin;
    assert.equal(q.closedWindowN, 3); assert.equal(q.openWindowN, 1);
    assert.equal(q.reverted, 1); assert.equal(q.fixCandidates, 1);
    assert.equal(q.revertRate, 1 / 3); assert.equal(q.revertOrFixCandidateRate, 2 / 3);
    rmSync(d, { recursive: true });
  });

  test("mutation: remove the revert and the revert count goes to zero; widen the excludes and lines read change", async () => {
    const d = fixture({ withRevert: false }); const o = await outcomes(d, { now: NOW });
    assert.equal(o.quality.Q2_postMergeWithin.reverted, 0);
    const o2 = await outcomes(d, { now: NOW, exclude: [String.raw`^src/a\.js$`] });
    assert.equal(o2.humanAttention.H4_reviewBurden.items.find((i) => i.pr === 1).readLines, 0);
    rmSync(d, { recursive: true });
  });

  test("a change merged inside the window is not scored, even if a revert already exists", async () => {
    const d = fixture(); const o = await outcomes(d, { now: "2026-10-06T00:00:00Z" });
    assert.equal(o.quality.Q2_postMergeWithin.closedWindowN, 0);
    assert.equal(o.quality.Q2_postMergeWithin.revertRate, NOT_RECORDED);
    rmSync(d, { recursive: true });
  });

  test("no person appears in the output and nothing is ranked", async () => {
    const d = fixture(); const o = await outcomes(d, { now: NOW });
    const text = JSON.stringify(o);
    assert.doesNotMatch(text, /Zed|Uniqueperson|example\.test/);
    assert.doesNotMatch(text, /rank|leaderboard|author/i);
    rmSync(d, { recursive: true });
  });

  test("read only: the repository is byte-for-byte unchanged afterwards", async () => {
    const d = fixture(); const before = listing(d); const head = g(d, "rev-parse", "HEAD");
    await outcomes(d, { now: NOW });
    assert.deepEqual(listing(d), before);
    assert.equal(g(d, "rev-parse", "HEAD"), head);
    assert.equal(g(d, "status", "--porcelain").trim(), "");
    rmSync(d, { recursive: true });
  });

  test("missing data says not recorded, with a reason", async () => {
    const d = fixture(); const o = await outcomes(d, { now: NOW });
    assert.equal(o.cost.value, NOT_RECORDED);
    assert.equal(o.humanAttention.H1_H2_H3.value, NOT_RECORDED);
    assert.equal(o.humanAttention.H4_reviewBurden.mergedWithNoReview.value, NOT_RECORDED);
    assert.match(o.delivery.D3_timeToRestore.reason, /deploy or incident/);
    rmSync(d, { recursive: true });
  });

  test("with --gh the share merged with no review is computed from an injected reader", async () => {
    const d = fixture(); const reviews = { 1: 2, 2: 0, 3: 0, 4: 1 };
    const o = await outcomes(d, { now: NOW, gh: true, reviewsOf: (pr) => reviews[pr] });
    assert.deepEqual([o.humanAttention.H4_reviewBurden.mergedWithNoReview.none, o.humanAttention.H4_reviewBurden.mergedWithNoReview.of], [2, 4]);
    rmSync(d, { recursive: true });
  });

  test("with ten or more merged changes the slowest tenth is listed", async () => {
    const d = mkdtempSync(join(tmpdir(), "outc10-"));
    at("2026-10-01T00:00:00Z"); g(d, "init", "-q", "-b", "main"); put(d, "README", "x\n"); g(d, "add", "."); g(d, "commit", "-qm", "init");
    for (let i = 1; i <= 10; i++) {
      const day = String(i).padStart(2, "0");
      at(`2026-10-${day}T00:00:00Z`); g(d, "checkout", "-qb", `b${i}`); put(d, `f${i}.js`, "x\n"); g(d, "add", "."); g(d, "commit", "-qm", `w${i}`);
      at(`2026-10-${day}T0${i === 10 ? 9 : 1}:00:00Z`); g(d, "checkout", "-q", "main"); g(d, "merge", "--no-ff", "-qm", `Merge pull request #${i} from x/b${i}`, `b${i}`);
    }
    const o = await outcomes(d, { now: NOW });
    assert.equal(o.delivery.D1_leadTime_gitOnly.slowestTenth.length, 1);
    assert.equal(o.delivery.D1_leadTime_gitOnly.slowestTenth[0].pr, 10);
    rmSync(d, { recursive: true });
  });

  test("median", () => { assert.equal(median([3, 1, 2]), 2); assert.equal(median([1, 2, 3, 4]), 2.5); assert.equal(median([]), null); });
});
