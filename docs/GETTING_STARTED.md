# Getting Started

Two questions, answered in order: what you actually get, then exactly how
to get it. Everything below is checked against real runs, not aspiration —
where a claim needs evidence, it points at the artefact that proves it.

## What you get

Not "faster code." A **record** — one that survives the session that
produced it and answers questions nobody thought to ask while it was being
written:

- **A named human on every consequential decision**, not a role. Every
  approval — ship this, deploy this, send this — is a durable artefact:
  who, what exactly they approved, when, and their answer verbatim. See
  `docs/HUMAN_APPROVAL_RULES.md` for which actions require this and
  `execution/pack/protocols/APPROVAL_PROTOCOL.md` for how the pause works.
- **Verification that didn't write the code it's checking.** QA and
  Security run as separate agents from Implementation, reading the diff
  cold. `docs/RELEASE_GATES.md` is the full gate map; a failed gate sends
  the slice back, never forward.
- **A refusal, not just a checklist.** An ask that conflicts with a
  recorded safety invariant is blocked at intake, before a line is
  written — proven neutrally on a real run: `docs/VALIDATION_MATRIX.md` §B3.
- **A machine-readable trace of every stage** — `runs/<slice>/trace.json`
  — cost, model, retries, which gates fired, who approved what. Two tools
  turn that into something you can hand someone:
  - `node execution/analyze.mjs <repo>` → `runs/ANALYTICS.md` +
    `dashboard.html` — cost, density, DORA-style metrics across every run.
  - `node execution/conformity.mjs <repo>` → `runs/CONFORMITY.md` — the
    same data mapped to what a SOC 2 auditor actually asks for (CC8.1
    change management, CC6.1 access scoping), with every gap stated, not
    hidden.
  - `node execution/verify-approvals.mjs <repo>` → checks any GitHub-PR
    reference in an approval record against GitHub's own API, rather than
    trusting the string. Flags a self-merged PR as self-merged, not as an
    equivalent-strength approval.

**This isn't a claim — it's checked.** `stash-seed` and `streak-seed`, the
two product repos this playbook has actually been run against, have seven
traced slices between them: real PRs, real merges, real gate catches
(a security gap the QA suite missed, caught before it shipped), real
budget overruns recorded honestly rather than smoothed over. `runs/*/trace.json`
in either repo is the primary evidence; `docs/VALIDATION_MATRIX.md` is the
narrative account of what each run proved and what it didn't.

## What it costs

Real numbers, not an estimate: **~756k tokens per slice on average**
(520k–947k observed range), dominated by turn count, not output length. A
slice needing more than 6 stages or ~600k tokens is a sizing signal, not a
target — see `execution/pack/protocols/RUN_ECONOMICS.md` for the per-stage
baselines and the budget-check discipline. This is spend an Orchestrator
checks *before* every spawn, never reconciled after.

## Two ways to run it

**Autonomous (Claude Code)** — the Orchestrator role is driven by an
actual agent session; gates, approval pauses, and state tracking are
mechanical. This is the path with real run history behind it and the one
below walks through.

**Manual (any tool)** — copy-paste prompts from `prompts/`, one per role,
run by a human relaying context between them. No state file, no automatic
gate enforcement; the discipline is on you. Start with `prompts/orchestrator.md`
if this is your path — the same lifecycle, without the harness.

## Setting up the autonomous path

### 1. Give the product repo a `.agentic/` folder

Every agent reads this first. It is **not generated** — there is no
scaffolding tool yet (a real gap, not an oversight; nothing here should
imply otherwise). The fastest honest start is copying a real one and
editing it down to your product:

```sh
cp -r <playbook>/examples/saved-items-bulk-delete/.agentic <product-repo>/.agentic
```

Four files, ~130 lines total in the worked example — small enough to read
end to end before you edit:

| File | Answers |
|---|---|
| `PROJECT_CONTEXT.md` | What this product is, who it's for, what's in scope |
| `SAFETY_INVARIANTS.md` | What must never break — this is what intake checks an ask against |
| `LOCAL_COMMANDS.md` | The exact commands an agent runs locally (test, build, lint) |
| `CURRENT_MVP_STATUS.md` | Where the product stands right now |

### 2. Pick a project pack

Read `project-packs/<archetype>.md` for your product shape (`b2c-saas`,
`ai-agent-product`, `browser-automation-product`, `enterprise-saas-future`)
— it names which overlay roles and gates apply. Skip enterprise overlays
(compliance, data governance, FinOps) unless you're actually in a
regulated or enterprise context; they add real gates, not decoration.

