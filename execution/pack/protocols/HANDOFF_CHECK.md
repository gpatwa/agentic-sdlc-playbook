# Protocol: Handoff Check

A cheap, continuous eval of the pipeline *itself*. Between two stages —
before the next agent starts — a **haiku-class validator** checks that the
outgoing handoff is complete. It is the runnable form of the handoff
principles in `docs/AGENT_ROLES.md`, and it gives the routing table's haiku
tier (`MODEL_ROUTING.md`) a standing job.

## When it runs

At every stage boundary, on the artefact just produced, before the
receiving agent is spawned. Fast and cheap enough to run every time.

## What it checks

Purely mechanical — it does not judge the work, only the envelope:

1. **Artefact present** — the named output artefact exists at the expected
   `runs/<slice>/` path and is non-empty.
2. **Minimal context** — the handoff names the file paths / commands / test
   names the next agent needs (not "the whole repo").
3. **Success criteria** — what "done" means for the next stage is stated.
4. **Constraints carried forward** — the inherited safety invariants and
   non-goals from prior stages are still present, not silently dropped.
5. **No invented claims** — the artefact doesn't assert a capability, file,
   or number that doesn't exist (a sanity pass, not a full review).

## Outcome

- **Pass** → the next stage proceeds.
- **Fail** → the handoff returns to the producing agent to complete, before
  the receiving agent burns context on an incomplete input. A failed check
  is a `context-gap` failure (`FAILURE_LOOP.md`), not a gate failure.

The check never approves or judges *quality* — that's the receiving agent's
job. It only prevents the common, expensive failure of a stage starting on
an incomplete handoff.
