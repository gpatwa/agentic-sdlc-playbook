# Parallel slices: what holds and what does not (T42 step O4)

> **Update 2026-11-04, pack v33:** the two known gaps below are closed in the pack's scripts (fixes 1 and 2 under "Fixes"). The
> table keeps the result as first measured; the "Now" column is the result after the fix, from the same test file with its two
> KNOWN GAP assertions flipped on purpose. Pack v33 is in this repo, **not installed into other repos**. The live-session check
> (fix 4) is still open, so "the hooks fire in a worktree session" is still not shown.

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
| Can a session in worktree A write into worktree B's `runs/`? | **Was: yes when `CLAUDE_PROJECT_DIR` is the main checkout** (the guard stripped *any* `.claude/worktrees/<name>/` prefix). **Now: no.** The guard takes the session's own worktree from the payload's `cwd` and denies a target in any other worktree; a session whose `cwd` is in no worktree owns none. | tests "write scope" |
| Is "**one run per repo at a time**" enforced across worktrees? | **Was: no.** `pick-intent.mjs` looked only at the `runs/` of the checkout it ran in, so main and a fresh worktree B both picked the same `intents/ready/one.md` while A had a run open. **Now: yes.** It reads the `runs/` of every worktree (`git worktree list`, plus any `.claude/worktrees/*`), says where the open run is, skips an intent that has a run folder in any worktree, and counts standing-Charter runs across worktrees once per slice name. | tests "pick-intent" |
| One shared **budget** across slices? | Not tested as a shared pool: the guard is per slice by design. The weekly standing-Charter count (S2.2) comes from `pick-intent.mjs`, so it now covers every worktree. | reading the code; `--runs-used` |

## What this lets us say, and what it does not

- **Can say:** two slices with *different* intents, each started deliberately by a person in its own worktree, keep separate
  budgets and separate event logs. Their approvals are separate by construction (each Charter is approved by its own hash).
- **Cannot say:** that parallel slices are safe in general, that routine (standing-Charter) runs can run in parallel, or that
  the hooks fire in a worktree session. The site's limit "one slice at a time per repo" stays as written.

## Fixes (pack v33, made 2026-11-04)

1. **`pick-intent.mjs` counts worktrees. Done.** Reads the `runs/` of every `git worktree list` entry and every `.claude/worktrees/*`
   directory, so an open run anywhere returns "a run is open: <slice> (in <worktree>)". Limit: a worktree left behind with a
   stale `in-progress` STATE.md blocks every pick until someone marks it done or removes the worktree; that is the safe direction.
2. **`write-scope-guard.mjs` binds a session to its own worktree. Done.** A target inside `.claude/worktrees/<name>/` is judged by
   its path inside that worktree only when the session's `cwd` is in the same worktree. Another worktree, or any worktree from
   a session in the main checkout, is denied with a message naming both. Limit: it trusts the payload's `cwd`; a session that
   `cd`s out of its worktree is treated as owning none.
3. **Interim rule, no code, still sound:** run parallel slices only for different intents typed by a person; set `CLAUDE_PROJECT_DIR`
   to the worktree when launching a session there.
4. **Confirm in one live session (open; owner or a spawned test):** that hooks listed in the worktree's `.claude/settings.json`
   fire, and what `CLAUDE_PROJECT_DIR` and `cwd` are on each spawn. Fix 2 depends on `cwd` being the worktree.

The two KNOWN GAP tests were flipped on purpose when the gaps closed.
