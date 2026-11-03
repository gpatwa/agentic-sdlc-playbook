# Assessment calibration, 2026-11-02: second repo (`streak-seed`, JavaScript)

A second seeded run, to test two things the first run (`../assessment-calibration-2026-11-02/`, Python) could not: a different stack, and the one-command path `execution/assess-run.mjs`. Both reviewers ran through that command, so this is also its first live use with each reviewer CLI.

**Setup.** `streak-seed` (about 3,700 lines, ours, Node). A separate agent planted six bugs of different classes in a history-free copy and wrote `seeds.json` (public now; a rescore needs new ones). Reviewers: Codex CLI 0.153.4 (`gpt-5.6-sol`, reasoning medium) and Claude Code 2.1.316 (`claude-sonnet-5-5`, reasoning high), each blind, read-only, one call per area (10 areas), with no earlier findings and no hint about the seeds. Command: `node execution/assess-run.mjs <copy> --reviewer codex|claude --seeds seeds.json`. Both runs passed the read-only check and reviewed all 10 areas.

| Seed | Where | Class | Codex | Claude |
|---|---|---|---|---|
| S1 | `src/services/habits.js:85` | authz, P0 | found | found |
| S5 | `src/client/app.js:45` | error handling fails open, P1 | found | found |
| S3 | `src/services/streak.js:29` | logic (`trunc` where `floor` belongs), P2 | missed | found |
| S2 | `src/server.js:327` | input validation (length counted in code points), P2 | missed | missed |
| S4 | `src/client/dom.js:37` | injection (href allowlist uses `includes("#/")`), P1 | missed* | missed |
| S6 | `src/server.js:155` | race/resource (listeners kept after the body cap), P2 | missed | missed |

**Recall: Codex 2 of 6 (33%), Claude 3 of 6 (50%).** Six seeds, one run each: indicative only, and the two are not shown to differ.

