# Validation Matrix

The playbook is validated by **reference apps** — each chosen to exercise
machinery the previous runs never touched. This file is the roadmap and the
scorecard. Update the status column as runs land; link evidence, don't
restate it.

Reference target: [stash-seed](https://github.com/gpatwa/stash-seed) (and
derivatives), per the phase plan below.

## Phases

| # | Phase | Pack | What it uniquely validates | Status | Evidence |
|---|-------|------|---------------------------|--------|----------|
| 0 | Paper worked example (bulk-delete) | b2c-saas | Artefact chain composes; gates map to a real slice | ✅ done | `examples/saved-items-bulk-delete/` |
| 0.5 | Live run-1 (bulk-delete, Tier 2) | b2c-saas | Agents execute the pipeline on real code; independent QA/Security converge | ✅ done | stash-seed PR #1, `runs/run-1/` |
| 1 | Live run-2 (email-digest, **Tier 3**) | b2c-saas | **Human-approval interrupt** (pause / explicit yes / durable record / scope enforcement); execution pack v2: model routing, per-stage tracing, wall-clock budgets, pipeline SLOs | ✅ done | stash-seed PR #2, `runs/email-digest/` (note the recorded Tier-3 token-SLO miss — telemetry working) |
| 2 | HTTP API + CI + deploy half | b2c-saas | The **deploy half**: gates-as-code (CI checks), HTTP surface, post-deploy smoke, executed rollback drill | ✅ done — local + CI (real-cloud deploy + live SLOs: future) | stash-seed PRs #3–#4; CI runs the gates + rollback drill on every push/PR |
| 3 | LLM summary slice (deterministic-first) | b2c-saas + AI overlay | Deterministic-first LLM discipline live: eval gates, AI Governance risk tier, FinOps kill-switch, **rule-5 interrupt** (real model = separate approval) | ✅ done | stash-seed PR #5, `runs/llm-summary/` (AI Engineer + AI Governance + FinOps all validated; real-model wiring deferred behind 7 rule-5 preconditions) |
| 4 | Greenfield app from a one-paragraph brief | any | The **discovery half** live (Market Researcher → PM → UX → UI); creating `.agentic/` from nothing; multi-slice 0→1 | ⬜ | — |
| 5 | stash-teams multi-tenancy | enterprise-saas-future | Enterprise overlays live: Data Governance, Compliance control mapping, RBAC Tier 3 with named approver | ⬜ | — |
| R | Red-team slices (one per phase) | any | **Refusal**: an ask that violates a safety invariant must be blocked and surfaced, not built (e.g. "auto-delete items older than 30 days, no confirmation") | ✅ first proven (B3) · recurring | `stash-seed` `runs/eval/B3-refusal-output.md` |

## Machinery still unvalidated or unenforced (tracked, not phase-bound)

- **Gates as code** — ✅ now run as CI checks on every push / PR (Phase 2a);
  making them *blocking* still needs branch protection (opt-in).
- **Failure loop under real failure** — ✅ proven (B4): an unsatisfiable gate
  was escalated within budget without weakening a gate.
  `stash-seed` `runs/eval/B4-escalation.md`.
- **DORA aggregation** — Trace tables exist per slice; nothing aggregates
  across `runs/*/STATE.md` yet (`PIPELINE_SLOS.md` names the metrics).
- **Rule-6 deferred slice** — wiring a real email provider under
  preconditions P-1..P-6 (stash-seed `runs/email-digest/05-security-review.md`)
  would validate vendor-risk + a second interrupt type.
- **Token budget model** — ✅ re-baselined 2026-07-25 to a per-stage cap
  (≤150k/stage) + a stage-count-scaled slice envelope (stages × 100k), in
  `PIPELINE_SLOS.md`. This reclassified email-digest's Tier-3 "miss"
  (629k across 7 stages = 90k/stage) as a false alarm of the old flat budget,
  and localized llm-summary's real overage to a single stage (FinOps 396k).
  Open follow-up: a scope guardrail for `agents/finops.md` so a $0-live slice
  doesn't model the entire future real-model slice.

## How to add a phase

One row, one uniquely-validated mechanism, smallest app that exercises it.
If a proposed phase doesn't validate anything new, it's a demo, not a
phase.
