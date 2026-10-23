# Protocol: the event log (pack v28)

A hook, not an agent, writes `.claude/events/<session_id>.jsonl`: one hash-chained line per
tool call, with the role that made it (`agent_type`), the tool, a call id and a target (a
project-relative path; for Bash only the program and a hash of the command; never contents,
commands or output). The hook fails open: a logging fault never blocks a run. Agents never
write, edit or delete these files; `.claude/` is a protected path for routine runs.

## What the Orchestrator does

1. **At each stage boundary,** run
   `node <playbook>/execution/events-verify.mjs .claude/events/<session_id>.jsonl [--paths <the Charter's allowed write prefixes>]`.
   Any alert (a broken chain, an attempt with no outcome, a write outside the allowed paths
   or the project) goes into that stage's notice as one line. An alert is not a stop by
   itself; a **broken chain is**, unless the Charter says otherwise: stop and say so.
2. **Before the release stage,** save the verifier's output to
   `runs/<slice-id>/events-verify-output.txt` for the Release Manager, who has no shell,
   and copy the log to `runs/<slice-id>/EVENTS.jsonl`. Record the file's final chain head
   (the verifier prints it) in `END_REVIEW.md` at the moment it is written.
3. **In `END_REVIEW.md`,** under Found: calls per role and how many failed, the number of
   attempts with no outcome, every alert, and the head hash. If the log is missing or
   empty, say so; that is a Charter miss, not a pass.

## What the Release Manager checks

`events-verify-output.txt` exists, says "chain intact", and lists no write outside the
Charter's paths. A broken or missing log fails the gate; an alert is reported, not blocking.

## Limits, stated plainly

The chain shows an edited, deleted or reordered line. It cannot show a line never written
(the hook fails open), or a whole file replaced by a fresh consistent one, which is why the
head hash is recorded in `END_REVIEW.md` when it is written. A role with Bash is not
technically stopped from touching the file (the Bash sandbox in `docs/AGENT_SECURITY_PLAN.md`
A5, not yet enabled, would protect `.claude/`).

## Telling agents from people in git

Every commit a run makes carries the trailer `Aveto-Run: <slice-id>`. A **routine run**
(`STANDING_CHARTER.md`) also commits as `Aveto routine run <noreply@aveto.dev>`: its setup
writes `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME` and `GIT_COMMITTER_EMAIL`
to the `env` block of the gitignored `.claude/settings.local.json`, so no command text
changes and no permission rule is needed. A Process v2 run keeps the operator's identity
and carries the trailer.
