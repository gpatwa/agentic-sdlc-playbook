# Agentic SDLC — Autonomous Run Guide

This repo is wired to run the **Agentic SDLC** with autonomous agents. The
methodology (roles, templates, gates, rules) lives in the playbook at:

> `{{PLAYBOOK_PATH}}`

## How to run a slice

- Start: `/agentic-slice <one-line ask>`
- Resume: `/agentic-resume <slice-id>`
- Status: `/agentic-status [slice-id]`

A session driving a slice acts as the **Orchestrator**: it reads
`.agentic/`, plans the slice, and delegates each stage to the role
subagents in `.claude/agents/` (generated from the playbook briefs).

## Non-negotiable rules

1. **Human approval is a hard stop.** Any action in the playbook's
   `docs/HUMAN_APPROVAL_RULES.md` (send/submit, destructive shared-state,
   deploy, safety-control change, real model/client, new data processor)
   pauses the run. Follow `.claude/protocols/APPROVAL_PROTOCOL.md`: surface
   the request, **wait** for an explicit human yes, record it. Never
   self-approve, never infer approval, never proceed on silence.
2. **Gates fail closed.** Walk `RELEASE_GATES.md` for the slice's tier. A
   failed gate sends the slice back, never forward.
3. **Retries are bounded.** Follow `.claude/protocols/FAILURE_LOOP.md` —
   retry within budget, then escalate to the human. Never spin.
4. **State is durable.** Each slice tracks `runs/<slice-id>/STATE.md`
   (`.claude/protocols/SLICE_STATE.md`) so any session can resume cold.
5. **Hand off through artefacts**, not conversation. Keep context thin.
6. **Budget is checked before the spend, not after.** Before spawning any
   stage, verify `spent + estimate ≤ budget` per
   `.claude/protocols/RUN_ECONOMICS.md`. Over budget → degrade the stage's
   depth, drop a non-load-bearing stage, or stop and ask the human with the
   numbers. Never raise the budget to fit the spend. Set each stage's depth
   (smoke / standard / adversarial) explicitly in its brief — `standard` is
   the default and `adversarial` is earned by stakes, not habit.

## Project context

Every agent reads `.agentic/` first: `PROJECT_CONTEXT.md`,
`SAFETY_INVARIANTS.md`, `LOCAL_COMMANDS.md`, `CURRENT_MVP_STATUS.md`.

## Regenerating the pack

The subagents in `.claude/agents/` are generated from the playbook briefs.
After the playbook changes, re-run:

```
node {{PLAYBOOK_PATH}}/execution/install.mjs .
```
