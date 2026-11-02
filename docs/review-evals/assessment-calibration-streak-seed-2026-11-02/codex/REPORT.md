# Assessment report: streak-seeded

**Assessed against Aveto's gates on 2026-11-02. This is an assessment, not a certification.** It records what the reviewers found in the parts listed below. It does not say the code is secure or compliant, and a finding's absence is not evidence of safety.

|  |  |
|---|---|
| Commit | `4858e7a6e9bf02a1249106fcbb6efb4bf0b5db2b` |
| Reviewers | codex (openai) |
| Independent second reviewer | **no**: one model family reviewed this. Treat it as a first pass. |
| Built under Aveto | no records found |
| Read-only check | passed: the target's HEAD and working tree were unchanged, and the review copy differed from the commit only by the recorded removals |
| Source reviewed | about 109,961 of 109,961 reviewable tokens (estimate: bytes / 4) |

## Summary

41 finding(s): 0 P0, 17 P1, 22 P2, 2 P3, 0 note. 26 are still open; the owner sets each disposition.

## Risk map

| Tier | Files | Approx. tokens |
|---|---|---|
| high | 49 | 70,578 |
| medium | 20 | 34,665 |
| low | 9 | 4,718 |

High-risk files (49): `.agentic/CURRENT_MVP_STATUS.md`, `.agentic/LOCAL_COMMANDS.md`, `.agentic/PROJECT_CONTEXT.md`, `.agentic/SAFETY_INVARIANTS.md`, `.agentic/STANDING_CHARTER.md`, `.agentic/STANDING_CHARTER_APPROVAL.md`, `.claude/agentic.config.json`, `.claude/agents/ai-engineer.md`, `.claude/agents/ai-governance.md`, `.claude/agents/analytics-engineer.md`, `.claude/agents/backend-architect.md`, `.claude/agents/cloud-deployment.md`, `.claude/agents/compliance-reviewer.md`, `.claude/agents/customer-success.md`, `.claude/agents/customer-support.md`, `.claude/agents/data-analyst.md`, `.claude/agents/data-governance.md`, `.claude/agents/engineering-manager.md`, `.claude/agents/finops.md`, `.claude/agents/frontend-developer.md`, `.claude/agents/market-researcher.md`, `.claude/agents/ml-engineer.md`, `.claude/agents/on-call-engineer.md`, `.claude/agents/orchestrator.md`, `.claude/agents/post-launch-learning.md`, and 24 more (see `map.json`).

## Findings

### P1

**F-01-1** · `.claude/agents/release-manager.md:84` · codex · open

An applicable release gate can be skipped with only a written rationale; this triggers whenever required evidence is absent and permits forward progress instead of failing closed. Suggested fix: distinguish genuinely inapplicable gates as `n/a`; every skipped or failed applicable gate must be a NO-GO.

*Evidence:* evidence: “For each gate that was skipped, record the rationale in the checklist.” and “A skipped gate without a rationale is a release blocker.”

**F-01-2** · `.claude/agents/production-verification.md:101<br>.claude/agents/on-call-engineer.md:71` · codex · open

A failed post-deploy check or regressed fix automatically executes rollback merely because the plan appeared in a reviewed tech spec; tech-spec review is not explicit approval for a destructive/external action. Suggested fix: execute only when an approval record or exact approved Charter line names that rollback and target; otherwise stop and request approval.

*Evidence:* evidence: “A no-go triggers rollback immediately; it does not wait for a human approval round-trip, because the rollback plan was already human-approved when the tech spec was reviewed” and “If it regressed, auto-executes the rollback plan already recorded in that slice's tech spec.”

**F-01-3** · `.claude/agents/security-privacy.md:4<br>.claude/agents/qa-evidence.md:4` · codex · confirmed

Independent reviewers receive unrestricted `Bash`, which can modify product files through shell utilities and bypass the `Write\¦Edit` hook, despite these roles not owning code changes. Trigger: any mistaken or injected `sed -i`, redirect, Node, or similar command. Suggested fix: run review commands in a read-only worktree/sandbox or expose a strict inspection/test-command allowlist plus a separately scoped artifact writer.

*Evidence:* evidence: `tools: Read, Write, Edit, Bash, Grep, Glob`; Security says “Code changes (engineers fix findings),” and QA says “QA does not modify code.”

**F-01-4** · `.claude/agents/qa-evidence.md:152` · codex · open

QA is prohibited from modifying code but is later required to land tests and deliberately break and restore the implementation, making the independent verifier an implementer and risking a partially restored worktree if interrupted. Suggested fix: QA should hand the test case to the engineer and independently verify the resulting diff.

*Evidence:* evidence: “QA does not modify code” versus “Land it as a test … These belong in `test/`” and “Break the fix deliberately, confirm the test fails, restore it.”

