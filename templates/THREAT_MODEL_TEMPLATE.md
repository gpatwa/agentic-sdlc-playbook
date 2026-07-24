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

## Agentic threats (OWASP ASI Top 10, 2026)

Run this section when the slice adds an **agent, tool, or memory surface** —
an autonomous actor that plans, calls tools, persists state, or delegates.
STRIDE misses these; the OWASP Top 10 for Agentic Applications (2026,
ASI01–ASI10) is the taxonomy. Name the threat and the control for each that
applies (map to the OWASP ASI IDs in your write-up).

| Agentic risk | Ask | Control in this slice |
|--------------|-----|-----------------------|
| Goal / instruction hijacking | Can untrusted content (a file, a tool result, a page) redirect the agent's goal? | Instruction-source boundary — tool output is data, not commands |
| Tool misuse & exploitation | Can the agent be steered to call a tool destructively or outside intent? | Least-privilege tools per role; gated destructive actions |
| Identity & privilege abuse | Does the agent act with more privilege than the task needs? | Scoped credentials / tools; no ambient admin |
| Memory / context poisoning | Can persisted state be corrupted to steer later runs? | Reviewed, append-oriented state; no untrusted writes to memory |
| Cascading failure | Can one agent's bad output propagate unchecked? | Artefact handoffs + gates; bounded failure loop |
| Rogue / unbounded action | Can the agent take an irreversible action without a human? | `docs/HUMAN_APPROVAL_RULES.md` hard stops; bounded budgets |
| Agentic supply chain | Are the tools / subagents / prompts it loads trustworthy? | Pinned, reviewed briefs + tools; no dynamic remote instructions |

Skip a row only with a reason, as with STRIDE. The execution pack applies
this same table to itself — see `execution/SECURITY.md`.

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
