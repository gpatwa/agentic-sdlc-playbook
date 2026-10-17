# Charter: <slice-id>

> The only human approval in a Process v2 run. The Orchestrator drafts this file
> at plan confirmation; the human reads it whole and approves it once, in their
> own words, naming this file and its sha256 (`node <playbook>/execution/charter-check.mjs
> runs/<slice-id>/CHARTER.md` prints both). After that the run proceeds to a
> finished result and **asks nothing**. It stops only when an action is outside
> this Charter (section 9). Every gated action cites the line id that allows it.
>
> Every field is required. "None" is a valid answer; a blank is not. A line
> authorises exactly what it names, nothing broader: no wildcards, no "and similar".

## 1. Scope
- **C1.1 Intent:** `runs/<slice-id>/intent.md`, sha256 `<…>`
- **C1.2 Plan:** `runs/<slice-id>/00-slice-plan.md`, sha256 `<…>`
- **C1.3 Non-goals:** <copied from the plan>

## 2. Budget (unit: peak context summed per spawn)
- **C2.1 Plan total:** <n>k
- **C2.2 Ceiling:** <n>k. Above it the run continues and sends a notice.
- **C2.3 Hard cap:** <n>k. Above it the run stops. The run never raises it.

## 3. Models (rule 5)
One line per role that calls a model in the product or the run, with the full model ID.
- **C3.1** <role>: `<full model id>`, <where it runs: the operator's session | the app at runtime>
- (or) **C3.0** None: no model in the product path.

## 4. Data processors (rule 6)
One line per processor, with exactly what it may receive and its DPA / terms status.
- **C4.1** <processor>, receives: <exact data>, terms: <status as known>
- (or) **C4.0** None beyond those already approved: <record ids>.

## 5. Safety controls (rule 4)
One line per invariant or guarded file that may change, with the bounds of the
change. The final words are checked by a different-model adversarial reviewer
against these bounds and shown to the human in the end-of-run review.
- **C5.1** `<.agentic/SAFETY_INVARIANTS.md> INV-<n>`: may <exact bound, for example "gain one sentence naming what the operator's session sends, as measured; nothing removed">
- **C5.2** `<guarded file>`: may <exact direction, for example "only add names to `disallowedTools`">
- (or) **C5.0** None.

## 6. Prerequisites (set once in the setup phase, each with its dry run)
| id | What | Why | Dry run that proves it |
|---|---|---|---|
| C6.P | <Permissions: how no app permission prompt interrupts the run: the exact allow rules written to `.claude/settings.json` (a fixed command prefix, a wildcard only at the end, for example `Bash(npm test *)`), or the permission mode the session runs in> | <every stage> | <each allowed command run once in setup, no prompt shown> |
| C6.1 | <setting, folder shortcut, or other prerequisite> | <stage that needs it> | <command and expected result> |

> C6.P is required. A permission prompt during the run is a Charter miss, recorded
> in the end review. A rule with a wildcard before or inside the command (for
> example `Bash(uv run * python * x.py *)`) is refused by `charter-check`: it can
> allow any command.

## 7. Depth (may not be lowered)
- **C7.1** Security Review: <smoke | standard | adversarial>
- **C7.2** Release Gate tier: <1 | 2 | 3>

## 8. Outcomes decided now
- **C8.1 If a pre-registered check fails:** <for example "close as not releasable, write the close-out, stop">
- **C8.2 At the end of a passing run:** <default: "push the branch and open a pull request; never merge, never deploy, never send">
- **C8.3 Irreversible actions allowed (rules 1 to 3):** <default: "none"> (each one names its exact target and its rollback)
- **C8.4 Human review of a Low-risk change at the end:** <review | skip> (default: review; see `CODE_REVIEW.md`: Medium and High changes are always reviewed)

## 9. Stops (the only reasons the run asks)
1. An action not covered by a line above (a new model, processor, data, file, invariant, or irreversible action).
2. Spend above the hard cap (C2.3).
3. A credential is needed (agents never handle credentials).
4. Lowering a depth in section 7.
5. A change to this Charter (an amendment is a new approval of a new hash).

## 10. Notices (sent, never asked)
A push notification at each stage boundary with two lines: the stage, its result
and the spend. The full record stays in `runs/<slice-id>/`.
