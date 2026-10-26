# Review-mode spike: can a whole-codebase review find what we know is there?

> **Decided 2026-10-25 by the owner: "A, spike first".** This replaces the front of `docs/REVIEW_MODE_PLAN.md`
> (M1 to M3b and M5 are deferred to a later milestone; the owner's priority is to review and polish what exists).
> **Bars fixed on 2026-10-25, before any review ran. They are not moved after.**

## Why a spike

The review-mode plan spends about 1.4M tokens of building before it measures anything. Its own risk section says
whole-codebase review quality is unknown. A spike measures that first, with two reviewers, in two sessions, for a
small fraction of the cost. If the answer is no, the 1.4M is saved.

## The target

A history-free copy of aveto-support's product code and tooling at `c150673` (the commit before the fix for S5):
`~/opt/aveto-review-spike/aveto-support-c150673/`. 77 files, about 15,000 lines: `.claude/` (agents, commands,
skills, hooks, settings), `aveto_support/`, `tools/`, `prompts/`, `tests/`, `pyproject.toml`, `uv.lock`,
`docs-source.toml`. An empty base commit, with the whole tree staged on top, so a review of "the current diff" sees
the entire tree. **Left out on purpose:** `runs/`, `docs/`, `evals/`, the README, and all history, so no record or
commit message can tell a reviewer what was found later. The copy was searched for any mention of the incidents (none).
The real repository is not touched.

## What is known to be in it (ground truth)

| Incident | In the copy? | Where |
|---|---|---|
| **S5, quote breakout** | **Yes** | `.claude/skills/aveto-judge-seen/SKILL.md` line 9: `'$ARGUMENTS'` inside single quotes in a shell-injection line; a single quote in the argument breaks out and runs a second command |
| **S6, wildcard permission rule** | **No.** It lived in `.claude/settings.local.json`, which was never committed anywhere | not testable from the repository; the review-mode plan's "find both S5 and S6" bar was impossible as written, and is corrected here |

One known incident is a very small recall test. The report says so.

## The two reviewers (neither is told what to find)

- **R1:** Claude Code's local `/code-review` at high effort, in a fresh session whose folder is the spike copy, run on
  each area in turn (`.claude`, `aveto_support`, `tools`, `prompts`). Never `--fix`, never `ultra`.
- **R2:** the Codex desktop app, in a new chat (not one that has seen this repository), asked for a blind review of the
  same tree, with the same rules as the trial's blind prompt.

## Bars (per reviewer, reported separately)

| Measure | Bar |
|---|---|
| **Recall** | The review raises S5 (caller text inside single quotes in a shell line allows a second command) without being told |
| **Precision** | At least **70%** of its findings are real, on all of them or the first 30 by severity. Real means dispositioned `fixed`, `accepted` or `intentional`; `rejected` is noise. The support session proposes each disposition and **the owner confirms any that are disputed** |
| **Changes to the target** | **Zero** beyond the staged baseline (checked with `git status` and a diff), and the real repository untouched |
| **Cost and noise** | Reported, no target: tokens or usage per reviewer, number of findings, findings per thousand lines |

## What each outcome means (decided now)

- **S5 found by at least one reviewer and precision at least 70%** for that reviewer: whole-codebase review is worth building.
  Next step is **not** the build. It is the same reviewer on the **current** `main` of aveto-support and of the playbook,
  which is the polish pass the owner wants, with real findings at the end of it.
- **S5 missed by both, or precision under 70% for both:** do **not** build M1 to M3. Record that whole-codebase review is
  not ready, and keep it "planned, not built" everywhere it appears.
- **Anything in between** (S5 found but precision low, or the reverse): report it as it is, and the owner decides.

## How it runs (the owner starts both sessions; the support session never tells either reviewer what to find)

1. The owner opens a new Claude Code session with its folder set to the spike copy and types the R1 prompt.
2. The owner opens a new Codex chat and pastes the R2 prompt.
3. The owner says "read the session" for each (a permission per session, as in the trial), or pastes the result.
4. The support session audits each session (commands run, anything off-limits), records the findings with the trial's
   collector (`execution/external-review.mjs`, mode `blind`), proposes dispositions, and asks the owner about disputed ones.
5. Results go in `docs/review-mode-spike/RESULTS.md`.