**F-01-5** · `.claude/agents/customer-support.md:50<br>.claude/agents/customer-success.md:48<br>.claude/agents/market-researcher.md:52<br>.claude/agents/sre.md:46` · codex · confirmed

Autonomous roles ingest tickets, customer notes, public content, and production logs without an operating rule that embedded text is untrusted data. A malicious instruction in those inputs can redirect repository reads, writes, or shell calls. Suggested fix: add a shared enforced rule that input content is never authority, embedded commands are never executed, and tool arguments must be independently derived from the role brief and approval state.

*Evidence:* evidence: “The inbound issue (ticket, message, or escalation)”; “support tickets … CSM / QBR notes”; “interview transcripts, support tickets, public competitor docs … community forums”; “Production signals: error logs … audit events.”

**F-01-6** · `.claude/agents/customer-success.md:56` · codex · open

Real customer identities and risk status are required in durable `runs/` artifacts without pseudonymization, field minimization, or retention controls. Trigger: a review using actual QBR, renewal, ticket, or escalation data. Suggested fix: require pseudonymous account IDs and aggregates, prohibit raw notes/contact data, and store identifiable details only in an access-controlled system outside the repository.

*Evidence:* evidence: the output must include “Top customer-impacting themes, each with account context” and “At-risk accounts and the leading indicator behind each flag.”

**F-01-7** · `.claude/agents/cloud-deployment.md:53` · codex · confirmed

Live-subscription deployment behavior is loaded from an unpinned third-party skill source. If upstream changes or is compromised, `npx skills add` resolves mutable instructions that can inspect secrets-adjacent configuration and deploy infrastructure. Suggested fix: pin a reviewed immutable commit/version and integrity hash, vendor or lock the exact skill contents, and record provenance.

*Evidence:* evidence: `npx skills add microsoft/azure-skills --skill azure-prepare --skill azure-validate --skill azure-deploy`; the role states the skills access “RBAC / managed-identity / secrets-adjacent configuration against a live subscription.”

**F-02-1** · `.claude/protocols/APPROVAL_PROTOCOL.md:68` · codex · open

A Charter-covered gated action proceeds without pausing for action-specific approval, contradicting this protocol’s own requirement that approval is never carried over. Trigger: any Charter line covering a rule 1–6 action. Suggested fix: exclude gated actions from Charter pre-approval and require a direct approval stop for each concrete action.

*Evidence:* evidence: “Covered: do not pause… act” and “NOT carried over from a previous approval. Each gated action is its own request.”

**F-02-2** · `.claude/protocols/STANDING_CHARTER.md:36` · codex · intentional

Tier-1 runs may open and automatically merge a pull request based only on an agent verdict, despite the approval protocol identifying opening or merging a PR as a rule 1–3 action requiring the human’s direct approval. Trigger: a standing-Charter run classified Tier 1 and Low with green gates. Suggested fix: leave the PR open and require direct human approval before merge.

*Evidence:* evidence: “Land. Open a pull request (S5.1). Auto-merge only under the rule below.” and “The Release Manager… decides; the Orchestrator merges with `gh pr merge`”

**F-02-3** · `.claude/protocols/RUN_ECONOMICS.md:178` · codex · open

A wall-clock timeout with no output is classified as a free infrastructure interruption, contradicting `FAILURE_LOOP.md`, where every attempt exceeding its wall-clock budget is a failure counted against bounded retries. Repeated hung attempts can therefore respawn indefinitely. Suggested fix: count every started attempt that exceeds the wall-clock limit as a timeout failure; exempt only interruptions occurring before an attempt begins.

*Evidence:* evidence: “An infrastructure interruption (usage limit, transport error, timeout with no output) is not a retry and does not consume the `FAILURE_LOOP.md` budget”

**F-02-5** · `.claude/protocols/SESSION_REQUEST.md:31` · codex · open

The protocol recommends wildcard permission rules without bounding the wildcard, expanding command execution beyond the dry-run command and weakening least privilege. Trigger: a fresh-load skill whose quoted command does not match an exact rule. Suggested fix: authorize the narrowest validated command or a fixed wrapper, and prohibit unconstrained wildcard rules.

*Evidence:* evidence: “prefer a wildcard rule in `.claude/settings.local.json` over an exact path.”

**F-03-1** · `.agentic/STANDING_CHARTER.md:34` · codex · open

Every routine commit stages entire directories, so unrelated or sensitive changes already present under `src`, `test`, or `runs` are included; `runs` is also outside the permitted prefixes in §4. Stage only plan-approved files and the current run’s directory, and fail if other changes exist.

*Evidence:* evidence: `git add src test README.md runs`, while lines 25–29 say “Exact path prefixes” and list only `src/`, `test/`, and `README.md`.

