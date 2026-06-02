# Migration Plan — <slice name>

> Owner: Backend Architect (with Data Governance for data classification)
> Status: <draft / approved / executed>
> Source tech spec: <path>

## Change summary

One paragraph: what schema or data is changing and why.

## Migration type

- [ ] **Additive only** (new table / nullable column / new index) — low risk.
- [ ] **Backfill** (populates existing rows) — medium risk.
- [ ] **Destructive** (drops / renames / type-narrows / deletes data) —
      requires human approval per `docs/HUMAN_APPROVAL_RULES.md` rule 2.

## Forward steps

Ordered, each independently runnable:

1. <step>
2. <step>

## Rollback steps

How to get back to the prior state. If a step is irreversible (data
destroyed), say so explicitly — that is the trigger for human approval.

1. <step>
2. <step>

## Zero-downtime strategy

For a live service, prefer expand / contract:

- **Expand:** add the new shape, write to both, read from old.
- **Migrate:** backfill + switch reads to new.
- **Contract:** stop writing old, remove it in a later slice.

State which phase this slice covers. Don't expand and contract in one slice
if the service can't tolerate it.

## Backfill

- **Volume:** <rows affected>
- **Method:** <batched / online / offline>
- **Throttle / batch size:** <to avoid load spikes>
- **Resumable?** <yes / no>

## Validation

- Pre-migration check: <invariant that must hold before>
- Post-migration check: <invariant that must hold after — row counts,
  referential integrity, spot query>

## Blast radius

- Tables / services affected: <list>
- Worst case if it goes wrong: <description>
- Audit event emitted for the migration? <yes — required for destructive>

## Approvals

- [ ] Backend Architect
- [ ] Data Governance (classification + retention preserved)
- [ ] Human (required if any step is destructive / irreversible)

## Hand off

To the engineer (execution) and the Release Manager (gate). Destructive
migrations are a Tier 3 release.
