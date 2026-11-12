# Scout variance test: three identical runs on pack v35 (criteria fixed before any run)

> Written 2026-11-12 by the support session; the owner chose "5 variance runs" from the Scout improvement list. **Fixed before the
> first run and not changed after it.** Runs happen in the scratch repo `/Users/gopalpatwa/opt/scout-pilot` (pack v35 installed at
> its commit `8b6a624`), in one desktop session started from a chip, under **one** Charter covering three Scout spawns, approved by the owner's
> typed sha256 in that session. Each spawn is a fresh subagent; the Orchestrator passes it the same prompt and nothing from an
> earlier spawn.

## What is measured

How much the Scout's output changes when nothing changes: same pack (v35), same model, same question, same candidates, no planted
instruction. Pilot runs 3 and 4 ranked a different candidate first; this test says how much of that is noise. Because v35 also
changed the evidence rules, it also shows whether the new rules are followed. It cannot separate "v35 is better" from "v35 is
different"; that needs the owner's spot-check as an answer key.

## Inputs, identical for all three runs

- Question and candidates: `docs/data/scout-pilot-2026-11/PILOT_PROMPT.md` (its canary URL and pass criteria do not apply), the
  question verbatim: "Which problem should Aveto build a product or agent for next?"
- No first source given; the Scout starts from the public web.
- Run folders: `runs/opportunity-variance-1`, `-2`, `-3`.
- Budget (Charter section 2), for the three spawns together: plan 180k, ceiling 270k, hard cap 330k (peak context summed per
  spawn; checked by hand after each spawn, since a Scout run has no `STATE.md`; the run stops before a spawn that would pass the cap).

## What is recorded (by the support session from the files, not from the Orchestrator's report)

| Measure | How |
|---|---|
| Top candidate | the rank-1 row of each `SCOUT.md` |
| Rank agreement | for each pair of runs, how many of the candidates hold the same rank; and whether the top two are the same set |
| Readiness labels | each candidate's label ("ready", "needs more discovery", "drop") per run |
| v35 rule: shared origin | each candidate's signals list an origin; no two counted signals share one |
| v35 rule: non-vendor evidence | each candidate has a non-vendor source or "non-vendor evidence: none found" with where it looked |
| v35 rule: disconfirming search | each candidate reports a search phrased to disconfirm, and what it found |
| Spend | per run, from the harness |
| Web calls | count per run, and how many fetched URLs the three runs share (event log targets) |

## How it is read (fixed now)

- **Stable:** the same top candidate in all three runs and the same top-two set. Rankings below that may move.
- **Unstable:** the top candidate differs in any run. Then no single Scout run should be used to choose work; the pilot's "use as
  leads" stays, and the next step is a verifier or more runs, not a decision.
- **Rules followed:** all three v35 rules met for every candidate in every run. Any miss is listed by run and candidate.
- Nothing here is pass or fail for the Scout as a product; it is a measurement. A run that breaks a Charter line is recorded as such.

## Limits known now

Three runs is a small sample: "stable" here means "did not flip in three tries", not a rate. The web changes between runs a few
minutes apart only a little, but search results are not fixed. Same model, same day.
