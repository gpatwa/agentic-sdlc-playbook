// repo-map.mjs is the first thing an assessment runs against code Aveto did not write. What it must get right:
// it never reads a secret path, it ranks risk the way docs/CODE_REVIEW.md says, it counts history exactly, and it
// answers "was this governed by Aveto?" from records. A silent error in any of these misdirects the whole review.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { buildMap, renderMap, tierOf, denyReason, parseRiskPaths, parseCodeowners, ownersOf, globToRegex, governance, detectCommands } from "../repo-map.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "repo-map.mjs");
const PLANTED = "AKIAPLANTEDSECRET0123456789";

let repo;
const sh = (...args) => execFileSync("git", ["-C", repo, "-c", "user.name=Ann", "-c", "user.email=a@x", ...args], { encoding: "utf8" });
const put = (path, body = "x\n") => { mkdirSync(dirname(join(repo, path)), { recursive: true }); writeFileSync(join(repo, path), body); };
const commit = (msg, author = "Ann") => { sh("add", "-A"); sh("-c", `user.name=${author}`, "commit", "-q", "-m", msg); };

before(() => {
  repo = join(tmpdir(), `repo-map-test-${process.pid}`);
  rmSync(repo, { recursive: true, force: true });
  mkdirSync(repo, { recursive: true });
  execFileSync("git", ["-C", repo, "init", "-q", "-b", "main"]);
  put("src/app.py", "print(1)\n");
  put("src/auth/login.py", "x\n");
  put("src/util.py", "x\n");
  put("README.md", "# hi\n");
  put("docs/auth.md", "about auth\n");
  put(".github/workflows/ci.yml", "jobs:\n  t:\n    steps:\n      - run: pytest -q\n");
  put(".github/CODEOWNERS", "*.py @dev\nsrc/auth/ @sec\n");
  put("package.json", JSON.stringify({ main: "index.js", scripts: { test: "node --test", lint: "eslint ." } }));
  put(".env", `KEY=${PLANTED}\n`);
  put(".env.example", "KEY=\n");
  put("secrets/token.txt", PLANTED);
  put("deploy/server.pem", PLANTED);
  put("node_modules/lib/index.js", "x\n");
  commit("one", "Ann");
  put("src/app.py", "print(2)\n"); commit("two", "Bob");
  put("src/app.py", "print(3)\n"); commit("three", "Ann");
});
after(() => rmSync(repo, { recursive: true, force: true }));

describe("secret paths", () => {
  test("the deny list names the usual suspects and spares example files", () => {
    for (const p of [".env", "svc/.env.production", "a/b/server.pem", "id_rsa", "secrets/x", "config/credentials/y.json", "x.tfstate", ".npmrc", "tls/ca.crt"]) {
      assert.ok(denyReason(p), `${p} should be denied`);
    }
    for (const p of [".env.example", "src/auth/login.py", "docs/secrets-policy.md", "keys.md"]) assert.equal(denyReason(p), null, `${p} should not be denied`);
  });
  test("denied files are marked, carry no size, and are not in the review set", () => {
    const m = buildMap(repo, { date: "2026-10-30" });
    for (const p of [".env", "secrets/token.txt", "deploy/server.pem"]) {
      const f = m.files.find((x) => x.path === p);
      assert.equal(f.status, "denied", p);
      assert.equal(f.bytes, 0, `${p} must not be sized`);
    }
    assert.equal(m.files.find((x) => x.path === ".env.example").status, "review");
  });
  test("a planted secret in an excluded path is in neither the map nor the JSON", () => {
    const m = buildMap(repo, { date: "2026-10-30" });
    assert.ok(!renderMap(m).includes(PLANTED));
    assert.ok(!JSON.stringify(m).includes(PLANTED));
  });
});

describe("risk tiers", () => {
  test("defaults follow CODE_REVIEW.md rule 3", () => {
    assert.equal(tierOf(".github/workflows/ci.yml").tier, "high");
    assert.equal(tierOf("src/auth/login.py").tier, "high");
    assert.equal(tierOf("infra/main.tf").tier, "high");
    assert.equal(tierOf(".agentic/SAFETY_INVARIANTS.md").tier, "high");
    assert.equal(tierOf("README.md").tier, "low");
    assert.equal(tierOf("docs/auth.md").tier, "low", "docs are low even when the name says auth");
    assert.equal(tierOf("src/util.py").tier, "medium");
  });
  test("an organisation's own rules win over the defaults", () => {
    const rules = parseRiskPaths("# ours\nhigh: src/util.py\nlow: src/auth/**\n");
    assert.equal(tierOf("src/util.py", rules).tier, "high");
    assert.equal(tierOf("src/auth/login.py", rules).tier, "low");
    assert.equal(tierOf("src/app.py", rules).tier, "medium");
  });
});

