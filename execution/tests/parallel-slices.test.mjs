// T42 O4: what happens when two slices run at once in two git worktrees of one project (plain Claude Code worktrees, not any
// other tool). Real `git worktree add`; the pack's real hook scripts driven with simulated hook payloads. This does NOT start a
// Claude Code session, so it proves what the scripts do with the inputs the harness is documented to send, not that the harness
// sends them. The two gaps this test first pinned as KNOWN GAP were closed in pack v33 (pick-intent reads every worktree's runs/;
// write-scope-guard binds a session to its own worktree) and the assertions were flipped on purpose. See docs/PARALLEL_SLICES.md.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const X = join(dirname(fileURLToPath(import.meta.url)), "..");
const g = (d, ...a) => execFileSync("git", ["-C", d, ...a], { encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
const state = (budget, spent, status = "in-progress") => `# S\n\n- **Status:** ${status}\n- **Budget:** ${budget}k tokens\n- **Spent:** ${spent}k\n`;
const hook = (script, args, payload, env = {}) => spawnSync("node", [join(X, "hooks", script), ...args], { input: JSON.stringify(payload), encoding: "utf8", env: { ...process.env, ...env } });
const pick = (dir) => spawnSync("node", [join(X, "pick-intent.mjs"), dir], { encoding: "utf8" });

let main, wa, wb;
before(() => {
  main = mkdtempSync(join(tmpdir(), "parallel-"));
  g(main, "init", "-q", "-b", "main");
  mkdirSync(join(main, "intents/ready"), { recursive: true });
  writeFileSync(join(main, "intents/ready/one.md"), "# one\n"); writeFileSync(join(main, "intents/ready/two.md"), "# two\n"); writeFileSync(join(main, ".gitignore"), ".claude/worktrees/\n");
  g(main, "add", "."); g(main, "commit", "-qm", "init");
  for (const w of ["a", "b"]) g(main, "worktree", "add", "-q", join(main, ".claude/worktrees", w), "-b", `slice-${w}`);
  wa = join(main, ".claude/worktrees/a"); wb = join(main, ".claude/worktrees/b");
  mkdirSync(join(wa, "runs/slice-a"), { recursive: true }); writeFileSync(join(wa, "runs/slice-a/STATE.md"), state(400, 500));
  mkdirSync(join(wb, "runs/slice-b"), { recursive: true }); writeFileSync(join(wb, "runs/slice-b/STATE.md"), state(400, 100));
});
after(() => rmSync(main, { recursive: true, force: true }));

describe("two slices in two worktrees", () => {
  test("budget: each session is judged by its own slice; the over-budget one asks, the healthy one is not blocked", () => {
    const a = hook("budget-guard.mjs", [], { cwd: wa, tool_name: "Agent", tool_input: {} }, { CLAUDE_PROJECT_DIR: main });
    const b = hook("budget-guard.mjs", [], { cwd: wb, tool_name: "Agent", tool_input: {} }, { CLAUDE_PROJECT_DIR: main });
    assert.match(a.stdout, /"permissionDecision":"ask"/); assert.match(a.stdout, /slice-a/);
    assert.equal(b.stdout.trim(), "", "B's spawn is allowed with no question");
  });

  test("events: each session writes its own chained file and both verify", () => {
    for (const [sid, cwd] of [["sess-a", wa], ["sess-b", wb]]) for (let i = 0; i < 3; i++) hook("event-log.mjs", ["pre"], { session_id: sid, cwd, tool_name: "Read", tool_input: { file_path: join(cwd, "README") }, tool_use_id: `t${i}` }, { CLAUDE_PROJECT_DIR: main });
    assert.deepEqual(readdirSync(join(main, ".claude/events")).sort(), ["sess-a.jsonl", "sess-b.jsonl"]);
    for (const s of ["sess-a", "sess-b"]) {
      const v = spawnSync("node", [join(X, "events-verify.mjs"), join(main, ".claude/events", `${s}.jsonl`)], { encoding: "utf8" });
      assert.equal(v.status, 0, v.stdout + v.stderr); assert.match(v.stdout, /chain intact/);
    }
  });

  const scope = (projectDir, cwd, file) => hook("write-scope-guard.mjs", ["software-architect"], { cwd, tool_name: "Write", tool_input: { file_path: file } }, { CLAUDE_PROJECT_DIR: projectDir });
  const denied = (r) => /"permissionDecision":"deny"|"decision":"block"|deny/.test(r.stdout);

  test("write scope: a session may write its own worktree's runs/", () => {
    assert.ok(!denied(scope(main, wa, join(wa, "runs/slice-a/x.md"))));
  });

  test("write scope (was KNOWN GAP): with CLAUDE_PROJECT_DIR set to the main checkout, a session in worktree A may NOT write into worktree B's runs/", () => {
    const r = scope(main, wa, join(wb, "runs/slice-b/x.md"));
    assert.ok(denied(r)); assert.match(r.stdout, /worktree \\"a\\"/); assert.match(r.stdout, /worktree \\"b\\"/);
  });

  test("write scope: with CLAUDE_PROJECT_DIR = main, A still writes its own worktree's runs/, also from a subdirectory", () => {
    assert.ok(!denied(scope(main, wa, join(wa, "runs/slice-a/x.md"))));
    mkdirSync(join(wa, "src"), { recursive: true });
    assert.ok(!denied(scope(main, join(wa, "src"), join(wa, "runs/slice-a/y.md"))));
  });

  test("write scope: a session in the main checkout owns no worktree, so it may not write into one either", () => {
    const r = scope(main, main, join(wa, "runs/slice-a/x.md"));
    assert.ok(denied(r)); assert.match(r.stdout, /no worktree/);
    assert.ok(!denied(scope(main, main, join(main, "runs/slice-main/x.md"))), "its own runs/ is still fine");
  });

  test("write scope: the worktree's own product code stays out of scope", () => {
    assert.ok(denied(scope(main, wa, join(wa, "src/x.js"))));
  });

  test("write scope: with CLAUDE_PROJECT_DIR set to the session's own worktree, another worktree is outside the project and denied", () => {
    assert.ok(denied(scope(wa, wa, join(wb, "runs/slice-b/x.md"))));
  });

  test("pick-intent: a worktree that has its own open run is told so", () => {
    const r = pick(wa);
    assert.equal(r.status, 3); assert.match(r.stdout, /slice-a/);
  });

  test("pick-intent (was KNOWN GAP): while A is open, main and a fresh worktree B are both told a run is open, and where", () => {
    rmSync(join(wb, "runs"), { recursive: true, force: true });           // B has no run yet
    const fromMain = pick(main), fromB = pick(wb);
    assert.equal(fromMain.status, 3); assert.equal(fromB.status, 3);
    assert.match(fromMain.stdout, /slice-a \(in \.claude\/worktrees\/a\)/);
    assert.match(fromB.stdout, /slice-a/);
  });

  test("pick-intent: once A is done, the next pick skips an intent that already has a run folder in another worktree", () => {
    writeFileSync(join(wa, "runs/slice-a/STATE.md"), state(400, 500, "done"));
    mkdirSync(join(wa, "runs/one"), { recursive: true }); writeFileSync(join(wa, "runs/one/STATE.md"), state(400, 10, "done"));
    const fromMain = pick(main), fromB = pick(wb);
    assert.equal(fromMain.status, 0); assert.equal(fromB.status, 0);
    assert.match(fromMain.stdout, /intents\/ready\/two\.md/); assert.match(fromB.stdout, /intents\/ready\/two\.md/);
  });
});
