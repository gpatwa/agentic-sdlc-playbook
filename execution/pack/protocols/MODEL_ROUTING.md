# Protocol: Model Routing

Route by the **cost of a wrong decision**, not the size of the task. Model
price differences are roughly an order of magnitude per class
(haiku ≪ sonnet ≪ opus); that spread is trivial against the cost of a bad
irreversible decision and wasteful on mechanical work.

Routing has **two axes**: *which model* answers, and *how hard it works*
(`effort`). They are set independently and both bind through agent
frontmatter. The same principle governs both — buy depth where being wrong
is expensive, not where the task is merely large.

Three layers, applied in order. The model actually used is recorded in the
slice's Trace table (`SLICE_STATE.md`).

## Layer 1 — static per-role defaults

Written into each generated agent's frontmatter by the installer:

| Class | Roles | Why |
|-------|-------|-----|
| **opus** | Software Architect, Security & Privacy, Orchestrator | Judgment-heavy and error-expensive: design trade-offs, adversarial review, plan decomposition |
| **sonnet** (default) | Everyone else — engineers, QA, EM, PM, Release Manager, analysts, overlays | Solid code + structured reasoning; empirically sufficient (run-1 converged with the answer key on sonnet) |
| **haiku** | Not a role — a task class: status summaries, STATE bookkeeping, the handoff check (`HANDOFF_CHECK.md`), changelog formatting | Mechanical transforms of existing artefacts; no judgment |

The Orchestrator is usually the driving session (its model is the user's
choice); the frontmatter default applies when it is spawned as a subagent.

## Layer 1b — static per-role effort

The second axis, also written into frontmatter by the installer. `effort`
overrides the session level for the life of that subagent.

| Level | Roles | Why |
|-------|-------|-----|
| **high** | Architect, Security & Privacy, Orchestrator, QA, Release Manager, the three governance reviewers | Every gate, plus the two roles whose errors propagate furthest. Under-thinking here is the failure the whole pipeline exists to prevent |
| **medium** (default) | Producers — engineers, analysts, researchers, writers | They work against a spec that already exists; the judgment was spent upstream |
| **low** | The mechanical task class from the table above (STATE bookkeeping, handoff check, changelog) | No judgment to deepen |

Two asymmetries worth stating, because they are what keep this from
becoming a blunt cost cut:

- **Gates never drop below `high`.** A cheaper gate that passes a bad slice
  costs more than every token it saved. QA is on this list on evidence, not
  principle — it failed the `browser-client` slice on a live accessibility
  defect that a fully green suite could not see.
- **`low` is a task class, never a role.** A producer stage reduced to
  `low` risks under-thinking on anything non-trivial; reduce *depth* via
  the smoke/standard/adversarial tiers in `RUN_ECONOMICS.md` instead.

Effort is not a substitute for the depth tiers — depth says *how much
ground to cover*, effort says *how hard to think about the ground covered*.
Set both.

## Layer 2 — tier escalation (reuses release tiers)

The release tier is already the project's risk classifier — route on it:

- **Tier 1** (docs / refactor): drop one class — sonnet for judgment roles,
  haiku where mechanical. Producers drop to `low` effort; gates stay
  `medium`.
- **Tier 2**: the static defaults.
- **Tier 3** (external effect / approval-gated): Architect, Security &
  Privacy, and Release Manager run **opus at `xhigh` unconditionally**.
  Model and effort cost are both noise against incident cost here.

The Orchestrator applies tier overrides at spawn time; frontmatter is only
the static default.

## Layer 3 — escalation on failure

Per `FAILURE_LOOP.md`: the **final retry** of a failed stage runs one model
class higher than the attempt that failed. A same-model identical retry
adds little information; a class change changes the distribution. The cheap
path is the default; the expensive path is earned by evidence of
difficulty.

Effort escalates the same way and one step at a time: a stage that failed
at `medium` retries at `high`. Raise effort *before* raising model class —
it is the cheaper of the two changes and, on current models, frequently the
one that actually mattered.

## Cache stability rule

Never switch models **mid-stage** — it forfeits the prompt cache. Route at
stage boundaries only. (Same reason the stage, not the step, is the unit of
handoff.)

## Recording

Every spawn records its model **and effort** in the Trace table. If actual
routing diverges from this protocol (e.g. a manual override), note why in
the STATE file — silent divergence is how routing policies rot.

> **The density figures in `RUN_ECONOMICS.md` predate this axis.** They were
> measured with every stage at the session's inherited effort, so they are
> not valid baselines for a run that sets effort per role. Re-measure them
> from the next run's trace rather than adjusting them by assumption; until
> then, treat a variance against them as unexplained, not as a finding.
