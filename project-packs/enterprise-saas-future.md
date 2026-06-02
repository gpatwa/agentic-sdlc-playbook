# Project Pack — Enterprise SaaS (Future Roadmap)

Use for: a multi-tenant SaaS that serves teams / organisations as
buyers, with admin / RBAC / audit / SSO / compliance requirements.

This pack is marked "future" because it is not the current MVP focus
for any project using this playbook today. It exists so that when a
B2C product graduates to enterprise, the team has a clear map of what
changes.

---

## When to use this pack

- The product is being positioned for purchase by a team or
  organisation, not by an individual user.
- There is a clear distinction between an admin role and an end-user
  role.
- The product needs to satisfy at least one of: SOC 2, HIPAA, GDPR,
  enterprise SSO, custom data retention, audit export.

If none of these are true, use the B2C pack and revisit later.

## Product principles

- **Admin separation.** Admin actions and end-user actions live in
  separate surfaces. Admin actions have stricter approval and audit.
- **RBAC by default.** Every record carries a tenant ID and a user ID.
  Cross-tenant access is impossible by construction.
- **Audit log is a product surface.** The customer admin can inspect
  what their users did and what the system did on their behalf.
- **Configurable safety.** Customers can tighten safety rules (more
  approval gates, narrower data retention) but never loosen the floor
  the product enforces.

## Lifecycle adjustments

These overlay roles are now first-class in the playbook; this pack turns
them on:

- **Compliance Reviewer** (`agents/compliance-reviewer.md`). Runs between
  Security and the Release Gate. Maps the change to named controls (SOC 2,
  ISO 27001, GDPR, ISO 42001 for AI) and produces auditor-grade evidence.
  Output: `templates/COMPLIANCE_REVIEW_TEMPLATE.md`.
- **Site Reliability Engineer** (`agents/sre.md`). Owns production after
  release: SLOs, error budgets, runbooks, and blameless incident reviews
  (`templates/INCIDENT_REVIEW_TEMPLATE.md`).
- **Customer Success** (`agents/customer-success.md`). Feeds Post-Launch
  with account-level signal, triangulated against the Data Analyst's
  quant. Output: `templates/CUSTOMER_SIGNAL_REVIEW_TEMPLATE.md`.
- **Data Governance** (`agents/data-governance.md`). Classifies new data,
  sets residency + retention, and keeps the catalog / RoPA current. Output:
  `templates/DATA_GOVERNANCE_REVIEW_TEMPLATE.md`.
- **AI Governance** (`agents/ai-governance.md`). Risk-tiers AI capabilities
  (NIST AI RMF / EU AI Act / ISO 42001) and owns the eval suite. Output:
  `templates/AI_RISK_ASSESSMENT_TEMPLATE.md`.
- **FinOps** (`agents/finops.md`). Cost-per-action, unit economics, and
  kill-switches for unbounded-cost paths. Output:
  `templates/COST_BUDGET_TEMPLATE.md`.
- **Tech Writer** (`agents/tech-writer.md`). User docs, API reference, and
  release notes matched to shipped behaviour. Output:
  `templates/DOC_DELTA_TEMPLATE.md`.
- **PRDs include a deployment-shape section.** SaaS, single-tenant,
  on-prem — the answer changes everything downstream.

## Default release tier

- Any feature touching tenant data: **Tier 3**.
- Any RBAC change: **Tier 3** + named compliance approver.
- Any audit log change: **Tier 3**.

## Safety invariants (recommended floor)

- Tenant ID + user ID on every record. Always.
- Cross-tenant queries throw at the service boundary, not just the
  query builder.
- Audit log is append-only and exportable.
- PII fields have explicit retention policies in code.
- SSO / API key revocation is immediate and audited.
- No customer data flows to a third-party processor without explicit
  configuration the customer can audit, a vendor risk assessment
  (`templates/VENDOR_RISK_TEMPLATE.md`), and the approval required by
  `docs/HUMAN_APPROVAL_RULES.md` rule 6.

## What's NOT in this pack

- Coach / mentor dashboards. Those belong to a separate B2B education
  pack when needed.
- University / institutional dashboards. Same as above.
- "Trial" or "demo" tenants that share data with real tenants.

## Anti-patterns specific to enterprise

- Adding admin features to the B2C surface to "save time".
- Letting one customer's logs leak into another's exports.
- Building RBAC late ("we'll add it before launch").
- Treating audit as observability — it's a product surface.

## Worked examples

This pack has no current worked example. When Agentic Job Ops or a
sibling project graduates to enterprise, an example will be added
here. Until then, the pack documents what to plan for, not what to
copy.
