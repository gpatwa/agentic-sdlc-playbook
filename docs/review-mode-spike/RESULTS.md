# Review-mode spike: results (2026-10-26)

Target: aveto-support at c150673, history-free copy. S5 (the `$ARGUMENTS` shell escape in
`.claude/skills/aveto-judge-seen/SKILL.md:9`) is the planted ground truth; S6 was untestable.

## R2: Codex, blind, new chat (record: r2-codex.md)
- 15 commands, all in the spike copy; the copy stayed clean (0 changes). Discipline met.
- **Recall: S5 found unprompted (P1) with a working reproduction. Bar met.**
- 5 findings: S5 real (known); c03 real, new (filenames reach the judge payload unvalidated; low impact);
  c04 real, new, reproduced on the real code (`tokenize("y"*1100)` raises RecursionError);
  c02 and c05 rejected, both **artifacts of my copy** (I left out `evals/` and `.gitignore`).
- Precision: **3/5 = 60% as scored (below the 70% bar); 3/3 = 100% excluding the copy artifacts.**

## R1: Claude /code-review high (session local_b9e486e6)
- Reported 10 findings; **S5 does not appear** among its summarized findings (its #6 concerns the same skill's
  question-file path, a different issue, and it left `$ARGUMENTS` as it was). Recall bar not met for R1.
- **Discipline: it applied fixes to 7 files in its own worktree** (uncommitted; the spike copy itself is clean).
  The plan required zero changes. Its test run: 370 passed, 3 failed, 2 errors, from files my copy omitted.
- Precision of its 10 findings: not yet judged.

## Outcome rule
S5 found by at least one reviewer (R2), but precision is 60% as scored, so the rule's "in between" case applies:
the owner decides. Recommendation: count the two copy artifacts as my error, not the reviewer's, and take the
result as a pass for Codex; do not count R1 as a pass (missed S5, changed files).

## Decision (owner, 2026-10-26)
Accepted the reading: the two copy artifacts are counted as the spike's error, not Codex's. Codex (R2) passes; R1 does not
(missed S5, changed files). Next step is the polish pass (Codex on current main of aveto-support and the playbook), not a build;
M1-M3b and M5 stay deferred.