**F-03-2** · `.agentic/STANDING_CHARTER.md:32` · codex · rejected

The charter requires every routine run to open a pull request and allows tier-1 auto-merge, but §7 says routine runs never send/submit or release anything. Every landing therefore has contradictory authorization and may either bypass the stated stop or deadlock. Explicitly exempt narrowly defined repository landing actions in §7, or require per-run approval and remove auto-merge.

*Evidence:* evidence: `End action: pull request`, `Auto-merge: tier 1`, and line 34 permits `git push`, `gh pr create`, and `gh pr merge`; lines 44–46 say a routine run never “Sends or submits anything on a user's behalf” or “Deploys or releases anything with an external effect.”

**F-04-1** · `.claude/agentic.config.json:3` · codex · open

The relative playbook path breaks when the repository runs from a Git worktree, preventing roles from loading governing approval and least-privilege instructions. Trigger: starting an autonomous slice outside the main checkout. Resolve the playbook against the main checkout’s Git common directory and pass roles its canonical absolute path.

*Evidence:* evidence: `"playbookPath": "../agentic-sdlc-playbook",`

**F-06-1** · `src/services/habits.js:85` · codex · open

Ownership comparison is case-insensitive while creation and listing are case-sensitive. A user identifying as `alice` can mutate a habit owned by `Alice` if its ID is known, violating user isolation. Use one canonical, case-sensitive identity comparison consistently.

*Evidence:* evidence: `if (!habit \¦\¦ habit.userId.toLowerCase() !== userId.toLowerCase()) return null;`

**F-06-2** · `src/client/render.js:94` · codex · confirmed

The habit-detail link has only an absolutely positioned, clipped screen-reader child; the visible habit name is outside the anchor. Sighted pointer users therefore have no visible click target for opening details. Wrap the visible row content/name in the anchor or give the link a visible, sized target.

*Evidence:* evidence: `h("a", { class: "row-link", href: detailHref(view.habitId) }, [ h("span", { class: "sr-only" }, [view.name]), ])`

**F-08-2** · `test/server.test.js:19` · codex · open

The test server binds every network interface, exposing an unauthenticated mutable service during the suite; the same defect occurs at `test/client-server.test.js:17`. Bind both harnesses explicitly to `127.0.0.1`.

*Evidence:* evidence: both harnesses execute `server.listen(0, resolve)`, and this file itself states at line 608 that `.listen(port, cb)` “binds every interface”

### P2

**F-01-8** · `.claude/agents/cloud-deployment.md:4<br>.claude/agents/production-verification.md:4<br>.claude/agents/on-call-engineer.md:4<br>.claude/agents/post-launch-learning.md:4<br>.claude/agents/software-architect.md:4` · codex · confirmed

These roles mandate executable or provider operations but their declared tool boundaries cannot perform them, so their core stages must stop at runtime. Suggested fix: provide narrowly scoped, approval-gated provider/runner capabilities or explicitly delegate each operation to a capable role.

*Evidence:* evidence: Cloud Deployment declares only `Read, Write, Edit, Grep, Glob` but requires `azd up` / `terraform apply`; Production Verification has the same tools but must query Azure and execute rollback; On-Call must access observability and execute remediation; Post-Launch mandates `node <playbook>/execution/analyze.mjs .`; Architect must “run the candidate … with a throwaway script.”

**F-01-9** · `.claude/agents/analytics-engineer.md:81` · codex · open

The analytics policy permits ordinary hashing of predictable identifiers such as emails; low-entropy hashes are dictionary-reversible and linkable across datasets. Trigger: an implementation chooses unkeyed hashing as the allowed “hashing layer.” Suggested fix: prohibit unkeyed hashes for identifiers; use opaque internal IDs or purpose-scoped keyed tokenization/HMAC, and prohibit free text unless explicitly classified and approved.

*Evidence:* evidence: “Names, emails, free-text, and identifiers go through the project's hashing or tokenisation layer.”

**F-02-4** · `.claude/protocols/MODEL_ROUTING.md:59` · codex · confirmed

Tier-1 routing lowers gates to `medium`, directly contradicting the stated invariant that gates never drop below `high`. Trigger: any Tier-1 QA, Security, Release, or governance gate. Suggested fix: retain `high` effort for all gates at every tier.

*Evidence:* evidence: “Gates never drop below `high`.” and “Tier 1… gates stay `medium`.”

**F-02-6** · `.claude/protocols/SESSION_REQUEST.md:56` · codex · confirmed

The prescribed waiting status is not one of the four exact status values accepted by `SLICE_STATE.md`, so status parsers and inventory reconciliation can reject or misclassify every fresh-session wait. Suggested fix: keep `Status: in-progress` and record `waiting-on-session` in a separate note or field.

