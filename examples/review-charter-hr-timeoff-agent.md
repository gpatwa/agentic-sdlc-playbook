# Charter: assess-hr-timeoff-agent-2026-11-02

> **Example, filled in for the first trial target; the two sha256 values are placeholders of zeros, not real hashes.**
>
> The Charter for an **assessment run** (review mode, `docs/REVIEW_MODE_PLAN.md`): a read-only review of code Aveto did not
> build. The owner approves this file once, by its sha256, and the run asks nothing more until the end report. It checks with
> `node <playbook>/execution/charter-check.mjs <this file>` like any other Charter.
>
> **What is fixed for every assessment** (do not loosen): no model beyond the owner's own session; no safety text changed; the
> target is read in a copy, `assess-guard.mjs verify` must pass before the report is trusted; the run ends at the hard cap with the
> unreviewed list; the only thing it may add to a repository is a pull request that adds a `reviews/` folder.
> **What the owner fills in:** the repo and commit, the cap, the data classification and processor (C4), the reviewers' models.
> "None" is valid; a blank is not. The wording is "assessed against Aveto's gates", never "certified" or "compliant".

## 1. Scope
- **C1.1 Intent:** assess `hr-timeoff-agent` at commit `5c4098f884fc85b586a1a8f0e68706adb68a3853` against Aveto's gates, read-only; deliver `reviews/REPORT.md`. sha256 `0000000000000000000000000000000000000000000000000000000000000001`
- **C1.2 Plan:** `reviews/AREAS.md` from `assess-plan.mjs`, sha256 `0000000000000000000000000000000000000000000000000000000000000002`
- **C1.3 Non-goals:** fixing anything; running the target's code or tests against real data; contacting any service the code names; certifying the code.

## 2. Budget (unit: peak context summed per spawn)
- **C2.1 Plan total:** 1800k
- **C2.2 Ceiling:** 2250k. Above it the run continues and sends a notice.
- **C2.3 Hard cap:** 2500k. Above it the run stops and lists every area not reviewed. The run never raises it.

## 3. Models (rule 5)
- **C3.1** Reviewer: `claude-opus-5-5`, effort high, the operator's session
No second model family is used in this example; the report will say the assessment was a first pass.
- **C3.R Review rescore:** unscored: no calibration record for this model yet

## 4. Data processors (rule 6)
- **C4.D Data classification of the code reviewed:** public: the repository is public on GitHub and its data is synthetic
- **C4.1** Anthropic (the operator's own plan), receives: the files in the planned areas of `reviews/AREAS.md`, minus secret paths and held-back files, terms: the operator's plan terms, as known
- **C4.2** Nothing else receives the code. The assessment adds no hosted service, and Aveto's authors never see it.

## 5. Safety controls (rule 4)
- **C5.0** None. No invariant or guarded file may change. `assess-guard.mjs` denies edits in the review copy and its `verify` is the check.

## 6. Prerequisites (set once in the setup phase, each with its dry run)
| id | What | Why | Dry run that proves it |
|---|---|---|---|
| C6.P | The run needs no allow rule beyond reading: `Read`, `Grep` and `Glob` in the review copy, which `assess-guard.mjs prepare` writes to the copy's own `.claude/settings.json` (excluded from git there). Any other allow rule goes to `.claude/settings.local.json`, which is gitignored, never the tracked `.claude/settings.json`; no agent role is spawned, so no `Agent(qa-evidence)` style rule is needed | every stage | `assess-guard.mjs verify` passes after setup, before any area is reviewed |
| C6.1 | `assess-guard.mjs prepare` ran and printed the commit above | every stage | `git rev-parse HEAD` in the review copy equals the commit in C1.1 |

## 7. Depth (may not be lowered)
- **C7.1** Security Review: standard (adversarial for areas the plan marks high-risk)
- **C7.2** Release Gate tier: 1

## 8. Outcomes decided now
- **C8.1 If a pre-registered check fails:** if `verify` fails, write no report, record the failure, stop.
- **C8.2 At the end of a passing run:** write `reviews/REPORT.md` and stop. Do not open a pull request on the target repository.
- **C8.3 Irreversible actions allowed (rules 1 to 3):** none
- **C8.4 Human review of a Low-risk change at the end:** review

## 9. Stops (the only reasons the run asks)
1. An action not covered by a line above (a new model, processor, data, file, invariant, or irreversible action).
2. Spend above the hard cap (C2.3).
3. A credential is needed (agents never handle credentials).
4. Lowering a depth in section 7.
5. A change to this Charter (an amendment is a new approval of a new hash).
6. A file or finding that looks like a secret: stop, name the path, and let the owner decide.

## 10. Notices (sent, never asked)
A push notification at each area boundary with two lines: the area, its finding count and the spend. The full record stays in `reviews/`.
