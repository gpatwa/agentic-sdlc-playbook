# Protocol: Pipeline SLOs

The SDLC applies SRE discipline to the products it builds; this file
applies it to the SDLC itself. Targets are measured from the Trace tables
in each slice's `STATE.md` (`SLICE_STATE.md`) — no telemetry, no SLO.

## Service-level objectives (initial targets)

Baselined on run-1 (4 stages, ~110k subagent tokens, stages 80–160s each).
Adjust with evidence, never silently (see "Changing targets").

| SLO | Target | Measured from |
|-----|--------|---------------|
| Stage wall-clock | p50 ≤ 5 min · p95 ≤ 20 min (the `FAILURE_LOOP.md` budget) | Trace: Start/End per stage |
| Slice token budget (Tier 2) | ≤ 250k subagent tokens p95 | Trace: Tokens column total |
| Slice token budget (Tier 3) | ≤ 400k subagent tokens p95 (opus stages cost more) | same |
| Approval surfacing | 100% of gated actions surfaced at Intake — never discovered at Release | Approvals table: request row exists before any implementation stage row |
| Escalation latency | A blocked slice surfaces to the human in the same turn it blocks | STATE status transitions |

## DORA mapping (aggregate, across slices)

| Metric | Definition here |
|--------|-----------------|
| Lead time | Intake row start → slice landed |
| Deployment frequency | Slices landed per week |
| Change failure rate | Slices reverted or hotfixed ÷ slices landed |
| Failed Deployment Recovery Time | `blocked-on-failure` set → unblocked (DORA's 2025 rename of MTTR) |
| Rework Rate | Reactive vs. planned work: stage retries (Trace `Retry #`) + post-landing hotfixes ÷ slices landed (DORA's 2025 fifth metric) |

The Post-Launch Learning agent aggregates these across `runs/*/STATE.md`
in its review; a slice that blew an SLO gets a carry-forward item, same as
any other regression.

## Changing targets

Targets are versioned in this file. Raising a budget to make a red SLO
green is the pipeline equivalent of loosening a product SLO to hide a
regression — the SRE rule applies: recorded change, with rationale, or it
doesn't happen.
