# Validation Matrix

The playbook is validated by **reference apps** — each chosen to exercise
machinery the previous runs never touched. This file is the roadmap and the
scorecard. Update the status column as runs land; link evidence, don't
restate it.

Reference targets: [stash-seed](https://github.com/gpatwa/stash-seed) (Phases
0–3, 6) and [streak-seed](https://github.com/gpatwa/streak-seed) (Phase 4 —
greenfield 0→1), per the phase plan below.

## Phases

| # | Phase | Pack | What it uniquely validates | Status | Evidence |
|---|-------|------|---------------------------|--------|----------|
| 0 | Paper worked example (bulk-delete) | b2c-saas | Artefact chain composes; gates map to a real slice | ✅ done | `examples/saved-items-bulk-delete/` |
| 0.5 | Live run-1 (bulk-delete, Tier 2) | b2c-saas | Agents execute the pipeline on real code; independent QA/Security converge | ✅ done | stash-seed PR #1, `runs/run-1/` |
| 1 | Live run-2 (email-digest, **Tier 3**) | b2c-saas | **Human-approval interrupt** (pause / explicit yes / durable record / scope enforcement); execution pack v2: model routing, per-stage tracing, wall-clock budgets, pipeline SLOs | ✅ done | stash-seed PR #2, `runs/email-digest/` (note the recorded Tier-3 token-SLO miss — telemetry working) |
| 2 | HTTP API + CI + deploy half | b2c-saas | The **deploy half**: gates-as-code (CI checks), HTTP surface, post-deploy smoke, executed rollback drill | ✅ done — local + CI (real-cloud deploy + live SLOs: future) | stash-seed PRs #3–#4; CI runs the gates + rollback drill on every push/PR |
| 3 | LLM summary slice (deterministic-first) | b2c-saas + AI overlay | Deterministic-first LLM discipline live: eval gates, AI Governance risk tier, FinOps kill-switch, **rule-5 interrupt** (real model = separate approval) | ✅ done | stash-seed PR #5, `runs/llm-summary/` (AI Engineer + AI Governance + FinOps all validated; real-model wiring deferred behind 7 rule-5 preconditions) |
| 4 | Greenfield app from a one-paragraph brief | any | The **discovery half** live (Market Researcher → PM → UX → UI); creating `.agentic/` from nothing; 0→1 | ✅ done | [streak-seed](https://github.com/gpatwa/streak-seed) `runs/greenfield/` — StreakKeeper 0→1 from one paragraph: 10 stages (4 discovery + 6 delivery), Tier 2 GO, 13/13 tests, 6/6 invariants independently verified; discovery caught the day-cutoff trap pre-code, QA found + Security sharpened a real bug. Commit `eee59ce`, pushed (rule-3) |
| 5 | stash-teams multi-tenancy | enterprise-saas-future | Enterprise overlays live: Data Governance, Compliance control mapping, RBAC Tier 3 with named approver | ⬜ | — |
| 6 | Pipeline analytics — self-observation | any | Insight generated from telemetry, not hand-derived: each run emits `trace.json`; `analyze.mjs` renders `ANALYTICS.md` + `dashboard.html`; per-stage cap + density outliers auto-flag. Closes the DORA-aggregation gap. | ✅ done · live-validated | playbook `execution/analyze.mjs`, `docs/PIPELINE_ANALYTICS.md`; wired into `SLICE_STATE.md` + Post-Launch brief. **Live-validated by Phase 4**: streak-seed `runs/greenfield/trace.json` emitted fresh (not backfilled) → analytics regenerated; the run's 1 density flag (UI 9.6k/call) surfaced the archetype carry-forward below |
| R | Red-team slices (one per phase) | any | **Refusal**: an ask that violates a safety invariant must be blocked and surfaced, not built (e.g. "auto-delete items older than 30 days, no confirmation") | ✅ first proven (B3) · recurring | `stash-seed` `runs/eval/B3-refusal-output.md` |

## Machinery still unvalidated or unenforced (tracked, not phase-bound)

- **Gates as code** — ✅ now run as CI checks on every push / PR (Phase 2a);
  making them *blocking* still needs branch protection (opt-in).
- **Failure loop under real failure** — ✅ proven twice. (B4) an unsatisfiable
  gate was escalated within budget without weakening a gate
  (`stash-seed` `runs/eval/B4-escalation.md`); and **first fired in a real
  delivery run** 2026-07-26 — Security blocked the `http-layer` slice over a
  wildcard bind that exposed user data to the LAN, the slice went *back* to
  Implementation, was fixed with two regression tests, and the blocker was
  re-verified (`streak-seed` `runs/http-layer/`). Six runs in, the fail-closed
  loop had never actually stopped a slice before.
- **Run cost is now controlled, not just measured** — ✅ `RUN_ECONOMICS.md`
  (2026-07-26): budget checked *before* every spawn, explicit depth tiers
  (smoke/standard/adversarial), incremental artefacts so an interrupted stage
  leaves its work on disk. Motivated by the `http-layer` run: ~868k tokens with
  18% lost to killed agents, `adversarial` depth on every stage of a
  dependency-free seed, and no control that ever summed the spend.
- **DORA aggregation** — ✅ built + live-validated (Phase 6):
  `execution/analyze.mjs` aggregates across `runs/*/trace.json` into
  `runs/ANALYTICS.md` + `runs/dashboard.html`. Live per-run emission proven by
  the Phase-4 greenfield run (streak-seed).
- **Rule-6 deferred slice** — wiring a real email provider under
  preconditions P-1..P-6 (stash-seed `runs/email-digest/05-security-review.md`)
  would validate vendor-risk + a second interrupt type.
- **Token budget model** — ✅ re-baselined 2026-07-25 to a per-stage cap
  (≤150k/stage) + a stage-count-scaled slice envelope (stages × 100k), in
  `PIPELINE_SLOS.md`. This reclassified email-digest's Tier-3 "miss"
  (629k across 7 stages = 90k/stage) as a false alarm of the old flat budget,
  and localized llm-summary's real overage to a single stage (FinOps 396k).
  ✅ follow-up done: a scope guardrail is now codified in `agents/finops.md`
  (match review depth to live cost risk) so a $0-live slice doesn't model the
  entire future real-model slice.
- **Density baseline is stage-archetype-dependent** — ✅ done 2026-07-26. The
  flat ~3.6k detector cut through two legitimate clusters; density is now capped
  per archetype (**design 15k · review 8k · build 5k** tok/call), classified in
  `analyze.mjs` and documented in `PIPELINE_SLOS.md`. More discriminating, not
  looser: cleared two false positives (greenfield UI 9.7k → 64% of cap; AI
  Governance 9.8k → 65%) while FinOps still fires at 264% — the same archetype
  on the same run, now correctly separated. Surfaced by streak-seed
  `runs/greenfield/10-post-launch.md`.
- **Greenfield installer bootstrap** — ✅ done 2026-07-26:
  `execution/install.mjs --greenfield` scaffolds a stub `.agentic/` so a
  brand-new repo can install the pack before discovery authors it. Stubs are
  explicit empty placeholders (never invented content — a fabricated
  SAFETY_INVARIANTS would be trusted downstream); the guard still fails closed
  without the flag. Surfaced by the Phase-4 run.

## How to add a phase

One row, one uniquely-validated mechanism, smallest app that exercises it.
If a proposed phase doesn't validate anything new, it's a demo, not a
phase.
