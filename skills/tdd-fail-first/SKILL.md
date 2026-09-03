---
name: tdd-fail-first
description: Prove a regression test actually catches the bug before trusting it — isolate the fix, confirm the test fails on the unfixed code, restore the fix, confirm it passes. Use when writing a regression test, fixing a bug or security finding, or about to report "tests pass" as evidence a change is correct.
license: MIT
metadata:
  origin: "agentic-sdlc-playbook"
  source: "docs/BACKLOG.md T7 — confirmed gap, not guessed"
---

# TDD, fail-first

A test that has never failed hasn't proven anything. This is the concrete
mechanic of red-before-green: how to know a regression guard actually
distinguishes broken code from fixed code, not just that it exists and is
green.

## When to use this

- Writing a new regression test for a bug fix.
- Adding a test for a gate catch — a defect a reviewer or a security pass found.
- Any time you're about to report "tests pass" as evidence a change is correct.
- Not for exploratory or throwaway scripts, and not for every trivial one-line
  change — match the effort to the stakes.

## The mechanism

1. **Identify the fix** — the exact diff, file, and lines that make the bug go away.
2. **Isolate it**, without discarding your work:
   - Uncommitted: `git stash push -- <file>` (stash only the fix, keep the new test).
   - Already committed: check out the pre-fix revision in a scratch worktree,
     or temporarily revert just the fix lines.
3. **Run the test(s) that should catch this bug**, against the *unfixed* code.
4. **Confirm it actually fails — and read why.** It should fail for the reason
   you expect (the bug being fixed), not for an unrelated reason (a typo, a
   missing import, broken test setup). A test that can't even run isn't evidence.
5. **Restore the fix**: `git stash pop`, or reapply the reverted lines.
6. **Run the test again.** Confirm it passes, and that nothing else broke —
   run the project's full local regression command, not just the one test file.
7. **Only now** report the test as a real regression guard.

## What this catches that "tests pass" alone doesn't

- A vacuous test — always green regardless of the code (a broken assertion, a
  path the test never actually exercises, a mock returning the expected value
  unconditionally).
- A test that passes by coincidence, not because it checks the right thing.
- A test written against the *fixed* code from the start, which never proves
  it would have caught the original bug.

## Example (real, not illustrative)

A per-run summary computed `NaN` once a run's `stages[]` array mixed traced
and untraced entries.

```bash
git stash push -- execution/analyze.mjs   # isolate the fix
node --test tests/analyze.test.mjs        # run the new test against unfixed code
# → AssertionError on the /NaN/ pattern — confirms the test actually
#   distinguishes broken from fixed, not just "a test exists"
git stash pop                             # restore the fix
node --test tests/analyze.test.mjs        # → all green
```

## Edge cases

- **The fix touches many files.** Isolate only the specific lines that would
  make the test fail — stashing the whole change tests something broader than
  you think you're testing.
- **The bug isn't reproducible by isolating the fix** (an infra/environment
  issue, not a code issue). Say so explicitly rather than skipping the
  fail-first step silently — a test you couldn't fail-first-verify is weaker
  evidence, and that's worth stating, not hiding.
- **Re-running the suite has side effects** (writes to a real file, hits a
  real network call). Isolate in a scratch copy — never skip verification
  because re-running is inconvenient.

## Why this is a skill, not just a habit

`docs/BACKLOG.md`'s T7 research confirmed this discipline is proven — used
repeatedly and successfully — but wasn't written into any engineer brief
(`frontend-developer.md`, `backend-architect.md`, `ai-engineer.md`,
`ml-engineer.md`). It depended on whoever was driving remembering to do it,
not the brief requiring it. This skill exists to close that gap without
rewriting every brief.
