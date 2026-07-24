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

## Enterprise & governance gates

These gates apply when the corresponding overlay role is enabled (see the
overlay section of `docs/AGENTIC_SDLC.md` and
`project-packs/enterprise-saas-future.md`). The Release Manager confirms
the ones that apply to the slice before go/no-go.

| Gate | Owner | How it's checked |
|------|-------|------------------|
| New data classified + retention set | Data Governance | `templates/DATA_GOVERNANCE_REVIEW_TEMPLATE.md` |
| Catalog / RoPA updated for new data flows | Data Governance | catalog diff |
| Schema / data migration has a plan + rollback | Backend Architect + Data Governance | `templates/MIGRATION_PLAN_TEMPLATE.md` |
| Threat model for new attack surface | Security & Privacy | `templates/THREAT_MODEL_TEMPLATE.md` |
| Controls mapped + evidence; named approver | Compliance Reviewer | `templates/COMPLIANCE_REVIEW_TEMPLATE.md` |
| New subprocessor risk-assessed + DPA in place | Compliance Reviewer | `templates/VENDOR_RISK_TEMPLATE.md` |
| AI capability risk-tiered; obligations met | AI Governance | `templates/AI_RISK_ASSESSMENT_TEMPLATE.md` |
| Eval coverage for AI safety invariants | AI Governance | eval suite ↔ invariants |
| Cost-per-action estimated; kill-switch tested | FinOps | `templates/COST_BUDGET_TEMPLATE.md` |
| Docs match shipped behaviour; migration notes | Tech Writer | `templates/DOC_DELTA_TEMPLATE.md` |
| SLOs + runbook + tested rollback (production service) | SRE | runbook + rollback drill |
| Change request recorded + approved (CAB) | Release Manager | `templates/CHANGE_REQUEST_TEMPLATE.md` |

A gate that doesn't apply to the slice is marked "n/a" with a one-line
reason in the release checklist — the same discipline as the core gates.

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
- In enterprise contexts: every applicable enterprise & governance gate
  above, plus a recorded, approved change request
  (`templates/CHANGE_REQUEST_TEMPLATE.md`) with a named approver.

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

## Enforcing gates in CI (gates as code)

The gates above are only as strong as their enforcement. Running them by
hand — or trusting an agent to — is the honor-system baseline. To make them
binding, run them as **required status checks** in CI:

- Each mechanical gate becomes a CI step (typecheck, tests, build, the local
  regression command). A red step blocks the merge.
- Branch protection on the default branch requires the check to pass before
  merge — this is what turns a gate from convention into a wall.
- The Release Manager then confirms the green check on the merge commit
  instead of re-running the gates by hand.

Reference implementation: the CI workflow in the `stash-seed` reference app
(`.github/workflows/ci.yml`) runs each gate as a discrete step. The gates
that need judgment — compliance approver, human approval per
`docs/HUMAN_APPROVAL_RULES.md` — stay human-verified. CI enforces the
mechanical gates; it does not replace the judgment ones.

**Deploy-half gates** (for a service with a runtime surface):

- **Post-deploy smoke** — after a deploy, an automated check runs against
  the *running* service and re-asserts the safety invariants, not just
  liveness. A green health check with a red safety check still fails.
- **Rollback drill executed** — the rollback path is run, not assumed: a
  bad build is caught by the smoke and rolled back. Required before a
  service is exposed. Reference: `stash-seed` `scripts/rollback-drill.mjs`.

**Eval-gated merge** (for AI slices): the AI Governance eval suite
(`agents/ai-governance.md`) runs as a required check — a regression in a
safety-invariant eval blocks the merge, the same as a failing test.

---

## How to use this list

When the Release Manager reviews a slice, they walk this list top to
bottom and tick off each gate. A skipped gate gets a written reason
recorded in the release checklist. A failed gate sends the slice back to
the owning stage — never forward.
