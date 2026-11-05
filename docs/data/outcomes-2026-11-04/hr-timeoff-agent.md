# Outcomes: hr-timeoff-agent

> Generated 2026-11-05T01:52:54.753Z by `execution/outcomes.mjs` from the git history of `origin/main` (tip `fd85486`, 2026-11-02T23:29:10Z) and `runs/<slice>/trace.json`. No model call, no person named, no ranking. A figure the records do not hold says "not recorded". Definitions, decisions and gaming checks are copied from `docs/PRODUCTIVITY_METRICS.md`, not retyped.

**n = 39 merged changes** (merge); 0 run record(s). Reported against this repo's own history only.

> Read lead time beside Q2 and H4. A faster lead time with a rising revert or fix rate, or with thinner review, is not an improvement.

## Delivery

**D1 lead time, git only** (hours, first commit on the branch to merge): n 39, median 0.4 h. Slowest tenth: #2 37.2 h, #1 18.7 h, #18 17.6 h, #21 15.6 h.

*Decision it informs:* Is the path from approved intent to merged work getting shorter or longer? Where does it wait? *Gaming check:* Splitting work into trivial slices; approving late. Always read beside Q2 and H4 *Cannot show:* Whether the thing was worth building; waiting that happened before approval

**D1 from Charter approval:** **not recorded** (no runs/*/trace.json)

**D2 merged per week** (merged changes per week (Monday start, UTC)): 2026-09-21: 1 · 2026-09-28: 21 · 2026-10-05: 13 · 2026-11-02: 4.

*Decision it informs:* Capacity: is the pipeline steady, or bunching behind review? *Gaming check:* Many tiny slices. Read beside slice size (C2) *Cannot show:* Value delivered; counts activity

**D3 time to restore:** **not recorded** (needs deploy or incident records; git shows reverts (Q2) but not when service was restored)

## Quality

**Q2 reverted or fixed within 14 days:** 35 change(s) have a closed window (4 still open and not counted). Reverted: 0 (certain). Fix candidates: 0 (heuristic). Revert rate 0%; revert or fix-candidate rate 0%. reverts are certain; fix candidates are a heuristic (a fix/hotfix commit that names the PR or touches a file it changed).

*Decision it informs:* The central counterweight to speed: did the work hold? *Gaming check:* Calling a fix a "new feature" *Cannot show:* Silent defects; fixes under another name

**Q1 gate catches:** **not recorded** (no runs/*/trace.json)

*Decision it informs:* Are the independent gates earning their cost? *Gaming check:* Reclassifying a finding to change the ratio. Findings keep their recorded severity *Cannot show:* Defects nobody found

**Q3, Q4:** **not recorded** (review findings are prose today; CI first-run results need the GitHub API (not read here))

## Cost

**C1, C2:** **not recorded** (no runs/*/trace.json)

## Human attention

**H1, H2, H3:** **not recorded** (owner touches live in the session transcript; no collector yet (backlog T30))

**H4 review burden** (changed lines (added + removed) outside excluded paths and runs/, per merged change): n 39, median 535 lines. Merged with no GitHub review recorded: 39 of 39.

*Decision it informs:* Is the unit small enough to be reviewed well? The research names review capacity as the common constraint *Gaming check:* Padding a diff with generated files. Excluded paths are listed *Cannot show:* Whether the review was careful

**H5 reviews waiting** (open, non-draft, non-bot pull requests at generation time): 1, oldest 30.3 days (age counts from creation, not from first ready-for-review); 3 draft or bot PR(s) left out.

**Review load per week** (per Monday-start UTC week: merged changes and changed lines a reader was asked to read): 2026-09-21: 1 merged, 1898 lines · 2026-09-28: 21 merged, 92095 lines · 2026-10-05: 13 merged, 34006 lines · 2026-11-02: 4 merged, 514 lines. Shown for planning the team's reading time. It is not a target and not a per-person figure.

## Paths excluded from review burden

Lockfiles and generated or build paths are left out of H4 so a padded diff cannot move it; changed lines under `runs/` are counted separately as record lines, not hidden:

- `(^|/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|uv\.lock|Pipfile\.lock|Cargo\.lock|go\.sum|Gemfile\.lock|composer\.lock)$`
- `(^|/)(node_modules|dist|build|\.next|__pycache__|vendor)/`
- `\.min\.(js|css)$`
- `\.(snap|map)$`
- `(^|/)(generated|__generated__)/`

