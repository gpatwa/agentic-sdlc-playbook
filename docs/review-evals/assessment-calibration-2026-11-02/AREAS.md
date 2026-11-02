# Assessment plan: seeded-repo

> Commit `57181e2f73c4683beba1d8bde4e48b15fb4340b5`, planned 2026-11-02 by `execution/assess-plan.mjs`. Deterministic, no model.
> Cap: 100,000 tokens of source (estimate: bytes / 4); an area holds at most 20,000. Areas run in order of risk, then churn, and the plan **stops at the cap**: the rest is listed as not reviewed, never skipped silently.

## Summary

- Planned: 6 areas, about 46,699 tokens.
- **Not reviewed:** 0 areas, about 0 tokens.
- Out of scope: 95 files. Excluded as secret paths: 0. Skipped (vendored, binary, lock): 0. Held back for a possible secret: 0. Too large for one pass: 0.

## Areas, in review order

| # | Area | Tier | Files | Approx. tokens | Status |
|---|---|---|---|---|---|
| 01 | `hr_timeoff_agent/services/web` | high | 11 | 10,393 | planned |
| 02 | `hr_timeoff_agent/adapters` | high | 8 | 18,132 | planned |
| 03 | `hr_timeoff_agent/services/a2a` | high | 5 | 10,208 | planned |
| 04 | `hr_timeoff_agent/core` | medium | 7 | 5,089 | planned |
| 05 | `hr_timeoff_agent/hr_tools` | medium | 3 | 2,877 | planned |
| 06 | `hr_timeoff_agent/services` | medium | 1 | 0 | planned |

## What this plan does not say

Reviewing an area finds issues; it does not show their absence. Anything in a **not reviewed** area, a held-back file or a secret path was not looked at.
