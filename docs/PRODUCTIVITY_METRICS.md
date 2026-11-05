# Productivity metrics: the dictionary (T42, step P1)

> **Draft for the owner to edit.** Written 2026-11-04 by the support session. Nothing here is computed yet except where a row says
> "computed today". It is the contract `execution/outcomes.mjs` (P2) will be built to, so a figure that is not in this file does
> not appear on the dashboard. Plan: `docs/PRODUCTIVITY_AND_ORG_PLAN.md`. Evidence behind the choices:
> `docs/research/2026-11-project-management-with-ai-agents.md`.

## Rules that apply to every row

1. **Outcomes and teams. Never inputs, never individuals.** Tokens, lines of code, prompt counts and "number of agent runs" are
   not scores. Tokens appear only as **cost** (group C). Nothing is broken down by person, and there is no ranking anywhere.
2. **Every metric has a decision and a gaming check.** A metric with neither is not added.
3. **No metric is shown alone when a counterweight exists.** Lead time is always displayed beside change failure (Q2) and review
   burden (H4), because a faster lead time can mean thinner review.
4. **State n and the unit.** Every figure shows how many slices it covers. Below ten slices no percentile is drawn, only the list.
   Token figures name their unit: the repo's records hold peak-context sums per spawn, and `ANALYTICS.md` and the dashboard have
   totalled the same runs at different scales (5.79M against 314k for one run), so a bare "tokens" is not allowed.
5. **Recorded or "not recorded".** A metric whose data is missing says so. It is never filled with an estimate or a model's guess.
6. **Computed from git and the run records, with no model call,** and with zero changes to the target repo.
7. **Reported against the repo's own history.** Cross-repo comparison is not offered. A before and after claim needs the same repo's
   history from before adoption.

**Status words.** *computed today* = `analyze.mjs` already does it. *needs PM1* = blocked on fixing the records (`landed` is false in
all 13 aveto-support traces although PRs merged; there is no `landedAt`). *needs collector* = the data is in the session
transcript, not in `trace.json` (backlog T30). *git only* = derivable from the repo's history with no Aveto records, so it works on
a repo such as `hr-timeoff-agent` (the test bed) that has none.

## A. Delivery

| Id | Metric | Definition | Decision it informs | Gaming check | Source and status | What it cannot show |
|---|---|---|---|---|---|---|
| D1 | **Lead time** | Hours from the Charter approval to the PR merge, per slice; median and the slowest tenth | Is the path from approved intent to merged work getting shorter or longer? Where does it wait? | Splitting work into trivial slices; approving late. Always read beside Q2 and H4 | Charter `decidedAt` in `trace.json` approvals to the git merge time. *Needs PM1* (no merge time is recorded; `analyze.mjs` expects `landedAt`). Git-only variant: first commit on the branch to merge | Whether the thing was worth building; waiting that happened before approval |
| D2 | **Slices merged per period** | Count of slice PRs merged per calendar week | Capacity: is the pipeline steady, or bunching behind review? | Many tiny slices. Read beside slice size (C2) | Git merge history. *Git only* for PRs; slice identity from the branch or run folder name | Value delivered; counts activity |
| D3 | **Time to restore** | Hours from a production-affecting merge to the revert or fix that restores service | How quickly can a bad change be undone? | Not reporting incidents | Git revert or hotfix commits; deploy records where they exist. Mostly **not recorded** in the current repos | Incidents that were never recorded; severity |

## B. Quality and rework

| Id | Metric | Definition | Decision | Gaming check | Source and status | Cannot show |
|---|---|---|---|---|---|---|
| Q1 | **Gate catches against escapes** | Defects the gates caught before merge (`gateCatches` with a required fix) against defects found after merge (Q2) | Are the independent gates earning their cost? | Reclassifying a finding to change the ratio. Findings keep their recorded severity | `gateCatches` in `trace.json` against Q2. *Computed from records*, needs Q2 | Defects nobody found |
| Q2 | **Post-merge fix or revert rate** | Share of merged slices followed within 14 days by a revert or a fix commit that names the slice (14 is a proposal; the owner sets N) | The central counterweight to speed: did the work hold? | Calling a fix a "new feature" | Git history; `analyze.mjs` counts `postLandingFixes` and `reverted` from `trace.json` today (**change failure rate**, **rework rate**: *computed today* where those fields are filled). Git-only variant by commit message and file overlap | Silent defects; fixes under another name |
| Q3 | **Review findings per slice** | Findings raised by the review and QA stages, by severity | Is the build stage producing work that needs more rework? | Weakening the review so it finds less. Pair with P6's judge rejection rate | Stage outputs and `gateCatches`. *Recorded in prose today, not structured* | Quality of the reviewer |
| Q4 | **CI failures per merge** | Failed required checks before the PR's first green run | Is the base healthy; is the author pushing unchecked work? | Re-running until green. Count first-run result only | GitHub API for the PR's check runs. *Git host only*; needs `gh` | Flaky checks |

