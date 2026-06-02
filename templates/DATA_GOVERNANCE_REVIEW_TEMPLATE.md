# Data Governance Review — <slice name>

> Owner: Data Governance Agent
> Status: <draft / pass / required-fix>
> Source tech spec: <path>

## Data elements

Every new or changed data element, classified and tagged. No untagged
data leaves this table.

| Element | Source | Classification | PII/PHI/PCI | Residency | Retention |
|---------|--------|----------------|-------------|-----------|-----------|
| <field> | <where it originates> | <public/internal/confidential/restricted> | <flag / none> | <region> | <period + mechanism> |

## Lineage

For each restricted / PII element, the end-to-end path:

- <element>: source → <store> → <processor(s)> → <export / downstream>

## Cross-border flows

Any data crossing a regional boundary, with its legal basis.

| Element | From → To | Legal basis | Notes |
|---------|-----------|-------------|-------|
| <element> | <region → region> | <SCCs / adequacy / consent> | <…> |

If a legal basis is unclear, escalate to the human — do not assume one.

## Retention enforcement

- <element>: <retention period> — enforced by <TTL job / policy / code
  pointer>. Verified? <yes / no>

## Catalog / RoPA delta

Entries this slice adds or changes:

- <catalog/RoPA entry>

## Findings

| Finding | Severity (blocker / required-fix / advisory) |
|---------|----------------------------------------------|
| <finding> | <severity> |

## Recommendation

- [ ] **Pass** to Compliance Reviewer.
- [ ] **Required fix** — back to Architect / engineer.

## Hand off

To the Compliance Reviewer (control mapping) and the Architect / engineers
(retention + residency implementation).
