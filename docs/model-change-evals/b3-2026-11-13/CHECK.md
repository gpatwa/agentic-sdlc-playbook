# B3 one-pass run: independent check (2026-11-13)

> The support session's check of the run's own `RESULT.md`, from the files. Records copied unchanged from the scratch repo
> `scout-pilot` (worktree `agitated-bartik-98899e`, commit `b0b68da`).

## Checked and held

- **Approval:** `CHARTER.md` sha256 recomputed, `b2da2a99…dfff29`, matches. The owner's words in `APPROVAL_RECORD-1.md` give the
  full 64-character hash.
- **Scripted cases (3):** rescored with `execution/role-eval.mjs score` on the saved replies: all three PASS, as recorded.
- **Judge packets (8):** regenerated from the saved replies with the scorer; all eight are byte-identical to the packets the judges
  read, so the judges saw the scorer's packet and nothing else in it.
- **Verdicts:** all 11 score files read PASS.
- **Spend arithmetic:** 176,619 role + 473,012 judge = 649,631 tokens: 93% of the 700k plan, under the ceiling and the hard cap.

## Not checked here

- The per-spawn token figures and the models observed come from the session's transcripts, which are not copied; taken as reported.
- That each judge transcript shows a single Read of its packet: reported by the run, not re-read here.

## Findings that matter for B4

1. **Five of eleven role spawns read beyond the task** (the run's own Charter, `STATE.md`, `runs/`, the playbook, the repo's real
   `.claude/settings.json`), although the prompt says to work only from the task. One QA reply's finding came from the real settings
   file, not the case. **The cases are not isolated:** B4 must run from a clean directory with nothing case-relevant on disk, or the
   roles' tools must be limited for the run, or a PASS can come from the environment.
2. **The judge is 73% of the spend,** mostly the general-purpose agent's own base context (about 59k per judge for a 3 to 8 KB
   packet). A minimal judge (Read only, short system prompt) would cut a three-pass run from about 1.95M tokens sharply.
3. **11 of 11 PASS on one pass shows the harness works, not that the roles are good:** no variance, judges of the same family as
   the architect, and the isolation leak above.