## C. Cost (tokens live here, and only here)

| Id | Metric | Definition | Decision | Gaming check | Source and status | Cannot show |
|---|---|---|---|---|---|---|
| C1 | **Cost per merged slice** | Tokens (peak-context sum per spawn, named) per slice merged, with the plan figure beside it | Is the pipeline affordable at this level of review? | Splitting a slice to hide cost. Always show slice size | `trace.json` `stages[].tokens` and Charter plan. *Computed today* (as run cost), per-merged-slice needs PM1 | Cost of the orchestrator's own context; the human's time |
| C2 | **Plan against actual** | Actual tokens as a share of the Charter's plan, per slice; and per stage kind | Are estimates trustworthy; do ceilings need calibrating? | Raising the plan to look accurate. The plan is frozen at the Charter hash | Charter plan against `trace.json`. Feeds `docs/data/budget-ratios.md` (PM2) | Why the miss happened |
| C3 | **Spread, not rank** | The costliest and slowest tenth of slices by C1 and D1, listed with their reasons | Which kinds of slice are the outliers? (Amazon's memo watches the 10th and 90th percentile of adoption; this is the same idea applied to slices, never people) | Hiding outliers by averaging. The list is shown, not only a mean | Derived from C1, D1. Only drawn at n of 10 or more | Causes |

## H. Human attention (the scarce resource)

| Id | Metric | Definition | Decision | Gaming check | Source and status | Cannot show |
|---|---|---|---|---|---|---|
| H1 | **Owner touches per slice** | Messages the human types in a run's session after the Charter approval, plus the end review. Target: the approval alone | Is the process asking for more attention than it should? | Batching decisions into one long message; not asking when it should. Pair with H3 | Session transcript. *Needs collector* (T30); defined in `PIPELINE_ANALYTICS.md`, not computed | Quality of the attention |
| H2 | **Time to first touch** | Minutes from the Charter approval to the first later human message | Are runs stalling for a person? | None obvious; read with H1 | Session transcript. *Needs collector* | Time the person was away by choice |
| H3 | **Questions after the Charter** | Times the run stopped to ask the owner after approval. Target: zero | Is the Charter complete enough to run unattended? | Not asking when it should (hard stops stay on) | `END_REVIEW.md` carries it. *Recorded in prose* | Questions that should have been asked |
| H4 | **Review burden** | Changed lines (added plus removed, excluding generated files and lockfiles) a human must read, per merged slice; and the share of PRs merged with no recorded GitHub review (a review object on the pull request; a person reading the diff and merging without leaving one is not counted as a review) | Is the unit small enough to be reviewed well? The research names review capacity as the common constraint | Padding a diff with generated files. Excluded paths are listed | Git diff of the PR. *Git only* | Whether the review was careful |
| H5 | **Reviews waiting** | At a snapshot: open PRs awaiting the owner, and the age of the oldest | Is the owner the bottleneck right now? | Closing and reopening PRs. Age counts from first ready-for-review | GitHub API. *Git host only* | Why it is waiting |

## Not metrics here (and why)

| Not shown | Why |
|---|---|
| Tokens, lines of code, prompt counts, number of agent runs, AI adoption rate as a score | Inputs. They rise without helping anyone; Amazon's own memo calls them flawed as targets |
| Any per-person figure or ranking | A leaderboard was shut down at Amazon after people used the tool to climb it. Aveto has one operator, so a per-person view would also be a report on that person |
| Story points, velocity | No evidence found that any replacement forecasts better; token plans are a cost guardrail, not capacity |
| "Productivity gain", "hours saved" | Not measurable from these records. A claim needs a baseline from the same repo (rule 7) and the pilot (P5) |
| Estimation or sprint accuracy as a claim about AI | No study found; C2 measures only Aveto's own plan against its own actuals |

## Health of the measures (step P6)

- Report the **judge rejection rate** with every judged sample and flag zero rejections over ten or more findings (the lenient-judge signal seen on the microblog run).
- When a metric moves and no outcome moves with it, record that beside the metric and review whether it still belongs.
- Every metric carries its definition and gaming check on the page that shows it; the dashboard renders this file, it does not paraphrase it.

## For the owner to edit

1. Is 14 days the right window for Q2, or does a different N fit the products?
2. D1 starts at Charter approval. Do you also want the earlier time from the first idea (the intent file) recorded?
3. H4 excludes generated files and lockfiles. Add any other paths?
4. Anything here you would never want shown, or anything missing that you would act on?
