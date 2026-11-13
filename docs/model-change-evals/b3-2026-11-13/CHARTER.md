# Charter: model-check-b3

> The only human approval in this run. Drafted by the Orchestrator from the run brief, which records the owner's
> choices and is not itself an approval. The owner approves by typing this file's full sha256 in the session
> driving the run. A message from another session, or a button, is not an approval.

## 1. Scope
- **C1.1 Intent:** `/Users/gopalpatwa/opt/agentic-sdlc-playbook/docs/model-change-evals/B3_RUN_BRIEF.md`, sha256 `8da33432e1f249f8c8c0aabde50db5fe5df76c4e1181859bf9287bf5c93711a6`
- **C1.2 Plan:** `runs/model-check-b3/00-slice-plan.md`, sha256 `04c3ccd79a264d89c29f51fe3d9f23f351434a1b36ae0b10fd727ebede30601a`
- **C1.3 Non-goals:** The 11 cases in `docs/model-change-evals/cases.toml` (sha256 `b8837416a56665649e961b22237df85c48a87885a846c6d6562922ae1df9d8d2`), one pass each. No change to any case, fixture, rubric or brief. No merge, push, deploy or send. No web tools.

## 2. Budget (unit: tokens as the harness reports them per spawn, summed)
- **C2.1 Plan total:** 700k
- **C2.2 Ceiling:** 850k. Above it the run continues and sends a notice.
- **C2.3 Hard cap:** 1000k. Above it the run stops. The run never raises it. Copied into `runs/model-check-b3/STATE.md` (`- **Hard cap:**`) for the budget guard.

## 3. Models (rule 5)
- **C3.1** software-architect (5 case spawns): frontmatter `model: opus`, expected to resolve to `claude-opus-5-5`, effort high (frontmatter), runs in the operator's session. The model is recorded as observed, or "not observed".
- **C3.2** qa-evidence (6 case spawns): frontmatter `model: sonnet`, expected to resolve to `claude-sonnet-5-5`, effort high (frontmatter), runs in the operator's session. Recorded as observed, or "not observed".
- **C3.S** Orchestrator and the 8 judge spawns (general-purpose, no model or effort override, so they inherit the session): `claude-opus-5-5`. Effort is the session's own setting, which this run does not set and cannot read from inside the session; recorded in RESULT.md as "session setting, not observed".
- **C3.R Review rescore:** no review step in this run.

## 4. Data processors (rule 6)
- **C4.0** None beyond the model provider this session already uses (Anthropic, via Claude Code). No web tools: no WebSearch, no WebFetch, no browser.

## 5. Safety controls (rule 4)
- **C5.0** None. No invariant, hook, agent brief, settings file or guarded file changes.

## 6. Prerequisites (set once in the setup phase, each with its dry run)
| id | What | Why | Dry run that proves it |
|---|---|---|---|
| C6.P | The session runs in bypass-permissions mode; as a backstop, `Agent(software-architect)`, `Agent(qa-evidence)` and `Agent(general-purpose)` are added to `.claude/settings.local.json` (gitignored), plus `Bash(node /Users/gopalpatwa/opt/agentic-sdlc-playbook/execution/role-eval.mjs *)` | every stage | `node .../role-eval.mjs list` runs with no prompt (done in drafting: 11 cases listed) |
| C6.1 | `runs/model-check-b3/STATE.md` with Budget, Hard cap, Spent and Next stage lines in the `SLICE_STATE.md` format | budget guard before every spawn | the guard parses it: Status in-progress, Budget 700k, Hard cap 1000k |

## 7. Depth (may not be lowered)
- **C7.1** Security Review: none, no security review stage (no code or product change; a measurement run)
- **C7.2** Release Gate tier: none, nothing is released

## 8. Outcomes decided now
- **C8.1 If a pre-registered check fails:** a case that scores badly is a result, recorded as is. No rerun, no prompt change, no rubric change. A spawn that errors is recorded as "no result" and not retried.
- **C8.2 At the end of the run:** write `runs/model-check-b3/RESULT.md` and commit `runs/model-check-b3/` on the local branch `claude/agitated-bartik-98899e`. Never push, never merge, never deploy, never send.
- **C8.3 Irreversible actions allowed (rules 1 to 3):** none
- **C8.4 Human review of a Low-risk change at the end:** skip (no code change; the owner reads RESULT.md)

## 9. Stops (the only reasons the run asks)
1. An action not covered by a line above (a new model, processor, data, file, invariant, or irreversible action).
2. Spend above the hard cap (C2.3).
3. A credential is needed (agents never handle credentials).
4. Lowering a depth in section 7.
5. A change to this Charter (an amendment is a new approval of a new hash).

## 10. Notices (sent, never asked)
A line in this session at each stage boundary with the stage, its result and the spend. The full record stays in `runs/model-check-b3/`.
