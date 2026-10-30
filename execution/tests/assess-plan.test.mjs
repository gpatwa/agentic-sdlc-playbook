// assess-plan.mjs decides what a reviewer will and will not look at. The two ways it can quietly mislead are showing a
// reviewer something it must not see (a secret) and hiding what was not reviewed. Both are tested by trying to break them.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { buildMap } from "../repo-map.mjs";
import { planAreas, scanForSecrets, writeRecords, secretHits, FINDINGS_HEADER } from "../assess-plan.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, "..", "assess-plan.mjs");
const KEY = "AKIAPLANTEDSECRET012";           // an AWS-style id in a normal source file
const ENVV = "PLANTED-ENV-VALUE-XYZ";           // a value in a secret path
const big = (n) => "x".repeat(n * 4);

let root, repo, out;
const g = (...a) => execFileSync("git", ["-C", repo, "-c", "user.name=A", "-c", "user.email=a@x", ...a], { encoding: "utf8" });
const put = (p, b = "x\n") => { mkdirSync(dirname(join(repo, p)), { recursive: true }); writeFileSync(join(repo, p), b); };
const allText = (dir) => readdirSync(dir, { recursive: true }).filter((f) => /\.md$/.test(f)).map((f) => readFileSync(join(dir, f), "utf8")).join("\n");

before(() => {
  root = join(tmpdir(), `assess-plan-${process.pid}`);
  rmSync(root, { recursive: true, force: true });
  repo = join(root, "repo"); out = join(root, "records");
  mkdirSync(repo, { recursive: true });
  execFileSync("git", ["-C", repo, "init", "-q", "-b", "main"]);
  put("src/auth/login.py", big(2000));
  put("src/auth/session.py", big(1000));
  put("src/billing/pay.py", big(3000));
  put("src/util/a.py", big(1500));
  put("src/util/b.py", big(1500));
  put("src/leak.py", `KEY = "${KEY}"\n`);
  put("README.md", "# readme\n" + big(500));
  put("generated/page.html", big(90000));
  put(".env", `TOKEN=${ENVV}\n`);
  put("secrets/k.txt", ENVV);
  g("add", "-A"); g("commit", "-q", "-m", "init");
});
after(() => rmSync(root, { recursive: true, force: true }));

const plan = (opts = {}, mapOpts = {}) => {
  const map = buildMap(repo, { date: "2026-10-30", ...mapOpts });
  return { map, plan: planAreas(map, { heldBack: scanForSecrets(map, repo), ...opts }) };
};

describe("order, size and the cap", () => {
  test("high-risk areas come first, and no area exceeds the area size", () => {
    const { plan: p } = plan({ areaTokens: 5000, capTokens: 1e9 });
    const tiers = p.areas.map((a) => a.tier);
    assert.deepEqual(tiers, [...tiers].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a] - { high: 0, medium: 1, low: 2 }[b])));
    assert.equal(p.areas[0].tier, "high");
    for (const a of p.areas) assert.ok(a.tokens <= 5000, `${a.dir} has ${a.tokens}`);
  });
  test("at the cap the run stops and everything after is listed as not reviewed, with a reason", () => {
    const { plan: p } = plan({ areaTokens: 5000, capTokens: 3000 });
    const planned = p.areas.filter((a) => a.status === "planned");
    assert.ok(planned.reduce((s, a) => s + a.tokens, 0) <= 3000);
    const notReviewed = p.areas.filter((a) => a.status === "not reviewed");
    assert.ok(notReviewed.length > 0);
    assert.ok(notReviewed.every((a) => a.reason));
    const firstNot = p.areas.findIndex((a) => a.status === "not reviewed");
    assert.ok(p.areas.slice(firstNot).every((a) => a.status === "not reviewed"), "nothing is planned after the first miss");
  });
  test("every reviewable file is in exactly one area, an oversize list, or the held-back list", () => {
    const { map, plan: p } = plan({ areaTokens: 5000, capTokens: 1e9 });
    const inAreas = p.areas.flatMap((a) => a.files);
    assert.equal(new Set(inAreas).size, inAreas.length, "no file twice");
    const accounted = new Set([...inAreas, ...p.oversize.map((f) => f.path), ...p.held.map((h) => h.path)]);
    for (const f of map.files.filter((x) => x.status === "review")) assert.ok(accounted.has(f.path), `${f.path} is unaccounted for`);
  });
  test("a file bigger than an area is named as too large, not silently dropped", () => {
    const { plan: p } = plan({ areaTokens: 5000 });
    assert.deepEqual(p.oversize.map((f) => f.path), ["generated/page.html"]);
  });
  test("--scope marks the rest out of scope and plans only the scope", () => {
    const { plan: p } = plan({ areaTokens: 5000 }, { scopes: ["src/util"] });
    assert.deepEqual(p.areas.flatMap((a) => a.files).sort(), ["src/util/a.py", "src/util/b.py"]);
    assert.ok(p.outOfScope >= 5);
  });
});

