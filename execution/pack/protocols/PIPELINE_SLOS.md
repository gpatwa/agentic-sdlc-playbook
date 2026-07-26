# Protocol: Pipeline SLOs

The SDLC applies SRE discipline to the products it builds; this file
applies it to the SDLC itself. Targets are measured from the Trace tables
in each slice's `STATE.md` (`SLICE_STATE.md`) — no telemetry, no SLO.

## Service-level objectives

Token budgets **re-baselined 2026-07-25** on three runs (run-1, email-digest,
llm-summary — see "Token budget: the per-stage model" below). Wall-clock and
the qualitative SLOs are unchanged. Adjust with evidence, never silently
(see "Changing targets").

| SLO | Target | Measured from |
|-----|--------|---------------|
| Stage wall-clock | p50 ≤ 5 min · p95 ≤ 20 min (the `FAILURE_LOOP.md` budget) | Trace: Start/End per stage |
| Per-stage token budget | ≤ 150k subagent tokens p95, **each spawned stage** | Trace: Tokens column, per row |
| Slice token envelope | ≤ spawned-stage-count × 100k subagent tokens p95 | Trace: Tokens total ÷ stage count |
| Approval surfacing | 100% of gated actions surfaced at Intake — never discovered at Release | Approvals table: request row exists before any implementation stage row |
| Escalation latency | A blocked slice surfaces to the human in the same turn it blocks | STATE status transitions |

## Token budget: the per-stage model

The original budget was a flat per-tier number (Tier 2 ≤ 250k, Tier 3 ≤ 400k),
baselined on run-1's 4-stage bulk-delete. It had the wrong *shape*: a slice's
token cost scales with **how many stages it spawns**, not its risk tier. Tier
selects *model routing* (opus on the reasoning stages), which drives **dollars
per token** — not the **token count**, which is set by stage count × per-stage
activity. Evidence: opus stages here (Security 70–81k, Release 88–94k,
Architecture 83k) consumed *fewer* tokens than the sonnet implementation/QA
stages (92–126k) — the opposite of "opus stages cost more [tokens]".

### Evidence (per-stage tokens, three runs)

| Run | Tier | Stages | Total | Per-stage avg | Max stage | > 150k? |
|-----|------|--------|-------|---------------|-----------|---------|
| run-1 (bulk-delete) | 2 | 4 | ~110k | ~28k | — | none |
| email-digest | 3 | 7 | 629k | ~90k | 125k (Post-Launch) | none |
| llm-summary | 2 + AI overlay | 6 | 884k | 98k *(ex-FinOps)* | **396k (FinOps)** | **FinOps only** |

Every legitimate stage across all three runs lands ≤ 126k. So:

- **Per-stage cap = 150k p95** — headroom over the heaviest legit stage (QA
  126k). Across all three runs it flags exactly one thing: FinOps (396k) on
  llm-summary. That is the metric doing its job, not a coincidence.
- **Slice envelope = stages × 100k** — the observed typical stage is ~90–98k on
  the two complex slices. Scaling with stage count means a 6- or 7-stage slice
  is not falsely red against a 4-stage baseline. A slice can pass every
  per-stage cap yet still bust the envelope (all stages high-but-legit) — that
  is a real signal too: the slice ran collectively hot, review its scope.

### What this reclassifies

- **email-digest's recorded Tier-3 "miss" was a false alarm.** 629k across 7
  stages is 90k/stage — dead-on typical, and inside the 700k envelope. (The
  earlier "504k vs 400k" figure counted the six pre-merge stages; the
  Post-Launch stage added 125k after merge.) The flat 400k target was simply
  the wrong shape. **Carry-forward closed.**
- **llm-summary's miss is real but localized.** Its 6 stages envelope at 600k;
  it hit 884k. The 284k overage is entirely FinOps: the other five stages
  totaled 487k (97.5k/stage, textbook typical). The per-stage cap isolates the
  cause; the envelope confirms no *other* stage was wasteful.

### FinOps 396k — root cause

FinOps made only **10 tool calls** (vs AI Engineer's 46, QA's 42) — this was
not file I/O, it was analytical over-production. For a slice whose **live cost
is $0** (the LLM path is a throwing placeholder), the stage modeled the entire
*future* real-model slice: 4 item-count tiers × 2 models of sensitivity, four
volume projections, a full 3-layer kill-switch design. Thorough, but
disproportionate to the slice's actual risk. **Guidance:** FinOps output should
be scoped to the slice's *live* cost risk — a $0-live slice warrants a short
"no live spend + forward-gate" note; the exhaustive future-slice cost model
belongs to the future rule-5 / real-model slice, where it is actionable. Now
codified as a per-role guardrail in `agents/finops.md` (operating constraint +
anti-pattern: match review depth to live cost risk) — a scope fix, not a
budget change.

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

The 2026-07-25 token re-baseline is the worked instance of this policy. It is
*not* loosening-to-hide: the flat per-tier budget was replaced because it had
the wrong shape (didn't scale with stage count), and the change is paired with
a **stricter** per-stage cap that surfaces the actual anomaly (FinOps 396k)
instead of burying it under a slice-total pass. Net diagnostic power went up,
not down — the test of an honest re-baseline.
