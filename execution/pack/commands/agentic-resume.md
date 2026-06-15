---
description: Resume an in-flight Agentic SDLC slice from its STATE.md.
argument-hint: <slice-id>
---

Resume the slice `$ARGUMENTS`.

1. Read `runs/$ARGUMENTS/STATE.md`.
2. If `Status: blocked-on-approval`, check whether the human has now
   answered. If yes, record it per `.claude/protocols/APPROVAL_PROTOCOL.md`
   and continue. If not, re-surface the pending `APPROVAL_REQUEST` and stop.
3. If `Status: blocked-on-failure`, read the latest `ESCALATION-*.md`; only
   proceed if the human has provided the unblocking decision.
4. Otherwise execute the `Next action` line: delegate to the owning role
   subagent for the `Current stage`, honoring the gates and protocols.
5. Update `STATE.md` as you go.

Do not restart completed stages. Trust the artefacts already in
`runs/$ARGUMENTS/`.