describe("what never reaches a reviewer", () => {
  test("secret paths are in no area; a normal file with a secret in it is held back", () => {
    const { plan: p } = plan({ areaTokens: 5000, capTokens: 1e9 });
    const inAreas = p.areas.flatMap((a) => a.files);
    assert.ok(!inAreas.includes(".env") && !inAreas.includes("secrets/k.txt"));
    assert.ok(!inAreas.includes("src/leak.py"));
    assert.deepEqual(p.held, [{ path: "src/leak.py", patterns: ["AWS access key id"] }]);
    assert.equal(p.excluded, 2);
  });
  test("no generated record contains a planted secret value, or the name of a secret path in an area", () => {
    const { map, plan: p } = plan({ areaTokens: 5000, capTokens: 1e9 });
    writeRecords(p, map, out);
    const text = allText(out);
    assert.ok(!text.includes(KEY), "the key in the source file leaked into the records");
    assert.ok(!text.includes(ENVV), "the value in a secret path leaked into the records");
    const prompts = allText(join(out, "areas"));
    assert.ok(!prompts.includes(".env") && !prompts.includes("secrets/k.txt"), "a secret path is named in an area prompt");
    assert.match(text, /src\/leak\.py.*AWS access key id/);
  });
  test("the secret scan names a pattern, never the match, and finds the usual shapes", () => {
    assert.deepEqual(secretHits(`-----BEGIN RSA PRIVATE KEY-----`), ["private key block"]);
    assert.deepEqual(secretHits(`token = "ghp_${"a".repeat(36)}"`), ["GitHub token"]);
    assert.deepEqual(secretHits(`password = "correct-horse-battery"`), ["hard-coded password"]);
    assert.deepEqual(secretHits(`password = os.environ["PASSWORD"]`), []);
  });
});

describe("the records and the command line", () => {
  test("area prompts say read-only, name files and never fix; FINDINGS.md starts empty and is not overwritten", () => {
    const { map, plan: p } = plan({ areaTokens: 5000, capTokens: 1e9 });
    const dir = join(root, "records2");
    writeRecords(p, map, dir);
    const first = readdirSync(join(dir, "areas")).sort()[0];
    const prompt = readFileSync(join(dir, "areas", first), "utf8");
    assert.match(prompt, /read-only review copy/);
    assert.match(prompt, /\*\*Never fix\.\*\*/);
    assert.match(prompt, /Security Review/, "the first area is high risk");
    assert.equal(readFileSync(join(dir, "FINDINGS.md"), "utf8"), FINDINGS_HEADER);
    writeFileSync(join(dir, "FINDINGS.md"), FINDINGS_HEADER + "| F-01-1 | P1 | a.py:1 | x | y | me | open |\n");
    writeRecords(p, map, dir);
    assert.match(readFileSync(join(dir, "FINDINGS.md"), "utf8"), /F-01-1/);
  });
  test("a run on the repo changes nothing in it", () => {
    const before = g("status", "--porcelain");
    const head = g("rev-parse", "HEAD");
    execFileSync("node", [cli, repo, "--out", join(root, "records3"), "--area-tokens", "5000", "--date", "2026-10-30"]);
    assert.equal(g("status", "--porcelain"), before);
    assert.equal(g("rev-parse", "HEAD"), head);
    assert.ok(existsSync(join(root, "records3", "AREAS.md")));
  });
});