*Evidence:* evidence: “Set `Status: in-progress (waiting-on-session)` in `STATE.md`.”

**F-02-7** · `.claude/protocols/SLICE_STATE.md:134` · codex · open

The trace schema permits only `approved` or `denied`, while the same protocol requires recording `deferred`; a deferred approval cannot conform to the documented schema. Suggested fix: add `deferred` to the schema enum and consumers.

*Evidence:* evidence: `"decision": "<approved\¦denied>"` while line 200 requires “Record the decision verbatim (`approved`, `denied`, `deferred`)”

**F-02-8** · `.claude/protocols/TELEMETRY.md:58` · codex · confirmed

Stage token totals omit cache-read and cache-creation tokens even though those signals are available and `RUN_ECONOMICS.md` says actual processing is dominated by cache reads. Trigger: any telemetry-enabled cached run; budgets and SLOs materially undercount usage. Suggested fix: include all four token categories or rename the field and stop comparing it with total-token baselines.

*Evidence:* evidence: “`stages[].tokens` — Runtime — sum `input_tokens` + `output_tokens` per `agent_id`”

**F-02-9** · `.claude/protocols/TELEMETRY.md:62` · codex · open

API-request `duration_ms` is mapped to stage wall-clock even though a stage also spends time in tool calls and between multiple requests; the resulting value cannot measure the stage’s elapsed Start-to-End duration used by the wall-clock SLO. Suggested fix: derive wall-clock from stage boundary timestamps or the enclosing stage span.

*Evidence:* evidence: “`claude_code.api_request`… `duration_ms`” and “Wall-clock — Runtime — `duration_ms`”

**F-03-3** · `.agentic/CURRENT_MVP_STATUS.md:10` · codex · open

The status claims all six safety invariants were verified, but the governing file contains seven; a reviewer relying on this status can omit the loopback-only access-control invariant. Update the status to cover all seven invariants explicitly.

*Evidence:* evidence: `all 6 SAFETY_INVARIANTS independently verified`; `.agentic/SAFETY_INVARIANTS.md:26` begins invariant `7. The server is reachable only from the host it runs on.`

**F-03-4** · `.agentic/PROJECT_CONTEXT.md:24` · codex · open

The project stage says the delivery target is a headless service for a future frontend, although the same area records an implemented rendering boundary and HTTP headers. Agents must read this context before planning, so it can mis-scope subsequent security and architecture work. Update the stage to describe the current HTTP/browser client.

*Evidence:* evidence: `a headless, dependency-free Node service ... backing a future frontend`; `.agentic/CURRENT_MVP_STATUS.md:26-30` says defects were closed in “the rendering boundary and HTTP headers.”

**F-03-5** · `.agentic/CURRENT_MVP_STATUS.md:41` · codex · open

The current-status document marks the hardening work uncommitted and pending review even though this file and the described implementation are present in commit `4858e7a6e9bf02a1249106fcbb6efb4bf0b5db2b`; resume logic can therefore repeat or block already-landed work. Replace this with the actual landed/review state and commit reference.

*Evidence:* evidence: `Uncommitted — in the working tree pending human review.`

**F-05-1** · `.github/workflows/ci.yml:18` · codex · confirmed

CI executes actions referenced by mutable major-version tags. If either tag is maliciously repointed or its upstream account is compromised, arbitrary code runs in every PR and main-branch job. Suggested fix: pin both actions to reviewed full commit SHAs and use comments to record their release versions.

*Evidence:* evidence: `- uses: actions/checkout@v4` and `- uses: actions/setup-node@v4`

**F-05-2** · `.github/workflows/ci.yml:21` · codex · open

CI tests only Node 22 although the repository declares support for Node 18+. Node 22-only syntax or APIs can therefore pass the gate and fail on the documented minimum runtime. Suggested fix: test a matrix containing the minimum supported Node version, or explicitly raise the documented runtime requirement.

*Evidence:* evidence: `node-version: "22"`

**F-06-3** · `src/client/app.js:31` · codex · open

A malformed percent escape in a user-controlled URL hash, such as `#/habit/%`, makes `decodeURIComponent` throw `URIError`, aborting rendering. Catch decoding failures and treat the hash as an invalid route.

*Evidence:* evidence: `return m ? decodeURIComponent(m[1]) : null;`

**F-06-4** · `src/client/app.js:44` · codex · open

Every non-404 response below 500 is treated as success. For example, a whitespace-only stored user ID produces a 400 response whose missing `habit` is inserted into state, after which rendering throws. Require a successful 2xx response and validate the response shape before updating state.

*Evidence:* evidence: `if (res.status === 404) return { kind: "gone" }; if (res.status >= 500) return { kind: "failed" }; const body = await res.json(); return { kind: "ok", habit: body.habit, changed: body.changed };`

**F-06-5** · `src/services/audit.js:19` · codex · open

