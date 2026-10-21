// The generator produces every product repo's agent definitions, including the
// least-privilege `tools:` frontmatter. A silent regression here is a SECURITY
// regression in every repo the pack is installed into, so these assertions are
// about the contract in ADAPTERS.md — not about implementation detail.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const playbook = join(here, "..", "..");
const installer = join(playbook, "execution", "install.mjs");
const briefsDir = join(playbook, "agents");

let target;

const install = (args = []) =>
  execFileSync("node", [installer, target, ...args], { encoding: "utf8", cwd: playbook });

const agentPath = (slug) => join(target, ".claude", "agents", `${slug}.md`);
const frontmatter = (slug) => {
  const text = readFileSync(agentPath(slug), "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(m, `${slug}: no frontmatter block`);
  return Object.fromEntries(
    m[1].split("\n").map((l) => {
      const i = l.indexOf(":");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
  );
};
const toolsOf = (slug) => frontmatter(slug).tools.split(",").map((s) => s.trim());

before(() => {
  target = join(tmpdir(), `agentic-install-test-${process.pid}`);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(join(target, ".agentic"), { recursive: true });
  for (const f of ["PROJECT_CONTEXT.md", "SAFETY_INVARIANTS.md", "LOCAL_COMMANDS.md", "CURRENT_MVP_STATUS.md"]) {
    writeFileSync(join(target, ".agentic", f), `# ${f}\n`);
  }
  install();
});

after(() => rmSync(target, { recursive: true, force: true }));

describe("install.mjs — agent generation", () => {
  test("emits exactly one agent per brief", () => {
    const briefs = readdirSync(briefsDir).filter((f) => f.endsWith(".md"));
    const agents = readdirSync(join(target, ".claude", "agents")).filter((f) => f.endsWith(".md"));
    assert.equal(agents.length, briefs.length);
    assert.deepEqual(agents.sort(), briefs.sort());
  });

  test("every agent carries the four required frontmatter fields", () => {
    for (const f of readdirSync(join(target, ".claude", "agents"))) {
      const fm = frontmatter(f.replace(/\.md$/, ""));
      for (const key of ["name", "description", "tools", "model"]) {
        assert.ok(fm[key], `${f}: missing ${key}`);
      }
    }
  });

  test("name always matches the filename slug", () => {
    for (const f of readdirSync(join(target, ".claude", "agents"))) {
      const slug = f.replace(/\.md$/, "");
      assert.equal(frontmatter(slug).name, slug);
    }
  });
});

// The security-relevant half. Bash is the tool that turns a compromised or
// confused agent into arbitrary code execution, so which roles get it is the
// single most important thing this generator decides.
describe("install.mjs — least privilege", () => {
  const EXPECT_BASH = [
    "frontend-developer", "backend-architect", "ai-engineer", "ml-engineer",
    "qa-evidence", "security-privacy", "sre", "analytics-engineer",
  ];

  test("only the roles that need Bash have Bash", () => {
    const withBash = readdirSync(join(target, ".claude", "agents"))
      .map((f) => f.replace(/\.md$/, ""))
      .filter((slug) => toolsOf(slug).includes("Bash"))
      .sort();
    assert.deepEqual(withBash, [...EXPECT_BASH].sort());
  });

  test("no agent is granted a tool outside the allowed set", () => {
    const ALLOWED = new Set(["Read", "Write", "Edit", "Bash", "Grep", "Glob"]);
    for (const f of readdirSync(join(target, ".claude", "agents"))) {
      const slug = f.replace(/\.md$/, "");
      for (const t of toolsOf(slug)) {
        assert.ok(ALLOWED.has(t), `${slug}: unexpected tool "${t}"`);
      }
    }
  });

  test("no agent inherits full tools by omitting the field", () => {
    for (const f of readdirSync(join(target, ".claude", "agents"))) {
      const raw = readFileSync(agentPath(f.replace(/\.md$/, "")), "utf8");
      assert.match(raw, /^tools:\s*\S/m, `${f}: tools must be explicit, never omitted`);
    }
  });

  // Withholding Bash left every non-building role free to Edit src/. The
  // write-scope guard is the boundary for those roles; losing it on one role
  // would be as silent as granting that role Bash.
  test("every role without Bash carries the write-scope guard, naming itself", () => {
    for (const f of readdirSync(join(target, ".claude", "agents"))) {
      const slug = f.replace(/\.md$/, "");
      if (EXPECT_BASH.includes(slug)) continue;
      const raw = readFileSync(agentPath(slug), "utf8");
      const fm = raw.split(/^---$/m)[1];
      assert.match(fm, /matcher: "Write\|Edit\|MultiEdit\|NotebookEdit"/, `${slug}: guard not on Write/Edit`);
      assert.match(fm, new RegExp(`write-scope-guard\\.mjs" ${slug}'$`, "m"), `${slug}: guard must name its own role`);
    }
  });

  // The budget hook parses STATE.md's Status and Budget lines. A Scope Review
  // that rewrote them into prose took its slice out of the guard; every role
  // that updates STATE.md must be told the format is load-bearing.
  test("every role is told STATE.md's Status and Budget lines keep their format", () => {
    for (const f of readdirSync(join(target, ".claude", "agents"))) {
      const raw = readFileSync(agentPath(f.replace(/\.md$/, "")), "utf8");
      assert.match(raw, /Keep `Status` to one of its four values/, f);
    }
  });

  test("Bash roles are not scoped — Bash could write around a Write hook", () => {
    for (const slug of EXPECT_BASH) {
      assert.doesNotMatch(readFileSync(agentPath(slug), "utf8"), /write-scope-guard/, slug);
    }
  });

  test("the write-scope guard script is installed", () => {
    assert.ok(existsSync(join(target, ".claude", "hooks", "write-scope-guard.mjs")));
  });
});

describe("install.mjs — model and effort routing", () => {
  const OPUS = ["software-architect", "security-privacy", "orchestrator"];
  const HIGH_EFFORT = [
    "software-architect", "security-privacy", "orchestrator", "qa-evidence",
    "release-manager", "compliance-reviewer", "ai-governance", "data-governance",
  ];

  test("opus is reserved for the judgment-heavy roles", () => {
    const opus = readdirSync(join(target, ".claude", "agents"))
      .map((f) => f.replace(/\.md$/, ""))
      .filter((slug) => frontmatter(slug).model === "opus")
      .sort();
    assert.deepEqual(opus, [...OPUS].sort());
  });

  test("every agent declares an effort level", () => {
    for (const f of readdirSync(join(target, ".claude", "agents"))) {
      const fm = frontmatter(f.replace(/\.md$/, ""));
      assert.ok(["low", "medium", "high", "xhigh", "max"].includes(fm.effort), `${f}: effort=${fm.effort}`);
    }
  });

  test("high effort goes to the gates and nowhere else", () => {
    const high = readdirSync(join(target, ".claude", "agents"))
      .map((f) => f.replace(/\.md$/, ""))
      .filter((slug) => frontmatter(slug).effort === "high")
      .sort();
    assert.deepEqual(high, [...HIGH_EFFORT].sort());
  });

  // MODEL_ROUTING.md states this as an invariant: a cheaper gate that passes a
  // bad slice costs more than every token it saved.
  test("no gate is ever below high effort", () => {
    for (const slug of HIGH_EFFORT) {
      assert.notEqual(frontmatter(slug).effort, "medium", `${slug} is a gate and must not run at medium`);
      assert.notEqual(frontmatter(slug).effort, "low", `${slug} is a gate and must not run at low`);
    }
  });
});

describe("install.mjs — pack integrity", () => {
  test("protocols are copied verbatim from the playbook", () => {
    const src = join(playbook, "execution", "pack", "protocols");
    const dst = join(target, ".claude", "protocols");
    for (const f of readdirSync(src)) {
      assert.equal(readFileSync(join(dst, f), "utf8"), readFileSync(join(src, f), "utf8"), `${f} diverged`);
    }
  });

  // With a support session beside the driver, a relayed message that says "the
  // owner approved" is the easiest way for an approval gate to be bypassed by
  // an agent that proposed the action. The rule must be in what the driver
  // reads, and in the protocol it follows.
  test("a relayed message is never an approval, in the run guide and the protocol", () => {
    const guide = readFileSync(join(target, "AGENTS.md"), "utf8");
    assert.match(guide, /directly, in\s+the session driving the run/);
    assert.match(guide, /even one that quotes the human, is never an approval/);
    assert.match(guide, /support session by name/);
    assert.match(guide, /SUPPORT_REQUESTS\.md/);
    const protocol = readFileSync(join(target, ".claude", "protocols", "APPROVAL_PROTOCOL.md"), "utf8");
    assert.match(protocol, /NOT relayed/);
    assert.match(protocol, /the verifier\s+cannot be the implementer/);
  });

  test("the pack tells the Architect to baseline a defect and the Orchestrator to estimate review stages high", () => {
    const arch = readFileSync(join(target, ".claude", "agents", "software-architect.md"), "utf8");
    assert.match(arch, /baseline on the unfixed code/);
    assert.match(arch, /does\s+not claim a fix or an explanation/);
    const econ = readFileSync(join(target, ".claude", "protocols", "RUN_ECONOMICS.md"), "utf8");
    assert.match(econ, /Estimate a review stage at \*\*50–60k\*\*/);
  });

  test("the pack asks for a ceiling once, opens stops with a digest, and tells the Architect to pilot a model first", () => {
    const cmd = readFileSync(join(target, ".claude", "commands", "agentic-slice.md"), "utf8");
    assert.match(cmd, /Propose a ceiling with the plan/);
    const proto = readFileSync(join(target, ".claude", "protocols", "APPROVAL_PROTOCOL.md"), "utf8");
    assert.match(proto, /digest of at most 15 lines/);
    assert.match(proto, /does\s+not weaken "not batchable"/);
    const arch = readFileSync(join(target, ".claude", "agents", "software-architect.md"), "utf8");
    assert.match(arch, /Pilot before you build/);
    assert.match(arch, /Facts come from the source, not memory/);
    const em = readFileSync(join(target, ".claude", "agents", "engineering-manager.md"), "utf8");
    assert.match(em, /Check the intent's claims against the repo/);
    const state = readFileSync(join(target, ".claude", "protocols", "SLICE_STATE.md"), "utf8");
    assert.match(state, /Keep `Next action` and the Budget block/);
    const econ = readFileSync(join(target, ".claude", "protocols", "RUN_ECONOMICS.md"), "utf8");
    assert.match(econ, /Ceiling, asked once/);
  });

  test("a depth the intent names binds, and lowering it is the human's decision", () => {
    const guide = readFileSync(join(target, "AGENTS.md"), "utf8");
    assert.match(guide, /A depth\s+the intent names binds/);
    const econ = readFileSync(join(target, ".claude", "protocols", "RUN_ECONOMICS.md"), "utf8");
    assert.match(econ, /A depth the intent names binds/);
    assert.match(econ, /stop-and-ask/);
    const cmd = readFileSync(join(target, ".claude", "commands", "agentic-slice.md"), "utf8");
    assert.match(cmd, /Carry any depth the intent names into the plan as written/);
  });

  test("a session request is desktop-app only, checks its folder first, and the plan lists prerequisites", () => {
    const req = readFileSync(join(target, ".claude", "protocols", "SESSION_REQUEST.md"), "utf8");
    assert.match(req, /desktop app only/);
    assert.match(req, /print its working directory and stop if it is\s+not the folder/);
    assert.match(req, /Never include a `claude` command line/);
    assert.match(req, /It\s+approves nothing/);
    // the template itself must not carry a runnable terminal command line
    const fences = req.match(/```[\s\S]*?```/g) || [];
    for (const f of fences) assert.doesNotMatch(f, /\bclaude\s+["'-]/);
    const cmd = readFileSync(join(target, ".claude", "commands", "agentic-slice.md"), "utf8");
    assert.match(cmd, /\*\*Prerequisites\*\* table/);
    assert.match(cmd, /`fresh-load`/);
    assert.match(cmd, /SESSION_REQUEST\.md/);
  });

  test("a stop sends a push notice that is not an approval", () => {
    const proto = readFileSync(join(target, ".claude", "protocols", "APPROVAL_PROTOCOL.md"), "utf8");
    assert.match(proto, /Send a push notification/);
    assert.match(proto, /The\s+notice is not an approval and not a relay of one/);
  });

  test("pack v20: a run under an approved Charter asks nothing for covered actions and ends with a review", () => {
    const proto = readFileSync(join(target, ".claude", "protocols", "APPROVAL_PROTOCOL.md"), "utf8");
    assert.match(proto, /A run under a Charter/);
    assert.match(proto, /approved \*\*that file by its sha256\*\*/);
    assert.match(proto, /Never widen a line by reading it generously/);
    assert.match(proto, /raising its own hard cap, an\s+agent handling a credential, lowering a depth it fixes/);
    assert.match(proto, /END_REVIEW\.md/);
    const cmd = readFileSync(join(target, ".claude", "commands", "agentic-slice.md"), "utf8");
    assert.match(cmd, /\*\*setup phase\*\*/);
    assert.match(cmd, /charter-check\.mjs/);
    assert.match(cmd, /A gated stage never changes a\s+definition it then has to reload/);
    const state = readFileSync(join(target, ".claude", "protocols", "SLICE_STATE.md"), "utf8");
    assert.match(state, /\*\*Charter:\*\*/);
  });

  test("pack v20: one session runs the slice, and --teams turns on agent teams for this repo only", () => {
    const cmd = readFileSync(join(target, ".claude", "commands", "agentic-slice.md"), "utf8");
    assert.match(cmd, /\*\*One session runs the slice\.\*\*/);
    assert.match(cmd, /\*\*never\*\* a human approval/);
    assert.match(cmd, /Never ask the human to open a session\s+during a Charter run/);
    assert.match(cmd, /charter-check-output\.txt/);
    assert.match(cmd, /C6\.P permission rules/);
    assert.match(cmd, /local `\/code-review` skill at `high` effort/);
    assert.match(cmd, /use `--fix`: findings go to the role that wrote the code/);
    assert.match(cmd, /a prompt\s+that appears anyway is a Charter miss/);
    const rm = readFileSync(join(target, ".claude", "agents", "release-manager.md"), "utf8");
    assert.match(rm, /\*\*Under a Charter \(Process v2\)\.\*\*/);
    assert.match(rm, /A missing or mismatched output file is a\s+NO-GO you report/);
    assert.match(rm, /Read `code-review\.md` too/);
    const plain = JSON.parse(readFileSync(join(target, ".claude", "settings.json"), "utf8"));
    assert.equal(plain.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS, undefined);
    const t2 = join(tmpdir(), `aveto-teams-${process.pid}-${Date.now()}`);
    mkdirSync(join(t2, ".agentic"), { recursive: true });
    for (const f of ["PROJECT_CONTEXT.md", "SAFETY_INVARIANTS.md", "LOCAL_COMMANDS.md", "CURRENT_MVP_STATUS.md"]) writeFileSync(join(t2, ".agentic", f), "# x\n");
    execFileSync("node", [join(here, "..", "install.mjs"), t2, "--teams"], { stdio: "pipe" });
    const withTeams = JSON.parse(readFileSync(join(t2, ".claude", "settings.json"), "utf8"));
    assert.equal(withTeams.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS, "1");
    assert.match(JSON.stringify(withTeams), /budget-guard/);
    rmSync(t2, { recursive: true, force: true });
  });

  test("pack v23: the code review layer: tiers from the diff, bounded rounds, a REVIEW.md starter that is never overwritten", () => {
    const proto = readFileSync(join(target, ".claude", "protocols", "CODE_REVIEW.md"), "utf8");
    assert.match(proto, /Risk tier, set by the change/);
    assert.match(proto, /At most \*\*three\*\* review-and-fix rounds/);
    assert.match(proto, /"0 findings\." is a complete, valid first line/);
    assert.match(proto, /It never approves a change on a person's behalf/);
    assert.match(proto, /Never its `--fix`/);
    const review = readFileSync(join(target, "REVIEW.md"), "utf8");
    assert.match(review, /Start with the count of findings/);
    writeFileSync(join(target, "REVIEW.md"), "# mine\n");
    execFileSync("node", [join(here, "..", "install.mjs"), target], { stdio: "pipe" });
    assert.equal(readFileSync(join(target, "REVIEW.md"), "utf8"), "# mine\n");
    const cmd = readFileSync(join(target, ".claude", "commands", "agentic-slice.md"), "utf8");
    assert.match(cmd, /\.claude\/protocols\/CODE_REVIEW\.md/);
    const rm = readFileSync(join(target, ".claude", "agents", "release-manager.md"), "utf8");
    assert.match(rm, /Re-derive the risk tier from the diff yourself/);
  });

  test("the review evals are well-formed cases from real incidents", async () => {
    const { readFileSync: rf } = await import("node:fs");
    const raw = rf(join(here, "..", "..", "docs", "review-evals", "cases.toml"), "utf8");
    const ids = [...raw.matchAll(/^id = "([^"]+)"/gm)].map((m) => m[1]);
    assert.ok(ids.length >= 5);
    assert.equal(new Set(ids).size, ids.length);
    for (const key of ["source", "severity", "file", "change", "must_find"]) assert.equal([...raw.matchAll(new RegExp(`^${key} = `, "gm"))].length, ids.length, key);
  });

  test("pack v24: Charter permission rules go to the gitignored local file; shortcuts outside the repo; time recorded; review ratios", () => {
    const cmd = readFileSync(join(target, ".claude", "commands", "agentic-slice.md"), "utf8");
    assert.match(cmd, /`\.claude\/settings\.local\.json` \(gitignored;\s+never the\s+tracked `\.claude\/settings\.json`/);
    assert.match(cmd, /questions asked of the human after the\s+Charter/);
    const sr = readFileSync(join(target, ".claude", "protocols", "SESSION_REQUEST.md"), "utf8");
    assert.match(sr, /in the repo's parent folder, never inside the repo/);
    const ap = readFileSync(join(target, ".claude", "protocols", "APPROVAL_PROTOCOL.md"), "utf8");
    assert.match(ap, /\*\*Record the time\.\*\*/);
    const rm = readFileSync(join(target, ".claude", "agents", "release-manager.md"), "utf8");
    assert.match(rm, /no allow rule from the Charter's C6\.P is in a tracked settings file/);
    const econ = readFileSync(join(target, ".claude", "protocols", "RUN_ECONOMICS.md"), "utf8");
    assert.match(econ, /Review stages run about 1\.5 to 3 times their estimate/);
  });

  test("pack v26: every role says what it does, which agent or gate checks it, and where the human decides", () => {
    const dir = join(target, ".claude", "agents");
    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    assert.equal(files.length, 28);
    for (const f of files) {
      const body = readFileSync(join(dir, f), "utf8");
      const sec = body.split("## Delegate, check, own")[1]?.split("\n## ")[0];
      assert.ok(sec, `${f}: no Delegate, check, own section`);
      const line = (label) => (sec.match(new RegExp(`\\*\\*${label}:\\*\\* (.+)`)) || [])[1] || "";
      assert.ok(line("The agent does"), `${f}: no "The agent does"`);
      const checked = line("Checked by");
      assert.ok(checked, `${f}: no "Checked by"`);
      assert.doesNotMatch(checked, /\b(human|owner|person|operator)\b/i, `${f}: "Checked by" names a person`);
      const owns = line("The human owns");
      assert.match(owns, /Charter|END_REVIEW\.md/, `${f}: "The human owns" must point to the Charter or END_REVIEW.md`);
    }
  });

  test("pack v26: new tests fail first on the base commit; generated tests pass a filter", () => {
    const qa = readFileSync(join(target, ".claude", "agents", "qa-evidence.md"), "utf8");
    assert.match(qa, /check out\s+the base commit/);
    assert.match(qa, /passes three\s+consecutive runs/);
    for (const f of ["backend-architect.md", "frontend-developer.md"]) {
      assert.match(readFileSync(join(target, ".claude", "agents", f), "utf8"), /Every new test fails first/);
    }
  });

  test("pack v25: reproduction column, END_REVIEW headings, unconfirmed rule, effort and rescore lines", () => {
    const cr = readFileSync(join(target, ".claude", "protocols", "CODE_REVIEW.md"), "utf8");
    assert.match(cr, /how to reproduce \| disposition/);
    assert.match(cr, /model \*\*or effort level\*\* changes/);
    const ap = readFileSync(join(target, ".claude", "protocols", "APPROVAL_PROTOCOL.md"), "utf8");
    assert.match(ap, /\*\*Blocked on me\*\*.*\*\*Changed\*\*, \*\*Found\*\*/s);
    const ag = readFileSync(join(target, "AGENTS.md"), "utf8");
    assert.match(ag, /Mark what you could not confirm, and say where you looked/);
    assert.equal(JSON.parse(readFileSync(join(target, ".claude", "agentic.config.json"), "utf8")).packVersion, 26);
  });

  test("the budget guard is installed and wired into settings", () => {
    assert.ok(existsSync(join(target, ".claude", "hooks", "budget-guard.mjs")));
    const settings = JSON.parse(readFileSync(join(target, ".claude", "settings.json"), "utf8"));
    assert.match(JSON.stringify(settings), /budget-guard/);
  });

  test("the budget guard is invoked via $CLAUDE_PROJECT_DIR, not a cwd-relative path", () => {
    const cmds = JSON.parse(readFileSync(join(target, ".claude", "settings.json"), "utf8"))
      .hooks.PreToolUse.flatMap((e) => e.hooks.map((h) => h.command))
      .filter((c) => c.includes("budget-guard"));
    assert.deepEqual(cmds, ['node "$CLAUDE_PROJECT_DIR/.claude/hooks/budget-guard.mjs"']);
  });

  test("an older install's cwd-relative guard is upgraded in place, not duplicated", () => {
    const p = join(target, ".claude", "settings.json");
    const s = JSON.parse(readFileSync(p, "utf8"));
    s.hooks.PreToolUse = [{ matcher: "Agent", hooks: [{ type: "command", command: "node .claude/hooks/budget-guard.mjs", timeout: 10 }] }];
    writeFileSync(p, JSON.stringify(s, null, 2));
    install();
    const cmds = JSON.parse(readFileSync(p, "utf8")).hooks.PreToolUse
      .flatMap((e) => e.hooks.map((h) => h.command)).filter((c) => c.includes("budget-guard"));
    assert.deepEqual(cmds, ['node "$CLAUDE_PROJECT_DIR/.claude/hooks/budget-guard.mjs"']);
  });

  test("worktrees and local settings are gitignored, once, without clobbering the file", () => {
    const p = join(target, ".gitignore");
    writeFileSync(p, "node_modules/");
    install();
    install();
    const lines = readFileSync(p, "utf8").split("\n");
    assert.ok(lines.includes("node_modules/"), "existing entries kept");
    assert.equal(lines.filter((l) => l === ".claude/worktrees/").length, 1);
    assert.equal(lines.filter((l) => l === ".claude/settings.local.json").length, 1);
  });

  test("re-running is idempotent", () => {
    const snapshot = (d) =>
      readdirSync(d).sort().map((f) => `${f}:${readFileSync(join(d, f), "utf8")}`).join("\n");
    const before = snapshot(join(target, ".claude", "agents"));
    const settingsBefore = readFileSync(join(target, ".claude", "settings.json"), "utf8");
    install();
    assert.equal(snapshot(join(target, ".claude", "agents")), before);
    assert.equal(readFileSync(join(target, ".claude", "settings.json"), "utf8"), settingsBefore);
  });

  test("warns when asked to install into a linked git worktree", () => {
    const root = join(tmpdir(), `agentic-wt-${process.pid}`);
    rmSync(root, { recursive: true, force: true });
    const main = join(root, "main");
    mkdirSync(join(main, ".agentic"), { recursive: true });
    writeFileSync(join(main, ".agentic", "PROJECT_CONTEXT.md"), "x\n");
    const git = (...a) => execFileSync("git", ["-C", main, "-c", "user.name=t", "-c", "user.email=t@t", ...a], { stdio: "pipe" });
    git("init", "-q");
    git("add", "-A");
    git("commit", "-q", "-m", "init");
    const wt = join(root, "wt");
    git("worktree", "add", "-q", wt, "-b", "side");
    const fromMain = execFileSync("node", [installer, main], { encoding: "utf8", cwd: playbook });
    const fromWorktree = execFileSync("node", [installer, wt], { encoding: "utf8", cwd: playbook });
    assert.doesNotMatch(fromMain, /linked git worktree/);
    assert.match(fromWorktree, /linked git worktree/);
    rmSync(root, { recursive: true, force: true });
  });

  test("refuses a repo with no .agentic/ rather than inventing one", () => {
    const bare = join(tmpdir(), `agentic-bare-${process.pid}`);
    rmSync(bare, { recursive: true, force: true });
    mkdirSync(bare, { recursive: true });
    assert.throws(() => execFileSync("node", [installer, bare], { encoding: "utf8", stdio: "pipe" }));
    assert.equal(existsSync(join(bare, ".claude", "agents")), false);
    rmSync(bare, { recursive: true, force: true });
  });
});

// packVersion was written and never read for the pack's whole life, so a
// product repo could drift arbitrarily far from the playbook driving it with
// nothing to notice. Drift that reports nothing is the kind that survives.
describe("install.mjs — pack drift detection", () => {
  const configOf = () => JSON.parse(readFileSync(join(target, ".claude", "agentic.config.json"), "utf8"));

  test("records a pack version", () => {
    assert.ok(Number.isFinite(configOf().packVersion));
  });

  test("says nothing when the installed pack is already current", () => {
    const out = install();
    assert.doesNotMatch(out, /pack (upgraded|DOWNGRADED)/);
  });

  test("reports an upgrade when the installed pack is older", () => {
    const cfg = configOf();
    writeFileSync(
      join(target, ".claude", "agentic.config.json"),
      JSON.stringify({ ...cfg, packVersion: cfg.packVersion - 1 }, null, 2),
    );
    const out = install();
    assert.match(out, /pack upgraded/);
    assert.match(out, /Re-read \.claude\/agents/);
  });

  test("warns loudly when the playbook is older than the installed pack", () => {
    const cfg = configOf();
    writeFileSync(
      join(target, ".claude", "agentic.config.json"),
      JSON.stringify({ ...cfg, packVersion: cfg.packVersion + 5 }, null, 2),
    );
    const out = install();
    assert.match(out, /DOWNGRADED/);
    assert.match(out, /OLDER than the installed pack/);
  });

  test("a corrupt config does not break the install", () => {
    writeFileSync(join(target, ".claude", "agentic.config.json"), "{ not json");
    assert.doesNotThrow(() => install());
    assert.ok(Number.isFinite(configOf().packVersion));
  });
});
