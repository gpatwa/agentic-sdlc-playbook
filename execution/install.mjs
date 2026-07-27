#!/usr/bin/env node
// Installs the Agentic SDLC execution pack into a product repo.
// Usage: node <playbook>/execution/install.mjs <product-dir>
//
// - Generates .claude/agents/<role>.md from the playbook's agents/*.md briefs
//   (Claude Code subagent format: frontmatter + inlined brief + protocol pointers).
// - Copies commands + protocols into .claude/.
// - Writes CLAUDE.md (autonomous-run guide) and .claude/agentic.config.json.
// Dependency-free; Node 18+.

import {
  readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync,
} from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const playbookRoot = join(here, "..");
const packDir = join(here, "pack");

const args = process.argv.slice(2);
const greenfield = args.includes("--greenfield");
const productDir = args.find((a) => !a.startsWith("--"));
if (!productDir) {
  console.error("usage: node <playbook>/execution/install.mjs <product-dir> [--greenfield]");
  process.exit(1);
}

// A greenfield repo has no .agentic/ yet — discovery authors it. Chicken-and-egg:
// the pack can't install without it. --greenfield scaffolds explicit STUBS so the
// pack installs; discovery then replaces them. The stubs are deliberately empty
// placeholders, never plausible invented content — an invented SAFETY_INVARIANTS
// is worse than none, because downstream agents would trust it.
const AGENTIC_STUBS = {
  "PROJECT_CONTEXT.md": `# Project Context — TODO\n\n> **STUB — written by \`install.mjs --greenfield\`. Replace before delivery.**\n> The Market Researcher / PM stages own this: what the product is, who it\n> serves, and the moment they hit the problem. Do not leave as-is.\n`,
  "SAFETY_INVARIANTS.md": `# Safety Invariants — TODO (EMPTY)\n\n> **STUB — written by \`install.mjs --greenfield\`. This file lists NOTHING yet.**\n> An empty invariants file means nothing is protected: gates that check\n> invariants will find none to enforce. The Architect + Security stages must\n> fill this from the PRD/UX before any delivery stage runs.\n>\n> Each invariant: one line, testable, stated as what MUST hold across releases.\n`,
  "LOCAL_COMMANDS.md": `# Local Commands — TODO\n\n> **STUB — written by \`install.mjs --greenfield\`. Replace before delivery.**\n> The commands agents run to verify work: typecheck, test, build, qa gate,\n> start. Fill these in as the delivery stages create them.\n`,
  "CURRENT_MVP_STATUS.md": `# Current MVP Status — TODO\n\n> **STUB — written by \`install.mjs --greenfield\`. Replace as the slice lands.**\n> What exists today, what this slice adds, what is explicitly out of scope.\n`,
};

if (!existsSync(join(productDir, ".agentic"))) {
  if (!greenfield) {
    console.error(`! ${productDir} has no .agentic/ — is it a product repo?`);
    console.error(`  new/greenfield repo? re-run with --greenfield to scaffold stub .agentic/ files.`);
    process.exit(1);
  }
  mkdirSync(join(productDir, ".agentic"), { recursive: true });
  for (const [f, body] of Object.entries(AGENTIC_STUBS)) {
    writeFileSync(join(productDir, ".agentic", f), body);
  }
  console.log(`  scaffolded stub .agentic/ (${Object.keys(AGENTIC_STUBS).length} files) — discovery must replace them`);
}

// Roles that run commands (need Bash); everyone else is doc-only (least privilege).
const BASH_ROLES = new Set([
  "frontend-developer", "backend-architect", "ai-engineer", "ml-engineer",
  "qa-evidence", "security-privacy", "sre", "analytics-engineer",
]);

// Static model defaults per pack/protocols/MODEL_ROUTING.md layer 1.
// The Orchestrator overrides at spawn time for tier/failure escalation.
const MODEL_FOR_ROLE = {
  "software-architect": "opus",
  "security-privacy": "opus",
  "orchestrator": "opus",
};
const DEFAULT_MODEL = "sonnet";

