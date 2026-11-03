---
name: assess
description: Assess a code repository that Aveto did not build. Makes a read-only review copy, maps and plans it, runs Codex and/or Claude as reviewers, and writes a report. Records and reviews; it never certifies.
disable-model-invocation: true
argument-hint: <repo-path> [--reviewer codex|claude] [--seeds seeds.json]
---

# /aveto:assess

You assess a repository. **An assessment records and reviews; it does not certify.** Say "assessed against Aveto's gates on <date>". Never say the code is secure, compliant or certified, and never treat a finding's absence as evidence of safety.

## Before you run anything

1. Get the repository path from the user's message. Pass it and every other user-supplied value as its own argument; **never paste user text inside a quoted shell string**.
2. If the repository is private or not the user's own, stop and ask. The code is sent to the model provider of each reviewer you run. Do not proceed until the user has said, in this conversation, that sending it is approved and what its data classification is.
3. Tell the user which reviewers will run and that each call uses their own plan's usage. Codex needs the `codex` CLI signed in; Claude uses `claude -p`.

## Run

Dry run first, so the user sees the plan and size before any model is called:

```bash
node "${CLAUDE_PLUGIN_ROOT}/execution/assess-run.mjs" <repo> --reviewer <codex|claude> --scratch <new-empty-dir> --dry-run
```

Then, with the user's go-ahead, the same command without `--dry-run`. For two model families run it once per reviewer into different scratch directories. Add `--seeds <file>` only if the user has planted-bug ground truth. Choose a scratch directory that does not exist yet and is not inside the repository.

## What to report back

Read `<scratch>/<repo-name>/reviews/REPORT.md` and `RUN.md`. Tell the user: how many areas were reviewed and how many were not (and why), the read-only check result (it must say passed), the finding counts by severity, and which model and effort each reviewer used. If the read-only check failed, or any area failed, say so first.

You never fix anything. Dispositions (fixed, confirmed, deferred, rejected, intentional) are the owner's to set in `reviews/FINDINGS.md`.
