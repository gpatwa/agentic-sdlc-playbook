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
1b. **Artefact complete, not merely non-empty** — it ends where a finished
   document ends. `RUN_ECONOMICS.md` §4 requires artefacts to be written
   incrementally so an interrupted stage leaves its work on disk; the direct
   consequence is that **a truncated artefact is now the expected shape of a
   killed stage**, and truncated artefacts are non-empty. Presence alone
   therefore stopped being evidence of completeness the moment incremental
   writes landed. Reject when any of these hold:
   - the template's required sections for that artefact type are not all
     present (each role's brief names them under Outputs);
   - the file ends mid-sentence, mid-table, or inside an unclosed code fence;
   - a section heading exists with no content beneath it;
   - a stated verdict is missing where the type requires one (a QA or
     Security artefact without a pass/fail, a Release without a go/no-go).

   The cost asymmetry justifies the check: a truncated artefact that passes
   here is read as authoritative by the next agent, which then reasons from a
   document whose missing half it cannot see.
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

A completeness failure (1b) **resumes** the producing stage rather than
restarting it — the partial artefact on disk is the resume point, which is
the whole reason `RUN_ECONOMICS.md` §6 requires incremental writes. Re-running
the stage from scratch discards work already paid for and is the more
expensive of the two paths.

The check never approves or judges *quality* — that's the receiving agent's
job. It only prevents the common, expensive failure of a stage starting on
an incomplete handoff.