### 3. Install the pack

```sh
node <playbook>/execution/install.mjs <product-repo>
```

Writes `.claude/agents/` (one least-privilege subagent per role),
`.claude/commands/`, `.claude/protocols/`, and `AGENTS.md` + `CLAUDE.md`
at the product repo's root.

### 4. Start a fresh session, rooted in the product repo

Claude Code discovers `.claude/agents/` and `.claude/commands/` at
**session start** — not mid-session. Open (or restart) the session with
the product repo as its working directory, not the playbook. This matters
more than it looks: an Orchestrator session rooted elsewhere falls back to
inlined briefs with full tool access, silently losing the per-role
scoping — see `execution/ADAPTERS.md` invariant 4 for what "silently" is
not allowed to mean once that happens.

### 5. Run a slice

Either give it a one-line ask:

```
/agentic-slice "<what you want built>"
```

or, better, write the intent yourself first — one page, from
`templates/INTENT_TEMPLATE.md`: what you want, what "done" means as
checkable statements, what must not break, and what is at stake — and pass
its path:

```
/agentic-slice path/to/intent.md
```

Given a one-liner, the Orchestrator drafts the intent for you and marks
everything it guessed as **(inferred)**. You confirm the intent and the
plan together, once; nothing past scope review starts before that.

The intent is what decides how much process you get. A complete one with
low stakes takes the short path — no market research, discovery or UX
research, because you already said what those stages would have derived.
Tick real user data, money, anything irreversible, or a safety control, and
the full chain runs however well the intent is written. QA, Security and the
release gate run on every path; QA checks each "done means" line exactly as
you wrote it.

The session becomes the Orchestrator: plans the slice, writes
`runs/<slice-id>/STATE.md`, and delegates each stage to its subagent. A
gated action pauses and waits — no timeout auto-approves; silence is not
consent. `/agentic-status [slice-id]` checks where a slice stands;
`/agentic-resume <slice-id>` continues one cold, from a different session
if needed — the entire point of `STATE.md` being durable.

### 6. After it lands

Regenerate the fleet views:

```sh
node <playbook>/execution/analyze.mjs <product-repo>
node <playbook>/execution/conformity.mjs <product-repo>
node <playbook>/execution/verify-approvals.mjs <product-repo>
node <playbook>/execution/usage.mjs <product-repo>          # add --write to save runs/<slice>/usage.json
```

`usage.mjs` reports what each stage actually consumed, read from the logs
Claude Code itself writes rather than from the agents. It shows two numbers
per stage and keeps them apart: **processed** (every token of every request)
and **peak context** (the last request's size, which is what `trace.json`
records). Expect the first to be ten to fifty times the second.

`runs/CONFORMITY.md` is the artefact to hand someone who asks "how do you
know a human approved this."

## Honest limits, stated up front

- **Single-operator proven, not multi-operator.** Every real run to date
  was driven by one person. `trace.json`'s `operator` field is ready for
  more; nothing has exercised it yet.
- **No `.agentic/` scaffolding tool.** You are copying and editing a real
  example by hand. Templated generation is a real gap (see step 1 above),
  not a documentation omission.
- **Telemetry is self-reported unless you turn on OpenTelemetry.**
  `execution/pack/protocols/TELEMETRY.md` documents how; the standing
  caveat in `docs/BACKLOG.md` explains why it matters.
- **This installs a Claude Code adapter.** `AGENTS.md` is written to be
  tool-neutral, but the mechanics in "Claude Code specifics" — subagent
  dispatch, the budget-guard hook — are this adapter's implementation, not
  a universal guarantee. `execution/ADAPTERS.md` is the contract a second
  adapter would need to satisfy, and what it's checked against so far.

## Where to go deeper

| Question | Read |
|---|---|
| How does the whole lifecycle fit together? | `docs/ARCHITECTURE.md` |
| Who does what, who hands off to whom? | `docs/AGENT_ROLES.md` |
| What gates a merge / release / launch? | `docs/RELEASE_GATES.md` |
| What must a human always approve? | `docs/HUMAN_APPROVAL_RULES.md` |
| What's proven, and what's still open? | `docs/VALIDATION_MATRIX.md` |
| What's next / what's deliberately parked? | `docs/BACKLOG.md` |
