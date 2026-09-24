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
- **Least-privilege:** <enforced / declared> — see "Least-privilege tier" below
- **Telemetry:** <otel / self-reported> — see `TELEMETRY.md`
- **Started:** <UTC>  ·  **Updated:** <UTC>

## Stages

| Stage | Owner | Status | Artefact | Gate |
|-------|-------|--------|----------|------|
| Intent | Human (Orchestrator drafts if given a one-liner) | confirmed | runs/<id>/intent.md | human confirms |
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

| Stage | Model | Effort | Start (UTC) | End (UTC) | Wall | Tokens | Tool calls | Retry # |
|-------|-------|--------|-------------|-----------|------|--------|------------|---------|
| <stage> | <model> | <effort> | <ts> | <ts> | <m:ss> | <n> | <n> | 0 |
| **Total** | | | | | | <Σ> | <Σ> | |

Record the effort the stage **actually ran at**, not the frontmatter
default — tier and failure escalation both move it (`MODEL_ROUTING.md`).
Without this column a routing change cannot be evaluated after the fact.

## Next action

<one line: the very next thing to do — what a resuming session executes>
```

## Machine-readable trace

Alongside `STATE.md`, each run emits **`runs/<slice-id>/trace.json`** — the same
per-stage telemetry as the Trace table, machine-readable, so analytics can
aggregate across runs without parsing markdown. STATE.md stays the human mirror;
neither is hand-parsed for numbers.

```json
{ "schema": "agentic-sdlc/trace@2", "slice": "<id>", "tier": 2,
  "overlay": false, "landed": true, "started": "<UTC>",
  "operator": "<who drove this run>",
  "leastPrivilegeEnforced": true,
  "leastPrivilegeNote": "<why — which tier, and what made it so>",
  "telemetrySource": "<otel | self-reported>",
  "approvals": [ { "action": "<what was approved>",
                   "rule": "<HUMAN_APPROVAL_RULES rule #, or why it was gated>",
                   "decision": "<approved|denied>",
                   "approver": "<the named person — never a role>",
                   "requestedAt": "<UTC>", "decidedAt": "<UTC>",
                   "record": "<path or URL to the durable record>" } ],
  "gateCatches": [ { "gate": "<QA|Security|...>", "verdict": "fail",
                     "severity": "<blocker|required-fix|advisory>",
                     "finding": "<one line: what it caught>",
                     "detectedAt": "<UTC, optional>",
                     "resolvedAt": "<UTC, optional>" } ],
  "stages": [ { "stage": "<name>", "executor": "subagent",
               "model": "<model>", "effort": "<level>",
               "tokens": 0, "toolCalls": 0, "retries": 0 } ] }
