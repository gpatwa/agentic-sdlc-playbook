# Cost & Budget Review — <slice name>

> Owner: FinOps Agent
> Status: <draft / pass / required-fix>
> Source tech spec: <path>

## Cost drivers

What this slice adds to the bill.

| Driver | Unit | Unit price | Notes |
|--------|------|------------|-------|
| <e.g. LLM tokens> | <per 1K tokens> | <$> | <model, avg tokens/call> |
| <e.g. compute> | <per hour / req> | <$> | <…> |
| <e.g. third-party API> | <per call> | <$> | <…> |

## Cost-per-action

- **Action:** <the user action being priced>
- **Cost per action:** <$ — show the arithmetic from the drivers above>

## Projected volume & monthly cost

- **Projected volume:** <actions / month, with the source of the estimate>
- **Expected monthly cost:** <$ at projected volume>
- **At 10x volume:** <$ — does anything break or balloon?>

## Unit economics

- **Value / price per action:** <$ or qualitative>
- **Margin per action:** <value − cost>
- **Sustainable?** <yes / no — stated plainly. If no, say so.>

## Budget & alerts

- **Budget ceiling:** <$ / month>
- **Alert thresholds:** <e.g. 50% / 80% — alert BEFORE the ceiling>
- **Alert routing:** <where it goes — coordinate with SRE alerting>

## Kill-switch / circuit-breaker

Required for any unbounded-cost path.

- **Trigger:** <token cap / spend ceiling / rate limit / concurrency>
- **Behaviour when tripped:** <degrade / queue / reject + user message>
- **Tested?** <yes — how / no → blocker>

## Findings

| Finding | Severity (blocker / required-fix / advisory) |
|---------|----------------------------------------------|
| <finding> | <severity> |

## Recommendation

- [ ] **Pass** to Release Manager.
- [ ] **Required fix** — missing kill-switch or unsustainable economics.

## Hand off

To the Release Manager (release input) and the Orchestrator (if economics
force a rethink). Kill-switch operation hands to the SRE in production.
