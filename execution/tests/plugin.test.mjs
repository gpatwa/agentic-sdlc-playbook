// The plugin is what an installer runs on their own machine, so these tests check what it must not do: ship hooks, drift from
// the scripts it copies, let user text into a shell quote, or touch the repository it assesses.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { build, manifest, marketplace, packVersion, PLUGIN_DIR } from "../build-plugin.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const skills = readdirSync(join(PLUGIN_DIR, "skills"));

describe("the plugin", () => {
  test("the committed copy matches what a build would write (no drift from execution/)", () => {
    assert.deepEqual(build({ check: true }), []);
  });
  test("manifest: name aveto, version equals PACK_VERSION, nothing duplicated in the marketplace entry", () => {
    const m = JSON.parse(readFileSync(join(PLUGIN_DIR, ".claude-plugin", "plugin.json"), "utf8"));
    assert.equal(m.name, "aveto");
    assert.equal(m.version, String(packVersion()));
    assert.ok(!("version" in marketplace().plugins[0]), "the docs say not to set version in both places");
    assert.equal(marketplace().plugins[0].source, "./plugin/aveto");
    assert.deepEqual(manifest(), m);
  });
  test("ships no hooks, no MCP servers, no agents: skills only", () => {
    for (const p of ["hooks", "hooks.json", ".mcp.json", "agents", "bin"]) assert.ok(!existsSync(join(PLUGIN_DIR, p)), `${p} must not exist`);
    assert.ok(!("hooks" in manifest()) && !("mcpServers" in manifest()));
  });
  test("every skill is user-invoked only, names its script by the plugin path, and keeps user text out of shell quotes", () => {
    assert.deepEqual(skills.sort(), ["assess", "judge", "reassess"]);
    for (const s of skills) {
      const text = readFileSync(join(PLUGIN_DIR, "skills", s, "SKILL.md"), "utf8");
      assert.match(text, /^---\nname: /, `${s} has frontmatter`);
      assert.match(text, /disable-model-invocation: true/, `${s} must not be started by the model`);
      assert.match(text, /\$\{CLAUDE_PLUGIN_ROOT\}\/execution\/assess-/, `${s} runs a shipped script by plugin path`);
      assert.ok(!/\$ARGUMENTS/.test(text), `${s} must not interpolate $ARGUMENTS (the S5 incident)`);
      const commands = [...text.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1]).join("\n");
      assert.ok(commands.length > 0, `${s} has a command block`);
      assert.ok(!/['"][^'"\n]*<[a-z-]+>[^'"\n]*['"]/.test(commands.replace(/"\$\{CLAUDE_PLUGIN_ROOT\}[^"]*"/g, "")), `${s}: no user placeholder inside quotes in a command`);
    }
  });
  test("the assess skill refuses to send private code anywhere without approval, and never says certified", () => {
    const t = readFileSync(join(PLUGIN_DIR, "skills", "assess", "SKILL.md"), "utf8");
    assert.match(t, /private or not the user's own, stop and ask/);
    assert.match(t, /never certifies|does not certify/);
  });
  test("claude plugin validate --strict passes on the plugin (skipped if the claude CLI is absent)", (t) => {
    const r = spawnSync("claude", ["plugin", "validate", PLUGIN_DIR, "--strict"], { encoding: "utf8" });
    if (r.error) return t.skip("claude CLI not installed");
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });
});

describe("the shipped scripts run from inside the plugin and change nothing", () => {
  test("assess-run --dry-run from the plugin path plans a fixture repo and leaves it untouched", () => {
    const base = join(tmpdir(), `plugin-run-${process.pid}`);
    rmSync(base, { recursive: true, force: true });
    const repo = join(base, "target"); mkdirSync(join(repo, "src"), { recursive: true });
    const g = (...a) => execFileSync("git", ["-C", repo, "-c", "user.name=A", "-c", "user.email=a@x", ...a], { encoding: "utf8" });
    g("init", "-q", "-b", "main"); writeFileSync(join(repo, "src", "a.py"), "x = 1\n"); g("add", "-A"); g("commit", "-q", "-m", "init");
    const before = g("status", "--porcelain") + g("rev-parse", "HEAD");
    const out = execFileSync("node", [join(PLUGIN_DIR, "execution", "assess-run.mjs"), repo, "--reviewer", "codex", "--scratch", join(base, "s"), "--dry-run"], { encoding: "utf8" });
    assert.match(out, /dry run: \d+ area/);
    assert.equal(g("status", "--porcelain") + g("rev-parse", "HEAD"), before);
    rmSync(base, { recursive: true, force: true });
  });
  test("the judge finds its prompt template inside the plugin", () => {
    assert.ok(existsSync(join(PLUGIN_DIR, "templates", "FINDING_JUDGE_PROMPT.md")));
  });
});
