# Protocol: Telemetry Provenance

Who produced a number decides whether it is evidence.

`trace.json` (`SLICE_STATE.md`) has always mixed two kinds of field. Some are
**governance facts** a human or a gate established — `gateCatches`, `landed`,
`operator`, the approval record. Others are **telemetry** — `tokens`,
`toolCalls`, `model`, `effort`, wall-clock. Until now both were written the
same way, by the agent narrating its own run, and a self-report has already
been observed wrong in this repo.

This protocol separates them. Telemetry should come from the runtime; the
record should say when it did not.

## Enabling runtime telemetry

Claude Code emits OpenTelemetry natively. Nothing in the pipeline has to
cooperate, and no agent has to be asked to report honestly:

```sh
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

Spans additionally require the beta flag:

```sh
export CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1
export OTEL_TRACES_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
```

Any OTLP backend receives it — MLflow, Langfuse, Arize Phoenix, LangSmith and
Laminar all accept OTLP, so no viewer needs building.

## What the runtime supplies

| Signal | Carries |
|--------|---------|
| `claude_code.api_request` (event) | `model`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`, `cost_usd`, `duration_ms`, `request_id`, `query_source`, `effort`, `agent.name` |
| `claude_code.tool_result` (event) | `tool_name`, `tool_use_id`, `success`, `duration_ms`, `error_type` |
| `claude_code.token.usage` (metric) | tokens by `type`, `model`, `query_source`, `agent.name` |
| `claude_code.cost.usage` (metric) | cost by `model`, `query_source`, `agent.name`, `effort` |
| `claude_code.tool` (span, beta) | `agent_id`, `parent_agent_id`, `subagent_type`, `tool_name` |

`query_source` is `main` / `subagent` / `auxiliary` — the same distinction
`trace@2`'s per-stage `executor` field records, now established by the runtime
instead of by the Orchestrator's recollection. `prompt.id` correlates a prompt
to every API call and tool result it caused.

## Field provenance in `trace@2`

| `trace@2` field | Source once telemetry is on |
|-----------------|------------------------------|
| `stages[].tokens` | Runtime — sum `input_tokens` + `output_tokens` per `agent_id` |
| `stages[].toolCalls` | Runtime — count `claude_code.tool_result` per `agent_id` |
| `stages[].model`, `stages[].effort` | Runtime — `claude_code.api_request` attributes |
| `stages[].executor` | Runtime — `query_source` |
| Wall-clock | Runtime — `duration_ms` |
| `gateCatches[]`, `detectedAt`/`resolvedAt` | **Agent + gate.** No OTel equivalent — a gate verdict is a judgement, not a measurement. |
| `landed`, `tier`, `overlay`, `slice` | **Human/Orchestrator.** Governance facts. |
| `operator` | **Human.** |
| `leastPrivilegeEnforced` | **Adapter.** See `ADAPTERS.md` invariant 4. |
| Approval records | **Human.** Signing them is separate work (`docs/BACKLOG.md` T14). |

The bottom half of that table is why `trace@2` stays. OTel models what a
program did; it does not model whether a human authorized it, whether a gate
refused it, or whether the slice landed. Emit OTel for telemetry, keep the
record for the things OTel has no concept of.

## Recording which source held

Set `telemetrySource` in `trace.json` for every run:

- **`otel`** — the numbers above came from the instrumentation layer.
- **`self-reported`** — telemetry was off for this run, so the agent's own
  figures were used. Not a defect; an unrecorded one is.

This mirrors `leastPrivilegeEnforced`'s two tiers. A run that says which source
it used can be audited. A run that says nothing cannot, and the standing caveat
in `docs/BACKLOG.md` applies to it in full.

## Verifying this document

Everything above is read from Claude Code's and OpenTelemetry's documentation.
Documentation is a claim; this repo's argument is that the difference from
evidence matters, so the claim has a checker:

```
node <playbook>/execution/otlp-probe.mjs --timeout 120
```

It stands in as the OTLP endpoint, records what actually arrives, and reports
which of the signals listed above were present — writing `report.md` alongside
the raw payloads. It exits non-zero when nothing arrives, so a session that was
started before telemetry was enabled fails loudly instead of producing an empty
report that reads like a pass. Claude Code reads its environment at process
start: **the session must be restarted after setting the variables**, or nothing
is emitted no matter what the config says.

Until a run of this probe says otherwise, treat the table above as unverified
and keep `telemetrySource: self-reported`.

## Honest limits

These are real and were checked, not assumed. None of them has been observed
live — this protocol is written from Claude Code's and OpenTelemetry's own
documentation, and the first run with a collector attached should be treated as
the actual test.

- **Per-role attribution is not available on metrics.** `agent.name` reports
  built-in agent types verbatim but collapses **user-defined agents to
  `"custom"`** — and every role in this pack is user-defined. Metrics will show
  one undifferentiated `custom` bucket, not 24 roles. Per-role cost therefore
  needs **spans** (`subagent_type`, still beta) or the `agent_type` field on
  hooks. Anyone wiring per-role cost analysis to metrics alone will get a
  single number and not notice.
- **Emission is Claude-Code-shaped, not convention-shaped.** Claude Code emits
  `claude_code.*` names. The OpenTelemetry **GenAI semantic conventions** —
  `gen_ai.operation.name`, `gen_ai.agent.id`, `invoke_agent`, `execute_tool` —
  are a separate vocabulary, and only `gen_ai.request.attempt` appears in
  Claude Code's span tree. What OTel buys here is **transport portability**
  (any OTLP backend ingests it), not **semantic portability**. A second adapter
  emitting proper `gen_ai.*` would still need a translation layer before its
  runs were comparable to these.
- **The GenAI conventions cannot be pinned.** Every `gen_ai.*` attribute is
  still marked *Development*, and the conventions moved into their own
  repository — `open-telemetry/semantic-conventions-genai` — which carries **no
  releases and no tags**. Do not couple `trace@2` tightly to a vocabulary with
  no version to hold onto. Map to it at the reporting edge if ever needed;
  don't adopt its names as the schema.
- **Traces are beta.** The span tree, and with it `parent_agent_id` and
  `subagent_type`, sits behind `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA`. Metrics
  and events are not beta.
