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

  test("the budget guard is installed and wired into settings", () => {
    assert.ok(existsSync(join(target, ".claude", "hooks", "budget-guard.mjs")));
    const settings = JSON.parse(readFileSync(join(target, ".claude", "settings.json"), "utf8"));
    assert.match(JSON.stringify(settings), /budget-guard/);
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
