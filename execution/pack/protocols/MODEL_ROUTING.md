# Protocol: Model Routing

Route by the **cost of a wrong decision**, not the size of the task. Model
price differences are roughly an order of magnitude per class
(haiku ≪ sonnet ≪ opus); that spread is trivial against the cost of a bad
irreversible decision and wasteful on mechanical work.

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

## Layer 2 — tier escalation (reuses release tiers)

The release tier is already the project's risk classifier — route on it:

- **Tier 1** (docs / refactor): drop one class — sonnet for judgment roles,
  haiku where mechanical.
- **Tier 2**: the static defaults.
- **Tier 3** (external effect / approval-gated): Architect, Security &
  Privacy, and Release Manager run **opus unconditionally**. Model cost is
  noise against incident cost here.

The Orchestrator applies tier overrides at spawn time; frontmatter is only
the static default.

## Layer 3 — escalation on failure

Per `FAILURE_LOOP.md`: the **final retry** of a failed stage runs one model
class higher than the attempt that failed. A same-model identical retry
adds little information; a class change changes the distribution. The cheap
path is the default; the expensive path is earned by evidence of
difficulty.

## Cache stability rule

Never switch models **mid-stage** — it forfeits the prompt cache. Route at
stage boundaries only. (Same reason the stage, not the step, is the unit of
handoff.)

## Recording

Every spawn records its model in the Trace table. If actual routing
diverges from this protocol (e.g. a manual override), note why in the
STATE file — silent divergence is how routing policies rot.
