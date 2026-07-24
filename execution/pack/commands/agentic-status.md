---
description: Summarize the state of Agentic SDLC slices in this repo.
argument-hint: "[slice-id]"
---

Report slice status.

- If `$ARGUMENTS` names a slice, read `runs/$ARGUMENTS/STATE.md` and print:
  the ask, current stage, status, any PENDING approval, any open failure
  escalation, and the next action.
- If no argument, print `runs/INDEX.md` — the fleet view, per
  `.claude/protocols/RUN_INVENTORY.md`. If it's missing or stale, rebuild it
  from every `runs/*/STATE.md` (slice-id · tier · status · stage).

Flag loudly any slice that is `blocked-on-approval` (waiting on the human)
or `blocked-on-failure` (needs a human decision). Read-only — do not change
any state.
