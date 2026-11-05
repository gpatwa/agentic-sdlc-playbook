# Budget ratios: plan against actual (T42 step PM2)

> Computed 2026-11-04 by the support session from the run records in `aveto-support` (plan totals from each run's `CHARTER.md`
> line C2.1; actuals from `runs/<slice>/trace.json`, summing `stages[].tokens`) and one streak-seed run. **n is small and the
> sample is one repo, one operator and tier 3 work, so this calibrates Aveto's own plans only. It says nothing about
> estimation in general** (the research found no study of that).

## Unit

Every figure is in tokens as the run records them: **peak context summed per spawn** (the `tokens` field in `trace.json`, the
number the budget guard and the Charter ceilings use). It is not the sum of all requests and not billing. The same runs total
very differently on other measures (5.79M against 314k for one run), so never compare these figures with `usage.json`'s
`processed` totals or with a bill. The Orchestrator's own turns are not in `stages[]`.

## The five aveto-support runs that have both a Charter plan and a trace

| Run (tier 3) | Plan (C2.1) | Ceiling (C2.2) | Hard cap (C2.3) | Actual | Actual ÷ plan | Actual ÷ ceiling |
|---|---|---|---|---|---|---|
| fix-service-accounting | 730k | 950k | 1,200k | 919k | 1.26 | 0.97 |
| land-answerability | 450k | 600k | 750k | 651k | 1.45 | 1.09 (over) |
| polished-chat-experience | 1,000k | 1,300k | 2,000k | 1,572k | 1.57 | 1.21 (over) |
| public-ask-the-docs | 2,000k | 3,000k | 3,600k | 2,496k | 1.25 | 0.83 |
| result-page-clarity | 400k | 720k | 800k | 579k | 1.45 | 0.80 |

- **Actual ÷ plan: 1.25, 1.26, 1.45, 1.45, 1.57. Median 1.45. Every one of five ran over plan, none over its hard cap.**
- Two of five crossed the ceiling (a notice, not a stop). The three that did not had ceilings of 1.3× (fix-service-accounting),
  1.5× (public-ask-the-docs) and 1.8× (result-page-clarity) the plan; the two that did had 1.33× and 1.3×.
- One run from another repo, for contrast, not for the table's statistics: streak-seed `health-version` spent 141k against a
  120k plan (1.18); its record does not say which token measure that figure uses, so it is not pooled.

## What this does not cover

- **The seven earlier aveto-support runs** (retrieval and abstention work, September to early October) have no Charter plan
  total on file, so they have no ratio. An earlier note that they ran "17 to 99% of plan" has no plan figure behind it in these
  records and is not repeated here.
- **Per-stage calibration.** The plan tables list estimates per stage but the stages in `trace.json` are not keyed to them
  (run 1 planned 11 stages and recorded 13), so a per-stage ratio would be a guess. Stage-level calibration needs the trace to
  carry the planned stage id; recorded as a gap, not filled.
- Other repos: `stash-seed` and `streak-seed` runs predate Charter plan totals, apart from the two streak-seed routine runs
  (`health-version`, `readme-test-count`); only the first has a recorded actual.

## Proposal for the next Charter (owner decides)

- State the plan as **the estimate, then the expected actual at about 1.45× it**, and set the ceiling so the expected actual sits
  under it: **ceiling at least 1.6× the estimate** for tier 3 work of this kind. This only restates what five runs did; it
  changes no hook or rule, and `RUN_ECONOMICS.md`'s current 1.3×/1.5× ceilings stay as written until the owner edits them.
- Re-compute this file after every ten recorded runs. A ratio set that stops being roughly stable means the plans, not the
  ceilings, are what needs attention.
- Tier 2 and tier 1 work has no data here. Do not apply 1.45× to it.
