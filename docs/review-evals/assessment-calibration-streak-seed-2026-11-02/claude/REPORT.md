# Assessment report: streak-seeded

**Assessed against Aveto's gates on 2026-11-02. This is an assessment, not a certification.** It records what the reviewers found in the parts listed below. It does not say the code is secure or compliant, and a finding's absence is not evidence of safety.

|  |  |
|---|---|
| Commit | `4858e7a6e9bf02a1249106fcbb6efb4bf0b5db2b` |
| Reviewers | claude (anthropic) |
| Independent second reviewer | **no**: one model family reviewed this. Treat it as a first pass. |
| Built under Aveto | no records found |
| Read-only check | passed: the target's HEAD and working tree were unchanged, and the review copy differed from the commit only by the recorded removals |
| Source reviewed | about 109,961 of 109,961 reviewable tokens (estimate: bytes / 4) |

## Summary

45 finding(s): 0 P0, 6 P1, 26 P2, 13 P3, 0 note. 0 are still open; the owner sets each disposition.

## Risk map

| Tier | Files | Approx. tokens |
|---|---|---|
| high | 49 | 70,578 |
| medium | 20 | 34,665 |
| low | 9 | 4,718 |

High-risk files (49): `.agentic/CURRENT_MVP_STATUS.md`, `.agentic/LOCAL_COMMANDS.md`, `.agentic/PROJECT_CONTEXT.md`, `.agentic/SAFETY_INVARIANTS.md`, `.agentic/STANDING_CHARTER.md`, `.agentic/STANDING_CHARTER_APPROVAL.md`, `.claude/agentic.config.json`, `.claude/agents/ai-engineer.md`, `.claude/agents/ai-governance.md`, `.claude/agents/analytics-engineer.md`, `.claude/agents/backend-architect.md`, `.claude/agents/cloud-deployment.md`, `.claude/agents/compliance-reviewer.md`, `.claude/agents/customer-success.md`, `.claude/agents/customer-support.md`, `.claude/agents/data-analyst.md`, `.claude/agents/data-governance.md`, `.claude/agents/engineering-manager.md`, `.claude/agents/finops.md`, `.claude/agents/frontend-developer.md`, `.claude/agents/market-researcher.md`, `.claude/agents/ml-engineer.md`, `.claude/agents/on-call-engineer.md`, `.claude/agents/orchestrator.md`, `.claude/agents/post-launch-learning.md`, and 24 more (see `map.json`).

## Findings

### P1

**F-01-1** · `.claude/agents/production-verification.md:100` ·  · claude

The brief tells the agent to execute a production rollback with no human approval round-trip. It infers approval from the tech spec review, which is not a recorded human approval. AGENTS.md rule 1 says "Never self-approve, never infer approval". The same file at line 122 says the human owns the rollback. A no-go verdict on a live service triggers this.

*Evidence:* `A no-go triggers rollback immediately; it does not wait for a human approval round-trip, because the rollback plan was already human-approved when the tech spec was reviewed` (lines 100-103) versus `The human owns: the deploy and its rollback (Charter C8.3)` (line 122)

**F-02-1** · `.claude/protocols/MODEL_ROUTING.md:60` ·  · claude

Tier 1 routing says gates stay at `medium` effort. The same file says gates never drop below `high`. Gates are `high` by default (Layer 1b), so a tier-1 slice (docs or refactor) following Layer 2 lowers QA, Release Manager and Security effort. `FAILURE_LOOP.md` treats weakening a gate as a rule 4 action. Layer 2 is applied by the Orchestrator at spawn time, with no approval step.

*Evidence:* `- **Gates never drop below \`high\`.** A cheaper gate that passes a bad slice` (line 43) vs `haiku where mechanical. Producers drop to \`low\` effort; gates stay` / `\`medium\`.` (lines 60-61)

**F-03-1** · `.agentic/STANDING_CHARTER.md:47` ·  · claude

§7.4 lists safety controls as files and directories only. The controls that SAFETY_INVARIANTS and CURRENT_MVP_STATUS call human-approval-only are enforced in code under `src/`, which §4 (S4.1) lets a routine run change freely. A tier 1 or 2 plan that widens `ALLOWED_TAGS` in `src/client/dom.js:24`, or changes the bind host in `src/server.js:404`, names only `src/` paths. It therefore "fits", skips human approval and can auto-merge. SAFETY_INVARIANTS item 7 requires approval plus real authentication for a bind widening. CURRENT_MVP_STATUS says widening `ALLOWED_TAGS` or `ALLOWED_PROPS` is a rule-4 change.

*Evidence:* `S4.1 \`src/\`` and `4. Changes a safety control: \`.agentic/SAFETY_INVARIANTS.md\`, hooks, permissions, deny lists, \`.claude/\`, CI.` Also `src/client/dom.js:24: const ALLOWED_TAGS = new Set(["a", "button", ...` and `src/server.js:404: createStreakServer().listen(port, host, () => {`. CURRENT_MVP_STATUS.md:37-39: `widening ALLOWED_TAGS or ALLOWED_PROPS is a rule-4 safety-control change and needs human approval.`

**F-04-1** · `.claude/settings.json:1` ·  · claude

The file has no `hooks` block, so the budget and write-scope guards that AGENTS.md promises are not wired. It happens on any subagent spawn or write: nothing checks `spent + estimate ≤ budget` first, and nothing restricts where roles write. The commit has no `.claude/hooks/` directory (glob of `.claude/**/*` returns no hook files) and no `.claude/commands/`. The `/agentic-slice`, `/agentic-resume` and `/agentic-status` entry points are missing too. Non-negotiable rule 6 is therefore not enforced, and rules 3 and 4 have no enforcement either.

*Evidence:* evidence: file is `{ "permissions": { "deny": [ ... ] } }` with no other top-level key. AGENTS.md says: "Budget enforcement: a pre-spawn hook (`.claude/hooks/`) checks the budget before every subagent spawn".

**F-04-2** · `.claude/settings.json:4-6` ·  · claude

The project-wide deny list blocks `Edit`, `Write` and `NotebookEdit` outright. Deny rules take precedence over allow rules and over per-agent `tools:` frontmatter. Every role that lists `Write, Edit` (orchestrator, product-manager, qa-evidence and the rest) therefore cannot write `runs/<slice-id>/STATE.md`, specs or evidence, which breaks rule 4 ("State is durable") and rule 5 (handoff through artefacts). Slices stall, or roles fall back to Bash redirects. That fallback is not denied (see F-04-3) and bypasses the least-privilege model.

*Evidence:* evidence: `"Edit",` `"Write",` `"NotebookEdit",`. The agent list shows orchestrator and the other roles with "Tools: Read, Write, Edit, ...".

**F-06-1** · `src/services/habits.js:85` ·  · claude

Cross-user access. `logCompletion` compares owner ids case-insensitively, but `listHabits` (line 64) and the audit scoping use strict `===`, so the ownership gate is looser than the rest of the service. Sending `X-User-Id: ALICE` with a sequential habitId such as `habit_1` that belongs to `alice` mutates alice's completion Set and returns her habit view (name, streaks) with 200 instead of the non-oracle 404. The `habit.completion_logged` audit event is then recorded under the attacker's userId, not the owner's. Ids are sequential (`habit_${++seq}`), so they are guessable. This contradicts the "ownership-gated, never touches another user's data" contract in the doc comment and in server.js.

*Evidence:* `if (!habit || habit.userId.toLowerCase() !== userId.toLowerCase()) return null;` versus `if (habit.userId === userId) out.push(viewOf(habit, today));`

