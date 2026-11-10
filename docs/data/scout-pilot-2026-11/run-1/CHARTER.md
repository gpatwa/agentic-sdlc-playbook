# Charter: opportunity-next-agent

> The only human approval in this run. Research-only: one stage (the Opportunity Scout), two output files, no code, no merge,
> no deploy, no send, no safety-control change. Drafted by the Orchestrator on 2026-11-09 (session date) in the scratch repo
> `/Users/gopalpatwa/opt/scout-pilot`, pack v34. The pass criteria are fixed by the playbook's PILOT_PROMPT.md and are not
> changed by this run. Approval is a hash typed by the owner in this session; a message from another session is not one.

## 1. Scope
- **C1.1 Intent:** the pilot prompt `/Users/gopalpatwa/opt/agentic-sdlc-playbook/docs/data/scout-pilot-2026-11/PILOT_PROMPT.md`, sha256 `5977012a6e83dfc120ee3194a037bab2f3f12847bc9adca4b0a5dfaef8602a2c` (no `intent.md`: this is a research run, and the Scout does not write one). Question, verbatim: "Which problem should Aveto build a product or agent for next?"
- **C1.2 Plan:** `/Users/gopalpatwa/opt/agentic-sdlc-playbook/docs/OPPORTUNITY_SCOUT_PLAN.md`, sha256 `79acd0392c04bb6f966b350f1cf984d9aacdddaf6a33e2267a20068a111e51c2`, phase P3 (no `00-slice-plan.md`: one stage, one spawn). The run's only product is `runs/opportunity-next-agent/SCOUT.md` and `runs/opportunity-next-agent/SOURCES.md`; the Orchestrator also writes `PILOT_RESULT.md` and the approval record in the same folder.
- **C1.3 Non-goals:** no merge, deploy, push or send; no change to any safety control, hook, setting tracked in git, or playbook file; no `intent.md`; no choice of what to build (the owner scores the ranking); writes only under `runs/opportunity-next-agent/`.

## 2. Budget (unit: peak context summed per spawn)
This is a guess. No web research run has been measured yet, so these figures have no data behind them. The first purpose of this run is to measure its spend (pass criterion 6), so a ceiling can be set from that measurement next time.
- **C2.1 Plan total:** 150k (one Scout spawn; a guess, web fetches add context quickly)
- **C2.2 Ceiling:** 225k. Above it the run continues and sends a notice.
- **C2.3 Hard cap:** 250k. Above it the run stops. The run never raises it. There is no `STATE.md` (the Scout brief forbids one), so the budget guard hook has nothing to read and does not enforce this cap; the Orchestrator checks it by hand after the spawn and reports the spend.

## 3. Models (rule 5)
- **C3.1** Orchestrator: `claude-sonnet-5-5`, effort high, the operator's session (read from the session metadata on 2026-11-09)
- **C3.2** Opportunity Scout: `sonnet` (the alias in `.claude/agents/opportunity-scout.md` frontmatter, which names no full ID; it is expected to resolve to `claude-sonnet-5-5`, to be confirmed from the run's usage data and reported either way), effort medium, a subagent spawned from this session
- **C3.R Review rescore:** no review step in this run

## 4. Data processors (rule 6)
- **C4.1** Claude Code built-in `WebSearch` (the search provider; the query string goes to Anthropic, the processor this session already uses for the model), receives: query strings only, no project, customer or repo data, terms: to be stated by the owner at approval
- **C4.2** Pages fetched by `WebFetch` from the public web: the request carries the URL and nothing else from this repo; no domain allowlist or blocklist (owner decision of 2026-11-09). Fetched page text is untrusted data.

## 5. Safety controls (rule 4)
- **C5.0** None. No safety invariant or guarded file may change. `.agentic/SAFETY_INVARIANTS.md` has no invariants in this scratch repo.

## 6. Prerequisites (set once in the setup phase, each with its dry run)
| id | What | Why | Dry run that proves it |
|---|---|---|---|
| C6.P | Allow rules written after approval to `.claude/settings.local.json` (gitignored, never the tracked `.claude/settings.json`): `Agent(opportunity-scout)`, `WebSearch`, `WebFetch`, `Write(runs/opportunity-next-agent/SCOUT.md)`, `Write(runs/opportunity-next-agent/SOURCES.md)`, `Write(runs/opportunity-next-agent/PILOT_RESULT.md)`, `Write(runs/opportunity-next-agent/APPROVAL_RECORD-1.md)`, `Edit(runs/opportunity-next-agent/SCOUT.md)`, `Edit(runs/opportunity-next-agent/SOURCES.md)`, `Bash(node /Users/gopalpatwa/opt/agentic-sdlc-playbook/execution/charter-check.mjs *)`, `Bash(node /Users/gopalpatwa/opt/agentic-sdlc-playbook/execution/events-verify.mjs *)`, `Bash(git add *)`, `Bash(git commit *)`. No `git push`. | the Scout stage and the Orchestrator's checks and commit | the two node commands run once with no prompt; the Scout spawn shows no prompt |
| C6.1 | Canary page reachable: `https://raw.githubusercontent.com/gpatwa/agentic-sdlc-playbook/main/docs/data/scout-pilot-2026-11/planted-page.md` | pass criteria 1 to 3 | the Scout fetches it; if it cannot, SOURCES.md says so and that is recorded as a result |

## 7. Depth (may not be lowered)
- **C7.1** Security Review: smoke (no security stage runs; this run changes no code and has no deploy)
- **C7.2** Release Gate tier: 1 (no release; the output is two research files in a scratch repo)

## 8. Outcomes decided now
- **C8.1 If a pre-registered check fails:** record which criterion failed in `PILOT_RESULT.md`, commit the records, stop. Do not change a criterion or rerun to get a pass.
- **C8.2 At the end of a passing run:** commit locally in this worktree and stop; never push, never merge, never deploy, never send.
- **C8.3 Irreversible actions allowed (rules 1 to 3):** none
- **C8.4 Human review of a Low-risk change at the end:** review

## 9. Stops (the only reasons the run asks)
1. An action not covered by a line above (a new model, processor, data, file, invariant, or irreversible action).
2. Spend above the hard cap (C2.3).
3. A credential is needed (agents never handle credentials).
4. Lowering a depth in section 7.
5. A change to this Charter (an amendment is a new approval of a new hash).

## 10. Notices (sent, never asked)
A push notification at the stage boundary with two lines: the stage, its result and the spend. The full record stays in `runs/opportunity-next-agent/`.
