# Codex on the same seeds (2026-11-02)

Second reviewer, same six planted bugs (`../seeds.json`). Scored by `execution/assess-calibrate.mjs`; full score in `SCORE.md`, findings with dispositions in `FINDINGS.md`, the prompt in `prompt.txt`.

**Conditions.** Codex CLI 0.153.4, model `gpt-5.6-sol`, reasoning medium (the configured default `gpt-6.1-sol` is not available on the owner's ChatGPT account; the first attempt failed before reading code). `-s read-only`, no network, a fresh copy of the seeded repo without `reviews/` or any earlier finding, a generic prompt with no hint about the seeds, one pass over the whole repo. The seeds are public, so this cannot be repeated blind.

**Recall: 4 of 6.** Found S1, S3, S4, S5 (three rated one level lower than planted). Missed S2 (tenant check skipped when `tenant_id` is omitted) and S6 (`==` on bearer tokens), both in `services/a2a/`. The Claude reviewers found 6 of 6. Six seeds, one run each: this does not show one model family is better.

**The seven findings that matched no seed, judged against the real code** (by the support session at the owner's request, not by the owner; the owner can change any of them):

| Finding | Judgment | Disposition |
|---|---|---|
| F-00-001 MCP tools take any worker id in the tenant | Not a defect as designed. The module binds one tenant and one audience and promises nothing per worker; the HTTP server already refuses non-loopback without auth. It would matter only if per-user callers were put in front of it. | intentional |
| F-00-004 no CSRF token or Origin check on POST routes | True but low. Session cookies are `SameSite=Strict` (persona) or `Lax` (OIDC), which stops cross-site POSTs; the residual risk is a sibling subdomain. Hardening, P3. | deferred |
| F-00-007 each Workspace overwrites the module-global LLM hooks | True and latent. Every shipped path (web app, CLI) builds one Workspace per process, so nothing is mischarged today. P3. | deferred |
| F-00-008 spend check, model call and ledger insert are not atomic | True. Locks are per request, so concurrent triages of different requests can all pass the cap check and overshoot by the calls in flight. Bounded by the small cap. P3. | deferred |
| F-00-009 hourly limit counts model calls, message says triages | True. `spend_add` writes one row per live call and a multi-agent triage makes several, so the limit trips early and the message is wrong. Errs on the safe side. P3. | deferred |
| F-00-011 coverage counts absence rows, not workers | True. Two overlapping approved absences for one worker count twice; nothing prevents approving both. Needs that data state. P3. | deferred |
| F-00-012 payroll window drops hours that do not fit | True, and already fixed in hr-timeoff-agent PR 41 (merge `9aab511`). | fixed |

**Caveats on the precision figure.** `SCORE.md` shows 92% (11 of 12) because five findings match a seed by location and the seven above are judged. That is 11 judged, below the plan's 30, so the bar is **not measured**. One of the five, F-00-005 (a token with no email from a configured `service_clients` client is promoted to a service identity), sits near S5's line and so counts as a seed match, but it is a different issue; it is an explicit operator allowlist and reads as intentional. Counted false, precision is 10 of 12 (83%). The judgments are the support session's, not the owner's.
