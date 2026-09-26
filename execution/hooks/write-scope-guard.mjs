#!/usr/bin/env node
// Write-scope guard — PreToolUse hook on Write / Edit for the roles that plan,
// specify and review but do not build. Dependency-free.
//
// Those roles get Read/Write/Edit/Grep/Glob and no Bash. Withholding Bash was
// the only boundary: nothing stopped an Architect from editing src/, which is
// the exact failure plan mode exists to prevent — and plan mode cannot do it
// here, because a parent session in auto mode overrides a subagent's
// permissionMode (see docs/BACKLOG.md T21). This hook scopes where such a role
// may write: its slice artefacts under runs/, plus the few repo files the role
// is named as owning.
//
// FAILS CLOSED, DELIBERATELY. This is a safety gate, not a cost control — the
// opposite of budget-guard.mjs. Missing role, unreadable payload, no target
// path, a path outside the project: every one of those denies. A role with no
// entry in EXTRA gets runs/ and nothing else — so a newly added role is scoped
// to its artefacts by default, not left open.
//
// The role comes from argv, written by install.mjs into each agent's own
// frontmatter — never from the payload, which the agent could influence.
//
// usage:  node .claude/hooks/write-scope-guard.mjs <role>
// stdin:  Claude Code PreToolUse payload (JSON)
// stdout: hook JSON — a deny with a reason, or nothing (= allow)
import { readFileSync, realpathSync, existsSync } from "node:fs";
import { resolve, relative, dirname, isAbsolute, sep } from "node:path";

// Every scoped role may write its own slice artefacts.
const COMMON = ["runs/"];

// Repo files a role is named as owning. Sources: the .agentic/ stubs in
// install.mjs (Market Researcher / PM own PROJECT_CONTEXT; the Architect fills
// SAFETY_INVARIANTS), agents/cloud-deployment.md's outputs (.azure/ plan,
// generated IaC in azd's layout), and the product docs a repo others adopt
// needs: the Architect keeps docs/ARCHITECTURE.md and the decision records in
// docs/adr/; the Tech Writer applies README, CHANGELOG and the rest of docs/.
// A trailing "/" is a directory prefix; anything else is an exact file.
const EXTRA = {
  "market-researcher": [".agentic/PROJECT_CONTEXT.md"],
  "product-manager": [".agentic/PROJECT_CONTEXT.md"],
  "software-architect": [".agentic/SAFETY_INVARIANTS.md", "docs/ARCHITECTURE.md", "docs/adr/"],
  "tech-writer": ["README.md", "CHANGELOG.md", "docs/"],
  "cloud-deployment": [".azure/", "infra/", "azure.yaml"],
};

// Carve-outs inside an allowed prefix, where another role owns the file. The
// Tech Writer applies docs, but the architecture record and its decisions are
// the Architect's — the same per-file ownership that stops the PM rewriting
// SAFETY_INVARIANTS.
const EXCLUDE = {
  "tech-writer": ["docs/ARCHITECTURE.md", "docs/adr/"],
};

const deny = (reason) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
};

// Resolve symlinks on the deepest part of the path that exists, so a link
// inside runs/ pointing at src/ cannot be used to write outside the scope.
const canonical = (p) => {
  let head = p;
  const tail = [];
  while (!existsSync(head)) {
    const parent = dirname(head);
    if (parent === head) return p;
    tail.unshift(head.slice(parent.length + 1));
    head = parent;
  }
  return [realpathSync.native(head), ...tail].join(sep);
};

const role = process.argv[2];

try {
  if (!role) deny("write-scope-guard: no role given. The hook is misconfigured — reinstall the pack (node <playbook>/execution/install.mjs).");

  const payload = JSON.parse(readFileSync(0, "utf8") || "{}");
  const input = payload.tool_input ?? {};
  const target = input.file_path ?? input.notebook_path;
  if (!target || typeof target !== "string") {
    deny(`write-scope-guard: ${payload.tool_name ?? "write"} call names no file path, so its scope cannot be checked.`);
  }

  const root = canonical(resolve(process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd()));
  const abs = canonical(isAbsolute(target) ? target : resolve(payload.cwd || root, target));
  const rel = relative(root, abs).split(sep).join("/");

  if (!rel || rel.startsWith("../") || rel === ".." || isAbsolute(rel)) {
    deny(`write-scope-guard: ${role} may not write outside the project (${target}).`);
  }

  const matches = (a) => (a.endsWith("/") ? rel.startsWith(a) : rel === a);
  const allowed = [...COMMON, ...(EXTRA[role] ?? [])];
  const excluded = (EXCLUDE[role] ?? []).find(matches);
  if (excluded) {
    deny(`write-scope-guard: "${rel}" is owned by another role, not ${role}. Describe the change in your artefact and hand it to its owner.`);
  }
  if (allowed.some(matches)) process.exit(0);

  deny(
    `write-scope-guard: ${role} writes its artefacts, not the product. ` +
    `"${rel}" is outside its scope (${allowed.join(", ")}). ` +
    `If this change is needed, describe it in your artefact under runs/<slice-id>/ ` +
    `and hand off to the role that builds it — do not work around this block.`,
  );
} catch (e) {
  deny(`write-scope-guard: could not evaluate this write (${e?.message ?? e}). Failing closed.`);
}
