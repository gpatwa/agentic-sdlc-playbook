# Ownerless high-risk paths on four repos (T42 O2)

Generated 2026-11-04 by `execution/repo-map.mjs` (read only) at each repo's checked-out HEAD, whose commit is in each map's header. Owners come only from CODEOWNERS. **Three of the four repos have no CODEOWNERS file** (aveto-support, streak-seed, stash-seed), so every high-risk file in them is ownerless; the pack does not install one. **hr-timeoff-agent does have `.github/CODEOWNERS`**, which names one person (`@gpatwa`) for every path, so none of its 21 high-risk files is ownerless. Named is not the same as independently approved: one owner on every path gives every path an accountable human and no second approver.

> Correction 2026-11-05: this line first said none of the four repos has a CODEOWNERS file. That was wrong for hr-timeoff-agent; the per-repo sections below were always computed from the file and were right. Found by the independent review in `docs/PROPOSAL_REVIEW_T42.md`.

## aveto-support

> Generated 2026-11-05 by `execution/repo-map.mjs` at commit `c579ea52ac6aeb527e8a6d57f0dbf5ca8f544a05` (branch `records/landed-from-git`). Deterministic, no model.


60 of 60 high-risk file(s) have no owner in CODEOWNERS (the repo has no CODEOWNERS file). A change to a path with no named owner has no one who may approve it, so a Charter that touches one stops at drafting and asks who owns it. Owners are read only from CODEOWNERS; they are never guessed from who committed.

| Path prefix | Ownerless high-risk files |
|---|---|
| `.claude/agents/` | 29 |
| `.claude/protocols/` | 13 |
| `.agentic/` | 4 |
| `.claude/commands/` | 3 |
| `.claude/hooks/` | 3 |
| `.claude/skills/` | 3 |
| `.claude/` | 2 |
| `infra/` | 2 |
| `(repo root)` | 1 |


## streak-seed

> Generated 2026-11-05 by `execution/repo-map.mjs` at commit `8b7edaf5330340f008fc1503b69d37f1d1bbc109` (branch `routine-run`). Deterministic, no model.


54 of 54 high-risk file(s) have no owner in CODEOWNERS (the repo has no CODEOWNERS file). A change to a path with no named owner has no one who may approve it, so a Charter that touches one stops at drafting and asks who owns it. Owners are read only from CODEOWNERS; they are never guessed from who committed.

| Path prefix | Ownerless high-risk files |
|---|---|
| `.claude/agents/` | 28 |
| `.claude/protocols/` | 12 |
| `.agentic/` | 6 |
| `.claude/commands/` | 3 |
| `.claude/` | 2 |
| `.claude/hooks/` | 2 |
| `.github/workflows/` | 1 |


## stash-seed

> Generated 2026-11-05 by `execution/repo-map.mjs` at commit `2cbaea3e9c26614f6e9fe538d4aafe6f88ec162c` (branch `main`). Deterministic, no model.


44 of 44 high-risk file(s) have no owner in CODEOWNERS (the repo has no CODEOWNERS file). A change to a path with no named owner has no one who may approve it, so a Charter that touches one stops at drafting and asks who owns it. Owners are read only from CODEOWNERS; they are never guessed from who committed.

| Path prefix | Ownerless high-risk files |
|---|---|
| `.claude/agents/` | 24 |
| `.claude/protocols/` | 8 |
| `.agentic/` | 4 |
| `.claude/commands/` | 3 |
| `.claude/` | 2 |
| `.claude/hooks/` | 1 |
| `.github/workflows/` | 1 |
| `runs/llm-summary/` | 1 |


## hr-timeoff-agent

> Generated 2026-11-05 by `execution/repo-map.mjs` at commit `5c4098f884fc85b586a1a8f0e68706adb68a3853` (branch `claude/docs-index`). Deterministic, no model.


0 of 21 high-risk file(s) have no owner in CODEOWNERS. A change to a path with no named owner has no one who may approve it, so a Charter that touches one stops at drafting and asks who owns it. Owners are read only from CODEOWNERS; they are never guessed from who committed.



