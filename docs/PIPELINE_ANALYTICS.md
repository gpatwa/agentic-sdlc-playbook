# Pipeline Analytics — generating insight systematically

The SDLC applies SRE discipline to the products it builds; this is that
discipline turned **inward**, made repeatable. Insight comes from exactly two
places, each an *observe → analyze → act* loop:

- **Loop 1 — introspection**: mine the pipeline's own exhaust (per-run
  telemetry). Built (Phase 6, this doc).
- **Loop 2 — environment scan**: watch the field, *grounded in* what Loop 1
  measured, score against real need. Cadenced. (`STANDARDS_WATCH.md`; deferred.)

Without a **feedback path** that changes briefs, gates, SLOs, or the roadmap,
either loop is just a memo. The worked examples: the FinOps 396k outlier →
`agents/finops.md` guardrail; the token-SLO miss → the `PIPELINE_SLOS.md`
per-stage re-baseline.

## Loop 1 architecture: author once, render many

One machine-readable source of truth; every human view is **rendered from it,
never hand-maintained** — the discipline that stops telemetry and its summary
from drifting.

```
runs/<slice>/trace.json     ← canonical facts (a run emits it; SLICE_STATE.md)
        │
   execution/analyze.mjs     ← dependency-free generator, globs runs/*/trace.json
        ├──► runs/ANALYTICS.md    (human · git-diffable · greppable)
        └──► runs/dashboard.html  (human · visual · self-contained, theme-aware)
```

- **`trace.json`** — the same per-stage rows as the STATE.md Trace table
  (model, tokens, toolCalls, retries), machine-readable. STATE.md is the human
  mirror; neither is hand-parsed for numbers.
- **`analyze.mjs`** — computes every derived metric (per-run totals, density,
  envelope status, fleet rollup) and **carries the detectors** so any run
  auto-flags its own outliers. Run it: `node <playbook>/execution/analyze.mjs .`
  from the product-repo root. The Post-Launch agent runs it at slice close.

## Detectors (in the generator, not the eye)

| Detector | Rule | Fires on |
|----------|------|----------|
| Per-stage cap | stage tokens > 150k | a single stage over-producing (FinOps 396k) |
| Density outlier | tokens/call > 2× the ~3.6k baseline | reasoning-bound stages |
| Slice envelope | run tokens > stages × 100k | a run collectively hot |

Baselines mirror `PIPELINE_SLOS.md` § SLOs — keep the two in sync (a small
duplication; the generator holds the machine copy, the protocol the prose one).

## What Loop 1 already surfaced (13 traced stages, 2 runs)

- Token cost is **near-linear in tool-call count** at a reproducible ~3.6k/call;
  drop the one outlier and both runs land at the same density.
- The email-digest Tier-3 "miss" was a **false alarm** of the old flat budget.
- llm-summary's overage is **100% one stage** (FinOps). The detectors isolate it.

## Not yet

- **Live emission** — the two runs above were backfilled; the mechanism
  validates when a fresh slice emits its own `trace.json` and Post-Launch
  regenerates. Older runs (deploy, eval, http-api, run-1) predate telemetry and
  appear as "not instrumented".
- **Loop 2** — the external watch, scheduled and seeded with this output.
- **>2 runs in the visual** — the dashboard's categorical colors are validated
  for two runs; a third needs the next palette slot re-validated.
