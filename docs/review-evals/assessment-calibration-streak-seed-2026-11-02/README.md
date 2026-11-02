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

**Precision is not measured.** Codex raised 41 findings and Claude 45; none is judged except the seed matches. The scorer's range (5% to 100% and 7% to 100%) is the honest statement. Judging about 86 findings was not done; the plan's bar needs 30 judged, so a sample of them is the next step.

**Bars after two runs.** Generality: 2 repos (Python, JavaScript), both ours; the plan's three, with one not ours, is still not met. Recall: 6 of 6 and 3 of 6 (Claude), 4 of 6 and 2 of 6 (Codex); no bar is claimed. Nothing here supports "the review finds the bugs"; it supports "it finds the loud ones and some quiet ones", with the misses listed.

Files: per reviewer `FINDINGS.md`, `SCORE.md`, `REPORT.md`, `RUN.md` (model, effort, tool version, per-area counts).
