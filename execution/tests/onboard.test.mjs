// install.mjs --existing proposes .agentic/ for code Aveto did not build. The risk is invented authority: safety text
// that looks confirmed when nobody confirmed it. These tests pin that every derived line says it is proposed, that an
// owner's own file is never overwritten, and that the repo's source is untouched.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { buildMap } from "../repo-map.mjs";
import { proposeAgentic, PROPOSED } from "../onboard.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const installer = join(here, "..", "install.mjs");
let repo;
const put = (p, b = "x\n") => { mkdirSync(dirname(join(repo, p)), { recursive: true }); writeFileSync(join(repo, p), b); };
const sha = (p) => createHash("sha256").update(readFileSync(join(repo, p))).digest("hex");
const install = (...a) => execFileSync("node", [installer, repo, ...a], { encoding: "utf8", stdio: "pipe" });
const g = (...a) => execFileSync("git", ["-C", repo, "-c", "user.name=A", "-c", "user.email=a@x", ...a], { encoding: "utf8" });

before(() => {
  repo = join(tmpdir(), `onboard-test-${process.pid}`);
  rmSync(repo, { recursive: true, force: true });
  mkdirSync(repo, { recursive: true });
  execFileSync("git", ["-C", repo, "init", "-q", "-b", "main"]);
  put("src/app.py", "print(1)\n");
  put("src/auth/login.py", "x\n");
  put("package.json", JSON.stringify({ scripts: { test: "node --test" } }));
  put(".github/workflows/ci.yml", "jobs: {}\n");
  put(".github/CODEOWNERS", "* @dev\n");
  g("add", "-A"); g("commit", "-q", "-m", "init");
});
after(() => rmSync(repo, { recursive: true, force: true }));

describe("proposals", () => {
  test("every derived line is marked proposed, and the invariants include no unmarked rule", () => {
    const files = proposeAgentic(buildMap(repo));
    assert.deepEqual(Object.keys(files).sort(), ["LOCAL_COMMANDS.md", "PROJECT_CONTEXT.md", "SAFETY_INVARIANTS.md"]);
    for (const [name, body] of Object.entries(files)) {
      assert.match(body, /PROPOSED by `install\.mjs --existing`, not confirmed/, name);
      for (const line of body.split("\n").filter((l) => /^- /.test(l))) assert.ok(line.includes(PROPOSED), `${name}: unmarked line: ${line}`);
    }
    const inv = files["SAFETY_INVARIANTS.md"];
    assert.match(inv, /secret-path list/);
    assert.match(inv, /CI files/);
    assert.match(inv, /authentication and access code.*src\/auth/);
    assert.match(inv, /CODEOWNERS/);
  });
  test("a repo with no test command is told so, not given an invented one", () => {
    const m = buildMap(repo); m.commands = [];
    assert.match(proposeAgentic(m)["LOCAL_COMMANDS.md"], /No tests found/);
  });
});

describe("install.mjs --existing", () => {
  test("without a flag an unknown repo is still refused, and the message names --existing", () => {
    assert.throws(() => install(), (e) => /--existing/.test(String(e.stderr)));
    assert.ok(!existsSync(join(repo, ".agentic")));
  });
  test("--greenfield and --existing together are refused", () => {
    assert.throws(() => install("--greenfield", "--existing"), (e) => /exclude each other/.test(String(e.stderr)));
  });
  test("it writes the three proposals, leaves source files alone, and never overwrites an owner's file", () => {
    const before = { app: sha("src/app.py"), login: sha("src/auth/login.py"), pkg: sha("package.json") };
    mkdirSync(join(repo, ".agentic"), { recursive: true });
    writeFileSync(join(repo, ".agentic", "PROJECT_CONTEXT.md"), "the owner wrote this\n");
    const out = install("--existing");
    assert.match(out, /PROJECT_CONTEXT\.md: exists, left alone/);
    assert.equal(readFileSync(join(repo, ".agentic", "PROJECT_CONTEXT.md"), "utf8"), "the owner wrote this\n");
    assert.match(readFileSync(join(repo, ".agentic", "SAFETY_INVARIANTS.md"), "utf8"), /\(proposed, not confirmed\)/);
    assert.match(readFileSync(join(repo, ".agentic", "LOCAL_COMMANDS.md"), "utf8"), /npm run test/);
    assert.deepEqual({ app: sha("src/app.py"), login: sha("src/auth/login.py"), pkg: sha("package.json") }, before);
  });
  test("a second run changes nothing it wrote the first time", () => {
    const a = sha(".agentic/SAFETY_INVARIANTS.md");
    install("--existing");
    assert.equal(sha(".agentic/SAFETY_INVARIANTS.md"), a);
  });
});
