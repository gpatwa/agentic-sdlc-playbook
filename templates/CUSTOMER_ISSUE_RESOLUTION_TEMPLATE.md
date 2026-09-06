# Customer Issue Resolution — <issue id>

> Owner: Customer Support Agent (+ On-Call Engineer Agent if escalated)
> Status: <triaging / escalated / resolved-pending-approval / sent>
> Opened: <ISO date>

## Issue

- Reported by: <account/user — scoped; never another customer's data>
- What they asked: <verbatim or close paraphrase>
- Category: <account/how-to / bug / incident>

## Triage

- [ ] Answerable directly from account/product context
- [ ] Escalated to On-Call Engineer Agent — technical issue

## Root cause (if escalated)

- Investigated by: On-Call Engineer Agent
- Signals correlated: <logs / metrics / traces / deploy history checked>
- Root cause: <finding>
- Confidence: <high / medium / low> — <why>

## Resolution

- Type: <direct answer / infra governed action / code fix (slice: `<slice-id>`)>
- If a code fix: link to the slice's own artefacts (`runs/<slice-id>/`) —
  this template does not duplicate that record.
- If an infra governed action: <what ran, pre-authorized under which
  runbook step, or gated per `HUMAN_APPROVAL_RULES.md`>

## Drafted reply

> <the exact text that would be sent>

Cites: <the real fix/answer this draft is based on — never a placeholder>

## Approval — verify + send (combined gate, per HUMAN_APPROVAL_RULES.md)

| Requested | Verified by | Decision | Sent text (if edited) | When (UTC) |
|-----------|-------------|----------|------------------------|------------|
| <what and why> | <human> | <approved / denied> | <diff from draft, if any> | <ts> |

## Post-merge verification (code fixes only)

- Monitored for: <window>
- Result: <held / regressed>
- If regressed: rollback plan executed from
  `runs/<slice-id>/02-architecture.md` § Rollback plan; revert audit
  event: <link>

## Learning signal

- Draft vs. sent diff, or root-cause correction: <what changed, and why
  — candidate for a Skill update>

## Hand off

- Sent reply + diff → Customer Success (aggregate theme tracking).
- Incident closed → SRE (postmortem, if one was declared).
