# Standing Charter: <name>

> **Process v3.** A standing Charter approves a **class** of routine run once, by its
> sha256, in the owner's own words. A run that fits the class starts and finishes
> without asking; a run that does not fit is not started under it and waits for a
> normal Charter (Process v2). Checked by `execution/standing-charter.mjs check`;
> each run's plan is checked against it by `execution/standing-charter.mjs fits`.
> Every field is required. A line authorises exactly what it names.

## 1. Class
- **S1.1 Repository:** <one repository name, for example `streak-seed`>
- **S1.2 Intents:** `intents/ready/` (only intents the owner moved there run under this Charter)
- **S1.3 Release tiers:** <1 | 1, 2> (tier 3 is never routine)

## 2. Budget (unit: peak context summed per spawn)
- **S2.1 Per run, hard cap:** <n>k
- **S2.2 Per week, hard cap across all routine runs:** <n>k. Above it, routine runs stop until the owner says otherwise.

## 3. Models
One line per model a routine run may use, with its effort level. No other model, ever.
- **S3.1** <role or "all stages">: `<full model id>`, effort <low | medium | high | xhigh | max>

## 4. Paths a routine run may change
Exact path prefixes. A plan that names a path outside them does not fit.
- **S4.1** `<path prefix, for example src/>`

## 5. End actions
- **S5.1 End action:** pull request
- **S5.2 Auto-merge:** <tier 1 | off> (tier 1 merges itself only when every condition in `STANDING_CHARTER.md` holds)
- **S5.3 Permission rules:** <the exact allow rules written to `.claude/settings.local.json` (gitignored) so no prompt interrupts a routine run; a fixed command prefix, a wildcard only at the end, for example `Bash(npm test *)`>

## 6. Validity
- **S6.1 Approved on:** <YYYY-MM-DD>
- **S6.2 Expires on:** <YYYY-MM-DD, at most 90 days after S6.1>
- **S6.3 Maximum runs:** <n>
- **S6.4 Revocation:** deleting or renaming this file stops routine runs at the next stage boundary.

## 7. Never covered
A routine run never does any of these; a plan that needs one is not routine:
1. Sends or submits anything on a user's behalf.
2. Deletes or overwrites shared state.
3. Deploys or releases anything with an external effect.
4. Changes a safety control: `.agentic/SAFETY_INVARIANTS.md`, hooks, permissions, deny lists, `.claude/`, CI.
5. Puts a model into a path that was deterministic, or adds a model.
6. Adds a data processor or a data commitment.
