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
| Run guide | `pack/AGENTS.md` | The non-negotiable rules section intact. `AGENTS.md`, not a per-tool file — see below. |
| Config record | generated | Playbook path, generation time, pack version, `defaults` (wall-clock budget, retry caps) |

**The run guide is `AGENTS.md`, not a per-tool file.** `AGENTS.md` (Linux
Foundation, read natively by 20+ tools — Codex, Cursor, Copilot, Windsurf,
Devin, Zed, among others) is the adapter-independent source of truth for the
non-negotiable rules. A per-tool file — the Claude Code adapter installs a
`CLAUDE.md` that is a one-line `@AGENTS.md` import, since Claude Code does
not read `AGENTS.md` on its own — exists only to point *that* tool at it, and
carries nothing the rules depend on. Any tool-specific mechanics that are
genuinely not portable (subagent dispatch, a pre-spawn hook, `.claude/`
paths) live in a clearly labeled section inside `AGENTS.md` itself, not
folded into the universal rules. This does not by itself make the pack
work on a second runtime — see T12 in `docs/BACKLOG.md` for what still
would — but it is the first artefact any second adapter would not need to
reinvent.

## Invariants no adapter may weaken

These are spec, not adapter preference. Each is stated as an **outcome** —
something checkable from the run's own artefacts — not as a mechanism, so
an adapter satisfies it however its runtime allows. Where the reference
(Claude Code) adapter's mechanism is named, that is documentation of one
implementation, not the requirement itself.

*Revised 2026-09-11 (T12a).* Three of these were previously stated loosely
enough that a runtime honestly reporting a gap and a runtime silently
lacking the property looked the same on paper. Each is now precise about
what a second adapter must actually produce.

1. **Approval interrupt semantics** — pause on gated actions; an explicit
   human yes; a durable record **attributable to a named person, not a
   role** (`docs/HUMAN_APPROVAL_RULES.md`: *"who approved" is an identity*);
   no timeout-approve; silence ≠ consent. The identity requirement was
   implicit before this revision — an adapter recording `"approved": true`
   with no named approver did not visibly fail this invariant. It does now.
2. **Failure budgets** — bounded retries, bounded wall-clock, escalate to
   the human when spent.
3. **Pre-spawn cost check** — before a stage's cost is incurred, spend is
   checked against the declared budget, and a spawn that would exceed it
   is not silently allowed (`RUN_ECONOMICS.md` §2). This used to exist only
   as the Claude Code adapter's `hooks/budget-guard.mjs` — a real
   interception point, but Claude-Code-specific and never stated as a
   contract a second adapter had to meet on its own terms. It is fatal to
   this product's own thesis to have a budget control that only the
   reference adapter enforces: *"checked before every spawn, never
   reconciled after"* has to mean something on every adapter, not just this
   one. An adapter without hook-level interception satisfies this by making
   the check a mandatory Orchestrator step whose result is written to the
   slice's `STATE.md` Budget block before the spawn it gates — verifiable
   from the artefact, not merely asserted in a brief. `budget-guard.mjs`
   remains what it always was: a mechanical backstop for a discipline the
   Orchestrator role already owns, not the source of the guarantee.
4. **Per-role least-privilege tool scoping** — an agent acting in a role
   must not exercise tool access broader than that role's declared
   boundary. Two ways to satisfy this, both legitimate, neither silent:
   - **Enforced** — the runtime mechanically restricts the tools an agent
     can invoke (Claude Code: generated `tools:` frontmatter on a spawned
     subagent). Unbypassable by the agent itself.
   - **Declared** — the runtime cannot enforce this, so the role's own
     brief states its tool boundary as an instruction the agent is asked to
     honor, **and the run's `STATE.md` records that enforcement was not
     runtime-verified for that run.** This adapter already documents this
     exact fallback for inlined briefs (`install.mjs`: *"the harness
     enforces this; when it is inlined... honor it yourself — the boundary
     is the role's, not the harness's"*) — T12a promotes it from an
     undocumented degradation to a named, checkable satisfaction tier.
   A run that exercises neither tier — no runtime restriction, and no
   record that there wasn't one — fails this invariant. It was previously
   possible to fail it invisibly; it no longer is.
5. **Artefact handoffs** — agents communicate through files in
   `runs/<slice-id>/`, not shared context.
6. **Durable slice state** — a cold session can resume from `STATE.md`.

An adapter that can't implement one of these on its runtime isn't an
adapter with a limitation — it's a runtime that can't safely host the
SDLC yet. An adapter that implements 4 only at the Declared tier, on every
run, with no path to Enforced, is a weaker adapter than one that reaches
Enforced — but it is not in violation, provided every run says which tier
it got. Silence about which tier is what's forbidden, not the Declared
tier itself.

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
