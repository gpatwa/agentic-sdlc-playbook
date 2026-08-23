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
- **Budget control is enforced, not just documented** — ✅ `execution/hooks/budget-guard.mjs`
  runs as a `PreToolUse` hook on `Agent` spawns (wired into `.claude/settings.json`
  by `install.mjs`). It reads the active slice's Budget block and *asks the human
  with the numbers* when a spawn would exceed budget. **Fails open by design** —
  a cost control must never block legitimate work on a parse bug; release gates
  fail closed, convenience guards fail open. Verified on all paths incl. corrupt
  state and garbage input.
- **Least-privilege — ✅ closed, live-validated.** Diagnosed as enforced only
  when the Orchestrator session is rooted in the product repo (runs 0.5–5 all
  ran from the playbook and fell back to general-purpose agents with full
  tools). Closed 2026-08-22 by `streak-seed` `runs/security-hardening/`, the
  first run with the Orchestrator rooted in the product repo: all five
  spawned stages used the generated `.claude/agents/*.md` with `tools:`
  frontmatter in force (`Read, Write, Edit, Bash, Grep, Glob`, nothing else).
  The boundary sharpened the work rather than obstructing it — see the
  security-hardening entry below.
- **Run cost is now controlled, not just measured** — ✅ `RUN_ECONOMICS.md`
  (2026-07-26): budget checked *before* every spawn, explicit depth tiers
  (smoke/standard/adversarial), incremental artefacts so an interrupted stage
  leaves its work on disk. Motivated by the `http-layer` run: ~868k tokens with
  18% lost to killed agents, `adversarial` depth on every stage of a
  dependency-free seed, and no control that ever summed the spend.
- **DORA aggregation** — ✅ built + live-validated (Phase 6):
  `execution/analyze.mjs` aggregates across `runs/*/trace.json` into
  `runs/ANALYTICS.md` + `runs/dashboard.html`. Live per-run emission proven by
  the Phase-4 greenfield run (streak-seed). **The DORA metrics themselves are
  now computed** (2026-07-26) — lead time, deployment frequency, change failure
  rate, rework rate — after an earlier ✅ here overstated things: the generator
  aggregated *cost* only. Failed-deployment recovery time is reported as **not
  captured** rather than estimated (it needs blocked→unblocked timestamps no run
  has recorded), and change-failure/rework are flagged as a **floor**, since
  pre-telemetry runs are invisible to them — stash-seed's Phase-2b slice shipped
  the wildcard bind fixed today and cannot be counted.
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

## Production-readiness audit (2026-07-28)

Audited against the bar **"another team installs the pack on their repo and
runs slices without us"** — not "the seed apps work". Findings are grouped by
the dimension they threaten; each is fixed, or recorded as a known limit with
the reason it is not being fixed now.

### Fixed in this pass

- **The pack had no tests at all** — ✅ closed. `execution/` now carries a
  dependency-free `node:test` suite (`npm test` in `execution/`): 48 tests over
  `install.mjs`, `analyze.mjs`, and `budget-guard.mjs`. This was the highest
  gap on the list because `install.mjs` generates the least-privilege `tools:`
  frontmatter — a silent regression there is a **security** regression in every
  repo the pack is installed into, and nothing would have caught it. The suite
  is **proven non-vacuous by mutation**: stripping `Bash` from a role that needs
  it → 1 failure; demoting the QA gate to `medium` → 2; restoring the
  divide-by-zero → 1; making the cost guard fail *closed* → 20.
  It also **found a live defect on its first run**: a stage with zero tool
  calls divided by zero, rendering `Infinity%` and `∞×` into `ANALYTICS.md`
  and falsely flagging the stage as a density outlier. Density is now `null`
  when unmeasurable and reads `—`, and no real trace's output changed.
- **Truncated artefacts passed the handoff check** — ✅ closed
  (`HANDOFF_CHECK.md` §1b). The check validated *non-empty*, while
  `RUN_ECONOMICS.md` §4 deliberately makes partial artefacts the **expected
  shape of a killed stage** by requiring incremental writes. Those two
  protocols shipped separately and contradicted each other: presence stopped
  being evidence of completeness the moment incremental writes landed, and a
  truncated artefact is read as authoritative by the next agent. Completeness
  failures now *resume* the producing stage rather than restarting it.
- **`packVersion` was write-only** — ✅ closed. Written at install since v2 and
  read by nothing, so a product repo could drift arbitrarily far from the
  playbook driving it with no signal. `install.mjs` now reads the previous
  install back and reports upgrade / **downgrade** (playbook older than the
  installed pack) with the prior install date.

### Fixed in the follow-up pass (same day)

- **Budget guard was wrong under concurrency** — ✅ closed. It took the *first*
  in-progress budgeted `STATE.md` in readdir order and stopped, so an
  over-budget slice could be missed entirely because an unrelated under-budget
  one happened to sort earlier. It now scans every in-progress budgeted slice
  and guards the **most constrained** (highest spent/budget). Correct under
  concurrency without needing a lock — the binding constraint is the one worth
  surfacing, whichever slice owns it.
- **CI on the playbook** — ✅ closed (`.github/workflows/ci.yml`). Runs the pack
  tests, a dangling-reference check, and an end-to-end installer run against a
  scratch repo. The repo defining the gates is now held to them.
- **Analytics could not be acted on** — ✅ mechanism supplied.
  `analyze.mjs --strict` exits non-zero on an envelope breach or stage
  outlier, so a product CI *can* gate on cost. Deliberately **opt-in and not
  the default**: release gates fail closed because shipping a defect is
  expensive, but a density outlier means a stage cost more than expected, not
  that the software is wrong — auto-blocking on it would stall correct work
  for a budget reason, the same reasoning that makes `budget-guard` fail open.
  Mechanism here, policy in the product.
