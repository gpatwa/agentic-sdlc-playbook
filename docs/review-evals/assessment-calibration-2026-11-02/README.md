# Assessment calibration, 2026-11-02 (M4, first run)

**What this is.** A first measurement of the review step in assessment mode: six bugs planted by one agent, a different agent
reviewing blind, scored by `execution/assess-calibrate.mjs`. **It is indicative, not a measurement of the bars in
`docs/REVIEW_MODE_PLAN.md`:** six seeds, one repo, one model family, one stack.

| Bar (plan) | Result | Status |
|---|---|---|
| Recall on known incidents | **6 of 6 planted bugs found** (authz, tenant, injection, logic, errors, concurrency; P0 to P2). With six seeds, a perfect score only supports "at least about 61% recall at 95% confidence" (0.607^6 = 0.05). The earlier spike found the real S5 incident (Codex) and missed it (Claude `/code-review`); see `docs/review-mode-spike/RESULTS.md`. | indicative |
| Precision (at least 70% on a sample of 30) | 18 findings: 6 match a planted bug and 12 match none. **On 2026-11-02 the owner told the support session to fix the 12; it read each against the real code and found all 12 real, and fixed them in hr-timeoff-agent PR 41 (merged 2026-11-02 as `9aab511`; CI green on `main`; PR 40, the CI hardening, merged too).** They are recorded as `fixed`. So 0 false positives in 18. **That is not the plan's measurement:** 18 is below the 30 the bar needs, the judge is the session that wrote the fixes and not an independent sample, and 5 of the 12 are P3 or low-value. | **18 of 30 judged; 100% so far; bar not met as measured** |
| Owner touches | none yet: the owner has not dispositioned a finding | not measured |
| Cost per 10,000 lines | 234,172 tokens for 3,837 lines = about 610,000 per 10,000 lines. **Basis: the harness's per-agent total, which is the context size of each agent's last request (peak context), summed over four agents. Processed tokens were not measured** (`usage.mjs` reads slices, not these agents), so this understates consumption, as the cost correction of 2026-10-29 explains. | indicative |
| Changes to the target | **zero**: `assess-guard.mjs verify` passed (target HEAD and tree unchanged, review copy differs only by the recorded removals) | met |
| Generality (3 repos, different stacks, one not ours) | one repo (Python, 3,837 lines in scope, ours) | **not met** |
| Confidentiality | secret-path exclusion and hold-back tested (`execution/tests`); no live proof that the permission rules hold in a Claude Code session | tests only |

## How it was run
1. Base: `hr-timeoff-agent` (the fix branch of PR 39), 3,837 lines of Python in four folders.
2. **Seeder** (a general-purpose agent, fresh): planted six one-to-few-line bugs, each of a different class, wrote `seeds.json` outside the repo.
3. The seeded code was committed as a single "Import" commit (no history to reveal the edits).
4. `assess-guard.mjs prepare`, `repo-map.mjs`, `assess-plan.mjs` (scoped to the four folders, 20k-token areas): six areas, one empty.
5. **Reviewers** (four read-only `Explore` agents, in parallel; one per area, two areas for one): given only the area prompt, told nothing about seeding.
6. Findings recorded as `open`; `assess-guard.mjs verify`; `assess-report.mjs`; `assess-calibrate.mjs`.

## What to be careful about
- **Same model family.** Seeder and reviewers are both Claude. Bugs a Claude agent finds plausible to plant are also bugs another Claude agent may find easy to spot. The independent family (Codex) has not been run on this set.
- **Easy conditions.** Each reviewer got an area of 3,000 to 18,000 tokens with a prompt that asked it to verify findings. A whole-tree run at the cap is harder.
- **Seeds are one-liners** that diverge from a nearby docstring or sibling code in several cases (S5, S6 contradict their own comments). Subtler logic bugs are under-represented.
- **Discipline.** Reviewers were told to use Read, Grep and Glob only. Two reported using Bash (`wc -l`, `cat -n`) anyway. Nothing changed, as `verify` shows, but it is another instance that an instruction is not a control.
- **These seeds are now public.** Do not reuse them to score a model that may have seen this directory; plant new ones for a rescore.
- **Findings beyond the seeds.** F-01-1 repeats finding 1 of the earlier manual assessment (the PR 39 guard is in the CLI, so `identity_from_env` still falls back when the app is created directly). The other eleven were fixed in PR 41 (merged) (see the table).

## Files
`seeds.json` (ground truth), `FINDINGS.md` (all 18, as recorded), `AREAS.md` (the plan), `REPORT.md` (the generated report), `SCORE.md` (the scorer's output).