describe("history", () => {
  test("commits and authors are counted from git, exactly", () => {
    const f = buildMap(repo).files.find((x) => x.path === "src/app.py");
    assert.equal(f.commits, 3);
    assert.deepEqual(f.authors, ["Ann", "Bob"]);
  });
  test("CODEOWNERS: the last matching line wins", () => {
    const e = parseCodeowners("*.py @dev\nsrc/auth/ @sec\n");
    assert.deepEqual(ownersOf("src/app.py", e), ["@dev"]);
    assert.deepEqual(ownersOf("src/auth/login.py", e), ["@sec"]);
    assert.deepEqual(ownersOf("README.md", e), []);
  });
  test("globs", () => {
    assert.ok(globToRegex("payments/**").test("payments/a/b.py"));
    assert.ok(globToRegex("*.py").test("x/y/z.py"));
    assert.ok(!globToRegex("/src/").test("other/src/x"));
  });
});

describe("what the map says about the repo", () => {
  test("vendored folders are skipped, and a scope marks the rest out of scope", () => {
    const m = buildMap(repo, { scopes: ["src"] });
    assert.equal(m.files.find((x) => x.path === "node_modules/lib/index.js").status, "out of scope");
    assert.equal(m.files.find((x) => x.path === "src/util.py").status, "review");
    assert.equal(m.files.find((x) => x.path === "README.md").status, "out of scope");
    assert.equal(buildMap(repo).files.find((x) => x.path === "node_modules/lib/index.js").status, "skipped");
  });
  test("commands and entry points come from manifests and CI", () => {
    const m = buildMap(repo);
    assert.ok(m.commands.some((c) => c.kind === "test" && /npm run test/.test(c.command)));
    assert.ok(m.commands.some((c) => c.kind === "ci" && /pytest/.test(c.command)));
    assert.ok(m.entryPoints.some((e) => /package main: index.js/.test(e.why)));
  });
  test("a repo with no manifests reports no tests, not an error", () => {
    const { commands } = detectCommands(["a.txt"], () => null);
    assert.deepEqual(commands, []);
    const md = renderMap({ ...buildMap(repo), commands: [] });
    assert.match(md, /\*\*No tests found\.\*\*/);
  });
  test("a repo without Aveto records is said to have none; one with a Charter is governed", () => {
    assert.equal(buildMap(repo).governance.governed, false);
    assert.match(renderMap(buildMap(repo)), /No Aveto records found/);
    assert.equal(governance(["runs/s1/CHARTER.md", "runs/s1/END_REVIEW.md", ".agentic/X.md"]).governed, true);
    assert.equal(governance([".claude/agents/a.md", "README.md"]).governed, false, "agents alone are not a record of governance");
  });
  test("the same repo gives the same map", () => {
    assert.equal(renderMap(buildMap(repo, { date: "2026-10-30" })), renderMap(buildMap(repo, { date: "2026-10-30" })));
  });
});

describe("the command line", () => {
  test("it changes nothing in the repo, and writes only where --out says", () => {
    const before = sh("status", "--porcelain");
    const head = sh("rev-parse", "HEAD");
    execFileSync("node", [cli, repo], { encoding: "utf8" });
    assert.equal(sh("status", "--porcelain"), before);
    const out = join(tmpdir(), `repo-map-out-${process.pid}`);
    rmSync(out, { recursive: true, force: true });
    execFileSync("node", [cli, repo, "--out", out, "--date", "2026-10-30"]);
    assert.ok(existsSync(join(out, "MAP.md")) && existsSync(join(out, "map.json")));
    assert.equal(sh("status", "--porcelain"), before);
    assert.equal(sh("rev-parse", "HEAD"), head);
    assert.ok(!readFileSync(join(out, "MAP.md"), "utf8").includes(PLANTED));
    rmSync(out, { recursive: true, force: true });
  });
  test("a directory that is not a git repo is refused", () => {
    assert.throws(() => execFileSync("node", [cli, tmpdir()], { stdio: "pipe" }), /not a git repository/);
  });
});
