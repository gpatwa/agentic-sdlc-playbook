// The write-scope guard FAILS CLOSED by design: it is a safety gate, the
// opposite of budget-guard. So this suite has to prove two things with equal
// weight — that a scoped role can still do its real job (write its artefacts
// and the few files it owns), and that every way around the scope is denied,
// including the ones an agent would reach for: traversal, absolute paths,
// symlinks, and a payload the guard cannot read.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, symlinkSync, realpathSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const guard = join(here, "..", "hooks", "write-scope-guard.mjs");

let n = 0;
const repo = () => {
  const dir = join(tmpdir(), `write-scope-${process.pid}-${n++}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "runs", "slice-a"), { recursive: true });
  mkdirSync(join(dir, "src"), { recursive: true });
  mkdirSync(join(dir, ".agentic"), { recursive: true });
  return realpathSync(dir);
};

// Runs the hook as Claude Code would; returns "allow" or "deny".
const run = (dir, role, payload, { raw } = {}) => {
  const args = role === null ? [guard] : [guard, role];
  const input = raw ?? JSON.stringify({ cwd: dir, hook_event_name: "PreToolUse", tool_name: "Write", ...payload });
  const out = execFileSync("node", args, {
    cwd: dir, input, encoding: "utf8", stdio: "pipe",
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  });
  if (!out.trim()) return "allow";
  return JSON.parse(out).hookSpecificOutput?.permissionDecision === "deny" ? "deny" : "allow";
};
const write = (file_path) => ({ tool_input: { file_path, content: "x" } });

describe("a scoped role can still do its job", () => {
  test("Architect writes its tech spec under runs/ (relative path)", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", write("runs/slice-a/02-architecture.md")), "allow");
  });
  test("an absolute path inside runs/ is allowed", () => {
    const d = repo();
    assert.equal(run(d, "product-manager", write(join(d, "runs", "slice-a", "prd.md"))), "allow");
  });
  test("a new slice directory that does not exist yet is allowed", () => {
    const d = repo();
    assert.equal(run(d, "orchestrator", write("runs/new-slice/intent.md")), "allow");
  });
  test("Architect may fill SAFETY_INVARIANTS, the file it owns", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", write(".agentic/SAFETY_INVARIANTS.md")), "allow");
  });
  test("PM and Market Researcher may write PROJECT_CONTEXT", () => {
    const d = repo();
    assert.equal(run(d, "product-manager", write(".agentic/PROJECT_CONTEXT.md")), "allow");
    assert.equal(run(d, "market-researcher", write(".agentic/PROJECT_CONTEXT.md")), "allow");
  });
  test("Cloud Deployment may write its plan and azd-layout IaC", () => {
    const d = repo();
    for (const p of [".azure/deployment-plan.md", "infra/main.bicep", "azure.yaml"]) {
      assert.equal(run(d, "cloud-deployment", write(p)), "allow", p);
    }
  });
  test("Edit is scoped the same way as Write", () => {
    const d = repo();
    const edit = { tool_name: "Edit", tool_input: { file_path: "runs/slice-a/STATE.md", old_string: "a", new_string: "b" } };
    assert.equal(run(d, "release-manager", edit), "allow");
  });
});

describe("product docs have owners", () => {
  test("the Architect keeps the living architecture doc and its decision records", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", write("docs/ARCHITECTURE.md")), "allow");
    assert.equal(run(d, "software-architect", write("docs/adr/0001-python-fastapi.md")), "allow");
  });
  test("the Architect still cannot write other docs or the README", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", write("docs/DEPLOY.md")), "deny");
    assert.equal(run(d, "software-architect", write("README.md")), "deny");
  });
  test("the Tech Writer applies docs, not just drafts them", () => {
    const d = repo();
    for (const p of ["README.md", "CHANGELOG.md", "docs/DEPLOY.md", "docs/runbooks/escalation.md"]) {
      assert.equal(run(d, "tech-writer", write(p)), "allow", p);
    }
  });
  test("the Tech Writer cannot rewrite the Architect's record inside docs/", () => {
    const d = repo();
    assert.equal(run(d, "tech-writer", write("docs/ARCHITECTURE.md")), "deny");
    assert.equal(run(d, "tech-writer", write("docs/adr/0001-x.md")), "deny");
  });
  test("the Tech Writer still cannot touch code", () => {
    const d = repo();
    assert.equal(run(d, "tech-writer", write("src/app.py")), "deny");
  });
});

describe("the product is out of scope", () => {
  test("Architect cannot edit source — the case plan mode exists for", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", write("src/app.js")), "deny");
  });
  test("Edit on source is denied, not just Write", () => {
    const d = repo();
    const edit = { tool_name: "Edit", tool_input: { file_path: "src/app.js", old_string: "a", new_string: "b" } };
    assert.equal(run(d, "software-architect", edit), "deny");
  });
  test("ownership is per file: Architect cannot rewrite PROJECT_CONTEXT", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", write(".agentic/PROJECT_CONTEXT.md")), "deny");
  });
  test("ownership is per file: PM cannot weaken SAFETY_INVARIANTS", () => {
    const d = repo();
    assert.equal(run(d, "product-manager", write(".agentic/SAFETY_INVARIANTS.md")), "deny");
  });
  test("a role with no named ownership gets runs/ only", () => {
    const d = repo();
    assert.equal(run(d, "release-manager", write(".agentic/CURRENT_MVP_STATUS.md")), "deny");
    assert.equal(run(d, "release-manager", write("README.md")), "deny");
  });
  test("an unknown role is scoped to runs/, not left open", () => {
    const d = repo();
    assert.equal(run(d, "brand-new-role", write("runs/slice-a/x.md")), "allow");
    assert.equal(run(d, "brand-new-role", write("src/x.js")), "deny");
  });
});

describe("the ways around it are closed", () => {
  test("../ traversal out of runs/ is denied", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", write("runs/../src/app.js")), "deny");
    assert.equal(run(d, "software-architect", write("runs/slice-a/../../src/app.js")), "deny");
  });
  test("a sibling that only shares the prefix is denied", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", write("runs-evil/app.js")), "deny");
    assert.equal(run(d, "software-architect", write("runs")), "deny");
  });
  test("an absolute path outside the project is denied", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", write(join(tmpdir(), "elsewhere.md"))), "deny");
  });
  test("an outside-project write says why, not just that it was blocked", () => {
    // The allowlist alone would deny this path too; what the explicit check buys
    // is a reason the agent can act on instead of a generic out-of-scope message.
    const d = repo();
    const out = execFileSync("node", [guard, "software-architect"], {
      cwd: d, encoding: "utf8", stdio: "pipe",
      input: JSON.stringify({ cwd: d, tool_name: "Write", tool_input: { file_path: "../elsewhere.md" } }),
      env: { ...process.env, CLAUDE_PROJECT_DIR: d },
    });
    assert.match(JSON.parse(out).hookSpecificOutput.permissionDecisionReason, /outside the project/);
  });
  test("a symlink inside runs/ pointing at src/ cannot be written through", () => {
    const d = repo();
    symlinkSync(join(d, "src"), join(d, "runs", "escape"));
    assert.equal(run(d, "software-architect", write("runs/escape/app.js")), "deny");
  });
  test("writing the project root itself is denied", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", write(d)), "deny");
  });
});

describe("it fails closed", () => {
  test("no role argument denies — a misconfigured hook must not allow", () => {
    const d = repo();
    assert.equal(run(d, null, write("runs/slice-a/x.md")), "deny");
  });
  test("an unreadable payload denies", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", null, { raw: "{not json" }), "deny");
  });
  test("a write that names no path denies", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", { tool_input: { content: "x" } }), "deny");
  });
  test("a non-string path denies", () => {
    const d = repo();
    assert.equal(run(d, "software-architect", { tool_input: { file_path: 42 } }), "deny");
  });
});
