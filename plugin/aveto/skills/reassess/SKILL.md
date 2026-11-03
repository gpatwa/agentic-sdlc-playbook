---
name: reassess
description: Compare an earlier assessment with a new one of the same scope and write a before-and-after table. Flags findings that were not re-found in files that did not change, so silence is never read as a fix.
disable-model-invocation: true
argument-hint: --before <FINDINGS.md> --after <records-dir> [--repo <dir> --from <sha> --to <sha>]
---

# /aveto:reassess

Run a new assessment of the same scope first (`/aveto:assess`), then:

```bash
node "${CLAUDE_PLUGIN_ROOT}/execution/assess-reassess.mjs" --before <earlier FINDINGS.md> --after <new records dir> --repo <git dir> --from <earlier sha> --to <new sha> --out <REASSESSMENT.md>
```

Always pass `--repo`, `--from` and `--to` so the table can tell a fix from a reviewer miss. Add `--seeds` only for a calibration run, and `--prs <file>` to attach pull request references to closed findings.

Report the counts, then the rows whose status is `NOT RE-FOUND, FILE UNCHANGED` or `NOT FIXED` **first**: those are not progress. Say that "closed" means the earlier disposition was fixed and no reviewer raised it again, which is evidence and not proof, and that the pairing of new and earlier findings is a heuristic the owner should check (the table lists the pairs). The exit code is 1 when either problem status appears.
