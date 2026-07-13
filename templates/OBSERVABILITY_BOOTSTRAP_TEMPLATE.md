# Observability Bootstrap — <service / product name>

> Owner: SRE Agent (with Backend Architect)
> Status: <draft / wired / verified>
> When: before the first production deploy of a service, or when a new
> service joins production. The SRE's SLOs attach to this — no telemetry,
> no SLO.

## Structured logging

- **Format:** <JSON lines / provider> — every entry carries
  `service`, `level`, `timestamp (UTC)`, and a correlation/request ID.
- **Correlation:** <how the request ID propagates across service calls>
- **PII rule:** IDs, counts, hashes only — never content, per
  `.agentic/SAFETY_INVARIANTS.md`. Name the enforcing layer (serializer /
  lint rule), not just the policy.
- **Levels:** what fires `error` (actionable) vs `warn` (investigate) vs
  `info` (audit-adjacent). An `error` that pages nobody is a `warn`.

## Metrics

One row per SLI the SRE's SLOs reference. RED (rate, errors, duration) for
request-shaped services; USE (utilization, saturation, errors) for
resources.

| SLI | Metric name | Type | Labels | Feeds SLO |
|-----|-------------|------|--------|-----------|
| <e.g. read success rate> | <name> | counter/histogram | <low-cardinality only> | <SLO> |

- **Cardinality rule:** no unbounded label values (user IDs, item IDs).

## Tracing

- **Propagation standard:** <W3C traceparent / provider>
- **Span naming:** `<service>.<operation>` — matches the service surface in
  the tech spec.
- **What must be spanned:** every external call (DB, third-party, LLM
  adapter) and every state-changing service function.

## Dashboards

- One dashboard per SLO, showing the SLI against target and the error
  budget burn. Link each: <url / path>

## Alert routing

- Symptom-based alerts only (user pain), each mapped to a runbook step —
  per `agents/sre.md`. Cause-based signals go to dashboards, not pagers.
- **Routing:** <where pages go; where FinOps budget alerts co-route so
  on-call has one surface>

## Audit vs. telemetry boundary

- **Audit events** are a product surface (user-visible, append-only,
  per `.agentic/`). **Telemetry** is operational. Telemetry may reference
  audit event IDs; it never duplicates audit payloads.

## Telemetry retention

- Logs: <period> · Metrics: <period> · Traces: <period>
- Sign-off from Data Governance if any telemetry stream could carry
  restricted data: <yes / n/a>

## Verification

- [ ] Every SLI above emits a live signal in staging (show the query).
- [ ] A synthetic error produces the expected alert → runbook path.
- [ ] Log output sampled and confirmed content-free (invariant 4).

## Hand off

To the Release Manager (production-service gate: "SLOs + runbook + tested
rollback") and the SRE's standing monitoring ownership.
