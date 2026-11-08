# Worktree hook probe: session report

## 1. Step 1 output (verbatim)

```
/Users/gopalpatwa/opt/worktree-probe/.claude/worktrees/inspiring-brahmagupta-bc3e61
/Users/gopalpatwa/opt/worktree-probe/.claude/worktrees/inspiring-brahmagupta-bc3e61
/Users/gopalpatwa/opt/worktree-probe                                                 8ee15dd [main]
/Users/gopalpatwa/opt/worktree-probe/.claude/worktrees/inspiring-brahmagupta-bc3e61  8ee15dd [claude/inspiring-brahmagupta-bc3e61]
/Users/gopalpatwa/opt/worktree-probe/.claude/worktrees/probe-other                   f4c81a7 [probe-other]
CLAUDE_PROJECT_DIR=
```

Note: `CLAUDE_PROJECT_DIR` was EMPTY in the Bash tool's own shell, but the hook process did receive it (see section 5).

## 2. Session-level hook (source "session")

Fired: YES for my Bash (log line 1) and my Write (line 2) calls. It also fired for my Agent, update_plan and Read calls (lines 3, 4, 11). It fired for the subagent's Write calls too (lines 6, 8, 10, with agent="software-architect").

## 3. Agent-level hook (source "agent-software-architect")

Fired: YES, for all three subagent Write attempts (lines 5, 7, 9), including the two that were later blocked.
Both the session and agent hooks logged each subagent write, at nearly the same timestamp.

## 4. Subagent write results (as reported by the subagent, not independently re-checked on disk)

- (a) runs/probe-a/arch-own.md: **ALLOWED**.
  Message: `File created successfully at: /Users/gopalpatwa/opt/worktree-probe/.claude/worktrees/inspiring-brahmagupta-bc3e61/runs/probe-a/arch-own.md (file state is current in your context — no need to Read it back)`
- (b) src/should-deny.txt: **BLOCKED**.
  Message: `PreToolUse:Write hook error: write-scope-guard: software-architect writes its artefacts, not the product. "src/should-deny.txt" is outside its scope (runs/, .agentic/SAFETY_INVARIANTS.md, docs/ARCHITECTURE.md, docs/adr/). If this change is needed, describe it in your artefact under runs/<slice-id>/ and hand off to the role that builds it — do not work around this block.`
- (c) /Users/gopalpatwa/opt/worktree-probe/.claude/worktrees/probe-other/runs/probe-a/arch-cross.md: **BLOCKED**.
  Message: `PreToolUse:Write hook error: write-scope-guard: software-architect is working in worktree "inspiring-brahmagupta-bc3e61" and may not write into worktree "probe-other" (/Users/gopalpatwa/opt/worktree-probe/.claude/worktrees/probe-other/runs/probe-a/arch-cross.md). Each slice's session writes its own worktree only; hand the change to that slice's session.`

The subagent said it has no shell, so it could not confirm its own working directory with `pwd`. It inferred the worktree path from its environment and from the (c) block message.

## 5. payload_cwd and env_CLAUDE_PROJECT_DIR seen

Across all 10 hook log lines (session and agent sources, main session and subagent):

| Case | payload_cwd | env_CLAUDE_PROJECT_DIR | process_cwd | payload_cwd inside my worktree? |
|---|---|---|---|---|
| Main-session Bash, Write, Agent, update_plan, Read (lines 1-4, 11) | `.../worktrees/inspiring-brahmagupta-bc3e61` | `/Users/gopalpatwa/opt/worktree-probe` | `/Users/gopalpatwa/opt/worktree-probe` | yes |
| (a) subagent allowed write (lines 5-6) | `.../worktrees/inspiring-brahmagupta-bc3e61` | `/Users/gopalpatwa/opt/worktree-probe` | `/Users/gopalpatwa/opt/worktree-probe` | yes |
| (b) subagent blocked write (lines 7-8) | same | same | same | yes |
| (c) subagent blocked cross-worktree write (lines 9-10) | same | same | same | yes (the target was in probe-other) |

Observations:
- `payload_cwd` was always the worktree path, never the main checkout.
- `env_CLAUDE_PROJECT_DIR` and `process_cwd` were always the MAIN checkout (`/Users/gopalpatwa/opt/worktree-probe`), not the worktree.
- A hook that resolves paths against CLAUDE_PROJECT_DIR or process cwd would therefore resolve to the main checkout, not the worktree.
- The `write-scope-guard` evidently used the payload cwd to identify the worktree. Its block message names "inspiring-brahmagupta-bc3e61".

Not observed:
- The write-scope-guard hook's own logging. It is not part of probe.jsonl, so I know of its decisions only through the subagent's quoted messages.
- The on-disk presence of arch-own.md, and the absence of src/should-deny.txt and arch-cross.md. I did not check the filesystem.
- A subagent `pwd`.
