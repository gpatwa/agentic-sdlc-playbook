# Pilot: aveto-support at c150673 (M6, first pilot)

The plan's first pilot: assessment mode on `aveto-support` at `c150673`, the commit before the fix for incident S5, as a history-free export (77 files, mostly Markdown protocols, agent briefs and run records, plus Python and a small service). Run with `assess-run.mjs` and `assess-judge.mjs`. Codex CLI 0.153.4 (`gpt-5.6-sol`, medium) and Claude Code 2.1.316 (`claude-sonnet-5-5`, high), each blind and read-only, 15 areas. The read-only check passed for both. This repo is ours, and it is the repo the earlier spike used.

**Recall: 1 of 1 known incident, for each reviewer.** Both raised S5 (`$ARGUMENTS` inside single quotes in a shell line, `.claude/skills/aveto-judge-seen/SKILL.md:9`) at P1, on the right file and line, unprompted. S6 (an over-broad permission rule) cannot be tested: it lived in `.claude/settings.local.json`, which was never committed. One incident cannot tell a good reviewer from a lucky one; this is a smoke test of the engine on a large repo, not a recall measurement.

**Coverage: not the whole repo.** The report says "about 393,806 of 678,400 reviewable tokens" were reviewed (58%); the planner's token cap left the rest listed as not reviewed (`REPORT.md`, "What was not reviewed"). Any claim here is about the reviewed part.

| | Findings | Judged (cross-family) | Confirmed | Rejected | Intentional |
|---|---|---|---|---|---|
| Codex | 66 | 15, by Claude | 11 | 3 | 1 |
| Claude | 94 | 15, by Codex | 11 | 3 | 1 |
| Both | 160 | 30 | **22 (73%)** | 6 | 2 |

The sample is random (seed 20261102, balanced, S5's finding excluded), the judges are the other family, and the judgments are provisional (`JUDGED.json` has each reason). Precision 73% on 30 matches the other two repos' 73% (Opus) to 80% (cross-family). The same caveats hold: an interval of about 56% to 86%, a model's opinion, no owner dispositions, and the eight findings not confirmed were mostly cases where the repo's own text already answered the point (for example "the owner told the support session directly", "the validator is mechanical by design"); one was a quote the reviewer had cut short. The judges rated the severity "too high" on 7 of the 30 findings.

**Reading the findings.** Most findings are about the governance Markdown and run records (contradictions between a protocol and a brief, a stale count, an unfilled field), because that is most of this repo. The one code finding that matters, S5, was found by both. Whether the rest are worth fixing is the owner's call and has not been made.

**What this adds to the series.** A fourth repo, and the first Markdown-heavy process repo rather than application code. The engine ran at 15 areas and 678k tokens of source without a failed area (58% of it reviewed, by the token cap). The M6 "done" condition, the owner's review of a report per pilot, is still open.

Files per reviewer: `FINDINGS.md`, `SCORE.md`, `REPORT.md`, `RUN.md`, `JUDGED.json`.
