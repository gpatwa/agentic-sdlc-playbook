# Spend record: opportunity-variance

Charter C2 (unit: peak context summed per spawn, unconfirmed): plan 180k, ceiling 270k, hard cap 330k. Checked by hand after each
spawn. The rule (C2.3): do not start the next spawn if the spend so far plus the largest single spawn so far would pass 330k. The
spend so far uses the larger of the two figures per spawn (harness or `usage.mjs` peak context), to be conservative.

| Spawn | Output folder | Both files written | Harness figure (tokens, tool uses, ms) | `usage.mjs` (requests, peak ctx, processed, model logged) | Spend so far | Next-spawn check (so far + largest) |
|---|---|---|---|---|---|---|
| 1 | `runs/opportunity-variance-1/` | yes (`SCOUT.md`, `SOURCES.md`) | 55,821 · 28 · 124,207 | 9 · 54k · 337k · `sonnet-5-5` | 55.8k | 111.6k ≤ 330k → spawn 2 may start |
| 2 | `runs/opportunity-variance-2/` | yes (`SCOUT.md`, `SOURCES.md`) | 59,307 · 33 · 144,394 | 9 · 57k · 332k · `sonnet-5-5` | 115.1k | 174.4k ≤ 330k → spawn 3 may start |
| 3 | `runs/opportunity-variance-3/` | yes (`SCOUT.md`, `SOURCES.md`) | 55,861 · 30 · 134,572 | 8 · 54k · 279k · `sonnet-5-5` | 171.0k | no further spawn |

**Total (harness figures):** 170,989 tokens across 3 spawns (`usage.mjs` peak context summed: 165k; processed summed: 948k). Under
the plan (180k), the ceiling (270k, so no notice was due) and the hard cap (330k). Orchestrator turns are not included (`usage.mjs`
does not measure them).

**Event log:** `EVENTS.jsonl` is a copy of `/Users/gopalpatwa/opt/scout-pilot/.claude/events/3557ec5a-897c-44e4-9924-010b2d8e87b3.jsonl`,
taken after spawn 3. `events-verify`: chain intact, 243 lines; main 31 calls, `opportunity-scout` 91 calls, 0 failed. Its one warning
(seq 243, a `Bash` call with no outcome) is the very command that made the copy: the copy was taken before that call's `post` event
was written.

Notes:
- Spawn 1 said in its own report that it stopped early, citing the budget. That is the Scout's own statement and is recorded here as such, not checked or graded by the Orchestrator (C1.3).
- `usage.mjs` read per slice folder (`--slice opportunity-variance-N`). Model as logged by the harness: `sonnet-5-5`.