The append-only audit store exposes its live mutable event objects. A caller can modify the object returned by `recordAuditEvent` or `listAuditEvents`, rewriting previously recorded type or metadata. Freeze stored events and metadata and return immutable snapshots or defensive copies.

*Evidence:* evidence: `events.push(event); return event;` and `return events.filter((e) => e.userId === userId);`

**F-07-1** · `AGENTS.md:66` · codex · rejected

Regenerating from a Git worktree fails because this command uses the worktree-relative path that lines 8–12 explicitly say points nowhere; resolve the playbook from the absolute git common directory before invoking it.

*Evidence:* evidence: `node ../agentic-sdlc-playbook/execution/install.mjs .`

**F-07-3** · `REVIEW.md:5` · codex · confirmed

Every code review loads an unconfigured starter template, so reviewers receive no repository-specific failure modes, exclusions, or high-risk paths. Replace all bracketed placeholders with the project’s actual review guidance.

*Evidence:* evidence: `> Replace the bracketed lines; delete this note.`

**F-08-1** · `test/client-dom.test.js:216` · codex · open

The href test misses URLs with an external or executable scheme followed by `#/`; `https://evil.example/#/x` passes the implementation’s `includes("#/")` guard. Add such cases and require hrefs to start with `#/`.

*Evidence:* evidence: the bad cases are `["javascript:alert(1)", "data:text/html,x", "//evil.example", "http://x"]`, while `src/client/dom.js` checks `if (name === "href" && !v.includes("#/"))`

**F-08-3** · `test/habits.test.js:72` · codex · open

The user-isolation test exercises only unrelated IDs, so it misses the confirmed case-collision bug: a caller using `U1` can mutate a habit owned by `u1`, although listing remains case-sensitive. Add case-variant isolation coverage and use one exact identity comparison consistently.

*Evidence:* evidence: the test creates with `"u1"` and probes with `"u2"`; `src/services/habits.js` authorizes with `habit.userId.toLowerCase() !== userId.toLowerCase()` but lists with `habit.userId === userId`

**F-08-4** · `test/client-render.test.js:335` · codex · open

The parseHash coverage omits malformed percent escapes; visiting or changing the hash to `#/habit/%` makes `decodeURIComponent` throw and aborts rendering. Add malformed-encoding cases and make parsing return `null` instead of throwing.

*Evidence:* evidence: C6c tests only `#/habit/habit_1`, an `encodeURIComponent` result, `#/`, empty string, and `undefined`; `src/client/app.js` returns `m ? decodeURIComponent(m[1]) : null`

**F-09-1** · `scripts/build-check.mjs:4` · codex · open

The build check claims to import every shipped module but omits the browser-client graph. A broken import in `boot.js` can therefore pass `npm run build`; include the client entry point in a browser-capable smoke check.

*Evidence:* evidence: `const modules = ["../src/services/streak.js", "../src/services/habits.js", "../src/services/audit.js", "../src/server.js"];`

**F-09-2** · `scripts/demo.mjs:10` · codex · rejected

Running the demo writes the complete habit view—including the habit name—to the console, violating the repository invariant that logs never contain habit names or free text. Log only explicitly selected non-sensitive fields such as the habit ID and streak counts.

*Evidence:* evidence: `const created = createHabit(userId, "Meditate"); console.log("Created habit:", created);`

### P3

**F-07-2** · `README.md:22` · codex · open

The README reports 84 tests although the repository’s ready intent records 92; this misleads readers whenever tests are added. Remove the hard-coded count while retaining that the command runs typecheck and the full suite.

*Evidence:* evidence: `npm run qa:mvp   # typecheck + the full suite (84 tests)`

**F-08-5** · `test/server.test.js:87` · codex · confirmed

The real-clock assertions can fail if UTC midnight occurs between the request and the subsequent clock read; the same race appears at lines 239 and 559. Pin/inject the clock or bracket the operation with before/after dates and handle a boundary crossing.

*Evidence:* evidence: after awaiting the completion response, S3 computes `const todayUTC = new Date().toISOString().slice(0, 10)` and requires the earlier response date to equal it

## What was not reviewed, and why

- 5 file(s) vendored, binary, lock or minified.

## Tests and CI

Commands detected from manifests: test `npm run test`; build `npm run build`; typecheck `npm run typecheck`; run `npm run start`. **They were not run by this assessment.**

CI files: `.github/workflows/ci.yml`.

## Proposed backlog

Nothing below has been done. Each item is an intent the owner can turn into a Charter; none changes anything until the owner picks it.

