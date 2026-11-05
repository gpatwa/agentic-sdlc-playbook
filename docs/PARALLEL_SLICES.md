# Parallel slices: what holds and what does not (T42 step O4)

> Tested 2026-11-04 by `execution/tests/parallel-slices.test.mjs`: two real `git worktree`s of one project, the pack's real hook
> scripts and `pick-intent.mjs`, driven with **simulated hook payloads**. Plain Claude Code worktrees were the model; no other
> tool was involved (Conductor, the earlier subject of plan item F3, closed to new users on 2026-11-04).
> **What this does not prove:** it does not start a Claude Code session. It shows what the scripts do with the inputs the harness
> is documented to send. Whether a real session in a worktree loads the repo's `.claude/settings.json` hooks, and what
> `CLAUDE_PROJECT_DIR` is set to on each spawn, is a harness fact still to be confirmed in a live session.

## Result

| Question | Result | Evidence |
|---|---|---|
| Does each session's **budget** follow its own slice? | **Yes.** The over-budget slice's session is asked; the healthy slice's spawn proceeds with no question. | test "budget" |
| Do two sessions' **event logs** collide? | **No.** One chained file per session id; both verify intact. They sit in one shared `.claude/events/` under the project directory; the copy to `runs/<slice>/EVENTS.jsonl` is by session id. | test "events" |
| Can a session write its own worktree's `runs/`? | **Yes.** | test "write scope" |
| Can a session in worktree A write into worktree B's `runs/`? | **Yes when `CLAUDE_PROJECT_DIR` is the main checkout; no when it is the session's own worktree.** `write-scope-guard.mjs` strips *any* `.claude/worktrees/<name>/` prefix, not the session's own. **Known gap.** | tests "KNOWN GAP" and "own worktree" |
| Is "**one run per repo at a time**" enforced across worktrees? | **No.** `pick-intent.mjs` looks only at the `runs/` of the checkout it is run in. While A has a run open, main and a fresh worktree B both pick the same `intents/ready/one.md`. **Known gap.** | test "KNOWN GAP: one run per repo" |
| One shared **budget** across slices? | Not tested as a shared pool: the guard is per slice by design. A weekly standing-Charter budget (S2.2) is counted from `runs/` in one checkout, so it has the same blind spot as `pick-intent`. | reading the code; `--runs-used` |

## What this lets us say, and what it does not

- **Can say:** two slices with *different* intents, each started deliberately by a person in its own worktree, keep separate
  budgets and separate event logs. Their approvals are separate by construction (each Charter is approved by its own hash).
- **Cannot say:** that parallel slices are safe in general, that routine (standing-Charter) runs can run in parallel, or that
  the hooks fire in a worktree session. The site's limit "one slice at a time per repo" stays as written.

## Proposed fixes (pack changes, not made; they need an owner decision and a pack bump)

1. **`pick-intent.mjs` counts worktrees.** Read the `runs/` of every `git worktree list` entry (and `.claude/worktrees/*`), so an
   open run anywhere returns "a run is open". Smallest change that closes the duplicate-pick gap.
2. **`write-scope-guard.mjs` binds a session to its own worktree.** When the payload's `cwd` is inside
   `.claude/worktrees/<name>/`, accept writes only under that name, not any worktree. Closes the cross-worktree write.
3. **Interim rule, no code:** run parallel slices only for different intents typed by a person; do not start routine runs while
   any worktree has a run open; set `CLAUDE_PROJECT_DIR` to the worktree when launching a session there.
4. **Confirm in one live session** (the owner or a spawned test): that hooks listed in the worktree's `.claude/settings.json` fire,
   and what `CLAUDE_PROJECT_DIR` is on each spawn.

Both "KNOWN GAP" tests will fail the day the pack closes the gap; flip the assertion then, on purpose.
