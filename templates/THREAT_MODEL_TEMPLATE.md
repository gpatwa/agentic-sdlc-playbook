# Threat Model — <slice / surface name>

> Owner: Security & Privacy Agent (with Software Architect)
> Status: <draft / reviewed>
> Source tech spec: <path>

Lightweight STRIDE. Scope it to the new or changed surface — don't
re-model the whole system.

## Surface in scope

What this slice adds or changes that an attacker could reach: endpoints,
inputs, integrations, trust boundaries.

## Assets

What's worth protecting here:

- <asset — e.g. user PII, auth tokens, tenant data, audit log>

## Trust boundaries & data flows

- <actor> → <entry point> → <component> → <store / external>
- Mark where data crosses a trust boundary (untrusted → trusted).

## Threats (STRIDE)

| # | Category | Threat | Affected asset | Likelihood × impact | Mitigation | Status |
|---|----------|--------|----------------|---------------------|------------|--------|
| 1 | Spoofing | <threat> | <asset> | <L/M/H> | <control> | <open/mitigated/accepted> |
| 2 | Tampering | <threat> | ... | | | |
| 3 | Repudiation | <threat> | ... | | | |
| 4 | Information disclosure | <threat> | ... | | | |
| 5 | Denial of service | <threat> | ... | | | |
| 6 | Elevation of privilege | <threat> | ... | | | |

Skip categories that genuinely don't apply — but say so, don't just omit.

## Abuse cases

How a motivated bad actor (or a confused LLM agent) misuses this surface:

- <abuse case> → <expected defence>

## Residual risk

Threats accepted without full mitigation, and why:

- <threat> — <rationale + who accepted it>

## Decision

- [ ] **Pass** — threats mitigated or residual risk explicitly accepted.
- [ ] **Required fix** — a blocker-severity threat is unmitigated.

## Hand off

To the engineer (mitigations) and the Release Manager (gate). High-risk
surfaces feed the Compliance Reviewer's control mapping.
