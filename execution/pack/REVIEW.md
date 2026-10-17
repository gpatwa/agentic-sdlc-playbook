# REVIEW.md

> Read by every code review in this repo (see `.claude/protocols/CODE_REVIEW.md`).
> Written by the people who own the code. Keep it short: it is loaded every time.
> Replace the bracketed lines; delete this note.

## What failure looks like here
- [The two or three ways a change here goes wrong in practice, for example "a new
  route that skips authentication", "a test that passes without asserting".]

## Report only
- A bug with a file and line, what triggers it, and the fix.
- At most [3] nits per review. Style-only and cleanup-only findings are dropped.
- Nothing already reported in an earlier round.

## Skip
- [paths that are generated or vendored, for example `dist/`, `*.lock`]

## Always read closely
- [paths where a mistake spreads, for example `.agentic/SAFETY_INVARIANTS.md`,
  `.claude/hooks/`, `.claude/settings*.json`, permission rules, deny lists, CI.]

## Summary
Start with the count of findings. If there is nothing to fix, say so plainly.
