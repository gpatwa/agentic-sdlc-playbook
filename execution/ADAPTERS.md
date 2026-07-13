# Provider Adapters

The playbook is deliberately split into two layers:

- **The spec** — `agents/`, `templates/`, `prompts/`, `docs/`. Plain
  markdown, provider-neutral. Nothing in it assumes a vendor, a harness,
  or an API.
- **The adapter** — `execution/`. Everything harness-specific. The current
  implementation (`install.mjs` + `pack/`) targets **Claude Code** and is
  the reference adapter.

Supporting another runtime (OpenAI Agents SDK, Gemini, an internal
orchestrator) means writing another adapter under `execution/<harness>/` —
never forking the spec. The briefs stay the single source of truth.

## The adapter contract

An adapter MUST emit, into a product repo:

| Output | From | Requirement |
|--------|------|-------------|
| One agent definition per brief | `agents/*.md` | Brief inlined verbatim + execution preamble (protocol pointers); **least-privilege tools** per role; static model default per `pack/protocols/MODEL_ROUTING.md` |
| Entry-point commands | `pack/commands/` | Start / resume / status semantics preserved |
| Protocols | `pack/protocols/` | Copied verbatim — see invariants below |
| Run guide | `pack/CLAUDE.md` (or equivalent) | The non-negotiable rules section intact |
| Config record | generated | Playbook path, generation time, pack version, `defaults` (wall-clock budget, retry caps) |

## Invariants no adapter may weaken

These are spec, not adapter preference:

1. **Approval interrupt semantics** — pause on gated actions, explicit
   human yes, durable record, no timeout-approve, silence ≠ consent.
2. **Failure budgets** — bounded retries, bounded wall-clock, escalate to
   the human when spent.
3. **Artefact handoffs** — agents communicate through files in
   `runs/<slice-id>/`, not shared context.
4. **Durable slice state** — a cold session can resume from `STATE.md`.

An adapter that can't implement one of these on its runtime isn't an
adapter with a limitation — it's a runtime that can't safely host the
SDLC yet.

## Model naming

`MODEL_ROUTING.md` uses capability **classes** (opus / sonnet / haiku as
shorthand for frontier-judgment / strong-default / fast-mechanical). An
adapter maps classes to its provider's models in its config; the routing
logic (per-role defaults, tier escalation, escalate-on-final-retry) is
unchanged.

## Product-side provider abstraction

Separately from all of this: the **products** built with the playbook keep
model providers behind the throwing-placeholder adapter pattern
(`agents/ai-engineer.md`). Pipeline adapters and product adapters are
different seams; don't conflate them.
