# Vendor Risk Assessment — <vendor / service name>

> Owner: Compliance Reviewer (with Security & Privacy)
> Status: <draft / approved / rejected>
> Triggers: `docs/HUMAN_APPROVAL_RULES.md` rule 6 (new data processor)

Complete this before routing any user or customer data to a new
third-party / subprocessor. Approval is a human decision.

## Vendor & service

- **Vendor:** <name>
- **Service:** <what it does for us>
- **Need it serves:** <why a third party rather than build / existing vendor>

## Data shared

Every data element that would flow to this vendor, classified.

| Element | Classification | PII/PHI/PCI | Necessary? |
|---------|----------------|-------------|------------|
| <field> | <public/internal/confidential/restricted> | <flag/none> | <yes — why> |

Apply minimisation: if an element isn't necessary for the service, don't
send it.

## Subprocessor chain

- Does the vendor use its own subprocessors for our data? <yes / no>
- If yes, are they disclosed and auditable? <detail>

## Security posture

- Certifications: <SOC 2 Type II / ISO 27001 / ISO 42001 (if AI) / HIPAA /
  PCI — with dates>
- Recent penetration test / audit? <yes — when / no>
- Status page / uptime history: <link>

## Contractual / DPA

- DPA in place? <yes — link / no → blocker>
- Data-handling terms acceptable? <yes / concerns>
- Liability + breach-notification SLA: <detail>

## Data residency

- Where is our data stored / processed? <region>
- Cross-border transfer + legal basis: <SCCs / adequacy / n/a>

## Access scope

- Least privilege honoured? <what the vendor can access>
- Our ability to revoke access immediately? <yes / no>

## Exit & portability

- Data export on termination? <format, mechanism>
- Deletion on termination + proof? <detail>

## Risk rating

- **Inherent risk:** <low / medium / high — based on data class + access>
- **Residual risk after controls:** <low / medium / high>
- **Residual risk accepted by:** <name, if any>

## Decision

- [ ] **Approve** — proceed; recorded in the processor inventory / RoPA.
- [ ] **Approve with conditions** — <conditions>.
- [ ] **Reject** — <reason>.

**Human approver (rule 6):** <name> — <time UTC>

## Hand off

To Data Governance (RoPA / inventory entry) and the Release Manager (the
integration is a Tier 3 release).