\* Codex saw the S4 weakness but reported it against the test (`test/client-dom.test.js:216`: "passes the implementation's `includes("#/")` guard"), not against `src/client/dom.js:37`. The scorer matches on file and line, so it is a miss; a human reader would give partial credit.

**What this adds to the first run.**
- On the Python repo the Claude reviewers found 6 of 6 and Codex 4 of 6; here, with subtler seeds (three P2s of the "wrong at the edge" kind: length units, rounding, listener cleanup), they found 3 and 2. The first run's 6 of 6 was an easy seed set, or the reviewers were stronger on Python; one run cannot say which.
- The misses cluster in small, local, semantic bugs (S2, S3, S6) and a bypassable string check (S4). Both reviewers did find the two that break a security rule outright (S1 authz, S5 fails open).
- Both misses of S4 and S6 were in files the reviewers said they read ("Listed files not read: none"), so they are reviewer misses, not planner coverage gaps.

**Precision, on a judged sample of 30.** Of the 81 findings that match no seed (Codex 39, Claude 42), 30 were drawn at random, 15 per reviewer, with a fixed seed (`random.seed(20261102)`, `precision-sample.json`). One judge agent (Claude Opus, fresh, told nothing about the seeds or which reviewer wrote what) read the code for each and gave a verdict (`precision-sample-judged.json`, with its reason and a file:line). The judgments are the support session's, not the owner's.

| | Confirmed | Rejected | Intentional | Precision |
|---|---|---|---|---|
| Codex (15) | 11 | 3 | 1 | 73% |
| Claude (15) | 11 | 4 | 0 | 73% |
| Both (30) | 22 | 7 | 1 | **73%** (27 of 35 if the 5 seed matches are counted as true) |

One verdict was changed by hand: the judge confirmed Claude's F-07-3 ("README links `runs/`, which does not exist"), but the seeded copy omitted `runs/` when it was made, so I set it to rejected. Without that correction the figure is 77%.

**Read this number with care.** It clears the plan's 70% bar on 30 judged findings, but:
- With 30 findings a 73% result has a wide interval (about 56% to 86% at 95%), so "clears 70%" is not established; and the sample is two reviewers on one repo.
- The judge is one model, and Claude is one of the two reviewers it judged. A different family or the owner could rule differently. Nine of the 30 were confirmed but with severity "too high" (the judge's view), so the P1/P2 labels are generous.
- 23 of the 30 are about the repo's governance documents, agent definitions, README or CI file (contradictions between protocols, tool lists, unfilled placeholders), not about application code. They are real, but low-value next to the seeded bugs; a "confirmed" doc inconsistency is cheap to be right about.
- The owner has dispositioned none of them. Owner touches per finding is not measured.

The scorer works per reviewer, so each file shows 17 or 18 judged and "not measured"; the combined 30 is the figure above.

**A bug found while doing this.** `assess-run.mjs` mis-parsed reviewer rows whose evidence contains backticks (it split the row wrongly, so the reviewer name landed in the disposition column and the scorer saw almost nothing judged). Fixed in `execution/assess-run.mjs` (`splitCells`) with a test that fails on the old code; `FINDINGS.md`, `SCORE.md` and `REPORT.md` here were rebuilt from the saved raw replies. Recall figures did not change.

## Judge calibration (`assess-judge.mjs`, cross-family)

The 30 findings above were judged by an ad-hoc Opus agent. To test the real judge (`execution/assess-judge.mjs`, prompt in `templates/FINDING_JUDGE_PROMPT.md`), the same 30 were judged again by a different family from the one that wrote them: Codex (`gpt-5.6-sol`, medium) judged Claude's 15, Claude (`claude-sonnet-5-5`, high) judged Codex's 15. Neither saw the Opus verdicts. Raw output in `judge-calibration/`.

| | Exact agreement with Opus | True vs false positive agree | Judge's own precision on the 15 |
|---|---|---|---|
| Codex judging Claude's findings | 11 of 15 | 11 of 15 | 13 confirmed, 2 rejected (87%) |
| Claude judging Codex's findings | 11 of 15 | 13 of 15 | 11 confirmed, 3 intentional, 1 unclear (79% of the 14 it settled) |
| Both | **22 of 30 (73%)** | **24 of 30 (80%)** | 24 of 30 confirmed (80%) |

So the precision figure holds up under a second pair of judges: 73% (Opus) and 80% (cross-family), both over the 70% bar and both on 30 findings, with the same wide interval. The judges agree on most verdicts and disagree on about one in four; four of the eight disagreements are about an artifact described below, and the judges are not ground truth.

**The disagreements.**
- Claude F-04-1 and F-04-3 (about `.claude/settings.json`) and, in part, F-07-3: **an artifact of the review copy.** The guard overwrites `.claude/settings.json` with its own permission rules and holds the repository's original at `.assess-held/.claude/settings.json.txt`. The Claude reviewer's two settings findings describe the guard's file (no hooks, a short deny list); the Codex judge, working in the same copy, saw the same file and confirmed them; Opus read the original copy and rejected them. Rejected is right. The area prompt did not say any of this; it does now (`assess-plan.mjs`, with a test), and reviewers and judges are told to read `.assess-held/` for the repository's own configuration.
- Claude F-02-11: Opus confirmed, Codex rejected (a budget-estimate wording point). Unsettled.
- Codex F-07-1: Opus rejected, Claude confirmed (the playbook install path in `AGENTS.md`). Unsettled.
- Codex F-09-2 and F-03-2: Opus rejected, Claude said intentional. Both mean "not a defect", so they agree on the outcome.
- Codex F-02-8: Opus confirmed, Claude unclear.

**What the calibration does and does not show.** It shows the judge runs end to end through both reviewer CLIs, returns parseable verdicts for all 30, and lands within a few findings of an independent judge. It does not show the judge is right: there is no ground truth for these findings, only other judges. The owner's dispositions are the missing reference, and they outrank any judge.

**Bars after two runs.** Precision: 73% on 30 judged (above the bar, weakly supported, see above). Generality: 2 repos (Python, JavaScript), both ours; the plan's three, with one not ours, is still not met. Recall: 6 of 6 and 3 of 6 (Claude), 4 of 6 and 2 of 6 (Codex); no bar is claimed. Nothing here supports "the review finds the bugs"; it supports "it finds the loud ones and some quiet ones", with the misses listed.

Files: `precision-sample.json` and `precision-sample-judged.json` (the draw and the verdicts); per reviewer `FINDINGS.md`, `SCORE.md`, `REPORT.md`, `RUN.md` (model, effort, tool version, per-area counts).
