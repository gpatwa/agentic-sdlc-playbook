# Outcomes: streak-seed

> Generated 2026-11-05T01:52:49.615Z by `execution/outcomes.mjs` from the git history of `main` (tip `bd9b40e`, 2026-10-21T20:32:42Z) and `runs/<slice>/trace.json`. No model call, no person named, no ranking. A figure the records do not hold says "not recorded". Definitions, decisions and gaming checks are copied from `docs/PRODUCTIVITY_METRICS.md`, not retyped.

**n = 0 merged changes** (none found); 4 run record(s). Reported against this repo's own history only.

> Read lead time beside Q2 and H4. A faster lead time with a rising revert or fix rate, or with thinner review, is not an improvement.

## Delivery

**D1 lead time, git only** (hours, first commit on the branch to merge): n 0, median n/a h. Slowest tenth: not drawn below ten merged changes.

*Decision it informs:* Is the path from approved intent to merged work getting shorter or longer? Where does it wait? *Gaming check:* Splitting work into trivial slices; approving late. Always read beside Q2 and H4 *Cannot show:* Whether the thing was worth building; waiting that happened before approval

**D1 from Charter approval** (hours, Charter approval to merge (from trace.json)): n 0, median n/a h.

**D2 merged per week** (merged changes per week (Monday start, UTC)): none.

*Decision it informs:* Capacity: is the pipeline steady, or bunching behind review? *Gaming check:* Many tiny slices. Read beside slice size (C2) *Cannot show:* Value delivered; counts activity

**D3 time to restore:** **not recorded** (needs deploy or incident records; git shows reverts (Q2) but not when service was restored)

## Quality

**Q2 reverted or fixed within 14 days:** 0 change(s) have a closed window (0 still open and not counted). Reverted: 0 (certain). Fix candidates: 0 (heuristic). Revert rate not recorded; revert or fix-candidate rate not recorded. reverts are certain; fix candidates are a heuristic (a fix/hotfix commit that names the PR or touches a file it changed).

*Decision it informs:* The central counterweight to speed: did the work hold? *Gaming check:* Calling a fix a "new feature" *Cannot show:* Silent defects; fixes under another name

**Q1 gate catches** (defects a gate caught before merge (trace.json gateCatches)): 1 of 4 slice(s) record them; total 1.

*Decision it informs:* Are the independent gates earning their cost? *Gaming check:* Reclassifying a finding to change the ratio. Findings keep their recorded severity *Cannot show:* Defects nobody found

**Q3, Q4:** **not recorded** (review findings are prose today; CI first-run results need the GitHub API (not read here))

## Cost

Unit: tokens, peak context summed per spawn (trace.json stages[].tokens). The orchestrator's own turns are not in this figure.

**C1 tokens per merged slice:** 708k over 4 landed slice(s). **C2 actual ÷ plan:** median not recorded over 0 slice(s) that have a Charter plan total.

| Slice | Tier | Landed | Tokens | Plan | Actual ÷ plan |
|---|---|---|---|---|---|
| browser-client | 2 | yes | 655k | n/a | n/a |
| greenfield | 2 | yes | 947k | n/a | n/a |
| http-layer | 2 | yes | 711k | n/a | n/a |
| security-hardening | 2 | yes | 520k | n/a | n/a |

*Decision it informs:* Is the pipeline affordable at this level of review? *Gaming check:* Splitting a slice to hide cost. Always show slice size *Cannot show:* Cost of the orchestrator's own context; the human's time

*Decision it informs:* Are estimates trustworthy; do ceilings need calibrating? *Gaming check:* Raising the plan to look accurate. The plan is frozen at the Charter hash *Cannot show:* Why the miss happened

## Human attention

**H1, H2, H3:** **not recorded** (owner touches live in the session transcript; no collector yet (backlog T30))

**H4 review burden** (changed lines (added + removed) outside excluded paths and runs/, per merged change): n 0, median n/a lines. Merged with no GitHub review recorded: **not recorded** (GitHub CLI unavailable for this repo).

*Decision it informs:* Is the unit small enough to be reviewed well? The research names review capacity as the common constraint *Gaming check:* Padding a diff with generated files. Excluded paths are listed *Cannot show:* Whether the review was careful

**H5 reviews waiting** (open, non-draft, non-bot pull requests at generation time): 0, oldest 0 days (age counts from creation, not from first ready-for-review); 0 draft or bot PR(s) left out.

**Review load per week** (per Monday-start UTC week: merged changes and changed lines a reader was asked to read): none. Shown for planning the team's reading time. It is not a target and not a per-person figure.

## Paths excluded from review burden

Lockfiles and generated or build paths are left out of H4 so a padded diff cannot move it; changed lines under `runs/` are counted separately as record lines, not hidden:

- `(^|/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|uv\.lock|Pipfile\.lock|Cargo\.lock|go\.sum|Gemfile\.lock|composer\.lock)$`
- `(^|/)(node_modules|dist|build|\.next|__pycache__|vendor)/`
- `\.min\.(js|css)$`
- `\.(snap|map)$`
- `(^|/)(generated|__generated__)/`

