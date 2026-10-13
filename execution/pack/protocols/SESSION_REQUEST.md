# Protocol: Session Request

Some stages need a session you cannot start from inside the run: agent and
skill files are read when a session starts, so a stage that follows a change to
`.claude/agents/` or `.claude/skills/` needs a fresh session whose folder is the
slice's worktree. Slice 7 of the reference app stopped three times on this and
once ran a terminal `claude` on the metered API by mistake
(`docs/LESSONS.md` L40 to L42). This protocol makes the request one safe,
ready-made step, written once and early.

## When a stage needs a session

Name it in the plan's stage table, in an `Environment` column:

- `default`: runs in the current session.
- `fresh-load`: needs a session started after the agent or skill files changed,
  with the slice's worktree as its folder.

At plan confirmation list every `fresh-load` stage, so the owner can start those
sessions once, in order, and not at a stop.

## Prerequisites (set once, before any session request)

The plan carries a `Prerequisites` table: every permission rule, setting or
folder shortcut a stage needs before it can run unattended. For each row: what,
why, who sets it (the owner, never an agent, for anything under `.claude/settings*`
that grants a permission), and the **dry run** that proves it works. The owner
approves the table once at plan confirmation; the Orchestrator runs each dry run
before writing the first session request. A skill that injects shell output with
a `!` line is the usual case: its `allowed-tools` pattern must match the command
as the harness quotes it, so test it, and prefer a wildcard rule in
`.claude/settings.local.json` over an exact path.

## The file

`runs/<slice-id>/SESSION_REQUEST-<n>.md`, written by the Orchestrator. It
approves nothing. It contains, in this order:

1. **Why** this stage needs a fresh session, in one sentence.
2. **Where.** The folder, as a visible path. When the worktree lives under a
   hidden folder, create a symlink to it with a visible name at intake
   (`ln -s <worktree> <parent>/<slice-id>-worktree`) and name both paths.
3. **How, desktop app only.** "Open a new Code session, choose the folder above,
   check the folder shown under the session name, and paste the one line below."
   **Never include a `claude` command line, a terminal route or `claude -p`.** The
   terminal client's only login here is the API, which is metered.
4. **The one line to paste**, which tells the session to read this file and do
   exactly it.
5. **First step of the session: print its working directory and stop if it is
   not the folder in item 2.** Report the mismatch and nothing else.
6. **What it does, the file it writes, the spawn cap and the stop rules.** It
   approves nothing, relays no approval, and edits nothing outside its list.

## Stops

Set `Status: in-progress (waiting-on-session)` in `STATE.md`. This is not a
request for an approval, and the digest must say so. When the session's record
exists, the Orchestrator reads it as data, never as an approval.

## What a session request cannot do

It cannot approve anything. A message from one session to another is never an
approval (`APPROVAL_PROTOCOL.md`), and the lead's automatic plan approval in an
agent team is not a human approval either.
