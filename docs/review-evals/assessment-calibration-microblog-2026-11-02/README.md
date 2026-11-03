# Assessment calibration: third repo, not ours (`microblog`, Flask)

Run through `execution/assess-run.mjs` and `execution/assess-judge.mjs`, as the other two calibration runs. This is the first repo in the series that Aveto did not build.

**Setup.** `miguelgrinberg/microblog` (MIT), shallow clone at `a975ef6` (2023-12-03), about 1,840 lines of Python plus templates, about 25,000 reviewable tokens, one review area. A separate agent planted six bugs of different classes in a history-free copy and wrote `seeds.json` (public now). Reviewers: Codex CLI 0.153.4 (`gpt-5.6-sol`, medium) and Claude Code 2.1.316 (`claude-sonnet-5-5`, high), each blind and read-only, no hint about the seeds. The read-only check passed for both. Nothing from the repo was run or installed.

| Seed | Where | Class | Codex | Claude |
|---|---|---|---|---|
| S1 | `app/api/users.py:66` | authz, P0 | found | found |
| S3 | `app/auth/routes.py:27` | open redirect, P1 | found | found |
| S5 | `app/models.py:274` | fails open, P0 | found | found |
| S6 | `app/models.py:264` | secret handling, P0 | found | found |
| S2 | `app/main/forms.py:52` | input validation (length bound dropped), P2 | missed | missed |
| S4 | `app/main/routes.py:173` | wrong comparison (`>=` for `>`), P2 | missed | missed |

**Recall: 4 of 6 for each reviewer (67%), and both missed the same two.** All four P0/P1 seeds were found by both; the two misses are the P2 "wrong at the edge" kind, as on the JavaScript repo. Six seeds, one run each: indicative only.

**Findings that match no seed, judged by the other family** (`assess-judge.mjs`, the whole set since it was under 30): Codex raised 7, judged by Claude; Claude raised 3, judged by Codex. All 10 confirmed, with the judge calling the severity too high on 4. They are real properties of upstream `microblog`, not of our seeds: the hard-coded fallback `SECRET_KEY` that also signs password-reset tokens, no `USER` in the Dockerfile, `FLASK_DEBUG=1` in `.flaskenv`, no timeout on the translation request, a state-changing GET, reset links built from the request host, dead pagination links, and no token invalidation after a password reset. Several are known limits of a tutorial app.

**Read the 10 of 10 with care.** It is a small set; both judges confirmed everything, where on the JavaScript repo the judges rejected about one finding in five. A judge that never rejects may be lenient, and these are generic hardening points that are easy to confirm. It is not a precision measurement: 10 judged, below the plan's 30, and the judgments are the judges', not the owner's.

**What this adds.** Recall is steady at 4 to 6 of 6 across repos and stacks, with the same weak spot (small semantic edge bugs). The tool ran unchanged on a repo it had never seen, in one pass, and the review itself took minutes. Generality: three repos (Python/FastAPI-style app, Node, Python/Flask), one not ours; the bar's letter is met, the evidence is thin (two languages, small repos, six seeds each).

Files per reviewer: `FINDINGS.md`, `SCORE.md`, `REPORT.md`, `RUN.md`, `JUDGED.json`.