### P2

**F-01-2** · `.claude/agents/on-call-engineer.md:71` ·  · claude

Same unrecorded-approval problem as F-01-1. The agent "auto-executes" the tech spec's rollback after a post-merge regression. The brief does not require a Charter line (C8.3) that names the rollback. Line 125 gates only "novel" infra actions. A regression after a merge triggers this.

*Evidence:* `If it regressed, auto-executes the rollback plan already recorded in that slice's tech spec, logs a revert audit event, and escalates to the human.` (lines 73-74)

**F-01-3** · `.claude/agents/cloud-deployment.md:4` ·  · claude

The role cannot do its mission with its granted tools. It must run the three wrapped skills, run `azd up` or `terraform apply`, and open a PR. It has no Bash and no Skill tool. Line 25 limits its writes to `runs/<slice-id>/`, yet its outputs include `.azure/deployment-plan.md` and IaC in the product repo. Line 24 says to stop and hand back. The only other path is the inlined fallback with full tools, which removes the least-privilege guarantee and the "never sets Validated" separation. Any deploy slice triggers this.

*Evidence:* `tools: Read, Write, Edit, Grep, Glob`; `used as a chain their own authors already enforce`; `Generated IaC (Terraform or Bicep) as a **pull request** into the product repo`; `Your writes are limited to \`runs/<slice-id>/\` and the few repo files your role owns`

**F-01-4** · `.claude/agents/production-verification.md:4` ·  · claude

Same mismatch. The mission needs `azure-diagnostics` and `azure-reliability` queries and execution of the rollback plan. The tools are Read, Write, Edit, Grep, Glob only, and writes are limited to `runs/`. The agent either cannot act, so it hands back, or it is inlined with full tools. The inlined case loses the "read-only against the live environment" guarantee at line 112.

*Evidence:* `tools: Read, Write, Edit, Grep, Glob`; `If no-go: the tech spec's rollback plan, executed`; `Read-only against the live environment`

**F-01-5** · `.claude/agents/on-call-engineer.md:4` ·  · claude

The role has no shell or observability tools. It needs logs, metrics, traces and deploy history. It must also execute pre-authorized runbook steps and rollbacks. Its Write/Edit is limited to `runs/`. Line 150 forbids "write access just to save a step", but the inlined fallback gives exactly that.

*Evidence:* `tools: Read, Write, Edit, Grep, Glob`; `Read-only access: logs, metrics, traces, deploy history, source repos.`; `executes governed remediation for infra-level actions`

**F-01-6** · `.claude/agents/post-launch-learning.md:68` ·  · claude

The brief requires running `node <playbook>/execution/analyze.mjs .`, but the agent has no Bash. It also must write `runs/ANALYTICS.md` and `runs/dashboard.html`, which are outside the `runs/<slice-id>/` write scope in line 25. Every Tier 2/3 close-out triggers this, so the step is skipped or the guard blocks it. The brief does not say which.

*Evidence:* `regenerate \`runs/ANALYTICS.md\` + \`runs/dashboard.html\` via \`node <playbook>/execution/analyze.mjs .\`` versus `tools: Read, Write, Edit, Grep, Glob` and `Your writes are limited to \`runs/<slice-id>/\``

**F-01-7** · `.claude/agents/orchestrator.md:4` ·  · claude

Release Manager's Charter check relies on the Orchestrator running `charter-check` and `git diff <base> -- .claude/settings.json` and saving the output. The Orchestrator has no Bash, so a spawned Orchestrator cannot produce them. The release-manager brief then reports "NO-GO" for a missing file. Release Manager also "lands the slice" with no shell. If the main session plays the Orchestrator, its boundary is not enforced either.

*Evidence:* orchestrator.md: `tools: Read, Write, Edit, Grep, Glob`; release-manager.md:103-104: `written by the Orchestrator just before this stage, because this role has no shell`; release-manager.md:112-113: `\`git diff <base> -- .claude/settings.json\` must be empty`

**F-01-8** · `.claude/agents/security-privacy.md:4` ·  · claude

Reviewer independence is enforced only in prose. This agent has Write, Edit and Bash and no write-scope-guard hook, yet it must not change code. QA has the same setup at qa-evidence.md:4 and must not modify code, and Bash would bypass a Write hook anyway. A reviewer can silently edit or "fix" the code under review. Release Manager relies on that independence.

