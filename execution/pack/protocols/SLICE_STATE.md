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

## Failure budget

Class per `FAILURE_LOOP.md` "Failure categories".

| Stage | Retries used | Cap | Class | Last failure |
|-------|--------------|-----|-------|--------------|
| <stage> | 0 | 2 | — | — |

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

## Status values

- **in-progress** — a stage is actively running.
- **blocked-on-approval** — a human-approval gate is open; the run is
  paused and MUST NOT proceed (see `APPROVAL_PROTOCOL.md`).
- **blocked-on-failure** — a gate failed and the retry budget is spent;
  escalated to the human (see `FAILURE_LOOP.md`).
- **done** — the slice landed and Post-Launch is complete.
