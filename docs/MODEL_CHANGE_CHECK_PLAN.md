# Plan: a model-change check for more than the review step (proposal, 2026-11-10)

> **Proposal. Nothing here is built, and nothing here spends anything until the owner approves a run.** Raised by the owner's
> question: "with every new model release, how do our agents get better at their role?" The honest answer is that they do not
> improve by themselves, and today we cannot say whether a model release helped or hurt any role except the review step.

## What exists, and what is missing

- **Exists:** the review step is rescored against `docs/review-evals/cases.toml` when its prompt, skill, model or effort changes,
  and the Charter records the status on its C3.R line. Static model and effort per role live in `MODEL_ROUTING.md`.
- **Missing:** `docs/review-evals/RESULTS.md` holds almost no recorded rescore (six lines). Every other role has no check at all.
  A model change moves the architect, QA, security and the rest with no measurement, and the routing defaults were chosen once.
- **Also missing:** a comparison across models. A single score says nothing about whether the new model is better than the last.

## Design

1. **Cases per role, from our own incidents.** Each role gets 6 to 8 cases built from real lessons (`docs/LESSONS.md`) and past
   runs, in the style of `cases.toml`: the input, what a good output must do (`must_do`), and what it must not do (`must_not`).
   Prefer checks a script can score (a named file written, a named risk raised, a forbidden path not touched). Where a person must
   judge, say so.
2. **First roles:** the review step (already has cases), the Software Architect (high effort, errors propagate), and QA Evidence
   (a gate). Chosen because a wrong output from each is expensive and they are the roles with the clearest checkable duties.
3. **Run each case at least three times.** The Scout pilots showed run-to-run variation (the top candidate changed between runs),
   so one run per case would measure noise. Record the pass rate per case, the model ID, the effort, the date, the pack version and the
   spend.
4. **Compare, do not score alone.** On a model release, run the same cases on the old and the new model and record both. The
   Charter's C3.R line generalises to "rescore status" for each role it names, with the date and the result.
5. **Runs go through a harness session that spawns the role subagents** (no terminal CLI runs, per the owner's rule). The case
   files, a prompt for the driving session and a scoring script are the repo's part.

## Cost, as a guess

Per role: 6 to 8 cases, three runs, two models, so about 36 to 48 spawns. At the Scout's measured 40k to 47k tokens per spawn
(a peak-context figure of unconfirmed unit, and the Scout is a small role) that is roughly 1.5M to 2.3M tokens a role, so about 3M to
7M tokens for three roles. **This is an estimate with no measurement behind it**; the first approved run should measure it.

## What it can and cannot show

- **Can show:** whether a given role's pass rate on our own cases moved when the model or effort changed, and what it cost.
- **Cannot show:** that a role is good in general (the cases come from our incidents), anything about roles with no cases, or that a
  pass rate predicts production outcomes. Three runs a case is a small sample, and a scripted check is only as good as its case.

## Phases (each waits for what is named)

| Phase | Work | Spend | Needs |
|---|---|---|---|
| B1 | Pick the cases: 6 to 8 per role for the architect and QA from `LESSONS.md` and past runs; record the existing review rescore in `RESULTS.md` | none | **done 2026-11-10** for the architect (5) and QA (6) cases: `docs/model-change-evals/cases.toml`. The review rescore is **not** recorded yet. |
| B2 | Case files, the driving prompt and a scoring script, with tests that the scorer passes a known-good and fails a known-bad output | none | **done 2026-11-10**: fixtures, `execution/role-eval.mjs`, 12 tests (493 in the suite). Three scripted cases have known-good and known-bad samples; the eight judged cases need a judge, which is B3's part. Never run on a model. |
| B3 | One approved run set on the current model, to measure spend and variance | model spend | **one pass done 2026-11-13** (`docs/model-change-evals/b3-2026-11-13/`): 11 of 11 PASS, 650k tokens (judges 73%); cases leak: five roles read beyond the task, so B4 needs a clean directory or limited tools; a leaner judge first. Three passes not run |
| B4 | The same set on the next model that ships, compared | model spend | a model release, and the owner's approval |

## Open decisions for the owner
1. Which roles after the first three, and whether the Scout belongs (it has the least stable output).
2. Whether C3.R becomes a per-role line in the Charter template (a template change and a `charter-check` change).
3. The spend ceiling for B3.

**2026-11-13:** what happens at each model release, step by step, is `docs/MODEL_RELEASE_PROCEDURE.md`; `execution/model-drift.mjs`
shows which model each role ran on and flags a baselined role that has moved (`docs/model-change-evals/baselines.json`).