- **Stale installed packs** — ✅ closed. Both seed repos regenerated to pack v3;
  all 24 agents in each now carry `effort:`. This also **live-validated the new
  drift detection**, which reported the v2→v3 transition on both real repos.
- **We measured cost, never code quality** — ✅ the measurement half is closed,
  the gate half is deferred by design. Four external write-ups (Google's
  New-SDLC paper, Monaco, DoorDash, Anthropic's AI-native-org talk) plus our own
  "no quality metric" finding all pointed at the same hole: `analyze.mjs`
  measured the pipeline's *cost*, and nothing measured the *code's shape*.
  `execution/quality.mjs` now computes module size, an approximate per-file
  complexity, and a test-presence signal (explicitly **not** coverage), rendered
  to `QUALITY.md`. **Measure-only — it never gates**; whether any metric earns a
  gate waits on a real slice where a reviewer looked, per the plan and Google's
  own "an eval without a rubric measures nothing". Run against real seed code it
  earned its keep immediately: the `large` flag landed on the exact
  `streak-seed/src/server.js` that once shipped the wildcard-bind defect, and it
  exposed one false positive of its own (density on a 2-line file), fixed with a
  size floor calibrated from that data — measure, then decide, not assert.

### Live-validated by streak-seed `security-hardening` (2026-08-22)

The T1 slice from `docs/BACKLOG.md` — the first run with the Orchestrator
rooted in a product repo. It closed four open validation gaps at once and
found one real defect in the tooling that was measuring it.

- **Least-privilege — closed.** See the matching bullet above.
- **trace@2 populated by a real run for the first time** — `operator`,
  per-stage `effort`, and `executor` all recorded. Effort routing held: the
  two gate stages (Security re-gate, re-verify) ran `high`; the two build
  stages (Implementation, rework) ran `medium`.
- **First structured `gateCatches` entry.** Security's re-gate returned a
  `required-fix` on F-5: the F-2 tag-allowlist fix reproduced the F-1 defect
  it sat beside — `create()` read `vnode.tag` three times, so a stateful
  getter/Proxy could pass validation on one read and construct from another.
  Not reachable in this build; sent back so the precondition could be struck
  honestly rather than recorded as a guarantee the code didn't provide. First
  entry in `analyze.mjs`'s "Gate catches" table that isn't a floor.
- **`analyze.mjs` found a real defect in itself.** The per-run summary row
  summed `run.stages` unfiltered. trace@1 never exposed this — orchestrator-
  executed stages lived only in `notes`, never in `stages`. This run's
  `stages` array mixed three untraced entries (Intake, Release, Post-Launch)
  with five traced ones for the first time, and `undefined + number` rendered
  `NaN` across the whole `security-hardening` row — tokens, calls, and
  envelope-pass all unreadable. Fixed by filtering `perRun`'s reduce the same
  way the fleet `stages` list already was; the envelope's stage count now
  also excludes untraced stages, so an orchestrator-executed stage no longer
  buys the run free headroom for free. Non-vacuous regression test added
  (confirmed failing before the fix, passing after).
- **Budget overrun, recorded honestly.** 520,139 tokens against a 490k budget
  (106%) — not authorized, not raised to fit. Root cause: two of five spawn
  estimates were invented rather than drawn from `RUN_ECONOMICS.md` §1 (a
  resumed re-verify priced at 40k actually cost 115k — resumption saves
  re-derivation, not tokens). Three amendments proposed to `RUN_ECONOMICS.md`
  in the run's Post-Launch review; not yet applied to the playbook.
- **T2 (quality-gate decision) — early signal, not conclusive.**
  `quality.mjs` run against the same code flags `src/client/dom.js` as
  "dense" — the exact file that held F-5. A proximity signal, not a catch:
  density measures decision count, not property-read count, so it would not
  have caught the specific defect (the run's own Post-Launch review is
  explicit that only a mechanism-level assertion — reads counted, not
  outcomes asserted — can). One data point; insufficient alone to decide T2.

Evidence: `streak-seed/runs/security-hardening/{STATE.md,trace.json,
03-security.md,05-post-launch.md}`. Left uncommitted in `streak-seed`
pending human review — deliberate, per rule-3/rule-4 scope.

### Known limits — recorded, not fixed

- **Telemetry is self-reported, contradicting its own protocol.**
  `RUN_ECONOMICS.md` §5 requires harness-sourced telemetry; in practice the
  agent writes its own token and tool-call numbers into `trace.json`. **Every
  cost figure in this repo rests on agents reporting their own usage**, and a
  stage killed mid-run records nothing at all (the `http-layer` run's "18% lost
  to killed agents" was reconstructed by hand). Not fixable from inside the
  pack — it needs harness-level usage capture we do not control. The honest
  status is *stated intent, not enforced*.
- **No uninstall for the pack, and none planned.** `install.mjs` overwrites
  `.claude/agents/`. The pack only ever writes into a git repo, so revert is
  `git checkout` — building an uninstaller would duplicate version control and
  add a second, less-tested way to remove files. Recorded as a decision, not a
  backlog item. The real risk it appeared to cover — *install writes a bad
  pack* — is now covered by the test suite and CI instead.

Checked and **clean**: cross-document reference integrity. All 38 `*.md`
references across briefs and protocols resolve; the three with no file in the
playbook (`ANALYTICS.md`, `INDEX.md`, `STATE.md`) are generated at runtime in
the product repo.

## How to add a phase

One row, one uniquely-validated mechanism, smallest app that exercises it.
If a proposed phase doesn't validate anything new, it's a demo, not a
phase.