*Evidence:* security-privacy.md: `tools: Read, Write, Edit, Bash, Grep, Glob` (no \`hooks:\`); `Code changes (engineers fix findings).`; qa-evidence.md:109-111: `QA does not modify code.`

**F-01-9** · `.claude/agents/customer-support.md:48` ·  · claude

The agent reads attacker-controlled inbound ticket text and account data, then drafts a reply. Nothing tells it to treat that content as data rather than instructions. Only security-privacy.md:112 says so. A crafted ticket could steer the draft toward another customer's details or a false commitment. Human verify-and-send review is the only backstop. market-researcher.md:52-55 (public reviews, forums, competitor pages) has the same gap.

*Evidence:* `- The inbound issue (ticket, message, or escalation).`; no "untrusted" or "data, not instructions" wording anywhere in the file

**F-02-2** · `.claude/protocols/STANDING_CHARTER.md:22` ·  · claude

Autonomous routine runs, including auto-merge with no human message, depend on two plain files in `.agentic/`: the Charter and its approval record. Step 2 checks only that the Charter's sha256 equals the hash in the approval file. Nothing here checks that a human wrote the approval file, and nothing forbids a run from creating or editing either file. An agent that can write `.agentic/` (for example one steered by repo content) could write a matching pair and so authorize itself. `TELEMETRY.md:67` says signing approvals is still unbuilt (BACKLOG T14). This also sits against `APPROVAL_PROTOCOL.md:117-124` (approval is direct, in the driving session). That file never mentions standing Charters.

*Evidence:* `with its approval recorded in \`.agentic/STANDING_CHARTER_APPROVAL.md\` (the human's words, the sha256, the time from \`date -u\`)` (lines 12-14); `.agentic/STANDING_CHARTER.md\`, and its sha256 equals the one in the approval file.` (lines 22-24); `Approval records | **Human.** Signing them is separate work` (`TELEMETRY.md:67`); the "never does" list (`STANDING_CHARTER.md:59-61`) omits editing `.agentic/STANDING_CHARTER*`

**F-02-3** · `.claude/protocols/CODE_REVIEW.md:31` ·  · claude

The risk-tier table does not list the protocols, agent briefs, `AGENTS.md` or `CLAUDE.md` as High. A diff that edits `APPROVAL_PROTOCOL.md`, `FAILURE_LOOP.md` or an agent brief is only markdown, so it matches "only docs" and is Low. If the owner sets C8.4 to "skipped", such a change gets no human review. It is also eligible for auto-merge under `STANDING_CHARTER.md:47`, unless the S4 prefixes (not in this area) exclude it. These files define the hard stops.

*Evidence:* High row: `safety invariants, hooks, permission rules or settings, deny lists, auth, a model or processor line, CI or release workflows, anything a Charter line (C5.x) names`; Low row: `only docs, comments, formatting, tests that add coverage without changing behaviour | per the Charter's C8.4: either skipped (the owner sees only the notice)` (lines 31, 33)

**F-02-4** · `.claude/protocols/FAILURE_LOOP.md:12` ·  · claude

Timeouts are classified two ways. `FAILURE_LOOP` says a stage over its wall-clock budget is a failure that counts against the retry budget. `RUN_ECONOMICS` says a "timeout with no output" is an infrastructure interruption that does not consume that budget. A hung stage can be labelled infra and retried without limit, which defeats the anti-runaway bound. `HANDOFF_CHECK.md:47-53` has the same clash: a truncated artefact from a killed stage is a `context-gap` failure that is also meant to be resumed as a non-retry.

*Evidence:* `**or a stage attempt exceeds its wall-clock budget**.` (line 12) and `Stop it, record it, count it against the retry budget.` (lines 21-22) vs `An **infrastructure** interruption (usage limit, transport error, timeout with no output) is **not** a retry and does not consume the \`FAILURE_LOOP.md\` budget` (`RUN_ECONOMICS.md:178-180`)

**F-02-5** · `.claude/protocols/SLICE_STATE.md:11` ·  · claude

Every role is told to edit `STATE.md`, and the pre-spawn budget hook trusts its `Budget`, `Spent` and `Next stage` lines. No rule says only the Orchestrator may write the budget lines. Any agent, including a producer under budget pressure, can raise `Budget`, lower `Spent` or alter the next-stage estimate. The guard then passes, and that breaks the rule "Never raise the budget to fit the spend" with nothing enforcing it.

*Evidence:* `- Every agent **updates** \`STATE.md\` when it finishes its stage` (lines 11-12); `The pre-spawn budget hook parses them` (line 19); `It reads \`Spent\` and the **Next stage** line's \`est.\` from \`STATE.md\`` (`RUN_ECONOMICS.md:89-91`); `Update STATE.md ... Keep ... Budget, Spent and Next stage lines in their exact format` (`security-privacy.md:18`)

**F-02-6** · `.claude/protocols/SESSION_REQUEST.md:56` ·  · claude

The session-request protocol sets `Status: in-progress (waiting-on-session)`. `SLICE_STATE` says Status is exactly one of four values because the budget hook parses it. The `RUN_INVENTORY` template lists the same four. A slice with this status is a case the hook cannot parse, and `SLICE_STATE.md:19-20` says such a slice is "checked by no one".

*Evidence:* `- **Status:** <in-progress / blocked-on-approval / blocked-on-failure / done>` (`SLICE_STATE.md:33`); `\`Status\` is exactly one of the four template values` (`SLICE_STATE.md:16`); `Set \`Status: in-progress (waiting-on-session)\` in \`STATE.md\`.` (`SESSION_REQUEST.md:56`)

**F-02-7** · `.claude/protocols/RUN_ECONOMICS.md:102` ·  · claude

The budget gate and the ceiling disagree. §2 sends the Orchestrator to degrade, drop or ask whenever `spent + estimate > budget`. The ceiling paragraph says spend between plan and ceiling "needs no question". It never says whether the `Budget` line holds the plan or the ceiling. If it holds the plan, the hook stops where the protocol says proceed. If it holds the ceiling, the plan total is no longer the check, and the 1.3 to 1.5× margin is effectively a raised budget.

*Evidence:* `spent + estimate(next stage)  ≤  budget ?` (line 80); `Spend between the plan and the ceiling needs no question.` (lines 102-103); `Raising the budget to fit the spend is the same anti-pattern` (lines 86-87)

**F-03-2** · `.agentic/STANDING_CHARTER.md:34` ·  · claude

The permission rule `Bash(git add src test README.md runs)` lets a routine run commit `runs/`. The path allowlist in §4 does not include `runs/`. The two sections disagree, so the "paths a routine run may change" boundary is not what the permissions enforce. The `fits` check and the permissions can give different answers.

*Evidence:* S4: `S4.1 \`src/\` / S4.2 \`test/\` / S4.3 \`README.md\`` with `A plan that names a path outside them does not fit.` S5.3: `Bash(git add src test README.md runs)`

**F-03-3** · `.agentic/STANDING_CHARTER.md:34` ·  · claude

S5.3 has every routine run write permission rules to `.claude/settings.local.json`. §7.4 says a routine run never changes permissions or `.claude/`. Every run therefore does what §7 forbids. Which clause wins is undefined. A reviewer or checker can reasonably reject every plan, or ignore §7.4 for permissions.

*Evidence:* S5.3: `Permission rules: written to \`.claude/settings.local.json\` (gitignored), every routine run ...`. §7.4: `Changes a safety control: ... hooks, permissions, deny lists, \`.claude/\`, CI.` .gitignore:2: `.claude/settings.local.json`

**F-03-4** · `.agentic/CURRENT_MVP_STATUS.md:37` ·  · claude

The "standing precondition §7.7" and the struck "§7.1/§7.2/§7.3" are recorded only in this status file. They point at `runs/browser-client/04-security.md`. SAFETY_INVARIANTS.md has no §7.x. Its only "7" is the bind invariant, and it carries no ALLOWED_TAGS/ALLOWED_PROPS rule. The doc that says "These MUST hold across releases" therefore omits a constraint the status file calls standing. A reader who loads the invariants, as AGENTS.md directs, never sees it. The §7.x label also collides with invariant 7.

*Evidence:* CURRENT_MVP_STATUS.md:36-39: `Preconditions §7.1/§7.2/§7.3 from \`runs/browser-client/04-security.md\` are **struck**. New standing precondition **§7.7**: widening \`ALLOWED_TAGS\` or \`ALLOWED_PROPS\` ...`. SAFETY_INVARIANTS.md:1-3, 26-38: invariants are numbered items `1.`–`7.`, and `7.` is `The server is reachable only from the host it runs on.`

**F-03-5** · `.agentic/CURRENT_MVP_STATUS.md:20` ·  · claude

The file says a fix is "required before the first HTTP slice": validate a representable date before mutation. Elsewhere in the same file and in SAFETY_INVARIANTS an HTTP layer already exists (CSP, JSON response headers, an access log, the `http-layer` slice, `src/server.js`). Nothing in the file records the fix as done. I did not check the code. The status doc leaves an open safety precondition looking unmet, or silently skipped, for a layer that has shipped.

*Evidence:* Line 18-22: `No UI/HTTP surface; ... Known non-blocking finding: an unvalidated clock arg → **required fix before the first HTTP slice** (validate a representable date before mutation — not just \`isFinite\`).` Line 27-28: `Five defects closed in the rendering boundary and HTTP headers`. SAFETY_INVARIANTS.md:36-38: `the \`http-layer\` implementation bound every interface`

**F-04-3** · `.claude/settings.json:7-18` ·  · claude

The "protective" deny rules are prefix patterns on specific git/file commands, and Bash is otherwise unrestricted. A role with Bash (qa-evidence, security-privacy, backend-architect, sre and others) can still change or exfiltrate. Examples are `sed -i`, `tee`, `cat > file`, `python -c`, `node -e`, `git -C . commit`, `git -c ... push`, `git stash`, `git rebase`, `git merge`, `git tag`, `git branch -D` and `scp`. It can also read denied files, for example `cat .env` or `cat ~/.ssh/id_rsa`. `Read(...)` deny rules do not cover Bash. The `git push` and `git commit` denies are weakened further by variants such as `git -C <dir> push`. The deny list gives a false sense that human-approval-gated actions (send, destructive shared-state, deploy) are blocked.

*Evidence:* evidence: `"Bash(git push:*)", "Bash(git commit:*)", "Bash(git add:*)", ... "Bash(rm:*)", "Bash(mv:*)", "Bash(cp:*)", "Bash(curl:*)", "Bash(wget:*)"`, with no `ask` list, no `sandbox` setting and no `Bash` default restriction. The secret-read rules at lines 19-53 are all `Read(...)` only.

**F-05-1** · `.github/workflows/ci.yml:3` ·  · claude

The file says routine runs may never change it, but nothing in the repo enforces that. `.github/` holds only `ci.yml`, so there is no `CODEOWNERS`. The `pull_request` trigger runs the workflow file from the PR head. A PR that edits `ci.yml` (for example, removing `npm run qa:mvp` or adding `|| true`) is gated by its own weakened version, and the auto-merge that waits on this check would then pass. Branch protection or rulesets are outside the repo, so I could not confirm them. This is unconfirmed, and I searched `.github/**`.

*Evidence:* `# may never change this file; it is the check their auto-merge waits on.` and `on:\n  pull_request:` (line 6-7). Glob `.github/**` returned only `.github/workflows/ci.yml`.

**F-06-2** · `src/client/app.js:127` ·  · claude

Stale "healthy" state after the UTC day rolls over. The client has no clock, and the only fetch of `/habits` is the initial `load()`, with no refetch, visibility handler or timer. A tab left open past UTC midnight still shows "Logged" and "Current streak N". Tapping the control hits `stateOf(view) === "healthy"` and returns with no request, so the user cannot log the new day until they reload. The at-risk, broken and healthy tags are also stale.

*Evidence:* `if (stateOf(view) === "healthy") return;` and `window.addEventListener("hashchange", render); render(); load();` (no later call to `load()` or refetch anywhere in the file)

**F-06-3** · `src/client/app.js:46` ·  · claude

`mapLogResponse` treats every status other than 404 and ≥500 as success. A 400, 401, 403, 413 or 429 (for example a 400 `x-user-id header required` when the stored `streakkeeper.userId` is whitespace-only, which `getUserId` accepts because `stored.length > 0`) goes to `res.json()`. That gives `{kind:"ok", habit: undefined}`. Line 150 then replaces the entry in `state.habits` with `undefined`. `HabitRow` and `stateOf` throw on `undefined`, and the `catch` re-renders from the same poisoned state, so the throw escapes as an unhandled rejection. The UI breaks until reload instead of showing the inline "That didn't go through" error.

*Evidence:* `if (res.status === 404) return { kind: "gone" }; if (res.status >= 500) return { kind: "failed" }; const body = await res.json(); return { kind: "ok", habit: body.habit, changed: body.changed };` and `state.habits = state.habits.map((entry) => (entry.habitId === habitId ? mapped.habit : entry));`

**F-06-4** · `src/client/render.js:94` ·  · claude

The detail view cannot be reached by a sighted mouse or touch user. The only anchor to `#/habit/<id>` contains just an `.sr-only` span. `.row-link` in app.css:142 has only `color: inherit`, with no overlay, size or `::after` stretch. The visible name sits in `.row-visual` (`aria-hidden`) and is not a link. The anchor has no visible area and no useful focus indicator, so the habit detail page is effectively reachable only by screen-reader or keyboard users.

*Evidence:* `h("a", { class: "row-link", href: detailHref(view.habitId) }, [ h("span", { class: "sr-only" }, [view.name]), ]),` and `.row-link { color: inherit; }`

**F-07-1** · `REVIEW.md:20` ·  · claude

The file is still the unfilled template, so every review that loads it gets no repo-specific scope. "Always read closely" has no paths, so `.claude/hooks/`, `.claude/settings*.json` and `.agentic/SAFETY_INVARIANTS.md` get no extra attention. "What failure looks like here" has no content. "Skip" has no content. The file's own header says to replace the bracketed lines and delete the note, and both are still there. Any review of a change to the hooks or settings is triggered by this.

*Evidence:* `> Replace the bracketed lines; delete this note.` (line 5); `- [The two or three ways a change here goes wrong in practice, ...]` (line 8); `- [paths that are generated or vendored, for example `dist/`, `*.lock`]` (line 17); `- [paths where a mistake spreads, for example `.agentic/SAFETY_INVARIANTS.md`,` (line 20)

**F-07-3** · `README.md:15` ·  · claude

The README sends readers to `runs/` as "the interesting directory" and links three slice folders. It also points the known-advisories note at `runs/browser-client/04-security.md`. In this copy the directory does not exist, so every one of those links is dead. AGENTS.md rule 4 also depends on `runs/<slice-id>/STATE.md` for resuming a slice. A reader following the README, or an agent resuming a slice, finds nothing. Unconfirmed whether `runs/` was left out of the review copy or was never committed. I searched with `Glob runs/**/*` and it returned no files.

*Evidence:* `The interesting directory is [`runs/`](runs/).` (line 15); `| [`greenfield`](runs/greenfield/) |` (line 41); `[`runs/browser-client/04-security.md`](runs/browser-client/04-security.md)` (line 67)

**F-08-1** · `test/client-static.test.js:68` ·  · claude

The traversal cases in C16 never reach the server as written. `fetch()` runs the URL through the WHATWG URL parser, which resolves `..` and `%2e%2e` dot-segments before sending. `/app.css/../server.js` goes out as `/server.js`, `/../src/server.js` as `/src/server.js`, and `/%2e%2e/server.js` as `/server.js`. The test therefore only shows that unrelated paths return 404. It would still pass if the static handler did path joining and was open to traversal. Only `/app.js%00.txt`, `/APP.JS` and `/client/app.js` test a real negative.

*Evidence:* `const negativePaths = [ "/app.css/../server.js", "/%2e%2e/server.js", "/../src/server.js", "/client/app.js", "/app.js%00.txt", "/APP.JS", ]; ... const res = await fetch(\`${base}${p}\`);` (traversal strings are sent through `fetch`, not a raw `http.request`/`net` socket)

### P3

**F-01-10** · `.claude/agents/security-privacy.md:65` ·  · claude

The "what to scan for" checklist covers secrets, PII in logs, approval bypass, audit events, adapters, CAPTCHA and agentic threats. It has no checks for authn/authz or tenant isolation, injection (SQL, command, path, SSRF) or new dependencies. backend-architect.md:72 requires tenant/user scoping, but no reviewer is told to verify it. Mission scope is deliberate, but the agent is described as the "last reviewer".

*Evidence:* `## Quality bar — what to scan for` lists exactly: Secrets, PII, Approval bypass, Audit event coverage, Adapter boundary integrity, CAPTCHA, Agentic threats

**F-02-8** · `.claude/protocols/CODE_REVIEW.md:17` ·  · claude

Release blocking is defined two ways. §1 says open findings from either review block the release. §3 says Nits are optional and Pre-existing findings are reported "do not block on it". A finding with no disposition is open. Following §1 literally, an open Nit or Pre-existing finding blocks. The standing-Charter auto-merge test checks only open Important findings.

*Evidence:* `Open findings from either review block the release.` (lines 17-18); `**Nit** (small and real, optional), **Pre-existing** (present before this change; report it, do not block on it)` (lines 51-52); `A finding with no disposition is open.` (line 55); `zero open Important findings` (`STANDING_CHARTER.md:49`)

**F-02-9** · `.claude/protocols/TELEMETRY.md:33` ·  · claude

The sample config sets the global OTLP protocol to `grpc`. It then points the traces endpoint at port 4318 with a `/v1/traces` path, which is the OTLP/HTTP endpoint. Unless a traces-specific protocol is set, spans go out over gRPC to an HTTP port and fail. Per-role attribution depends on these spans, since metrics collapse custom agents to `custom`.

*Evidence:* `export OTEL_EXPORTER_OTLP_PROTOCOL=grpc` (line 24); `export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces` (line 33); `collapses **user-defined agents to \`"custom"\`**` (lines 114-116)

**F-02-10** · `.claude/protocols/TELEMETRY.md:58` ·  · claude

The provenance map says per-stage tokens and tool calls come from the runtime, summed "per `agent_id`". The signal table gives `agent_id` only on the beta `claude_code.tool` span. `api_request` and `tool_result` carry `agent.name`, which is `custom` for every role in this pack. A stage's tokens cannot be derived from those events as documented. A run that records `telemetrySource: otel` on that basis would overstate its provenance.

*Evidence:* `| \`stages[].tokens\` | Runtime — sum \`input_tokens\` + \`output_tokens\` per \`agent_id\` |` (line 58) vs `| \`claude_code.tool\` (span, beta) | \`agent_id\`, \`parent_agent_id\`, \`subagent_type\`, \`tool_name\` |` (line 47) and `| \`claude_code.api_request\` (event) | \`model\`, ... \`agent.name\` |` (line 43)

**F-02-11** · `.claude/protocols/RUN_ECONOMICS.md:46` ·  · claude

The guidance tells the Orchestrator to estimate stages above the pipeline's own SLO cap. A tier-3 Release Manager is estimated at 150 to 190k, and the worst-seen figures are 149k to 187k. `PIPELINE_SLOS` sets the per-stage target at ≤150k p95 and says every legitimate stage landed ≤126k. Following the estimate guidance routinely breaches a stated SLO. Neither file says which governs, and `PIPELINE_SLOS.md:121-126` requires target changes to be recorded.

*Evidence:* `Estimate a tier 3 Release Manager at 150 to 190k` (`RUN_ECONOMICS.md:50-51`); `| Per-stage token budget | ≤ 150k subagent tokens p95, **each spawned stage** |` (`PIPELINE_SLOS.md:17`); `Every legitimate stage across all three runs lands ≤ 126k.` (`PIPELINE_SLOS.md:42`)

**F-04-4** · `.claude/settings.json:19-53` ·  · claude

The secret-file deny list misses common credential files, so they stay readable by `Read`. These include `.git-credentials`, `.docker/config.json`, `*.p8`, `*.ovpn`, `.env` variants outside `**/.env*` such as `*.env`, `.vault-token`, `.terraformrc`, `terraform.tfvars` and `.aws` (the `.aws` rule covers only the `**/.aws/**` path form). Any role with `Read` can pull them into context and then into artefacts or logs.

*Evidence:* evidence: the list ends `"Read(**/.netrc)", "Read(**/.pypirc)", "Read(**/.netrc)", "Read(**/.pgpass)", "Read(**/.htpasswd)"` and contains no entries for `.git-credentials`, `.docker/`, `*.p8`, `*.tfvars` or `.vault-token`.

**F-05-2** · `.github/workflows/ci.yml:18-19` ·  · claude

Third-party actions are pinned to mutable major tags, not commit SHAs. If the `v4` tag is moved or compromised, arbitrary code runs in CI on every PR and push to main. Impact is limited by `permissions: contents: read`, but the job still runs untrusted PR code with the workflow's default token.

*Evidence:* `- uses: actions/checkout@v4`<br>`- uses: actions/setup-node@v4`

**F-06-5** · `src/client/app.js:31` ·  · claude

`decodeURIComponent` is unguarded, so a malformed percent-escape in the hash (for example `#/habit/%E0%A4%A`) throws `URIError`. `render()` runs after `load()` finishes, outside any try/catch, so the throw rejects `load()` and the page stays on "Loading habits…" forever. In the `hashchange` handler it throws as an uncaught error and leaves the previous view in place.

*Evidence:* `return m ? decodeURIComponent(m[1]) : null;` and, in `load()`, `render();` placed after the try/catch block

**F-06-6** · `src/services/streak.js:29` ·  · claude

`dayIndex` uses `Math.trunc`, which rounds toward zero, not floor. For any negative epoch-ms the index is wrong. For example `-1` ms (1969-12-31T23:59:59.999Z) maps to `-0`, the same index as 1970-01-01, which breaks the "same UTC calendar day → same int" contract. Negative values pass the guard (`Math.abs(ms) > MAX_TIME`). Server paths use `Date.now()`, so this is only reachable through the injectable `now` seam.

*Evidence:* `const idx = Math.trunc(ms / MS_PER_DAY);` with the doc comment "Same UTC calendar day → same int."

**F-07-2** · `REVIEW.md:13` ·  · claude

The "Report only" rules contradict each other. Line 13 allows up to 3 nits per review, while line 14 says style-only and cleanup-only findings are dropped. A reviewer cannot follow both. Whether nits are allowed is decided by whichever line the reviewer reads, so reports will vary.

*Evidence:* `- At most [3] nits per review. Style-only and cleanup-only findings are dropped.`

**F-08-2** · `test/client-render.test.js:301` ·  · claude

C6 is meant to show the UI does not reveal whether a habit id exists. It builds both trees by calling the same `ErrorNotice(COPY.errorHabitNotFound, "region")` and compares them, so the `deepEqual` always passes. It never runs the app.js render path that picks which tree to show. If app.js rendered a different tree for a foreign id than for a missing one, C6 would still pass.

*Evidence:* `const treeA = neverExisted === null ? ErrorNotice(COPY.errorHabitNotFound, "region") : null; const treeB = foreignButAbsent === null ? ErrorNotice(COPY.errorHabitNotFound, "region") : null; assert.deepEqual(treeA, treeB);`

**F-08-3** · `test/client-render.test.js:335` ·  · claude

The title and the C6c description say `parseHash` and `detailHref` round-trip and that rejects and accepts are documented. The body never composes the two as `parseHash(detailHref(id))`. It also never checks `detailHref`'s output for an id that needs encoding, or malformed `%` escapes in `parseHash`. A regression in `detailHref` encoding that leaves `parseHash` correct would go unnoticed. The last assertion tests `h()`, not routing.

*Evidence:* `test("C6c: parseHash and detailHref round-trip, and reject/accept as documented", () => { assert.equal(parseHash("#/habit/habit_1"), "habit_1"); ... assert.equal(h("li", {}, ["x"]).tag, "li");` (no call to `detailHref` in this test)

**F-08-4** · `test/server.test.js:87` ·  · claude

Tests that compare against a separately computed "today" or "yesterday" are flaky near UTC midnight. The server reads `Date.now()` inside the request, and the test reads its own clock afterwards or earlier. S3 and S13 compute `todayUTC` after the request. S26 seeds "yesterday" with `Date.now() - 86_400_000` and then lists at the server's later `Date.now()`. If midnight UTC falls between the two reads, S3 and S13 fail on the date, and S26 sees a broken streak, so `atRisk` is false and `currentStreak` is 0. The test clock is not pinned, although the service has an injectable `now` seam.

*Evidence:* S3: `const todayUTC = new Date().toISOString().slice(0, 10); assert.equal(body.habit.lastCompletedDate, todayUTC);` (read after the fetch). S26 (line 559): `logCompletion("u-s26", created.habit.habitId, Date.now() - 86_400_000);` then `assert.equal(body.habits[0].atRisk, true);`

## What was not reviewed, and why

- 5 file(s) vendored, binary, lock or minified.

## Tests and CI

Commands detected from manifests: test `npm run test`; build `npm run build`; typecheck `npm run typecheck`; run `npm run start`. **They were not run by this assessment.**

CI files: `.github/workflows/ci.yml`.

## Proposed backlog

Nothing below has been done. Each item is an intent the owner can turn into a Charter; none changes anything until the owner picks it.

- **Intent (F-01-1, P1):** Fix the issue at `.claude/agents/production-verification.md:100`: The brief tells the agent to execute a production rollback with no human approval round-trip. It infers approval from the tech spec review, which is not a recorded human approval. AGENTS.md rule 1 says "Never self-approve, never infer approval". The same file at line 122 says the human owns the rollback. A no-go verdict on a live service triggers this. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-1, P1):** Fix the issue at `.claude/protocols/MODEL_ROUTING.md:60`: Tier 1 routing says gates stay at `medium` effort. The same file says gates never drop below `high`. Gates are `high` by default (Layer 1b), so a tier-1 slice (docs or refactor) following Layer 2 lowers QA, Release Manager and Security effort. `FAILURE_LOOP.md` treats weakening a gate as a rule 4 action. Layer 2 is applied by the Orchestrator at spawn time, with no approval step. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-03-1, P1):** Fix the issue at `.agentic/STANDING_CHARTER.md:47`: §7.4 lists safety controls as files and directories only. The controls that SAFETY_INVARIANTS and CURRENT_MVP_STATUS call human-approval-only are enforced in code under `src/`, which §4 (S4.1) lets a routine run change freely. A tier 1 or 2 plan that widens `ALLOWED_TAGS` in `src/client/dom.js:24`, or changes the bind host in `src/server.js:404`, names only `src/` paths. It therefore "fits", skips human approval and can auto-merge. SAFETY_INVARIANTS item 7 requires approval plus real authentication for a bind widening. CURRENT_MVP_STATUS says widening `ALLOWED_TAGS` or `ALLOWED_PROPS` is a rule-4 change. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-04-1, P1):** Fix the issue at `.claude/settings.json:1`: The file has no `hooks` block, so the budget and write-scope guards that AGENTS.md promises are not wired. It happens on any subagent spawn or write: nothing checks `spent + estimate ≤ budget` first, and nothing restricts where roles write. The commit has no `.claude/hooks/` directory (glob of `.claude/**/*` returns no hook files) and no `.claude/commands/`. The `/agentic-slice`, `/agentic-resume` and `/agentic-status` entry points are missing too. Non-negotiable rule 6 is therefore not enforced, and rules 3 and 4 have no enforcement either. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-04-2, P1):** Fix the issue at `.claude/settings.json:4-6`: The project-wide deny list blocks `Edit`, `Write` and `NotebookEdit` outright. Deny rules take precedence over allow rules and over per-agent `tools:` frontmatter. Every role that lists `Write, Edit` (orchestrator, product-manager, qa-evidence and the rest) therefore cannot write `runs/<slice-id>/STATE.md`, specs or evidence, which breaks rule 4 ("State is durable") and rule 5 (handoff through artefacts). Slices stall, or roles fall back to Bash redirects. That fallback is not denied (see F-04-3) and bypasses the least-privilege model. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-06-1, P1):** Fix the issue at `src/services/habits.js:85`: Cross-user access. `logCompletion` compares owner ids case-insensitively, but `listHabits` (line 64) and the audit scoping use strict `===`, so the ownership gate is looser than the rest of the service. Sending `X-User-Id: ALICE` with a sequential habitId such as `habit_1` that belongs to `alice` mutates alice's completion Set and returns her habit view (name, streaks) with 200 instead of the non-oracle 404. The `habit.completion_logged` audit event is then recorded under the attacker's userId, not the owner's. Ids are sequential (`habit_${++seq}`), so they are guessable. This contradicts the "ownership-gated, never touches another user's data" contract in the doc comment and in server.js. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.

