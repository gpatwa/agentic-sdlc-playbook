// assess-run.mjs chains the assessment steps. The reviewer is replaced by a fake that returns canned replies, so these tests
// check the chain and its failure modes: a reviewer that tries to write, one that fails, one that returns prose, and the
// model never being taken from the tool's own configuration.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { run, extractRows, reviewerCommand, REVIEWERS } from "../assess-run.mjs";

const here = dirname(fileURLToPath(import.meta.url));
let root, repo;
const g = (...a) => execFileSync("git", ["-C", repo, "-c", "user.name=A", "-c", "user.email=a@x", ...a], { encoding: "utf8" });
const put = (p, b = "x\n") => { mkdirSync(dirname(join(repo, p)), { recursive: true }); writeFileSync(join(repo, p), b); };

before(() => {
  root = join(tmpdir(), `assess-run-${process.pid}`);
  rmSync(root, { recursive: true, force: true });
  repo = join(root, "target");
  mkdirSync(repo, { recursive: true });
  execFileSync("git", ["-C", repo, "init", "-q", "-b", "main"]);
  put("src/auth.py", "def check(user):\n    return True\n");
  put("src/util.py", "x = 1\n");
  put(".env", "KEY=value\n");
  g("add", "-A"); g("commit", "-q", "-m", "init");
});
after(() => rmSync(root, { recursive: true, force: true }));

const REPLY = "| 1 | P1 | src/auth.py:2 | `check` always returns True, so anyone is authorised. | `return True` |\n| 2 | P3 | no line here | vague | none |\nNot read: nothing.";
const ok = (reply) => () => ({ status: 0, stdout: reply });

describe("extractRows", () => {
  test("renumbers, tags the reviewer, opens the disposition, and drops rows without file and line", () => {
    const rows = extractRows(REPLY, 3, "codex");
    assert.equal(rows.length, 1);
    assert.match(rows[0], /^\| F-03-1 \| P1 \| src\/auth\.py:2 \| .*\| codex \| open \|$/);
  });
  test("prose and 'No findings.' give no rows", () => {
    assert.deepEqual(extractRows("No findings.", 1, "codex"), []);
    assert.deepEqual(extractRows("I looked and it is fine", 1, "codex"), []);
  });
});

describe("reviewerCommand", () => {
  test("always passes a model and a read-only sandbox, never the tool's own default", () => {
    const c = reviewerCommand("codex", { clone: "/c", model: "m1", effort: "medium", outFile: "/o" });
    assert.ok(c.args.includes("-m") && c.args[c.args.indexOf("-m") + 1] === "m1");
    assert.ok(c.args.includes("read-only"));
    const k = reviewerCommand("claude", { clone: "/c", model: "m2", effort: "high", outFile: "/o" });
    assert.ok(k.args.includes("--disallowedTools") && /Write/.test(k.args.join(" ")));
    assert.throws(() => reviewerCommand("gpt", {}), /unknown reviewer/);
  });
});

describe("run", () => {
  test("a dry run plans and calls no reviewer", () => {
    let called = 0;
    const r = run(repo, { reviewer: "codex", scratch: join(root, "s0"), dryRun: true }, () => { called++; return { status: 0, stdout: "" }; });
    assert.equal(called, 0);
    assert.ok(r.dryRun && r.areas >= 1);
    assert.match(readFileSync(join(r.clone, "reviews", "RUN.md"), "utf8"), /gpt-5\.6-sol/);
  });

  test("the chain: findings are appended, the read-only check passes, the report is written", () => {
    const seen = [];
    const r = run(repo, { reviewer: "codex", scratch: join(root, "s1") }, (spec, prompt) => { seen.push({ spec, prompt }); return { status: 0, stdout: REPLY }; });
    // codex replies through the -o file; the fake wrote nothing, so the stdout fallback must carry it
    assert.ok(seen.length >= 1);
    assert.match(seen[0].prompt, /You cannot write files/);
    assert.ok(!seen[0].prompt.includes("KEY=value"), "the secret file's contents never reach the reviewer");
    assert.equal(r.verified.ok, true);
    assert.ok(r.rows >= 1);
    assert.match(readFileSync(join(r.records, "FINDINGS.md"), "utf8"), /\| codex \| open \|/);
    assert.ok(existsSync(r.reportPath), r.reportError);
  });

  test("a reviewer that fails leaves its area marked not reviewed, and the run still reports", () => {
    const r = run(repo, { reviewer: "claude", scratch: join(root, "s2") }, () => ({ status: 1, stdout: "" }));
    assert.ok(r.failed.length >= 1);
    assert.match(readFileSync(join(r.records, "RUN.md"), "utf8"), /FAILED/);
  });

  test("a reviewer that writes into the copy fails the read-only check", () => {
    const r = run(repo, { reviewer: "claude", scratch: join(root, "s3") }, (spec, prompt, cwd) => { writeFileSync(join(cwd, "src", "util.py"), "x = 2\n"); return { status: 0, stdout: REPLY }; });
    assert.equal(r.verified.ok, false);
    assert.match(r.verified.problems.join("\n"), /differs/);
  });

  test("seeds give a score", () => {
    const seeds = join(root, "seeds.json");
    writeFileSync(seeds, JSON.stringify([{ id: "S1", file: "src/auth.py", lineStart: 2, lineEnd: 2, class: "authz", severity: "P1", description: "always true" }]));
    const r = run(repo, { reviewer: "claude", scratch: join(root, "s4"), seeds }, ok(REPLY));
    assert.match(readFileSync(r.scorePath, "utf8"), /Recall: 1 of 1/);
  });

  test("the command line refuses an unknown reviewer", () => {
    assert.throws(() => execFileSync("node", [join(here, "..", "assess-run.mjs"), repo, "--reviewer", "gpt"], { stdio: "pipe" }), (e) => e.status === 2);
  });
});
