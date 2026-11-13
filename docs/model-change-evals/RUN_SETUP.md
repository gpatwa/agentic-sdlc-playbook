# Setting up a model-change pass so its PASS means something (after B3)

> Written 2026-11-13 from B3's own result (`docs/model-change-evals/b3-2026-11-13/CHECK.md`). **Nothing here has been run.** It fixes
> two things B3 found: the cases were not isolated (some role spawns read the run's own Charter, `STATE.md`, `runs/`, the playbook,
> the repo's real settings), and the judges took 73% of the spend.

## 1. A clean eval repo, not the pilot repo

- A dedicated repo for the pass (for example `/Users/gopalpatwa/opt/model-eval`), `git init`, with the four `.agentic/` files as
  one-line stubs and **nothing else of value**: no other runs, no product code, no tracked `.claude/settings.json` with allow rules
  (the C6.P rules go in the gitignored `.claude/settings.local.json`, as always).
- Install the pack from the playbook's **main checkout**, never a worktree (`node <playbook>/execution/install.mjs <eval repo>`).
- The run's own records live in `runs/model-check-<n>/` in that repo. A role can still find them if it looks; the next step catches that.

## 2. Measure what each spawn read, and report it

After the pass, run, on every event log the pass wrote:

```
node <playbook>/execution/role-eval.mjs leaks <session events.jsonl> [--allow <substring> ...]
```

It lists, per role spawn, every file read, search or shell call beyond the role's own brief (exit 1 if any). Bash records only the
program and a hash, so a shell call is listed as "command not recorded" and a person judges it. Put the result in `RESULT.md`.
The hooks write to the **main checkout's** `.claude/events/<session>.jsonl`, and a pass can span more than one log: pass each file.
(On B3 the log the checker found held 8 of the 11 role spawns; where the other three went was not traced.)

**Charter lines for a pass (`C8.1`):** a spawn that read beyond its brief is recorded as **leaked**, its score is reported
separately and is not counted as a clean PASS, and that one case may be re-spawned **once** in a fresh spawn, recorded as such.
Any other bad score stays a result, with no reruns, no prompt changes and no rubric changes, as in B3.

## 3. A lean judge

B3's judges were general-purpose subagents: about 59k tokens each for a 3 to 8 KB packet, almost all of it the agent's own base
context. `docs/model-change-evals/eval-judge.md` is a subagent with one tool (Read) and a short prompt. **Copy it to
`<eval repo>/.claude/agents/eval-judge.md`** and spawn the judges as `eval-judge`.

**Not measured:** how much it saves. Before the full pass, run one judge both ways on the same packet (the old way, then
`eval-judge`) and write both token figures in `RESULT.md`; do not claim the saving until you have them. Judges still run on the
session's model, and the same family as the architect role, so the judging is not independent; a different family is a Charter
choice.
