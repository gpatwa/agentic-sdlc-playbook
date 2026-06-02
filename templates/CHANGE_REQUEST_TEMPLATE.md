# Change Request — <slice / release name>

> Owner: Release Manager
> Status: <submitted / approved / scheduled / implemented / closed>
> Release tier: <1 / 2 / 3>

The enterprise change-management (CAB) record for a release. Pairs with the
release checklist; this is the approval-and-schedule artefact an auditor or
on-call engineer can read after the fact.

## Change summary

What is changing, in operator terms (not feature-marketing terms).

## Change type

- [ ] **Standard** — pre-approved, low-risk, repeatable (no CAB needed).
- [ ] **Normal** — needs review + approval before the window.
- [ ] **Emergency** — expedited; approval recorded retroactively within
      <window>.

## Risk & tier

- Release tier: <1 / 2 / 3 — per `docs/RELEASE_GATES.md`>
- Risk if it fails: <description>
- Affected systems / tenants: <list>

## Implementation plan

- Steps (or link to runbook / migration plan): <pointer>
- Estimated duration: <time>
- Maintenance window: <date/time + timezone, or "rolling / no downtime">

## Rollback plan

- Trigger to roll back: <condition>
- Steps (or link): <pointer to migration plan rollback / runbook>
- Tested? <yes — when / no → blocker for Tier 3>

## Validation

- How success is confirmed post-change: <checks, SLO watch window>
- Who watches, and for how long: <owner + duration>

## Approvals

| Role | Name | Decision | Time (UTC) |
|------|------|----------|------------|
| Release Manager | <name> | <approve/deny> | <ts> |
| Compliance approver (if applicable) | <name> | <approve/deny> | <ts> |
| Human owner (Tier 3 per `docs/HUMAN_APPROVAL_RULES.md`) | <name> | <approve/deny> | <ts> |

## Communications

- Who is notified before / after: <stakeholders, status page, customers>

## Hand off

To the engineer (execution) and Post-Launch (the record closes after the
validation window).
