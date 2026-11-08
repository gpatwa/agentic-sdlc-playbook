# Parallel slices: what holds and what does not (T42 step O4)

> **Update 2026-11-04, pack v33:** the two known gaps below are closed in the pack's scripts (fixes 1 and 2 under "Fixes"). The
> table keeps the result as first measured; the "Now" column is the result after the fix, from the same test file with its two
> KNOWN GAP assertions flipped on purpose. Pack v33 is now installed in `aveto-support` and `streak-seed`.
>
> **Update 2026-11-07, live-session check (fix 4) done:** in one real Claude Code worktree session, hooks fired, `cwd` was the
> worktree, and the v33 guard allowed and blocked the right writes. See "Live-session check" below for the result and its limits.

> Tested 2026-11-04 by `execution/tests/parallel-slices.test.mjs`: two real `git worktree`s of one project, the pack's real hook
> scripts and `pick-intent.mjs`, driven with **simulated hook payloads**. Plain Claude Code worktrees were the model; no other
> tool was involved (Conductor, the earlier subject of plan item F3, closed to new users on 2026-11-04).
> **What this does not prove:** it does not start a Claude Code session. It shows what the scripts do with the inputs the harness
> is documented to send. *(As of 2026-11-04. The live-session check below has since confirmed it for one session and one agent.)*

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
  the hooks fire in every harness setup (one live session was checked, see below). The site's limit "one slice at a time per repo" stays as written.

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
4. **Confirm in one live session. Done 2026-11-07, see "Live-session check".** Fix 2 depends on `cwd` being the worktree, and it was.

Fix 3's advice to set `CLAUDE_PROJECT_DIR` to the worktree is **not needed and not what the harness does** (see below): in a
worktree the app created, `CLAUDE_PROJECT_DIR` was the main checkout. The guard is built for that case.

## Live-session check (2026-11-07)

A throwaway repo with pack v33 (`--greenfield`), a second worktree `probe-other`, and a probe hook at two levels (the repo's
`settings.json` and the `software-architect` agent's frontmatter). A session was started by the desktop app in a fresh worktree
of that repo (`claude/inspiring-brahmagupta-bc3e61`) and scripted to write once itself and then spawn the real
`software-architect` agent for three writes. Raw log and the session's own report:
`docs/data/worktree-probe-2026-11-07/`. A first attempt stalled on an unanswered permission prompt and is not used.

| Question | Observed |
|---|---|
| Do hooks fire in a worktree session? | **Yes**, at both levels (session `settings.json` and agent frontmatter), on every tool call logged (14 events). |
| `cwd` in the hook payload | **The worktree**, on all 14 events, main session and subagent. |
| `CLAUDE_PROJECT_DIR` seen by hooks | **The main checkout**, on all 14 events. (Empty in the Bash tool's own shell.) |
| Hook process working directory | **The main checkout.** |
| Architect writes its own worktree's `runs/` | **Allowed**; file present on disk. |
| Architect writes `src/` | **Blocked** by `write-scope-guard`: "…outside its scope (runs/, …)"; no file on disk. |
| Architect writes another worktree's `runs/` | **Blocked** by `write-scope-guard`: "…working in worktree "inspiring-brahmagupta-bc3e61" and may not write into worktree "probe-other"…"; no file on disk. |

**What it shows:** the v33 guard's assumption holds in this setup. `cwd` is the worktree while the project root is the main checkout,
which is the case the guard was built for. Any hook or script that resolves a path from `CLAUDE_PROJECT_DIR` or the process
directory will get the main checkout, not the worktree; per-worktree decisions must use the payload's `cwd`.

**Limits:** one session, one agent role (`software-architect`), one run, macOS. The guard's own decisions are known from the
block messages and the files on disk, not from a guard log. A subagent has no shell, so its directory is the payload's value,
not a `pwd`. Whether the worktree's `settings.json` or the main checkout's fired is not distinguishable (same commit). A session
whose `cwd` is outside every worktree was not run live; it stays covered by the simulated-payload tests only. Other hooks and
scripts in the pack that read `CLAUDE_PROJECT_DIR` were **not audited** for this.

The two KNOWN GAP tests were flipped on purpose when the gaps closed.
