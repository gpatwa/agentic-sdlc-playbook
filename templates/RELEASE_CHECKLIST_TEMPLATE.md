# Release Checklist — <slice name>

> Owner: Release Manager Agent
> Tier: <1 / 2 / 3>
> Source artefacts: PRD, feature spec, UX spec, tech spec, QA evidence,
> security review (link / paste paths)

## Tier classification rationale

One paragraph. Why this slice is Tier <n> per `docs/RELEASE_GATES.md`.

## Gates

Walk every gate from `docs/RELEASE_GATES.md` for the chosen tier. Mark
each.

### Implementation

- [ ] Typecheck passed
- [ ] Targeted tests passed
- [ ] Full test suite passed
- [ ] Build passed
- [ ] One commit per task
- [ ] No new lint warnings (`git diff --check`)

### QA

- [ ] UI verified in preview where observable
- [ ] Local regression command passed (`<command>`)
- [ ] Safety invariants verified

### Security

- [ ] No secrets / credentials in diff
- [ ] No PII / sensitive data logged
- [ ] Audit events cover state changes
- [ ] Adapter boundary placeholder still throws

### Tier 3 only

- [ ] Human approval obtained per `docs/HUMAN_APPROVAL_RULES.md`
- [ ] Approval recorded: <who, when, exact request, exact response>
- [ ] Dry-run passed on fixture
- [ ] Audit event coverage manually verified
- [ ] Post-launch monitoring plan exists (below)

### Skipped gates

| Gate | Reason for skip | Approved by |
|------|-----------------|-------------|
| <gate> | <reason> | <agent or human> |

A skipped gate without a reason is a release blocker.

## Rollback plan

Lifted from the tech spec, confirmed against the actual diff:

1. <step>
2. <step>

## Post-launch monitoring (Tier 3)

- Signal to watch: <metric / event>
- Threshold for concern: <value>
- Owner: Post-Launch Learning Agent

## Decision

- [ ] **Go** — slice lands now.
- [ ] **No-go** — return to <agent> with the failing gate(s) listed above.

## Hand off

If go: to Post-Launch Learning Agent (after the slice has produced any
observable signal).
If no-go: to Engineering Manager with the failing gates.