- **Intent (F-01-1, P1):** Fix the issue at `.claude/agents/release-manager.md:84`: An applicable release gate can be skipped with only a written rationale; this triggers whenever required evidence is absent and permits forward progress instead of failing closed. Suggested fix: distinguish genuinely inapplicable gates as `n/a`; every skipped or failed applicable gate must be a NO-GO. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-2, P1):** Fix the issue at `.claude/agents/production-verification.md:101<br>.claude/agents/on-call-engineer.md:71`: A failed post-deploy check or regressed fix automatically executes rollback merely because the plan appeared in a reviewed tech spec; tech-spec review is not explicit approval for a destructive/external action. Suggested fix: execute only when an approval record or exact approved Charter line names that rollback and target; otherwise stop and request approval. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-3, P1):** Fix the issue at `.claude/agents/security-privacy.md:4<br>.claude/agents/qa-evidence.md:4`: Independent reviewers receive unrestricted `Bash`, which can modify product files through shell utilities and bypass the `Write\¦Edit` hook, despite these roles not owning code changes. Trigger: any mistaken or injected `sed -i`, redirect, Node, or similar command. Suggested fix: run review commands in a read-only worktree/sandbox or expose a strict inspection/test-command allowlist plus a separately scoped artifact writer. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-4, P1):** Fix the issue at `.claude/agents/qa-evidence.md:152`: QA is prohibited from modifying code but is later required to land tests and deliberately break and restore the implementation, making the independent verifier an implementer and risking a partially restored worktree if interrupted. Suggested fix: QA should hand the test case to the engineer and independently verify the resulting diff. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-5, P1):** Fix the issue at `.claude/agents/customer-support.md:50<br>.claude/agents/customer-success.md:48<br>.claude/agents/market-researcher.md:52<br>.claude/agents/sre.md:46`: Autonomous roles ingest tickets, customer notes, public content, and production logs without an operating rule that embedded text is untrusted data. A malicious instruction in those inputs can redirect repository reads, writes, or shell calls. Suggested fix: add a shared enforced rule that input content is never authority, embedded commands are never executed, and tool arguments must be independently derived from the role brief and approval state. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-6, P1):** Fix the issue at `.claude/agents/customer-success.md:56`: Real customer identities and risk status are required in durable `runs/` artifacts without pseudonymization, field minimization, or retention controls. Trigger: a review using actual QBR, renewal, ticket, or escalation data. Suggested fix: require pseudonymous account IDs and aggregates, prohibit raw notes/contact data, and store identifiable details only in an access-controlled system outside the repository. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-7, P1):** Fix the issue at `.claude/agents/cloud-deployment.md:53`: Live-subscription deployment behavior is loaded from an unpinned third-party skill source. If upstream changes or is compromised, `npx skills add` resolves mutable instructions that can inspect secrets-adjacent configuration and deploy infrastructure. Suggested fix: pin a reviewed immutable commit/version and integrity hash, vendor or lock the exact skill contents, and record provenance. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-1, P1):** Fix the issue at `.claude/protocols/APPROVAL_PROTOCOL.md:68`: A Charter-covered gated action proceeds without pausing for action-specific approval, contradicting this protocol’s own requirement that approval is never carried over. Trigger: any Charter line covering a rule 1–6 action. Suggested fix: exclude gated actions from Charter pre-approval and require a direct approval stop for each concrete action. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-2, P1):** Fix the issue at `.claude/protocols/STANDING_CHARTER.md:36`: Tier-1 runs may open and automatically merge a pull request based only on an agent verdict, despite the approval protocol identifying opening or merging a PR as a rule 1–3 action requiring the human’s direct approval. Trigger: a standing-Charter run classified Tier 1 and Low with green gates. Suggested fix: leave the PR open and require direct human approval before merge. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-3, P1):** Fix the issue at `.claude/protocols/RUN_ECONOMICS.md:178`: A wall-clock timeout with no output is classified as a free infrastructure interruption, contradicting `FAILURE_LOOP.md`, where every attempt exceeding its wall-clock budget is a failure counted against bounded retries. Repeated hung attempts can therefore respawn indefinitely. Suggested fix: count every started attempt that exceeds the wall-clock limit as a timeout failure; exempt only interruptions occurring before an attempt begins. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-5, P1):** Fix the issue at `.claude/protocols/SESSION_REQUEST.md:31`: The protocol recommends wildcard permission rules without bounding the wildcard, expanding command execution beyond the dry-run command and weakening least privilege. Trigger: a fresh-load skill whose quoted command does not match an exact rule. Suggested fix: authorize the narrowest validated command or a fixed wrapper, and prohibit unconstrained wildcard rules. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-03-1, P1):** Fix the issue at `.agentic/STANDING_CHARTER.md:34`: Every routine commit stages entire directories, so unrelated or sensitive changes already present under `src`, `test`, or `runs` are included; `runs` is also outside the permitted prefixes in §4. Stage only plan-approved files and the current run’s directory, and fail if other changes exist. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-03-2, P1):** Fix the issue at `.agentic/STANDING_CHARTER.md:32`: The charter requires every routine run to open a pull request and allows tier-1 auto-merge, but §7 says routine runs never send/submit or release anything. Every landing therefore has contradictory authorization and may either bypass the stated stop or deadlock. Explicitly exempt narrowly defined repository landing actions in §7, or require per-run approval and remove auto-merge. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-04-1, P1):** Fix the issue at `.claude/agentic.config.json:3`: The relative playbook path breaks when the repository runs from a Git worktree, preventing roles from loading governing approval and least-privilege instructions. Trigger: starting an autonomous slice outside the main checkout. Resolve the playbook against the main checkout’s Git common directory and pass roles its canonical absolute path. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-06-1, P1):** Fix the issue at `src/services/habits.js:85`: Ownership comparison is case-insensitive while creation and listing are case-sensitive. A user identifying as `alice` can mutate a habit owned by `Alice` if its ID is known, violating user isolation. Use one canonical, case-sensitive identity comparison consistently. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-06-2, P1):** Fix the issue at `src/client/render.js:94`: The habit-detail link has only an absolutely positioned, clipped screen-reader child; the visible habit name is outside the anchor. Sighted pointer users therefore have no visible click target for opening details. Wrap the visible row content/name in the anchor or give the link a visible, sized target. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-08-2, P1):** Fix the issue at `test/server.test.js:19`: The test server binds every network interface, exposing an unauthenticated mutable service during the suite; the same defect occurs at `test/client-server.test.js:17`. Bind both harnesses explicitly to `127.0.0.1`. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.

