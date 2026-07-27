# Protocol: Slice State

The slice-state file is the single source of truth for where a slice is in
the lifecycle. It lives at `runs/<slice-id>/STATE.md` in the product repo.
Any agent — or any fresh session — reads it to resume a slice cold, without
the originating conversation.

## Rules

- The Orchestrator creates `STATE.md` when a slice starts.
- Every agent **updates** `STATE.md` when it finishes its stage (before
  handing off).
- Never advance `Current stage` past a stage whose gate hasn't passed.
- Never advance past an open approval (see `APPROVAL_PROTOCOL.md`).
- Artefacts are referenced by path, never inlined.
- Alongside `STATE.md`, emit `runs/<slice-id>/trace.json` — machine-readable
  telemetry mirroring the Trace table (see "Machine-readable trace").

## Template

```markdown
# Slice State — <slice-id>

- **Ask:** <one-line human ask>
- **Project pack:** <archetype>
- **Release tier:** <1 / 2 / 3 / TBD>
- **Current stage:** <stage name>
- **Status:** <in-progress / blocked-on-approval / blocked-on-failure / done>
- **Started:** <UTC>  ·  **Updated:** <UTC>

## Stages

| Stage | Owner | Status | Artefact | Gate |
|-------|-------|--------|----------|------|
| Intake | Orchestrator | done | runs/<id>/00-slice-plan.md | n/a |
| Scope | Engineering Manager | in-progress | — | — |
| ... | ... | pending | — | — |

## Approvals

| Action | Rule | Requested | Decision | Approver | When (UTC) | Record |
|--------|------|-----------|----------|----------|-----------|--------|
| <action> | <HAR rule #> | yes | <approved/denied/PENDING> | <name> | <ts> | runs/<id>/APPROVAL_RECORD-*.md |

## Budget

Per `RUN_ECONOMICS.md`. Checked **before every spawn** — never reconciled after.

- **Budget:** <n>k tokens  ·  **Depth:** <smoke / standard / adversarial>
- **Spent:** <n>k (<pct>%)  ·  **Remaining:** <n>k
- **Next stage:** <stage> (<archetype>) est. <n>k → **<PROCEED / DEGRADE / STOP-AND-ASK>**

## Failure budget

Class per `FAILURE_LOOP.md` "Failure categories".

| Stage | Retries used | Cap | Class | Last failure |
|-------|--------------|-----|-------|--------------|
| <stage> | 0 | 2 | — | — |

## Interruptions

Per `RUN_ECONOMICS.md` §6. **Infrastructure** interruptions (usage limit,
transport error) are *not* retries and do not consume the failure budget;
**logic** failures do. On re-spawn, hand the agent its partial artefact back and
tell it to continue from the first missing section — never restart.

| Stage | Cause | Class | Partial artefact reached | Resumed |
|-------|-------|-------|--------------------------|---------|
| <stage> | <usage limit / transport / …> | infra \| logic | <last completed section, or "none"> | <yes/no> |

## Trace

One row per stage attempt — this is the pipeline's telemetry. Fill Tokens /
Tool calls from the harness's usage stats where available; wall-clock
always. Totals row = the slice's run cost. Feeds `PIPELINE_SLOS.md`.

| Stage | Model | Start (UTC) | End (UTC) | Wall | Tokens | Tool calls | Retry # |
|-------|-------|-------------|-----------|------|--------|------------|---------|
| <stage> | <model> | <ts> | <ts> | <m:ss> | <n> | <n> | 0 |
| **Total** | | | | | <Σ> | <Σ> | |

## Next action

<one line: the very next thing to do — what a resuming session executes>
```

## Machine-readable trace

Alongside `STATE.md`, each run emits **`runs/<slice-id>/trace.json`** — the same
per-stage telemetry as the Trace table, machine-readable, so analytics can
aggregate across runs without parsing markdown. STATE.md stays the human mirror;
neither is hand-parsed for numbers.

```json
{ "schema": "agentic-sdlc/trace@1", "slice": "<id>", "tier": 2,
  "overlay": false, "landed": true, "started": "<UTC>",
  "stages": [ { "stage": "<name>", "model": "<model>",
               "tokens": 0, "toolCalls": 0, "retries": 0 } ] }
```

The Post-Launch agent regenerates `runs/ANALYTICS.md` + `runs/dashboard.html`
from all traces via `execution/analyze.mjs` at slice close.

## Status values

- **in-progress** — a stage is actively running.
- **blocked-on-approval** — a human-approval gate is open; the run is
  paused and MUST NOT proceed (see `APPROVAL_PROTOCOL.md`).
- **blocked-on-failure** — a gate failed and the retry budget is spent;
  escalated to the human (see `FAILURE_LOOP.md`).
- **done** — the slice landed and Post-Launch is complete.
