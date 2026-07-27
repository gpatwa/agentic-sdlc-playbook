# Protocol: Run Economics

`PIPELINE_SLOS.md` **measures** what a run cost, after the fact. This file
**controls** what it is allowed to cost, before the spend happens. A pipeline
that can only discover overspend in its own post-mortem is not governed — it is
narrated.

## Why this exists

The `http-layer` run reached ~868k tokens **before finishing**, hit the account
usage limit four times, and lost ~156k to agents that were killed mid-stage and
produced nothing. Every individual stage was defensible; nothing checked the
total until the human hit a wall. Three specific failures, three controls:

| Failure observed | Control |
|---|---|
| No check before spawning — spend discovered only in hindsight | **Budget check** (§2) |
| Every stage ran at maximum rigor, on a seed app with no users | **Depth tiers** (§3) |
| Killed agents produced *nothing* — all-or-nothing work units | **Incremental artefacts** (§4) |

This is the FinOps guardrail (`agents/finops.md`: match review depth to what is
actually at stake) turned on the pipeline itself.

## 1. What a stage costs

Measured across 27 real stages (`runs/*/trace.json`). Use these to estimate
before spawning; re-derive them as data accumulates.

| Archetype | Typical | Budget with | Worst seen |
|-----------|---------|-------------|------------|
| **design** (Market Research, PRD, UX, UI, AI Governance) | ~69k | **70k** | 77k |
| **review** (Scope, Architecture, Security, Release, Post-Launch) | ~98k | **100k** | 149k |
| **build** (Implementation, QA, AI Engineer) | ~129k | **130k** | 178k |

A stage's cost is dominated by its **agentic loop**, not its output: ~4–5k per
tool call, re-processing accumulated context each turn. So cost tracks *number
of turns*, which tracks *how much you asked it to do*.

## 2. Budget check — before every spawn

The slice declares a budget at Intake and records spend in `STATE.md` (see the
Budget block in `SLICE_STATE.md`). **Before spawning any stage**, the
Orchestrator checks:

```
spent + estimate(next stage)  ≤  budget ?
```

- **Yes** → spawn.
- **No** → do not silently proceed. In order: **degrade** the stage's depth one
  tier (§3), **drop** a stage that is not load-bearing, or **stop and ask the
  human** with the numbers. Raising the budget to fit the spend is the same
  anti-pattern `PIPELINE_SLOS.md` forbids for SLOs.

Default budget = Σ estimates of planned stages, rounded up one stage's worth as
headroom. A slice that needs more than **6 stages** or **~600k** is a signal the
slice is too big — send it back to the EM before spending, not after.

**Cost is a first-class gate.** A run that blows its budget is a failed run even
if every artefact is perfect.

## 3. Depth tiers

Rigor is a **dial the Orchestrator sets per stage**, not a constant. The default
is `standard`. `adversarial` is earned by stakes, never by habit.

| Depth | The stage does | Use when |
|-------|----------------|----------|
| `smoke` | Run the gates, report real output. No independent derivation. | Tier-1 docs/refactors; a re-gate of a one-line fix |
| `standard` | Verify the prior stage's claims independently; spot-check the risky parts. | **Default.** Seed apps, internal tools, no real user data |
| `adversarial` | Actively try to break it; write probe harnesses; hunt new attack surface. | Real user data, external surface, auth, money, irreversible actions |

State the depth **explicitly in the brief**. The `http-layer` run got
`adversarial` on every stage purely because the briefs said "attack", "probe",
"go beyond the shipped tests" — nobody chose it, and a dependency-free local
seed did not warrant 178k of QA.

Degrading depth is a legitimate response to budget pressure. Degrading it to
dodge a *finding* is not: if a stage at `standard` surfaces something that needs
adversarial depth, escalate the depth and the budget, and record why.

## 4. Incremental artefacts — no all-or-nothing work

Every agent **writes its artefact incrementally, section by section, as it goes**
— never buffering the whole document to a single write at the end. A stage killed
at 80% must leave 80% on disk.

This is not a style preference. Three agents were killed mid-stage by an
infrastructure limit in one session; each had done real work (one had already
verified clock-guard behaviour empirically, one had "found something in the blast
radius") and **all of it was lost**, because the artefact was still in the
agent's head. The re-run then paid full price from zero.

The Orchestrator states this in every brief. On re-spawn after an interruption,
hand the agent its own partial artefact back as input and tell it to continue —
resuming beats restarting.

## 5. Recording

`STATE.md` carries the Budget block; `trace.json` carries per-stage actuals.
Telemetry is taken from the **harness's** usage numbers, never from an agent's
self-report — a self-reported figure has already been observed to be wrong
(98,661 actual vs "~88,000" claimed). The Orchestrator writes the trace.

## 6. Stage resume — continue, never restart

§4 guarantees an interrupted stage left work on disk. This section says what to
do with it.

**The brief names the artefact's required sections, in order.** The agent writes
them in that order, so *what exists on disk is what is done* — no separate
progress file, no bookkeeping to fall out of sync.

On interruption, the Orchestrator:

1. Records it in the `STATE.md` **Interruptions** table (below) — cause, stage,
   and what the partial artefact reached. This is durable: a cold session picks
   up the same way.
2. Classifies it. An **infrastructure** interruption (usage limit, transport
   error, timeout with no output) is **not** a retry and does not consume the
   `FAILURE_LOOP.md` budget — nothing about the work failed. A **logic** failure
   does.
3. On re-spawn, hands the agent **its own partial artefact as an input**, with:
   *"Your partial work is at `<path>`. Read it. Continue from the first missing
   section. Do not restart, and do not rewrite sections that are already
   complete."*

Restarting a 70%-complete stage from zero is the most expensive thing this
pipeline can do — it pays full price for work it already owns. Three stages were
killed this way in one session before this rule existed.

## 7. Crystallization — verification migrates into code

Agent-derived verification is expensive and evaporates; tests are cheap and
permanent. QA wrote 119 adversarial probes in one stage for 178k tokens; a
handful became tests and the rest vanished, so the next QA run will re-derive
them at full price.

**The rule** (owned by QA, `agents/qa-evidence.md`): a probe that establishes
something a future change could break silently becomes a **test**; one-time
exploration becomes **a sentence in the report**. Every regression guard must be
proven non-vacuous — break the fix, confirm the test fails, restore.

This is the only lever here with *compounding* returns: it makes each subsequent
run cheaper rather than merely capping the current one. A pipeline that
crystallizes gets stronger and cheaper with use; one that does not pays full
price forever.
