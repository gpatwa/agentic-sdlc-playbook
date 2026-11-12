# Can Aveto see the plan's remaining quota? (docs-only check)

> Written 2026-11-12 by the support session at the owner's request (roadmap Theme 3, decision 5: "documentation only, no spend,
> nothing installed"). Pages read through a page-reading agent, which quoted them: https://code.claude.com/docs/en/statusline
> (read in full), https://code.claude.com/docs/en/hooks (first ~80k characters verbatim, the next ~100k summarised, the last ~113k
> **not read**), https://code.claude.com/docs/en/costs, https://code.claude.com/docs/en/monitoring-usage (the last ~36k characters not
> read). Nothing was run. Every "the docs do not say" below means these pages, as read.

## Answer

**Partly.** The plan's usage is visible to one documented place only: the **status line command**. It receives, on stdin:

| Field | What the docs say |
|---|---|
| `rate_limits.five_hour.used_percentage` | "Percentage of the 5-hour or 7-day rate limit consumed, from 0 to 100" |
| `rate_limits.seven_day.used_percentage` | same |
| `rate_limits.five_hour.resets_at`, `rate_limits.seven_day.resets_at` | "Unix epoch seconds when the 5-hour or 7-day rate limit window resets" |

Limits the docs state: `rate_limits` "appears only for claude.ai Pro, Max, and Ultra subscribers", and "only after the first API
response in the session". It is **used**, not **remaining** (remaining = 100 minus used, which is arithmetic, not a documented
field). Team and Enterprise seats are not mentioned for this field.

**Not a source:**
- **Hooks** (PreToolUse, PostToolUse, Stop and others, in the part read) receive no usage, cost or rate-limit fields. PostToolUse on a
  finished subagent can carry `totalTokens` and `usage`, per subagent, not the plan's quota.
- **`cost.total_cost_usd`** in the status line is a client-side estimate at list price; the costs page says for Pro, Max and Ultra
  "the session cost figure isn't relevant for billing purposes".
- **`/usage`** shows plan usage bars on an interactive screen; no machine-readable output is documented.
- **OpenTelemetry** metrics give cost and token counts, not quota (per the part read).
- No environment variable or file holding quota is documented.

## What Aveto could build from this (not built; a pack change, so a new version)

1. **The status line writes a small file.** A status line script Aveto installs saves `used_percentage` and `resets_at` for both
   windows, with the time it saw them, to a file under `.claude/` (not committed).
2. **The budget guard reads it before each spawn.** `budget-guard.mjs` already runs before every subagent. It would add: if the
   five-hour window is past a threshold set in the Charter (for example 80% used), stop and ask, showing the figure, its age and the
   reset time; if the file is missing or stale, say so and carry on (the guard fails open by design).
3. **The record keeps it.** `STATE.md` and the end review show the window's figure at the start and the end of the run.

This gives "stop at a remaining-quota %" before a stage starts. It still cannot stop a stage once started (T43e).

## Not confirmed, and needed before building

1. **Whether the desktop app runs a status line command at all.** Status lines are documented for the terminal. Aveto's runs go
   through the desktop app. If the app does not run it, nothing writes the file. Check by installing a one-line status line that
   writes a timestamp, in a throwaway repo, and running one desktop session (no model spend beyond the session itself).
2. **How fresh the figure is.** The docs say the status line reruns when a window resets; how often it reruns otherwise is not stated
   here. A stale figure must show its age.
3. **Whether subagents' usage counts toward the same five-hour window promptly.** Not stated.
4. **Team and Enterprise plans:** not stated whether they receive `rate_limits`.

## Recommendation

Do check 1 (cheap, needs the owner's go-ahead because it installs a status line in a throwaway repo). If the desktop app runs it,
building items 1 to 3 is about one small slice. If it does not, the honest wording is "Aveto cannot see your plan's quota from the
desktop app; use `/usage`", and Theme 3 falls back to the turn limit (`maxTurns`) and a running spend total.