**Recorded and deferred** (below P1; filing them is the owner's call):
- F-01-2 (P2) `.claude/agents/on-call-engineer.md:71`: Same unrecorded-approval problem as F-01-1. The agent "auto-executes" the tech spec's rollback after a post-merge regression. The brief does not require a Charter line (C8.3) that names the rollback. Line 125 gates only "novel" infra actions. A regression after a merge triggers this.
- F-01-3 (P2) `.claude/agents/cloud-deployment.md:4`: The role cannot do its mission with its granted tools. It must run the three wrapped skills, run `azd up` or `terraform apply`, and open a PR. It has no Bash and no Skill tool. Line 25 limits its writes to `runs/<slice-id>/`, yet its outputs include `.azure/deployment-plan.md` and IaC in the product repo. Line 24 says to stop and hand back. The only other path is the inlined fallback with full tools, which removes the least-privilege guarantee and the "never sets Validated" separation. Any deploy slice triggers this.
- F-01-4 (P2) `.claude/agents/production-verification.md:4`: Same mismatch. The mission needs `azure-diagnostics` and `azure-reliability` queries and execution of the rollback plan. The tools are Read, Write, Edit, Grep, Glob only, and writes are limited to `runs/`. The agent either cannot act, so it hands back, or it is inlined with full tools. The inlined case loses the "read-only against the live environment" guarantee at line 112.
- F-01-5 (P2) `.claude/agents/on-call-engineer.md:4`: The role has no shell or observability tools. It needs logs, metrics, traces and deploy history. It must also execute pre-authorized runbook steps and rollbacks. Its Write/Edit is limited to `runs/`. Line 150 forbids "write access just to save a step", but the inlined fallback gives exactly that.
- F-01-6 (P2) `.claude/agents/post-launch-learning.md:68`: The brief requires running `node <playbook>/execution/analyze.mjs .`, but the agent has no Bash. It also must write `runs/ANALYTICS.md` and `runs/dashboard.html`, which are outside the `runs/<slice-id>/` write scope in line 25. Every Tier 2/3 close-out triggers this, so the step is skipped or the guard blocks it. The brief does not say which.
- F-01-7 (P2) `.claude/agents/orchestrator.md:4`: Release Manager's Charter check relies on the Orchestrator running `charter-check` and `git diff <base> -- .claude/settings.json` and saving the output. The Orchestrator has no Bash, so a spawned Orchestrator cannot produce them. The release-manager brief then reports "NO-GO" for a missing file. Release Manager also "lands the slice" with no shell. If the main session plays the Orchestrator, its boundary is not enforced either.
- F-01-8 (P2) `.claude/agents/security-privacy.md:4`: Reviewer independence is enforced only in prose. This agent has Write, Edit and Bash and no write-scope-guard hook, yet it must not change code. QA has the same setup at qa-evidence.md:4 and must not modify code, and Bash would bypass a Write hook anyway. A reviewer can silently edit or "fix" the code under review. Release Manager relies on that independence.
- F-01-9 (P2) `.claude/agents/customer-support.md:48`: The agent reads attacker-controlled inbound ticket text and account data, then drafts a reply. Nothing tells it to treat that content as data rather than instructions. Only security-privacy.md:112 says so. A crafted ticket could steer the draft toward another customer's details or a false commitment. Human verify-and-send review is the only backstop. market-researcher.md:52-55 (public reviews, forums, competitor pages) has the same gap.
- F-01-10 (P3) `.claude/agents/security-privacy.md:65`: The "what to scan for" checklist covers secrets, PII in logs, approval bypass, audit events, adapters, CAPTCHA and agentic threats. It has no checks for authn/authz or tenant isolation, injection (SQL, command, path, SSRF) or new dependencies. backend-architect.md:72 requires tenant/user scoping, but no reviewer is told to verify it. Mission scope is deliberate, but the agent is described as the "last reviewer".
- F-02-2 (P2) `.claude/protocols/STANDING_CHARTER.md:22`: Autonomous routine runs, including auto-merge with no human message, depend on two plain files in `.agentic/`: the Charter and its approval record. Step 2 checks only that the Charter's sha256 equals the hash in the approval file. Nothing here checks that a human wrote the approval file, and nothing forbids a run from creating or editing either file. An agent that can write `.agentic/` (for example one steered by repo content) could write a matching pair and so authorize itself. `TELEMETRY.md:67` says signing approvals is still unbuilt (BACKLOG T14). This also sits against `APPROVAL_PROTOCOL.md:117-124` (approval is direct, in the driving session). That file never mentions standing Charters.
- F-02-3 (P2) `.claude/protocols/CODE_REVIEW.md:31`: The risk-tier table does not list the protocols, agent briefs, `AGENTS.md` or `CLAUDE.md` as High. A diff that edits `APPROVAL_PROTOCOL.md`, `FAILURE_LOOP.md` or an agent brief is only markdown, so it matches "only docs" and is Low. If the owner sets C8.4 to "skipped", such a change gets no human review. It is also eligible for auto-merge under `STANDING_CHARTER.md:47`, unless the S4 prefixes (not in this area) exclude it. These files define the hard stops.
- F-02-4 (P2) `.claude/protocols/FAILURE_LOOP.md:12`: Timeouts are classified two ways. `FAILURE_LOOP` says a stage over its wall-clock budget is a failure that counts against the retry budget. `RUN_ECONOMICS` says a "timeout with no output" is an infrastructure interruption that does not consume that budget. A hung stage can be labelled infra and retried without limit, which defeats the anti-runaway bound. `HANDOFF_CHECK.md:47-53` has the same clash: a truncated artefact from a killed stage is a `context-gap` failure that is also meant to be resumed as a non-retry.
- F-02-5 (P2) `.claude/protocols/SLICE_STATE.md:11`: Every role is told to edit `STATE.md`, and the pre-spawn budget hook trusts its `Budget`, `Spent` and `Next stage` lines. No rule says only the Orchestrator may write the budget lines. Any agent, including a producer under budget pressure, can raise `Budget`, lower `Spent` or alter the next-stage estimate. The guard then passes, and that breaks the rule "Never raise the budget to fit the spend" with nothing enforcing it.
- F-02-6 (P2) `.claude/protocols/SESSION_REQUEST.md:56`: The session-request protocol sets `Status: in-progress (waiting-on-session)`. `SLICE_STATE` says Status is exactly one of four values because the budget hook parses it. The `RUN_INVENTORY` template lists the same four. A slice with this status is a case the hook cannot parse, and `SLICE_STATE.md:19-20` says such a slice is "checked by no one".
- F-02-7 (P2) `.claude/protocols/RUN_ECONOMICS.md:102`: The budget gate and the ceiling disagree. §2 sends the Orchestrator to degrade, drop or ask whenever `spent + estimate > budget`. The ceiling paragraph says spend between plan and ceiling "needs no question". It never says whether the `Budget` line holds the plan or the ceiling. If it holds the plan, the hook stops where the protocol says proceed. If it holds the ceiling, the plan total is no longer the check, and the 1.3 to 1.5× margin is effectively a raised budget.
- F-02-8 (P3) `.claude/protocols/CODE_REVIEW.md:17`: Release blocking is defined two ways. §1 says open findings from either review block the release. §3 says Nits are optional and Pre-existing findings are reported "do not block on it". A finding with no disposition is open. Following §1 literally, an open Nit or Pre-existing finding blocks. The standing-Charter auto-merge test checks only open Important findings.
- F-02-9 (P3) `.claude/protocols/TELEMETRY.md:33`: The sample config sets the global OTLP protocol to `grpc`. It then points the traces endpoint at port 4318 with a `/v1/traces` path, which is the OTLP/HTTP endpoint. Unless a traces-specific protocol is set, spans go out over gRPC to an HTTP port and fail. Per-role attribution depends on these spans, since metrics collapse custom agents to `custom`.
- F-02-10 (P3) `.claude/protocols/TELEMETRY.md:58`: The provenance map says per-stage tokens and tool calls come from the runtime, summed "per `agent_id`". The signal table gives `agent_id` only on the beta `claude_code.tool` span. `api_request` and `tool_result` carry `agent.name`, which is `custom` for every role in this pack. A stage's tokens cannot be derived from those events as documented. A run that records `telemetrySource: otel` on that basis would overstate its provenance.
- F-02-11 (P3) `.claude/protocols/RUN_ECONOMICS.md:46`: The guidance tells the Orchestrator to estimate stages above the pipeline's own SLO cap. A tier-3 Release Manager is estimated at 150 to 190k, and the worst-seen figures are 149k to 187k. `PIPELINE_SLOS` sets the per-stage target at ≤150k p95 and says every legitimate stage landed ≤126k. Following the estimate guidance routinely breaches a stated SLO. Neither file says which governs, and `PIPELINE_SLOS.md:121-126` requires target changes to be recorded.
- F-03-2 (P2) `.agentic/STANDING_CHARTER.md:34`: The permission rule `Bash(git add src test README.md runs)` lets a routine run commit `runs/`. The path allowlist in §4 does not include `runs/`. The two sections disagree, so the "paths a routine run may change" boundary is not what the permissions enforce. The `fits` check and the permissions can give different answers.
- F-03-3 (P2) `.agentic/STANDING_CHARTER.md:34`: S5.3 has every routine run write permission rules to `.claude/settings.local.json`. §7.4 says a routine run never changes permissions or `.claude/`. Every run therefore does what §7 forbids. Which clause wins is undefined. A reviewer or checker can reasonably reject every plan, or ignore §7.4 for permissions.
- F-03-4 (P2) `.agentic/CURRENT_MVP_STATUS.md:37`: The "standing precondition §7.7" and the struck "§7.1/§7.2/§7.3" are recorded only in this status file. They point at `runs/browser-client/04-security.md`. SAFETY_INVARIANTS.md has no §7.x. Its only "7" is the bind invariant, and it carries no ALLOWED_TAGS/ALLOWED_PROPS rule. The doc that says "These MUST hold across releases" therefore omits a constraint the status file calls standing. A reader who loads the invariants, as AGENTS.md directs, never sees it. The §7.x label also collides with invariant 7.
- F-03-5 (P2) `.agentic/CURRENT_MVP_STATUS.md:20`: The file says a fix is "required before the first HTTP slice": validate a representable date before mutation. Elsewhere in the same file and in SAFETY_INVARIANTS an HTTP layer already exists (CSP, JSON response headers, an access log, the `http-layer` slice, `src/server.js`). Nothing in the file records the fix as done. I did not check the code. The status doc leaves an open safety precondition looking unmet, or silently skipped, for a layer that has shipped.
- F-04-3 (P2) `.claude/settings.json:7-18`: The "protective" deny rules are prefix patterns on specific git/file commands, and Bash is otherwise unrestricted. A role with Bash (qa-evidence, security-privacy, backend-architect, sre and others) can still change or exfiltrate. Examples are `sed -i`, `tee`, `cat > file`, `python -c`, `node -e`, `git -C . commit`, `git -c ... push`, `git stash`, `git rebase`, `git merge`, `git tag`, `git branch -D` and `scp`. It can also read denied files, for example `cat .env` or `cat ~/.ssh/id_rsa`. `Read(...)` deny rules do not cover Bash. The `git push` and `git commit` denies are weakened further by variants such as `git -C <dir> push`. The deny list gives a false sense that human-approval-gated actions (send, destructive shared-state, deploy) are blocked.
- F-04-4 (P3) `.claude/settings.json:19-53`: The secret-file deny list misses common credential files, so they stay readable by `Read`. These include `.git-credentials`, `.docker/config.json`, `*.p8`, `*.ovpn`, `.env` variants outside `**/.env*` such as `*.env`, `.vault-token`, `.terraformrc`, `terraform.tfvars` and `.aws` (the `.aws` rule covers only the `**/.aws/**` path form). Any role with `Read` can pull them into context and then into artefacts or logs.
- F-05-1 (P2) `.github/workflows/ci.yml:3`: The file says routine runs may never change it, but nothing in the repo enforces that. `.github/` holds only `ci.yml`, so there is no `CODEOWNERS`. The `pull_request` trigger runs the workflow file from the PR head. A PR that edits `ci.yml` (for example, removing `npm run qa:mvp` or adding `|| true`) is gated by its own weakened version, and the auto-merge that waits on this check would then pass. Branch protection or rulesets are outside the repo, so I could not confirm them. This is unconfirmed, and I searched `.github/**`.
- F-05-2 (P3) `.github/workflows/ci.yml:18-19`: Third-party actions are pinned to mutable major tags, not commit SHAs. If the `v4` tag is moved or compromised, arbitrary code runs in CI on every PR and push to main. Impact is limited by `permissions: contents: read`, but the job still runs untrusted PR code with the workflow's default token.
- F-06-2 (P2) `src/client/app.js:127`: Stale "healthy" state after the UTC day rolls over. The client has no clock, and the only fetch of `/habits` is the initial `load()`, with no refetch, visibility handler or timer. A tab left open past UTC midnight still shows "Logged" and "Current streak N". Tapping the control hits `stateOf(view) === "healthy"` and returns with no request, so the user cannot log the new day until they reload. The at-risk, broken and healthy tags are also stale.
- F-06-3 (P2) `src/client/app.js:46`: `mapLogResponse` treats every status other than 404 and ≥500 as success. A 400, 401, 403, 413 or 429 (for example a 400 `x-user-id header required` when the stored `streakkeeper.userId` is whitespace-only, which `getUserId` accepts because `stored.length > 0`) goes to `res.json()`. That gives `{kind:"ok", habit: undefined}`. Line 150 then replaces the entry in `state.habits` with `undefined`. `HabitRow` and `stateOf` throw on `undefined`, and the `catch` re-renders from the same poisoned state, so the throw escapes as an unhandled rejection. The UI breaks until reload instead of showing the inline "That didn't go through" error.
- F-06-4 (P2) `src/client/render.js:94`: The detail view cannot be reached by a sighted mouse or touch user. The only anchor to `#/habit/<id>` contains just an `.sr-only` span. `.row-link` in app.css:142 has only `color: inherit`, with no overlay, size or `::after` stretch. The visible name sits in `.row-visual` (`aria-hidden`) and is not a link. The anchor has no visible area and no useful focus indicator, so the habit detail page is effectively reachable only by screen-reader or keyboard users.
- F-06-5 (P3) `src/client/app.js:31`: `decodeURIComponent` is unguarded, so a malformed percent-escape in the hash (for example `#/habit/%E0%A4%A`) throws `URIError`. `render()` runs after `load()` finishes, outside any try/catch, so the throw rejects `load()` and the page stays on "Loading habits…" forever. In the `hashchange` handler it throws as an uncaught error and leaves the previous view in place.
- F-06-6 (P3) `src/services/streak.js:29`: `dayIndex` uses `Math.trunc`, which rounds toward zero, not floor. For any negative epoch-ms the index is wrong. For example `-1` ms (1969-12-31T23:59:59.999Z) maps to `-0`, the same index as 1970-01-01, which breaks the "same UTC calendar day → same int" contract. Negative values pass the guard (`Math.abs(ms) > MAX_TIME`). Server paths use `Date.now()`, so this is only reachable through the injectable `now` seam.
- F-07-1 (P2) `REVIEW.md:20`: The file is still the unfilled template, so every review that loads it gets no repo-specific scope. "Always read closely" has no paths, so `.claude/hooks/`, `.claude/settings*.json` and `.agentic/SAFETY_INVARIANTS.md` get no extra attention. "What failure looks like here" has no content. "Skip" has no content. The file's own header says to replace the bracketed lines and delete the note, and both are still there. Any review of a change to the hooks or settings is triggered by this.
- F-07-2 (P3) `REVIEW.md:13`: The "Report only" rules contradict each other. Line 13 allows up to 3 nits per review, while line 14 says style-only and cleanup-only findings are dropped. A reviewer cannot follow both. Whether nits are allowed is decided by whichever line the reviewer reads, so reports will vary.
- F-07-3 (P2) `README.md:15`: The README sends readers to `runs/` as "the interesting directory" and links three slice folders. It also points the known-advisories note at `runs/browser-client/04-security.md`. In this copy the directory does not exist, so every one of those links is dead. AGENTS.md rule 4 also depends on `runs/<slice-id>/STATE.md` for resuming a slice. A reader following the README, or an agent resuming a slice, finds nothing. Unconfirmed whether `runs/` was left out of the review copy or was never committed. I searched with `Glob runs/**/*` and it returned no files.
- F-08-1 (P2) `test/client-static.test.js:68`: The traversal cases in C16 never reach the server as written. `fetch()` runs the URL through the WHATWG URL parser, which resolves `..` and `%2e%2e` dot-segments before sending. `/app.css/../server.js` goes out as `/server.js`, `/../src/server.js` as `/src/server.js`, and `/%2e%2e/server.js` as `/server.js`. The test therefore only shows that unrelated paths return 404. It would still pass if the static handler did path joining and was open to traversal. Only `/app.js%00.txt`, `/APP.JS` and `/client/app.js` test a real negative.
- F-08-2 (P3) `test/client-render.test.js:301`: C6 is meant to show the UI does not reveal whether a habit id exists. It builds both trees by calling the same `ErrorNotice(COPY.errorHabitNotFound, "region")` and compares them, so the `deepEqual` always passes. It never runs the app.js render path that picks which tree to show. If app.js rendered a different tree for a foreign id than for a missing one, C6 would still pass.
- F-08-3 (P3) `test/client-render.test.js:335`: The title and the C6c description say `parseHash` and `detailHref` round-trip and that rejects and accepts are documented. The body never composes the two as `parseHash(detailHref(id))`. It also never checks `detailHref`'s output for an id that needs encoding, or malformed `%` escapes in `parseHash`. A regression in `detailHref` encoding that leaves `parseHash` correct would go unnoticed. The last assertion tests `h()`, not routing.
- F-08-4 (P3) `test/server.test.js:87`: Tests that compare against a separately computed "today" or "yesterday" are flaky near UTC midnight. The server reads `Date.now()` inside the request, and the test reads its own clock afterwards or earlier. S3 and S13 compute `todayUTC` after the request. S26 seeds "yesterday" with `Date.now() - 86_400_000` and then lists at the server's later `Date.now()`. If midnight UTC falls between the two reads, S3 and S13 fail on the date, and S26 sees a broken streak, so `atRisk` is false and `currentStreak` is 0. The test clock is not pinned, although the service has an injectable `now` seam.

## Method and limits

- Files were mapped and tiered by a script from names, manifests and git history; reviewers read areas in order of risk until the cap.
- Reviewers worked in a copy with write tools, pushes and secret reads denied; the read-only check above is the evidence, not the instruction.
- Findings are from reading. None was reproduced unless its evidence says so.
- Recall and precision of this reviewer are reported in the calibration record, not here; a repo's report is only as good as that record.