const firstHeading = (md) => (md.match(/^#\s+(.+)$/m)?.[1] || "Agent").trim();
const mission = (md) => {
  const m = md.match(/##\s+Mission\s*\n+([\s\S]*?)(?:\n##\s|\n#\s|$)/);
  if (!m) return "";
  return m[1].trim().split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
};

const claudeDir = join(productDir, ".claude");
const outAgents = join(claudeDir, "agents");
mkdirSync(outAgents, { recursive: true });

const playbookRel = relative(productDir, playbookRoot) || ".";

let count = 0;
for (const file of readdirSync(join(playbookRoot, "agents")).filter((f) => f.endsWith(".md"))) {
  const slug = basename(file, ".md");
  const brief = readFileSync(join(playbookRoot, "agents", file), "utf8");
  const title = firstHeading(brief);
  const miss = mission(brief);
  const desc =
    (miss.length > 180 ? miss.slice(0, 177) + "..." : miss) ||
    `${title} for the Agentic SDLC.`;
  const tools = BASH_ROLES.has(slug)
    ? "Read, Write, Edit, Bash, Grep, Glob"
    : "Read, Write, Edit, Grep, Glob";
  const model = MODEL_FOR_ROLE[slug] ?? DEFAULT_MODEL;

  const out = `---
name: ${slug}
description: ${desc.replace(/\n/g, " ")}
tools: ${tools}
model: ${model}
---

You are the **${title}** in an autonomous Agentic SDLC run. Stay strictly in this role.

## Operating rules (execution pack)

- Read \`.agentic/\` (PROJECT_CONTEXT, SAFETY_INVARIANTS, LOCAL_COMMANDS, CURRENT_MVP_STATUS) before acting.
- Read your input artefact from \`runs/<slice-id>/\`. Write your output artefact there.
- **Write your artefact incrementally, section by section, as you go** — never buffer the whole document to one write at the end (\`.claude/protocols/RUN_ECONOMICS.md\`). If you are interrupted, what you finished must already be on disk.
- Work at the **depth the brief states** (smoke / standard / adversarial). Do not escalate rigor on your own initiative — match effort to what is actually at stake.
- **Your tool boundary is: ${tools}.** You have no others. If a task appears to need a tool outside that list, stop and hand back rather than working around it. When this brief is spawned from \`.claude/agents/\` the harness enforces this; when it is **inlined** into a general-purpose agent it cannot, so honor it yourself — the boundary is the role's, not the harness's.
- Update \`runs/<slice-id>/STATE.md\` per \`.claude/protocols/SLICE_STATE.md\` when you finish. Do not invent token/tool-call figures — the Orchestrator records telemetry from the harness.
- If your stage hits a human-approval action, STOP and follow \`.claude/protocols/APPROVAL_PROTOCOL.md\` — do not proceed on assumed approval.
- On a failed gate, follow \`.claude/protocols/FAILURE_LOOP.md\` (bounded retries, then escalate).
- Hand off only through artefacts. The full methodology lives in the playbook at \`${playbookRel}\`.

## Your role brief

${brief.trim()}
`;
  writeFileSync(join(outAgents, `${slug}.md`), out);
  count++;
}

const copyDir = (src, dst) => {
  mkdirSync(dst, { recursive: true });
  for (const f of readdirSync(src)) copyFileSync(join(src, f), join(dst, f));
};
copyDir(join(packDir, "commands"), join(claudeDir, "commands"));
copyDir(join(packDir, "protocols"), join(claudeDir, "protocols"));
copyDir(join(here, "hooks"), join(claudeDir, "hooks"));

// Wire the budget guard as a PreToolUse hook on Agent spawns, so
// RUN_ECONOMICS.md's pre-spawn check is mechanical, not a discipline the
// Orchestrator has to remember. Merge — never clobber existing settings.
const settingsPath = join(claudeDir, "settings.json");
const HOOK_CMD = "node .claude/hooks/budget-guard.mjs";
let settings = {};
if (existsSync(settingsPath)) {
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {
    console.log("  ! .claude/settings.json is not valid JSON — leaving it alone");
    settings = null;
  }
}
if (settings) {
  settings.hooks ??= {};
  settings.hooks.PreToolUse ??= [];
  const already = settings.hooks.PreToolUse.some((e) =>
    (e?.hooks ?? []).some((h) => h?.command === HOOK_CMD),
  );
  if (!already) {
    settings.hooks.PreToolUse.push({
      matcher: "Agent",
      hooks: [{ type: "command", command: HOOK_CMD, timeout: 10 }],
    });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  }
}

const claudeMd = readFileSync(join(packDir, "CLAUDE.md"), "utf8")
  .replaceAll("{{PLAYBOOK_PATH}}", playbookRel);
writeFileSync(join(productDir, "CLAUDE.md"), claudeMd);

writeFileSync(
  join(claudeDir, "agentic.config.json"),
  JSON.stringify(
    {
      packVersion: 2,
      playbookPath: playbookRel,
      generatedAt: new Date().toISOString(),
      agentCount: count,
      defaults: {
        stageWallClockMinutes: 20,
        retryCapPerStage: 2,
        sliceIterationCap: 6,
        modelClasses: { opus: "opus", sonnet: "sonnet", haiku: "haiku" },
      },
    },
    null, 2,
  ) + "\n",
);

console.log(`Installed Agentic SDLC execution pack into ${claudeDir}`);
console.log(`  agents generated : ${count}`);
console.log(`  commands         : ${readdirSync(join(claudeDir, "commands")).length}`);
console.log(`  protocols        : ${readdirSync(join(claudeDir, "protocols")).length}`);
console.log(`  playbook (rel)   : ${playbookRel}`);
