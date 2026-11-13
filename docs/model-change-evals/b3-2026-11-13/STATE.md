# Slice State — model-check-b3

- **Ask:** B3 one-pass measurement of the 11 model-change cases on the current model
- **Project pack:** scratch (measurement run)
- **Release tier:** none
- **Current stage:** Result written
- **Status:** done
- **Least-privilege:** enforced — role spawns use this repo's `.claude/agents/` (software-architect, qa-evidence); judges are general-purpose with full tools by design of the brief
- **Telemetry:** self-reported
- **Charter:** runs/model-check-b3/CHARTER.md, sha256 b2da2a999729752facdcfe3f8a4b23353ca6f0984b70d16a6bd812b80bdfff29, approved in APPROVAL_RECORD-1
- **Started:** 2026-11-12  ·  **Updated:** 2026-11-12

## Stages

| Stage | Owner | Status | Artefact | Gate |
|-------|-------|--------|----------|------|
| Charter | Orchestrator → owner | approved | runs/model-check-b3/CHARTER.md | owner types full sha256 |
| Cases (11) | software-architect / qa-evidence | done | replies/ | — |
| Judging (8) | general-purpose | done | scores/ | — |
| Result | Orchestrator | done | RESULT.md | — |

## Budget

Per `RUN_ECONOMICS.md`. Checked **before every spawn** — never reconciled after.

- **Budget:** 700k tokens  ·  **Depth:** standard
- **Hard cap:** 1000k tokens
- **Spent:** 650k (93%)  ·  **Remaining:** 50k
- **Next stage:** none est. 0k → **PROCEED**

## Failure budget

| Stage | Retries used | Cap | Class | Last failure |
|-------|--------------|-----|-------|--------------|
| every spawn | 0 | 0 | — | — (Charter C8.1: no retries) |

## Spend log

| # | Spawn | Tokens |
|---|-------|--------|
| 1-11 | 11 case spawns (5 software-architect, 6 qa-evidence), all completed, none errored | 176,619 (harness subagent_tokens, summed) |
| 12-19 | 8 judge spawns (general-purpose), all completed | 473,012 |