```

**`gateCatches`** records every defect a gate caught before it shipped — the
closest thing this system can honestly produce to an *impact* number. A gate
that fails a slice and sends it back is the pipeline earning its keep; counting
those catches, by gate and severity, is how the qualitative evidence ("QA
failed browser-client on a live a11y defect", "Security blocked the http-layer
bind") becomes a metric. Omit the array when nothing was caught; a genuinely
clean slice recording `[]` is different from an old run that never recorded it.

Pre-schema runs logged gate activity only in prose or an ad-hoc
`notes.gatesThatFired` array. `analyze.mjs` surfaces that legacy array too, so
existing catches aren't lost, but it labels the total a **floor** — a run whose
Security block lives only in its write-up cannot be counted structurally, so the
number under-reports until every run emits `gateCatches`.

**`detectedAt` / `resolvedAt`** (optional, per catch) are the failing verdict's
timestamp and the re-verified pass's timestamp — the blocked→unblocked window
`PIPELINE_SLOS.md`'s DORA mapping calls Failed-Deployment Recovery Time. Fill
them when both are known (the agent that raised the failing verdict records
`detectedAt`; whichever stage re-verifies the fix records `resolvedAt`); omit
both when the run predates this or the timestamps weren't captured live —
`analyze.mjs` reports FDRT as "not captured" rather than estimating it from
stage Start/End times, which span the wrong thing (a stage's own runtime, not
how long the *slice* sat blocked across possibly several stages).

**`leastPrivilegeEnforced` / `leastPrivilegeNote`** record which of
`ADAPTERS.md`'s two tool-scoping satisfaction tiers held for the run
(mirrored in prose by the STATE.md header line above). `true` (**enforced**)
means every stage ran as a subagent generated into `.claude/agents/`, with
the harness mechanically restricting its tools. `false` (**declared**) means
at least one stage ran with its brief inlined into a general-purpose agent —
no runtime tool restriction was in force, and the agent was relying on its
own brief's stated boundary. `leastPrivilegeNote` is free text: which stages,
and why (usually: which repo the Orchestrator session was rooted in).
Neither value is a defect by itself; an **omitted** field is.

Both fields were already real practice before they were a documented part of
this schema — three runs across both product repos (`stash-seed`
`saved-item-folders`, `streak-seed` `browser-client` and `security-hardening`)
recorded them under `notes.leastPrivilegeEnforced` /
`notes.leastPrivilegeNote`, on their own initiative, per the pack's `AGENTS.md`
instruction to record the gap rather than let it pass silently. This section
promotes them to top-level fields — the same move `gateCatches` made from
`notes.gatesThatFired` — because a convention three-for-three runs already
followed voluntarily belongs in the schema they were approximating, not
in `notes` pretending to be undiscovered.

**`approvals`** mirrors the STATE.md Approvals table in machine-readable form.
It was the single most load-bearing thing in this system that existed *only* as
prose: the named-approver claim is the centre of the whole accountability
argument, and until now no tool could read it. `conformity.mjs` falls back to
parsing STATE.md for runs written before this field, and labels those rows as
unstructured — a fallback, not a substitute, because a markdown table cannot be
checked for completeness. Record the **decision** verbatim (`approved`,
`denied`, `deferred`) rather than collapsing everything to a boolean: a deferred
item is evidence that scope was bounded deliberately, and is not an approval.
`approver` is a person. A role there fails `HUMAN_APPROVAL_RULES.md` and is
reported as a finding, because CC8.1 asks *who* and a team does not answer it.
Where the approval also produced an independently verifiable event — a pull
request review, a merge commit — put that in `record`: a reference someone else
can check is worth more than anything this repository asserts about itself.

**`telemetrySource`** records where this run's numbers came from — `otel` when
the harness emitted them from the instrumentation layer, `self-reported` when
the agent narrated its own `tokens` / `toolCalls` and those figures were used.
The distinction matters because the schema is otherwise filled in by the party
being measured, and a self-report in this repo has already been observed wrong.
`TELEMETRY.md` carries the enablement config and the per-field provenance map;
what belongs here is only which source held. Governance fields are unaffected —
`gateCatches`, `landed`, `operator` and the approval records have no
instrumentation equivalent, because a gate verdict is a judgement rather than a
measurement. As with `leastPrivilegeEnforced`, neither value is a defect by
itself; an omitted field is.

**`operator`** names the human who drove the run. A stage may carry its own
`operator` when a different person drove that stage; otherwise it inherits the
slice's.

Recorded now, while it is one field on a young corpus, because attribution is
painful to retrofit and impossible to reconstruct. Every run to date was driven
by one person, so the field costs nothing today and is the prerequisite for
anything multi-operator later — per-person budgets, slice ownership, or knowing
who to ask about a run. `analyze.mjs` stays silent about it while a fleet has a
single operator, and breaks figures out per operator once it has more.

**`stages` must list every stage that ran** — including ones the Orchestrator
executed itself rather than spawning. Mark those `"executor": "orchestrator"`;
`model`, `effort`, `tokens`, and `toolCalls` may be omitted when there is no
telemetry to report.

This is what `trace@2` fixes. Under `trace@1`, `stages` in practice meant
"stages spawned as subagents", and self-executed stages were dropped — or
recorded in an ad-hoc `notes.orchestratorExecuted` array that no tool read and
no schema described. Three of the first eight runs are in that state, so every
cost, density, and DORA figure for them was computed over a partial list with
nothing saying so.

`analyze.mjs` accepts both schemas and reports untraced stages either way — old
traces are run records and are not rewritten. What changes going forward is
that the omission is **structural and visible** instead of ad-hoc and silent:
a slice cost that excludes untraced stages is now reported as a floor.

The Post-Launch agent regenerates `runs/ANALYTICS.md` + `runs/dashboard.html`
from all traces via `execution/analyze.mjs` at slice close.

## Status values

- **in-progress** — a stage is actively running.
- **blocked-on-approval** — a human-approval gate is open; the run is
  paused and MUST NOT proceed (see `APPROVAL_PROTOCOL.md`).
- **blocked-on-failure** — a gate failed and the retry budget is spent;
  escalated to the human (see `FAILURE_LOOP.md`).
- **done** — the slice landed and Post-Launch is complete.
