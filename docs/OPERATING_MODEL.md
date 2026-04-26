# Operating Model

How the team of agents actually runs day-to-day. This document is the set
of rules that keep work small, context tight, and quality high — without
slowing the team down.

---

## Cadence

Work moves in **slices**. A slice is the unit the orchestrator hands to
the EM. It must be:

- Achievable in **one focused implementation pass** by one engineer agent.
- Self-contained enough to land as **one commit** (or a small, related
  series).
- Bounded by an explicit **non-goals list** so scope creep is visible.

Typical slice sizes:

| Slice type | Files touched | Est. tokens |
|------------|---------------|-------------|
| Bug fix | 1–3 | < 30k |
| Small feature | 3–6 | 30–80k |
| Phase / milestone | 6–15 | 80–200k |
| Cross-cutting refactor | varies | split, always |

A slice that crosses 200k of estimated work tokens MUST be split by the
EM. No exceptions.

---

## Context discipline

This is the single most important rule in the playbook. Agents lose
quality when their context fills with irrelevant material. Six concrete
practices keep context tight:

### 1. Small tasks

The EM rejects oversized slices. A slice that touches twelve files and
six concerns is six slices, not one.

### 2. One commit per task

When the engineer reports "done", the diff should describe one cohesive
change. Squash interim commits before handoff. A reviewer should be able
to read the diff once and understand what shipped.

### 3. Inspect only relevant files

Engineers read the files they need to change and the files those files
depend on. They do not pre-read the codebase "for context". If an agent
finds itself reading more than ten files for a slice, that's a signal the
slice is too big — escalate to the EM.

### 4. Targeted tests first

When verifying a change, run the most narrowly-scoped test that covers it
first (e.g. `npx vitest run tests/foo.test.ts`). Only run the full suite
once that passes. Targeted tests give a fast signal and keep the engineer
out of unrelated test output.

### 5. Full QA before commit

Before reporting completion, run the project's full local regression
command (e.g. `npm run qa:mvp`). One pass before commit prevents the
"it worked locally on the targeted test but breaks the suite" pattern.

### 6. Hand off through artefacts, not chat

Each agent reads its incoming artefact and writes its outgoing artefact.
It does not need to know what was said in the conversation that produced
the artefact. This is what makes role separation actually save context.

---

## Token / context limits

Models have finite context windows. Many also support prompt caching with
a short TTL (Anthropic's, for example, is five minutes), which makes long
mid-slice pauses expensive. These constraints shape how slices are sized:

- **Plan within the cache TTL, then act.** Don't pause to think for so
  long that you lose the prompt cache mid-slice — you'll re-pay the cost
  of replaying context. Treat the model's TTL as a soft budget on think
  time per round.
- **Avoid pulling whole files into context when a `grep -n` answers the
  question.** Read targeted ranges with `Read` `offset`/`limit`.
- **Avoid restating prior agents' work in your own response.** Reference
  the artefact path. The next agent reads it.
- **Don't dump full test output into messages.** Tail it. The signal is
  in the failures, not the passes.

---

## One commit per task

Each task ends with a single, focused commit message:

```
<imperative title under 70 chars>

<2–6 sentences on what changed and why>

<optional: bullet list of safety/behavioural notes if non-obvious>

Co-Authored-By: <model> <noreply@...>
```

The commit body should let a future reviewer answer:

1. What changed?
2. Why?
3. What safety properties were preserved?

Things the body should NOT contain:

- A blow-by-blow narrative of how the work was done.
- A list of files (the diff already shows that).
- Generic tool / model boilerplate (e.g. "Generated with <tool>") unless
  the project explicitly wants it.

---

## Branch and merge model

- **Trunk-based by default.** Slices land on `main` after their gates
  pass. No long-lived feature branches.
- **One slice per PR (or per direct commit if the project uses
  trunk-direct).** A PR that contains two unrelated slices gets split.
- **Never `--no-verify`, never force-push, never rebase published commits.**
  These are listed in `docs/HUMAN_APPROVAL_RULES.md` as actions that
  require explicit human approval.

---

## Communicating with the human

Only the Orchestrator communicates with the human user across stages.
Engineers, designers, and other role agents stay in their lane: they
produce artefacts, not status updates. The Orchestrator summarises status
back to the human at the natural pause points (slice plan agreed, slice
landed, slice released).

Status updates from non-Orchestrator agents during a slice should be
short — what was tried, what happened, what's next — not a narrative.

---

## When the rules conflict

If two rules conflict, prefer in this order:

1. Safety invariants (`docs/HUMAN_APPROVAL_RULES.md`,
   `.agentic/SAFETY_INVARIANTS.md`).
2. Release gates (`docs/RELEASE_GATES.md`).
3. Operating model (this document).
4. Project pack guidance (`project-packs/<archetype>.md`).
5. Local convention.

If the conflict can't be resolved, the Orchestrator escalates to the
human user with the trade-off named explicitly.
