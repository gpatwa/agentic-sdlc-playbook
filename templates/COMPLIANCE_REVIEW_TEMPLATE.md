# Compliance Review — <slice name>

> Owner: Compliance Reviewer Agent
> Status: <draft / pass / required-fix / block>
> Frameworks in scope: <SOC 2 / ISO 27001 / GDPR / ISO 42001 / HIPAA / PCI>
> Builds on Security review: <path / commit of the passed security review>

## Control mapping

Each thing the change touches, mapped to the specific control(s) it
affects. Use framework control IDs, not general categories.

| Change | Control (framework + ID) | Effect | Evidence |
|--------|--------------------------|--------|----------|
| <what changed> | <e.g. SOC 2 CC7.2 / ISO 27001 A.8.16> | <strengthens / must preserve / new> | <artefact pointer> |

Where one piece of evidence satisfies multiple controls (SOC 2 ↔ ISO 27001
overlap), note it once and reference it.

## Evidence

For each control above, the durable artefact an auditor would accept:

- **<control ID>:** <audit event / config value / test / generated report
  — with a pointer>. Prefer continuously-monitored evidence over a
  one-time screenshot.

## Retention check

- PII fields touched: <list>
- Enforced retention in code? <yes / no — pointer>
- Any extension of retention? <if yes → flag for Security & Privacy>

## Audit-export check

- Audit remains append-only? <yes / no>
- Audit remains exportable by the customer admin? <yes / no>
- New state-changing actions all produce audit events? <yes / no>

## Contractual commitments

- New external data flow / processor? <yes / no>
- If yes, present in the processor inventory / RoPA? <yes / no — pointer>
- DPA / customer addendum impact? <none / describe → escalate if needed>

## AI obligations (if the slice involves a model)

- Model risk tier (ISO 42001 / AI Act): <minimal / limited / high>
- Required obligations for that tier met? <list + evidence>
- Model card referenced: <path>

## Findings

| Finding | Severity (blocker / required-fix / advisory) | Control |
|---------|----------------------------------------------|---------|
| <finding> | <severity> | <control ID> |

## Recommendation

- [ ] **Pass** to Release Manager.
- [ ] **Required fix** — back to engineer / Security with the findings above.
- [ ] **Block** — a control gap needs a contract / policy change; escalated
      to human.

**Named compliance approver:** <name/role> — recorded by the Release Manager.

## Hand off

To Release Manager (if pass) or back to engineer / Security & Privacy.
