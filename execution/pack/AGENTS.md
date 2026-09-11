# Aveto — Autonomous Run Guide

This repo is wired to run **Aveto** with autonomous agents. The
methodology (roles, templates, gates, rules) lives in the playbook at:

> `{{PLAYBOOK_PATH}}`

This file is the **source of truth** for any tool that reads `AGENTS.md`
(Codex, Cursor, GitHub Copilot's coding agent, Windsurf, Amp, Aider, Gemini
CLI, Zed, Jules, Devin, Junie, and others). `CLAUDE.md` at the repo root
imports this file — see the note at the end.

## Non-negotiable rules

These hold regardless of which tool is driving the run.

1. **Human approval is a hard stop.** Any action in the playbook's
   `docs/HUMAN_APPROVAL_RULES.md` (send/submit, destructive shared-state,
   deploy, safety-control change, real model/client, new data processor)
   pauses the run. Surface the request, **wait** for an explicit human yes,
   record it. Never self-approve, never infer approval, never proceed on
   silence.
2. **Gates fail closed.** Walk `RELEASE_GATES.md` for the slice's tier. A
   failed gate sends the slice back, never forward.
3. **Retries are bounded.** Retry within budget, then escalate to the
   human. Never spin.
4. **State is durable.** Each slice tracks `runs/<slice-id>/STATE.md` so
   any session — cold, or on a different tool — can resume it.
5. **Hand off through artefacts**, not conversation. Keep context thin.
6. **Budget is checked before the spend, not after.** Before starting any
   stage, verify `spent + estimate ≤ budget`. Over budget → degrade the
   stage's depth, drop a non-load-bearing stage, or stop and ask the human
   with the numbers. Never raise the budget to fit the spend. Set each
   stage's depth (smoke / standard / adversarial) explicitly — `standard`
   is the default and `adversarial` is earned by stakes, not habit.

## Project context

Read `.agentic/` first, in order: `PROJECT_CONTEXT.md`,
`SAFETY_INVARIANTS.md`, `LOCAL_COMMANDS.md`, `CURRENT_MVP_STATUS.md`.

## How to run a slice

A session driving a slice acts as the **Orchestrator**: it reads
`.agentic/`, plans the slice, and delegates each stage to a role — one
narrow agent per stage, per the briefs in the playbook's `agents/`.

Regenerate the installed pack after the playbook changes:

```
node {{PLAYBOOK_PATH}}/execution/install.mjs .
```

## Claude Code specifics

Everything above is tool-agnostic. The mechanics below are not — they
describe how *this pack's Claude Code adapter* implements the rules above,
not a universal convention every tool sharing this file follows.

- **Entry points:** `/agentic-slice <ask>` to start, `/agentic-resume
  <slice-id>` to resume, `/agentic-status [slice-id]` to check.
- **Role dispatch:** each role runs as a generated Claude Code subagent in
  `.claude/agents/`, with least-privilege `tools:` frontmatter per role.
  **Run the Orchestrator from THIS repo, not from the playbook** — the
  subagents are only discoverable from *this* project's `.claude/agents/`.
  A session rooted elsewhere falls back to inlined briefs with **full
  tools**, silently losing the per-role restriction. If that happens,
  record in `STATE.md` that least-privilege was not enforced for the run.
- **Budget enforcement:** a pre-spawn hook (`.claude/hooks/`) checks the
  budget before every subagent spawn — see `RUN_ECONOMICS.md`.

A tool other than Claude Code driving this repo must honor the
non-negotiable rules above by its own means; nothing here assumes it has
subagents, hooks, or slash commands shaped like Claude Code's. See
`ADAPTERS.md` for the adapter contract this pack implements, and
`docs/BACKLOG.md` T12 for the open work restating that contract as
outcomes a second adapter could satisfy differently.