**Recorded and deferred** (below P1; filing them is the owner's call):
- F-01-8 (P2) `.claude/agents/cloud-deployment.md:4<br>.claude/agents/production-verification.md:4<br>.claude/agents/on-call-engineer.md:4<br>.claude/agents/post-launch-learning.md:4<br>.claude/agents/software-architect.md:4`: These roles mandate executable or provider operations but their declared tool boundaries cannot perform them, so their core stages must stop at runtime. Suggested fix: provide narrowly scoped, approval-gated provider/runner capabilities or explicitly delegate each operation to a capable role.
- F-01-9 (P2) `.claude/agents/analytics-engineer.md:81`: The analytics policy permits ordinary hashing of predictable identifiers such as emails; low-entropy hashes are dictionary-reversible and linkable across datasets. Trigger: an implementation chooses unkeyed hashing as the allowed “hashing layer.” Suggested fix: prohibit unkeyed hashes for identifiers; use opaque internal IDs or purpose-scoped keyed tokenization/HMAC, and prohibit free text unless explicitly classified and approved.
- F-02-4 (P2) `.claude/protocols/MODEL_ROUTING.md:59`: Tier-1 routing lowers gates to `medium`, directly contradicting the stated invariant that gates never drop below `high`. Trigger: any Tier-1 QA, Security, Release, or governance gate. Suggested fix: retain `high` effort for all gates at every tier.
- F-02-6 (P2) `.claude/protocols/SESSION_REQUEST.md:56`: The prescribed waiting status is not one of the four exact status values accepted by `SLICE_STATE.md`, so status parsers and inventory reconciliation can reject or misclassify every fresh-session wait. Suggested fix: keep `Status: in-progress` and record `waiting-on-session` in a separate note or field.
- F-02-7 (P2) `.claude/protocols/SLICE_STATE.md:134`: The trace schema permits only `approved` or `denied`, while the same protocol requires recording `deferred`; a deferred approval cannot conform to the documented schema. Suggested fix: add `deferred` to the schema enum and consumers.
- F-02-8 (P2) `.claude/protocols/TELEMETRY.md:58`: Stage token totals omit cache-read and cache-creation tokens even though those signals are available and `RUN_ECONOMICS.md` says actual processing is dominated by cache reads. Trigger: any telemetry-enabled cached run; budgets and SLOs materially undercount usage. Suggested fix: include all four token categories or rename the field and stop comparing it with total-token baselines.
- F-02-9 (P2) `.claude/protocols/TELEMETRY.md:62`: API-request `duration_ms` is mapped to stage wall-clock even though a stage also spends time in tool calls and between multiple requests; the resulting value cannot measure the stage’s elapsed Start-to-End duration used by the wall-clock SLO. Suggested fix: derive wall-clock from stage boundary timestamps or the enclosing stage span.
- F-03-3 (P2) `.agentic/CURRENT_MVP_STATUS.md:10`: The status claims all six safety invariants were verified, but the governing file contains seven; a reviewer relying on this status can omit the loopback-only access-control invariant. Update the status to cover all seven invariants explicitly.
- F-03-4 (P2) `.agentic/PROJECT_CONTEXT.md:24`: The project stage says the delivery target is a headless service for a future frontend, although the same area records an implemented rendering boundary and HTTP headers. Agents must read this context before planning, so it can mis-scope subsequent security and architecture work. Update the stage to describe the current HTTP/browser client.
- F-03-5 (P2) `.agentic/CURRENT_MVP_STATUS.md:41`: The current-status document marks the hardening work uncommitted and pending review even though this file and the described implementation are present in commit `4858e7a6e9bf02a1249106fcbb6efb4bf0b5db2b`; resume logic can therefore repeat or block already-landed work. Replace this with the actual landed/review state and commit reference.
- F-05-1 (P2) `.github/workflows/ci.yml:18`: CI executes actions referenced by mutable major-version tags. If either tag is maliciously repointed or its upstream account is compromised, arbitrary code runs in every PR and main-branch job. Suggested fix: pin both actions to reviewed full commit SHAs and use comments to record their release versions.
- F-05-2 (P2) `.github/workflows/ci.yml:21`: CI tests only Node 22 although the repository declares support for Node 18+. Node 22-only syntax or APIs can therefore pass the gate and fail on the documented minimum runtime. Suggested fix: test a matrix containing the minimum supported Node version, or explicitly raise the documented runtime requirement.
- F-06-3 (P2) `src/client/app.js:31`: A malformed percent escape in a user-controlled URL hash, such as `#/habit/%`, makes `decodeURIComponent` throw `URIError`, aborting rendering. Catch decoding failures and treat the hash as an invalid route.
- F-06-4 (P2) `src/client/app.js:44`: Every non-404 response below 500 is treated as success. For example, a whitespace-only stored user ID produces a 400 response whose missing `habit` is inserted into state, after which rendering throws. Require a successful 2xx response and validate the response shape before updating state.
- F-06-5 (P2) `src/services/audit.js:19`: The append-only audit store exposes its live mutable event objects. A caller can modify the object returned by `recordAuditEvent` or `listAuditEvents`, rewriting previously recorded type or metadata. Freeze stored events and metadata and return immutable snapshots or defensive copies.
- F-07-1 (P2) `AGENTS.md:66`: Regenerating from a Git worktree fails because this command uses the worktree-relative path that lines 8–12 explicitly say points nowhere; resolve the playbook from the absolute git common directory before invoking it.
- F-07-2 (P3) `README.md:22`: The README reports 84 tests although the repository’s ready intent records 92; this misleads readers whenever tests are added. Remove the hard-coded count while retaining that the command runs typecheck and the full suite.
- F-07-3 (P2) `REVIEW.md:5`: Every code review loads an unconfigured starter template, so reviewers receive no repository-specific failure modes, exclusions, or high-risk paths. Replace all bracketed placeholders with the project’s actual review guidance.
- F-08-1 (P2) `test/client-dom.test.js:216`: The href test misses URLs with an external or executable scheme followed by `#/`; `https://evil.example/#/x` passes the implementation’s `includes("#/")` guard. Add such cases and require hrefs to start with `#/`.
- F-08-3 (P2) `test/habits.test.js:72`: The user-isolation test exercises only unrelated IDs, so it misses the confirmed case-collision bug: a caller using `U1` can mutate a habit owned by `u1`, although listing remains case-sensitive. Add case-variant isolation coverage and use one exact identity comparison consistently.
- F-08-4 (P2) `test/client-render.test.js:335`: The parseHash coverage omits malformed percent escapes; visiting or changing the hash to `#/habit/%` makes `decodeURIComponent` throw and aborts rendering. Add malformed-encoding cases and make parsing return `null` instead of throwing.
- F-08-5 (P3) `test/server.test.js:87`: The real-clock assertions can fail if UTC midnight occurs between the request and the subsequent clock read; the same race appears at lines 239 and 559. Pin/inject the clock or bracket the operation with before/after dates and handle a boundary crossing.
- F-09-1 (P2) `scripts/build-check.mjs:4`: The build check claims to import every shipped module but omits the browser-client graph. A broken import in `boot.js` can therefore pass `npm run build`; include the client entry point in a browser-capable smoke check.
- F-09-2 (P2) `scripts/demo.mjs:10`: Running the demo writes the complete habit view—including the habit name—to the console, violating the repository invariant that logs never contain habit names or free text. Log only explicitly selected non-sensitive fields such as the habit ID and streak counts.

## Method and limits

- Files were mapped and tiered by a script from names, manifests and git history; reviewers read areas in order of risk until the cap.
- Reviewers worked in a copy with write tools, pushes and secret reads denied; the read-only check above is the evidence, not the instruction.
- Findings are from reading. None was reproduced unless its evidence says so.
- Recall and precision of this reviewer are reported in the calibration record, not here; a repo's report is only as good as that record.
