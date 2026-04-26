# Release Gates

A gate is a binary check that MUST pass before a slice of work moves
forward. Gates are owned by specific agents; the Release Manager confirms
all of them have passed before approving a release.

Gates are deliberately strict. If a gate fails, the failure is the signal
— do not "work around" it.

---

## Gate map by stage

| Stage | Gate | Owner | How it's checked |
|-------|------|-------|------------------|
| Scope | Slice fits in one implementation pass | EM | EM scope review |
| Scope | Non-goals are explicit | EM | Tech spec section present |
| Discovery | Success criteria are observable | PM | PRD review |
| Architecture | Adapter boundaries identified | Architect | Tech spec |
| Architecture | Audit / feedback / usage events listed | Architect | Tech spec |
| Implementation | Typecheck passes | Engineer | `npm run typecheck` (or pack equivalent) |
| Implementation | Targeted tests pass | Engineer | `npx vitest run <file>` (or equivalent) |
| Implementation | Full test suite passes | Engineer | `npm test` |
| Implementation | Build passes | Engineer | `npm run build` |
| Implementation | One commit per task | Engineer | git log review |
| Implementation | No new lint warnings | Engineer | `git diff --check` (or pack equivalent) |
| QA | UI verified in preview where observable | QA | Preview screenshots / snapshots |
| QA | Local regression command passes | QA | `npm run qa:mvp` (or pack equivalent) |
| QA | Safety invariants verified | QA | `.agentic/SAFETY_INVARIANTS.md` checklist |
| Security | No secrets / credentials in diff | Security | Diff review + grep |
| Security | No PII / sensitive data logged | Security | Diff review |
| Security | Audit events cover state changes | Security | Tech spec ↔ diff cross-check |
| Security | Adapter boundary placeholder still throws | Security | Test re-run |
| Release | Human approval points satisfied | Release Mgr | `docs/HUMAN_APPROVAL_RULES.md` |
| Release | Rollback plan exists | Release Mgr | Tech spec section |
| Release | Release checklist filled | Release Mgr | `templates/RELEASE_CHECKLIST_TEMPLATE.md` |

---

## Three release tiers

Not every change carries the same risk. The Release Manager picks the tier
based on what the slice changes.

### Tier 1: Local-only / docs / refactors

Examples: docs change, internal refactor, test-only addition.

- Implementation gates required.
- QA gates: skip preview if no UI change.
- Security gates: still run secrets/PII scan.
- Release gates: light checklist (no rollback plan needed for a doc).

### Tier 2: Behavioural change with no external effect

Examples: new UI feature, new service, internal data model change.

- All implementation, QA, and security gates.
- Release checklist required.
- Rollback plan required.

### Tier 3: External-effect change

Examples: change to anything that sends, submits, posts, publishes, pushes,
deploys, or destroys; change that touches an integration with a third
party; change that alters auth/permissions.

- Tier 2 gates plus:
- Explicit human approval per `docs/HUMAN_APPROVAL_RULES.md`.
- Dry-run on a fixture before live.
- Audit event coverage manually verified.
- Post-launch monitoring plan.

---

## Failure modes the gates exist to prevent

These are the patterns that have caused real problems before. The gates
above each map back to one of these:

- **Silent regression.** A change passes typecheck but breaks a test that
  wasn't run because nobody ran the full suite.
- **Approval bypass.** An automated path quietly gains a way to send
  something the user didn't authorise.
- **Silent LLM call.** A placeholder adapter gets replaced with a real
  client and tests start hitting the network without anyone noticing.
- **Logged secrets.** A debug log statement captures a credential,
  user-content blob, or PII field.
- **Hidden state change.** A migration or a settings save runs without an
  audit event, so the user can't see what happened.
- **Token budget blow-up.** A slice that was supposed to be one task
  expands mid-work and the agent runs out of context.

---

## How to use this list

When the Release Manager reviews a slice, they walk this list top to
bottom and tick off each gate. A skipped gate gets a written reason
recorded in the release checklist. A failed gate sends the slice back to
the owning stage — never forward.
