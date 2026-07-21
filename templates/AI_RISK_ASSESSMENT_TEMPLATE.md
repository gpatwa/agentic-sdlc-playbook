# AI Risk Assessment — <capability name>

> Owner: AI Governance Agent
> Status: <draft / pass / required-fix / block>
> Frameworks: NIST AI RMF (+ GenAI Profile AI-600-1) · EU AI Act (+ GPAI
> Code of Practice) · ISO 42001 · ISO 42005 (AI system impact assessment)
> Source model card: <path, if a trained model>

## Capability

- **What it does:** <one or two sentences>
- **Intended use:** <the surface + the decision it informs>
- **Users / subjects affected:** <who, and whether they're in a
  vulnerable / protected group>

## Risk tier

- **EU AI Act tier:** <minimal / limited / high / unacceptable>
- **NIST AI RMF framing:** <Govern / Map / Measure / Manage notes>
- **Rationale:** <why this tier — tied to the framework, not a guess>

An unacceptable-risk capability does not ship. Escalate.

> EU AI Act timing: GPAI obligations apply now; the Commission's enforcement
> powers begin 2 Aug 2026; models on the market before 2 Aug 2025 have until
> 2 Aug 2027 to comply. The GPAI Code of Practice is the standard vehicle to
> demonstrate compliance.

## Obligations for this tier

| Obligation | Required at this tier? | Met? | Evidence |
|------------|------------------------|------|----------|
| Transparency / disclosure to users | <y/n> | <y/n> | <pointer> |
| Human oversight | <y/n> | <y/n> | <pointer> |
| Robustness / accuracy threshold | <y/n> | <y/n> | <pointer> |
| Documentation / model card | <y/n> | <y/n> | <pointer> |
| Logging / traceability | <y/n> | <y/n> | <pointer> |

## Eval coverage

Does the eval suite cover this capability's safety invariants and failure
modes?

- **Covered:** <invariant → eval case>
- **Gaps to fill before release:** <invariant with no eval>
- **Golden set:** <name, size, frozen date>
- **Refresh status:** <current / due — drift signal>

## Model inventory entry

- <model/capability name, version, owner, tier, last reviewed>

## Post-deployment monitoring

- Behavioural drift: <what's watched, threshold>
- Fairness over time: <slices monitored, cadence>
- Owner in production: <SRE / AI Governance>

## Findings

| Finding | Severity (blocker / required-fix / advisory) |
|---------|----------------------------------------------|
| <finding> | <severity> |

## Recommendation

- [ ] **Pass** to Compliance Reviewer / Release Manager.
- [ ] **Required fix** — eval gaps or obligations unmet.
- [ ] **Block** — unacceptable risk or unmet high-risk obligation;
      escalated to human.

## Hand off

To the Compliance Reviewer (feeds ISO 42001 control mapping) and the
Release Manager (high-risk gating).
