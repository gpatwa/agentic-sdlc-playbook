// assess-reassess.mjs must not turn a reviewer's silence into a fix. Its failure modes: calling a finding "closed" when the
// file never changed, pairing an unrelated finding with an old one, and hiding a fix that did not hold.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { reassess, render, similarity, changedFiles, readFindings } from "../assess-reassess.mjs";

const f = (id, where, finding, disposition = "open", reviewer = "codex", severity = "P2") => ({ id, severity, where, finding, evidence: "", reviewer, disposition });
const status = (res, id) => res.rows.find((r) => r.id === id).status;

describe("reassess", () => {
  test("a fixed finding that is not raised again is closed; raised again it is NOT FIXED", () => {
    const before = [f("F-1", "a.py:10", "tenant check is skipped when tenant id is omitted", "fixed"), f("F-2", "b.py:5", "token compared with double equals", "fixed")];
    const after = [f("N-1", "b.py:7", "token still compared with double equals", "open", "claude")];
    const res = reassess(before, after, { changed: new Set(["a.py", "b.py"]) });
    assert.equal(status(res, "F-1"), "closed");
    assert.equal(status(res, "F-2"), "NOT FIXED");
    assert.deepEqual(res.fresh, []);
  });

  test("silence is not a fix: an open finding in a file that did not change is flagged, one in a changed file is only 'not re-found'", () => {
    const before = [f("F-1", "a.py:10", "sql built from a string", "open"), f("F-2", "b.py:5", "missing timeout on request", "deferred")];
    const res = reassess(before, [], { changed: new Set(["b.py"]) });
    assert.equal(status(res, "F-1"), "NOT RE-FOUND, FILE UNCHANGED");
    assert.equal(status(res, "F-2"), "not re-found");
    const unknown = reassess(before, [], { changed: null });
    assert.match(unknown.rows[0].note, /no changed-file list/);
  });

  test("a closed finding whose file never changed is marked CHECK", () => {
    const res = reassess([f("F-1", "a.py:10", "x is wrong", "fixed")], [], { changed: new Set(["other.py"]) });
    assert.equal(status(res, "F-1"), "closed");
    assert.match(res.rows[0].note, /CHECK/);
  });

  test("still open, re-raised and unchanged follow the earlier disposition", () => {
    const before = [f("F-1", "a.py:10", "no timeout on the request", "deferred"), f("F-2", "b.py:5", "debug flag is on", "intentional"), f("F-3", "c.py:1", "unused import", "rejected")];
    const after = [f("N-1", "a.py:12", "request has no timeout"), f("N-2", "b.py:6", "debug flag enabled")];
    const res = reassess(before, after, { changed: new Set(["a.py"]) });
    assert.equal(status(res, "F-1"), "still open");
    assert.equal(status(res, "F-2"), "re-raised");
    assert.equal(status(res, "F-3"), "unchanged");
  });

  test("pairing needs the same file; line shift is covered by word overlap; unrelated findings stay new", () => {
    const before = [f("F-1", "a.py:10", "the tenant check is skipped when the tenant id is omitted", "fixed")];
    const moved = reassess(before, [f("N-1", "a.py:90", "tenant check skipped when tenant id omitted again")], {});
    assert.equal(status(moved, "F-1"), "NOT FIXED", "same file, far line, similar words");
    const otherFile = reassess(before, [f("N-1", "z.py:10", "the tenant check is skipped when the tenant id is omitted")], {});
    assert.equal(status(otherFile, "F-1"), "closed");
    assert.equal(otherFile.fresh.length, 1);
    const unrelated = reassess(before, [f("N-2", "a.py:200", "cookie lacks the secure flag")], {});
    assert.equal(status(unrelated, "F-1"), "closed");
    assert.equal(unrelated.fresh.length, 1);
  });

  test("two different problems near each other are not paired", () => {
    const before = [f("F-1", "a.py:108", "the audit wrapper only records ToolError failures, other exceptions leave no entry", "fixed")];
    const after = [f("N-1", "a.py:98", "the audit list grows without limit and nothing reads it in production")];
    assert.equal(status(reassess(before, after, {}), "F-1"), "closed");
  });

  test("PR references are carried onto closed rows", () => {
    const res = reassess([f("F-1", "a.py:10", "x", "fixed")], [], { changed: new Set(["a.py"]), prs: { "F-1": "PR 41" } });
    assert.equal(res.rows[0].note, "PR 41");
  });
});

describe("render", () => {
  test("problems are listed before progress, and the missing changed-file list is stated", () => {
    const before = [f("F-1", "a.py:10", "one", "fixed"), f("F-2", "b.py:5", "two", "open")];
    const res = reassess(before, [], { changed: null });
    const md = render(res, { date: "2026-11-02", reviewers: ["codex"], prsSupplied: false, changedSupplied: false });
    assert.match(md, /not a certification/);
    assert.match(md, /NOT supplied/);
    assert.ok(md.indexOf("| F-2 |") < md.indexOf("| F-1 |"), "not re-found is listed before closed");
    assert.match(md, /Pull request references were not supplied/);
  });
});

describe("inputs", () => {
  test("similarity and git changed files", () => {
    assert.ok(similarity("tenant check skipped", "tenant check skipped") === 1);
    assert.equal(similarity("abc", "xyz"), 0);
    const root = join(tmpdir(), `reassess-${process.pid}`);
    rmSync(root, { recursive: true, force: true }); mkdirSync(root, { recursive: true });
    const g = (...a) => execFileSync("git", ["-C", root, "-c", "user.name=A", "-c", "user.email=a@x", ...a], { encoding: "utf8" });
    g("init", "-q", "-b", "main"); writeFileSync(join(root, "a.py"), "1"); writeFileSync(join(root, "b.py"), "1"); g("add", "-A"); g("commit", "-q", "-m", "1");
    const from = g("rev-parse", "HEAD").trim();
    writeFileSync(join(root, "a.py"), "2"); g("commit", "-q", "-am", "2");
    assert.deepEqual([...changedFiles(root, from, "HEAD")], ["a.py"]);
    writeFileSync(join(root, "FINDINGS.md"), "| id | severity | file:line | finding | evidence | reviewer | disposition |\n|---|---|---|---|---|---|---|\n| F-1 | P1 | a.py:3 | claim | ev | codex | fixed |\n| F-2 | P1 | no line | claim | ev | codex | open |\n");
    assert.equal(readFindings(root).length, 1, "a finding without a file and line is not compared");
    rmSync(root, { recursive: true, force: true });
  });
});
