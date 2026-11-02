// assess-report.mjs writes the one document an owner or an auditor reads. Its failure modes: claiming more than was done
// (a clean read-only check that was not, a second reviewer that was not, a finding with no line), and leaking a secret
// the reviewers quoted. Each is tried here.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { prepare } from "../assess-guard.mjs";
import { buildMap } from "../repo-map.mjs";
import { planAreas, scanForSecrets, writeRecords } from "../assess-plan.mjs";
import { parseFindings, buildReport, hasFileAndLine } from "../assess-report.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "assess-report.mjs");
let root, repo, guard, rec;
const g = (...a) => execFileSync("git", ["-C", repo, "-c", "user.name=A", "-c", "user.email=a@x", ...a], { encoding: "utf8" });
const put = (p, b = "x\n") => { mkdirSync(dirname(join(repo, p)), { recursive: true }); writeFileSync(join(repo, p), b); };
const ROW = (id, sev, where, finding, evidence = "read it", reviewer = "claude", disp = "open") => `| ${id} | ${sev} | ${where} | ${finding} | ${evidence} | ${reviewer} | ${disp} |\n`;
const HEAD = `# Findings\n\n| id | severity | file:line | finding | evidence | reviewer | disposition |\n|---|---|---|---|---|---|---|\n`;
const REV1 = [{ name: "claude", family: "anthropic" }];
const REV2 = [...REV1, { name: "codex", family: "openai" }];
const setFindings = (rows) => writeFileSync(join(rec, "FINDINGS.md"), HEAD + rows.join(""));

before(() => {
  root = join(tmpdir(), `assess-report-${process.pid}`);
  rmSync(root, { recursive: true, force: true });
  repo = join(root, "repo");
  mkdirSync(repo, { recursive: true });
  execFileSync("git", ["-C", repo, "init", "-q", "-b", "main"]);
  put("src/auth/login.py", "x".repeat(8000));
  put("src/util.py", "x".repeat(8000));
  put("README.md", "# r\n");
  put(".env", "A=1\n");
  g("add", "-A"); g("commit", "-q", "-m", "init");
  guard = prepare(repo, join(root, "scratch"));
  rec = join(guard.clone, "reviews");
  const map = buildMap(guard.clone, { date: "2026-11-02" });
  writeRecords(planAreas(map, { areaTokens: 2500, capTokens: 2500, heldBack: scanForSecrets(map, guard.clone) }), map, rec);
  writeFileSync(join(rec, "map.json"), JSON.stringify(map));
});
after(() => rmSync(root, { recursive: true, force: true }));

const report = (o = {}) => buildReport(rec, { reviewers: REV1, date: "2026-11-02", ...o });

describe("parsing", () => {
  test("rows parse, escaped pipes survive, and a finding needs a file and a line", () => {
    const rows = parseFindings(HEAD + ROW("F-01-1", "P1", "src/a.py:10", "uses a \\| b", "x \\| y"));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].finding, "uses a | b");
    assert.equal(rows[0].evidence, "x | y");
    assert.ok(hasFileAndLine("src/a.py:10") && !hasFileAndLine("src/a.py") && !hasFileAndLine(""));
  });
});

describe("the report says only what was done", () => {
  test("one model family is called a first pass; two are called independent", () => {
    setFindings([]);
    assert.match(report(), /Independent second reviewer \| \*\*no\*\*/);
    assert.match(report({ reviewers: REV2 }), /Independent second reviewer \| yes \(anthropic, openai\)/);
  });
  test("it is an assessment: it never says certified, and it says what a clean result means", () => {
    setFindings([]);
    const t = report();
    assert.match(t, /not a certification/);
    assert.doesNotMatch(t, /\bcertified\b/i);
    assert.match(t, /absence is not evidence of safety/);
    assert.match(t, /No findings were recorded\./);
  });
  test("findings are grouped by severity with file, line and evidence; P0 and P1 become intents, the rest are deferred", () => {
    setFindings([ROW("F-01-1", "P1", "src/auth/login.py:12", "session never expires", "login.py:12 sets no ttl"), ROW("F-01-2", "P3", "src/util.py:3", "dead branch"), ROW("F-02-1", "P0", "src/auth/login.py:40", "admin check missing")]);
    const t = report();
    assert.ok(t.indexOf("### P0") < t.indexOf("### P1") && t.indexOf("### P1") < t.indexOf("### P3"));
    assert.match(t, /\*\*F-01-1\*\* · `src\/auth\/login\.py:12`/);
    assert.match(t, /\*Evidence:\* login\.py:12 sets no ttl/);
    assert.match(t, /\*\*Intent \(F-02-1, P0\):\*\* Fix the issue at `src\/auth\/login\.py:40`/);
    assert.match(t, /Recorded and deferred[^]*F-01-2 \(P3\)/);
    assert.match(t, /3 finding\(s\): 1 P0, 1 P1, 0 P2, 1 P3, 0 note/);
  });
  test("an item with no file and line is not counted and is named", () => {
    setFindings([ROW("F-01-1", "P1", "somewhere in auth", "vague")]);
    const t = report();
    assert.match(t, /No findings were recorded\./);
    assert.match(t, /had no file and line and are not counted: F-01-1/);
  });
  test("what was not reviewed is listed with its reason, including held-back and excluded counts", () => {
    setFindings([]);
    const t = report();
    assert.match(t, /Area `[^`]+` \(\w+, about [\d,]+ tokens\): token cap reached\./);
    assert.match(t, /1 file\(s\) on the secret-path list, never read\./);
  });
  test("no tests found is said, and detected commands are marked as not run", () => {
    setFindings([]);
    assert.match(report(), /\*\*No tests found\.\*\*/);
  });
  test("the same records give the same report", () => {
    setFindings([ROW("F-01-1", "P2", "src/util.py:1", "x")]);
    assert.equal(report(), report());
  });
});

describe("it refuses to overclaim", () => {
  test("a failed read-only check stops the report; with the override the failure is at the top", () => {
    setFindings([]);
    const gp = join(root, "scratch", "guard.json");
    assert.match(report({ guardPath: gp }), /Read-only check \| passed/);
    writeFileSync(join(guard.clone, "src", "util.py"), "edited");
    assert.throws(() => report({ guardPath: gp }), /read-only check failed/);
    const t = report({ guardPath: gp, allowUnverified: true });
    assert.match(t.split("\n")[0], /WARNING: the read-only check FAILED/);
    assert.match(t, /Read-only check \| FAILED/);
    writeFileSync(join(guard.clone, "src", "util.py"), "x".repeat(8000));
  });
  test("a secret quoted in a finding's evidence stops the report", () => {
    setFindings([ROW("F-01-1", "P1", "src/a.py:1", "hard-coded key", "key is AKIAABCDEFGHIJKLMNOP")]);
    assert.throws(() => report(), /matches a secret pattern/);
  });
  test("the command line writes REPORT.md and exits 1 with a message when it must refuse", () => {
    setFindings([]);
    execFileSync("node", [cli, rec, "--reviewers", "claude:anthropic", "--date", "2026-11-02"]);
    assert.match(readFileSync(join(rec, "REPORT.md"), "utf8"), /^# Assessment report: repo/);
    setFindings([ROW("F-01-1", "P1", "a.py:1", "k", "AKIAABCDEFGHIJKLMNOP")]);
    assert.throws(() => execFileSync("node", [cli, rec, "--reviewers", "claude:anthropic"], { stdio: "pipe" }), (e) => e.status === 1 && /secret pattern/.test(String(e.stderr)));
  });
});
