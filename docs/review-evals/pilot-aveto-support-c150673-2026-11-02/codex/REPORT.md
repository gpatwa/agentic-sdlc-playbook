# Assessment report: aveto-support-c150673

**Assessed against Aveto's gates on 2026-11-03. This is an assessment, not a certification.** It records what the reviewers found in the parts listed below. It does not say the code is secure or compliant, and a finding's absence is not evidence of safety.

|  |  |
|---|---|
| Commit | `32c74fcd218daef9c931776c918e79fa34e0729d` |
| Reviewers | codex (openai) |
| Independent second reviewer | **no**: one model family reviewed this. Treat it as a first pass. |
| Built under Aveto | yes: 0 Charter record(s), 8 run folder(s) |
| Read-only check | passed: the target's HEAD and working tree were unchanged, and the review copy differed from the commit only by the recorded removals |
| Source reviewed | about 393,806 of 678,400 reviewable tokens (estimate: bytes / 4) |

## Summary

66 finding(s): 0 P0, 33 P1, 31 P2, 2 P3, 0 note. 66 are still open; the owner sets each disposition.

## Risk map

| Tier | Files | Approx. tokens |
|---|---|---|
| high | 47 | 69,507 |
| medium | 67 | 169,781 |
| low | 308 | 454,421 |

High-risk files (47): `.agentic/CURRENT_MVP_STATUS.md`, `.agentic/LOCAL_COMMANDS.md`, `.agentic/PROJECT_CONTEXT.md`, `.agentic/SAFETY_INVARIANTS.md`, `.claude/agentic.config.json`, `.claude/agents/ai-engineer.md`, `.claude/agents/ai-governance.md`, `.claude/agents/analytics-engineer.md`, `.claude/agents/aveto-answerability-judge.md`, `.claude/agents/backend-architect.md`, `.claude/agents/cloud-deployment.md`, `.claude/agents/compliance-reviewer.md`, `.claude/agents/customer-success.md`, `.claude/agents/customer-support.md`, `.claude/agents/data-analyst.md`, `.claude/agents/data-governance.md`, `.claude/agents/engineering-manager.md`, `.claude/agents/finops.md`, `.claude/agents/frontend-developer.md`, `.claude/agents/market-researcher.md`, `.claude/agents/ml-engineer.md`, `.claude/agents/on-call-engineer.md`, `.claude/agents/orchestrator.md`, `.claude/agents/post-launch-learning.md`, `.claude/agents/product-manager.md`, and 22 more (see `map.json`).

## Findings

### P1

**F-01-1** · `.claude/agents/release-manager.md:93` · codex · open

Approval verification is limited to Tier 3, so a Tier 1/2 slice containing a send, destructive operation, deployment, or safety-control change can pass without validating its mandatory approval. Require approval verification for every applicable action regardless of release tier.

*Evidence:* evidence: `For Tier 3 slices, the Release Manager confirms:`

**F-01-2** · `.claude/agents/production-verification.md:101` · codex · open

A failed production check automatically triggers a destructive rollback without pausing for direct human approval, contrary to the repository’s hard-stop rule. Require explicit in-session approval for the specific rollback before execution.

*Evidence:* evidence: `A no-go triggers rollback immediately; it does not wait for a human approval round-trip`

**F-01-3** · `.claude/agents/on-call-engineer.md:63` · codex · open

During an incident, the agent may execute production-changing actions based solely on prior runbook authorization rather than obtaining the required direct human approval. Require approval for each production mutation and treat the runbook as instructions, not authorization.

*Evidence:* evidence: `Infra-level action: executed directly if it matches a pre-authorized runbook step`

**F-01-4** · `.claude/agents/on-call-engineer.md:71` · codex · open

The agent is instructed to auto-execute rollback after detecting a regression, bypassing the mandatory human hard stop for destructive shared-state changes. Replace auto-execution with a specific approval request followed by an audited rollback.

*Evidence:* evidence: `If it regressed, auto-executes the rollback plan`

**F-01-5** · `.claude/agents/sre.md:95` · codex · open

The role treats a runbook as capable of pre-authorizing future production mutations, allowing incident actions without direct approval in the driving session. Require in-session approval for each destructive or external-effect mitigation.

*Evidence:* evidence: `A runbook MAY pre-authorise specific, named mitigation steps`

**F-01-6** · `.claude/agents/cloud-deployment.md:4` · codex · open

The role cannot invoke the required Azure skills, run deployment commands, or open the promised pull request because its enforced tool boundary contains neither `Skill` nor `Bash`; every cloud-deployment run therefore stops before its core work. Add the narrowly scoped skill/execution capability required by the workflow while retaining the approval gate.

*Evidence:* evidence: `tools: Read, Write, Edit, Grep, Glob`

**F-01-7** · `.claude/agents/cloud-deployment.md:53` · codex · open

The prescribed installation executes mutable upstream skill code through an unpinned `npx skills add` command. A changed or compromised upstream repository would run with deployment privileges. Pin an audited commit or immutable package digest and verify it before installation.

*Evidence:* evidence: `github.com/microsoft/azure-skills`, installed via `npx skills add microsoft/azure-skills --skill azure-prepare --skill azure-validate --skill azure-deploy`

**F-01-8** · `.claude/agents/production-verification.md:4` · codex · open

The role has no `Skill`, shell, or live-environment tool, so it cannot invoke `azure-diagnostics`, query Azure, or execute the rollback that its required outputs promise. Grant narrowly scoped read-only diagnostic access plus separately approval-gated rollback execution.

*Evidence:* evidence: `tools: Read, Write, Edit, Grep, Glob`

**F-01-9** · `.claude/agents/on-call-engineer.md:4` · codex · open

The on-call role has no observability or command tool, so it cannot inspect live logs, metrics, traces, execute an approved mitigation, or perform rollback during an incident. Add explicit least-privilege diagnostic tools and a separately gated mutation mechanism.

*Evidence:* evidence: `tools: Read, Write, Edit, Grep, Glob`

**F-01-12** · `.claude/agents/qa-evidence.md:133` · codex · open

QA is both declared independent and instructed to land tests into the implementation under review. This mutates the reviewed tree after the recorded implementation SHA and lets the reviewer change the evidence it relies on. QA should only report the required regression test and hand it back to an engineer, then re-review the new commit.

*Evidence:* evidence: `Land it as a test if a future change could break it silently`

**F-01-13** · `.claude/agents/security-privacy.md:4` · codex · open

The security reviewer processes potentially adversarial diffs while holding unrestricted `Bash`, `Write`, and `Edit`, with no write-scope hook despite explicitly not owning code changes. Prompt injection in reviewed content can therefore cause repository mutation or command execution. Scope writes to the review artefact and replace unrestricted shell access with read-only, allow-listed checks.

*Evidence:* evidence: `tools: Read, Write, Edit, Bash, Grep, Glob`

**F-01-14** · `.claude/agents/aveto-answerability-judge.md:15` · codex · open

Retrieved documentation is untrusted model input, but the judge prompt never tells the model to ignore instructions embedded in questions or passages. A passage containing prompt-injection text can redirect the verdict and defeat answerability gating. Delimit inputs, state that their contents are data only, and add adversarial injection evals.

*Evidence:* evidence: `Judge only from the passages shown; use no outside knowledge and no tools.`

**F-01-15** · `.claude/agents/customer-success.md:58` · codex · open

Live customer data is written into committed `runs/` artefacts with account context and explicit at-risk-account reporting, but no redaction or pseudonymization requirement exists. Running this role against real customers can publish identities, renewal risk, ticket history, or QBR details. Store only opaque account IDs and aggregated/redacted evidence; keep raw customer data outside the repository.

*Evidence:* evidence: `Top customer-impacting themes, each with account context and frequency.`

**F-01-16** · `.claude/agents/customer-support.md:50` · codex · open

The per-issue artefact consumes account context and records the resolution and customer-facing reply in `runs/`, without prohibiting raw PII, credentials, or ticket content from being committed. Require redacted inputs/outputs, opaque ticket IDs, and external storage for raw account data.

*Evidence:* evidence: `The inbound issue (ticket, message, or escalation).`

**F-02-1** · `.claude/protocols/APPROVAL_PROTOCOL.md:40` · codex · open

Approval responses containing credentials, personal data, or confidential context are copied verbatim into the durable repository artefact, causing disclosure when runs are committed publicly. Store only the explicit decision and a redacted excerpt; keep any sensitive original in protected storage.

*Evidence:* evidence: `write runs/<slice-id>/APPROVAL_RECORD-<n>.md: the decision, the approver, the UTC timestamp, and the human's response **verbatim**.`

**F-02-2** · `.claude/protocols/HANDOFF_CHECK.md:10` · codex · open

The model-based validator consumes stage-produced artefacts without any instruction/data boundary or tool restriction. An artefact containing prompt-injection instructions can redirect the validator, fabricate a pass, or invoke any tools it is offered. Use deterministic envelope checks where possible and run any model check tool-free with explicitly delimited, untrusted input.

*Evidence:* evidence: `At every stage boundary, on the artefact just produced, before the receiving agent is spawned.` and `No invented claims — the artefact doesn't assert a capability, file, or number that doesn't exist`

**F-02-5** · `.claude/protocols/RUN_ECONOMICS.md:29` · codex · open

The pre-spawn budget uses the last request’s peak context instead of total processed or cost-weighted tokens. A long agentic loop can consume 10–50 times the recorded amount and still pass the budget gate, recreating the account-exhaustion failure this protocol is intended to prevent. Budget against cumulative runtime usage or cost, including cache reads and writes.

*Evidence:* evidence: `These are peak context, not consumption` and `What a stage actually processes — every request's tokens, summed — is typically **10–50× larger**, mostly cache reads.`

**F-02-6** · `.claude/protocols/SLICE_STATE.md:16` · codex · open

A malformed or missing budget block disables enforcement instead of stopping the spawn. Any accidental edit or adversarial stage output that makes `STATE.md` unparsable bypasses the mandatory pre-spend gate. Make parse failure a hard denial until valid state is restored.

*Evidence:* evidence: `A slice it cannot parse is checked by no one, and the hook can only say so.`

**F-02-7** · `.claude/protocols/RUN_ECONOMICS.md:171` · codex · open

A wall-clock timeout with no output is classified as an infrastructure interruption and excluded from the retry budget, contradicting `FAILURE_LOOP.md` and permitting an unlimited sequence of timed-out respawns. Count every stage wall-clock timeout as a retry; exempt only interruptions that did not exceed the stage budget.

*Evidence:* evidence: `An **infrastructure** interruption (usage limit, transport error, timeout with no output) is **not** a retry and does not consume the FAILURE_LOOP.md budget`

**F-02-8** · `.claude/protocols/TELEMETRY.md:58` · codex · open

Runtime token accounting omits `cache_read_tokens` and `cache_creation_tokens` even though they are emitted separately. Runs dominated by cached context therefore under-report stage spend, weakening budget and SLO enforcement. Sum all four token categories or use cost-weighted usage consistently.

*Evidence:* evidence: `stages[].tokens \¦ Runtime — sum input_tokens + output_tokens per agent_id`

**F-04-1** · `.claude/skills/aveto-judge-seen/SKILL.md:9` · codex · open

A run ID containing a single quote escapes the shell argument before `seen_payload.py` can validate it, allowing arbitrary commands under the operator’s permissions; replace textual shell interpolation with argument-safe invocation and narrow the allowed-tools pattern.

*Evidence:* evidence: the exact code is `!`uv run -q --project "${CLAUDE_PROJECT_DIR}" python "${CLAUDE_SKILL_DIR}/seen_payload.py" '$ARGUMENTS'``

**F-05-1** · `.claude/settings.json:9` · codex · open

When the next stage exceeds the approved budget, the configured guard merely requests permission to continue, allowing an over-budget spawn despite the mandatory ceiling. Make the guard deny the spawn until the plan is degraded, a stage is dropped, or a new compliant plan is recorded.

*Evidence:* evidence: the setting runs `node "$CLAUDE_PROJECT_DIR/.claude/hooks/budget-guard.mjs"`; that hook returns `permissionDecision: "ask"` and says `Approve only if you intend to continue anyway.`

**F-07-1** · `runs/docs-retrieval-4/06-release-checklist.md:170` · codex · open

The gate declares the slice internally releasable even though its mandatory crash criterion is explicitly not met; when the owner relies on this verdict to push or merge, a failed slice can advance. Mark it not releasable and return it to the owning stage, or obtain a direct human amendment to the intent and rerun the gate.

*Evidence:* evidence: line 100 says “The shutdown crash is fixed or explained. NOT MET as written,” while line 170 says “Verdict: internally releasable, not announced.”

**F-08-1** · `runs/docs-abstention/APPROVAL_RECORD-8.md:11` · codex · open

Pack v17 widened a write-scope safety control and was installed based on approval relayed from another session, which cannot satisfy the direct human-approval requirement. Trigger: installing commit `ebd6c6e`. Revert that change, obtain the owner’s direct approval in the driving session, record it, and only then reinstall.

*Evidence:* evidence: “the owner's go on installing it is as relayed by that session and not separately recorded here”

**F-08-2** · `runs/docs-abstention/SUPPORT_REPLIES.md:59` · codex · open

The ten-file pack upgrade, including the write-scope guard change, landed after the recorded Security Review and Release Gate ranges, so the final branch’s safety-control change was never reviewed or gated. Trigger: treating the closed slice or final branch as gate-covered. Run adversarial Security and the Release Gate against the final commit, or remove the late pack upgrade.

*Evidence:* evidence: “Done as commit `ebd6c6e` on this branch … pack v15 -> v17, 10 files. The Tech Writer and Post-Launch Learning may now write `.agentic/CURRENT_MVP_STATUS.md`”

**F-08-3** · `runs/docs-abstention/STATE.md:109` · codex · open

The intent explicitly bound Security to adversarial depth for INV-4, but the Orchestrator lowered it to standard without a human decision recorded in the owner’s words. Trigger: running or accepting the standard-depth review as satisfying the named Security stage. Obtain explicit owner approval for the downgrade or rerun Security at adversarial depth.

*Evidence:* evidence: “The intent asked for Security at adversarial depth … the Orchestrator ran Security at **standard** depth … No approval record names the downgrade.”

**F-09-1** · `runs/docs-answerability-2/SUPPORT_REPLIES.md:41` · codex · open

A support session deleted a permission/safety-control file based on an owner instruction received outside the driving session, although `APPROVAL_RECORD-9.md:10` explicitly left S6’s disposition unapproved. This bypasses the hard approval boundary. Record the breach and require a direct decision in the driving session before treating S6 as resolved.

*Evidence:* evidence: `Writer: the support session, on the owner's word ("remove it", 2026-10-16). Data only.` and `The gitignored .claude/settings.local.json ... is deleted.`

**F-12-1** · `runs/docs-retrieval-2/01-scope.md:92` · codex · open

The scope silently extends approvals explicitly limited to `docs-retrieval-2` across the newly created `docs-retrieval-2-proof` slice. This triggers when slice B relies on those approvals, violating the hard-stop rule against inferring approval scope. Obtain and record the owner’s direct approval naming slice B before using the changed safety control there.

*Evidence:* evidence: `Both approvals are scoped to this work (the two slices together, one gate).` conflicts with APPROVAL_RECORD-1.md:7: `for docs-retrieval-2 only` and APPROVAL_REQUEST-1.md:9: `For this slice only`

**F-13-1** · `tests/test_judge_seen_skill.py:117` · codex · open

The injection test bypasses the skill’s shell wrapper by passing the hostile value directly as an argv element. A run ID containing a single quote can escape the wrapper’s `'$ARGUMENTS'` quoting without this test failing. Exercise the actual command template with a single-quote payload and assert no command executes.

*Evidence:* evidence: the exact code is `subprocess.run([sys.executable, str(HELPER), arg], ...)`, so shell metacharacters are never interpreted

**F-14-1** · `runs/docs-retrieval-3/03-implementation.md:6` · codex · open

The implementation fetched an unapproved third repository file outside `ingest`; this triggers when performing the tokenizer open check and violates the owner’s exact two-file authorization and INV-5’s ingest-only, hash-pinned download boundary. Fix by relying on approved metadata, or obtain new approval and pin/hash the file through `ingest`.

*Evidence:* evidence: “`tokenizer_config.json` … fetched by HTTPS GET only”; `APPROVAL_RECORD-1.md:5` authorizes “exactly those two files” and “Nothing else from the repo”

**F-15-1** · `aveto_support/judge.py:192` · codex · open

A symlinked `.aveto-judge` directory is followed, so `judge-input` or cleanup can read and delete `reply.txt` outside the transport directory. This triggers when `.aveto-judge` points to another directory. Reject a symlinked transport directory and use no-follow directory-relative operations.

*Evidence:* evidence: `base = TRANSPORT_DIR.resolve()` follows the directory symlink; `candidate = base / path.name` accepts the external file; cleanup later calls `safe.unlink()`

**F-15-2** · `aveto_support/evaluate.py:71` · codex · open

Duplicate evaluation IDs are accepted and scored repeatedly, allowing duplicated hits to inflate the 80% release gate; judge evaluation also collapses different questions with the same ID into one result. Reject every repeated ID while loading the eval set.

*Evidence:* evidence: `qid, text = entry.get("id"), entry.get("question")` is followed by unconditional `questions.append(...)` with no uniqueness check; `build_results` later uses `{q.id: retrieve_for_judge(...) for q in eval_set.questions}`

**F-15-3** · `aveto_support/ingest.py:408` · codex · open

The archive cap applies only to compressed bytes; each Markdown member is then read into memory without a per-member or aggregate uncompressed-size limit. A small highly compressed configured repository can exhaust memory during ingest. Enforce member-count, member-size, and total-uncompressed-size limits and decode incrementally.

*Evidence:* evidence: fetch uses `response.read(max_bytes + 1)`, but archive processing uses the unbounded `text = handle.read().decode("utf-8-sig")`

### P2

**F-01-10** · `.claude/agents/post-launch-learning.md:68` · codex · open

Slice close-out requires running a Node analytics generator, but the enforced tool boundary excludes `Bash`, so analytics cannot be regenerated and the mandatory close-out check cannot complete. Add a narrowly scoped execution tool or delegate this command to a role that has one.

*Evidence:* evidence: `then regenerate runs/ANALYTICS.md + runs/dashboard.html via node <playbook>/execution/analyze.mjs .`

**F-01-11** · `.claude/agents/software-architect.md:121` · codex · open

Model-bearing slices require executing a throwaway pilot, but this role has only read/write/search tools and explicitly may use no others, making the mandatory pre-implementation pilot impossible. Delegate the pilot to an execution-capable role or provide a constrained runner after rule-5 approval.

*Evidence:* evidence: `Before the Implementation stage, run the candidate on the seen sets only, with a throwaway script and a fixed rule`

**F-01-17** · `.claude/agents/market-researcher.md:86` · codex · open

Discovery artefacts are required to reproduce interview quotes and review excerpts, but the role has no consent, confidentiality, or redaction rule. Internal interviews or support tickets can therefore leak personal or confidential text into the repository. Require consent-aware paraphrasing/redaction and opaque source IDs for non-public evidence.

*Evidence:* evidence: `interview quote with ID, ticket count over a window, review excerpt with URL`

**F-02-3** · `.claude/protocols/MODEL_ROUTING.md:59` · codex · open

Tier-1 routing lowers gates to medium effort even though the same protocol says gates never drop below high. Every Tier-1 QA, Security, or Release gate therefore runs below the declared minimum. Keep gate effort at high for every tier.

*Evidence:* evidence: `Tier 1 (docs / refactor): ... Producers drop to low effort; gates stay medium.`

**F-02-4** · `.claude/protocols/MODEL_ROUTING.md:72` · codex · open

A failed Tier-3 Architecture, Security, or Release stage already runs on the highest documented model class, so its mandatory final retry cannot run “one model class higher.” Define saturation behavior, such as retaining Opus while increasing effort or escalating directly to the human.

*Evidence:* evidence: `the **final retry** of a failed stage runs one model class higher than the attempt that failed.`

**F-02-9** · `.claude/protocols/APPROVAL_PROTOCOL.md:47` · codex · open

A denied approval stops the slice, but the state schema has no cancelled or denied terminal status; `done` is reserved for landed slices. Denied slices consequently remain blocked forever in durable state and inventory. Add a terminal `cancelled`/`denied` status and specify the transition.

*Evidence:* evidence: `Denied → stop the slice. Record the rationale, hand back to the Orchestrator.`

**F-03-1** · `.agentic/PROJECT_CONTEXT.md:78` · codex · open

The project context falsely says no generative model is used anywhere; this triggers incorrect privacy and approval decisions because the operator-run judge sends questions, passages, and session context to Anthropic. Scope the claim to the Python program and document the judge workflow.

*Evidence:* evidence: `No generative model is used anywhere.` versus `.agentic/CURRENT_MVP_STATUS.md:21-29`: `Judge step ... aveto-answerability-judge ... The question, shown passages, reply and session context go to Anthropic`

**F-03-2** · `.agentic/CURRENT_MVP_STATUS.md:55` · codex · open

The documented `eval` exit condition is wrong: unanswerable questions never control the exit status, and even `--verdicts` leaves the exit code tied to the retrieval gate. Change this to say only answerable retrieval accuracy is gated.

*Evidence:* evidence: `` `eval`: scores retrieval against an eval file and exits non-zero below 80% on either group.`` versus `aveto_support/__main__.py:300`: `return 0 if report_eval.passed else 1` and `aveto_support/evaluate.py:151`: `unanswerable: {report.unanswerable_total} (diagnostic only, not gated)`

**F-03-3** · `.agentic/SAFETY_INVARIANTS.md:63` · codex · open

INV-4 claims unjudged retrieval can never print verdict-like lines, but a question containing newlines is echoed without normalization and can inject `no confident match` or `Deciding signal:` at line start. Normalize/reject control characters before rendering, or narrow the invariant to exclude echoed input.

*Evidence:* evidence: `` `retrieve`, and `eval` without `--verdicts`, never print a verdict, a deciding signal or `no confident match`.`` versus `aveto_support/__main__.py:56`: `f"Sources for: {result.question}"` and `aveto_support/__main__.py:284`: `print(format_result(retrieve(searcher, " ".join(args.question)), index))`

**F-07-2** · `runs/docs-retrieval-4/06-release-checklist.md:18` · codex · open

The Release Manager did not perform the required immutable-bar comparison and proceeded despite admitting that an intervening commit could have changed the bar; this permits a post-result bar edit to pass unnoticed. Require a diff or committed-content hash against the pre-QA revision and fail closed if it cannot be obtained.

*Evidence:* evidence: “I have no shell and cannot run `git diff 23d233c HEAD -- runs/docs-retrieval-4/06-release-gate-plan.md`”; line 21 adds, “A change to the plan inside a commit titled ‘STATE’ cannot be excluded … I do not treat the limit as a reason to void the check.”

**F-07-3** · `runs/docs-retrieval-4/06-qa-result.md:42` · codex · open

QA omitted the planned INV-1 through INV-3 verification but the release checklist later marks the safety-invariant gate complete; a posting or grounding regression could therefore advance without the required evidence. Walk and record every invariant, or explicitly justify each inapplicable invariant before rerunning the verdict.

*Evidence:* evidence: the gate plan at `06-release-gate-plan.md:26` requires QA to “walk `.agentic/SAFETY_INVARIANTS.md` INV-1 to INV-5,” but this line says, “I did not run INV-1 to INV-3 names”; `06-release-checklist.md:46` nevertheless checks “Safety invariants verified.”

**F-08-4** · `runs/docs-abstention/STATE.md:24` · codex · open

Durable state marks Freeze—and the following Label review and Scoring rows—as `pending` even though the slice is closed and the owner explicitly skipped those stages. Trigger: a cold resume or status reader interprets them as work still awaiting execution. Mark all three `skipped/not run`, with the failed precondition and APPROVAL_RECORD-6 as the reason.

*Evidence:* evidence: “\ / Freeze \ / Orchestrator \ / pending \ / — \ / method commit recorded \ / ”

**F-08-5** · `runs/docs-abstention/06-release-checklist.md:108` · codex · open

The checklist says no end-to-end figure was reported, but `03-implementation.md:14-19` reports end-to-end top-5/top-1 figures for every seen set. Trigger: downstream planning or status work relies on this checklist and discards existing diagnostic evidence. Change the claim to “no fifth-set/held-out end-to-end figure” and retain the seen-set diagnostics.

*Evidence:* evidence: “Any end-to-end figure … and any fifth-set result. I report none.”

**F-09-2** · `runs/docs-answerability-2/trace.json:55` · codex · open

The machine-readable trace dates approvals 5–7 as 2026-10-13, while each corresponding approval record says the owner typed it on 2026-10-12. Any audit generated from the trace therefore reports an incorrect approval chronology. Correct `requestedAt` and `decidedAt` for these three entries from their source records.

*Evidence:* evidence: `"requestedAt": "2026-10-13", "decidedAt": "2026-10-13"`; `APPROVAL_RECORD-5.md`, `APPROVAL_RECORD-6.md`, and `APPROVAL_RECORD-7.md` each state `owner, typed, 2026-10-12`.

**F-09-3** · `runs/docs-answerability-2/trace.json:134` · codex · open

The tier-3 gate catch says six items were unmet but records only release approval, change-request approval, vendor/DPA risk, and governance gates. It omits the recorded rollback-rehearsal, monitoring-threshold, and final-tree-regression failures, so generated gate reporting loses material release conditions. Replace the summary with the six conditions recorded in `15-close-out.md:35`.

*Evidence:* evidence: `"finding": "Six tier 3 items not met: release-action approval, change request approval, vendor risk and DPA (unknown), plus governance gates unruled; owner holds conditions T1 to T11."`

**F-09-4** · `runs/docs-answerability-2/15-close-out.md:97` · codex · open

The final close-out still projects total spend as about 2,613k because later stages were “not yet” recorded, while final durable state and trace report 2,773k. Using the close-out for retrospectives understates spend and plan overrun by about 160k. Reconcile its cost and lesson calculations with the finalized trace.

*Evidence:* evidence: `2,468k + 60k + 30k + 55k = about 2,613k, over the 2,600k plan by about 13k`; `STATE.md:54` records `Spent: 2773k` and `173k over the 2.6M plan`.

**F-09-5** · `runs/docs-answerability-2/STATE.md:57` · codex · open

Durable state still says the ruff failure must be settled, despite the same file recording that it was fixed and owner-acknowledged. A resumed run can incorrectly reopen a completed gate or modify frozen evidence again. Remove the obsolete note or mark it resolved with the fix commit.

*Evidence:* evidence: `the verdict needs the ruff item ... settled first`; line 65 says `fixed by the Orchestrator (D6), acknowledged by the owner in APPROVAL_RECORD-9`.

**F-10-1** · `runs/docs-abstention/02-baseline-sweep.py:140` · codex · open

The combined sweep uses logical OR, although the scope requires the combined “threshold AND margin” rule. Whenever only one signal falls below its cutoff, the script incorrectly counts an abstention. Regenerate the combined results using logical AND, or obtain an approved scope change to OR before relying on them.

*Evidence:* evidence: `if t is not None and float(r[tkey]) < t: return True` followed by `return m is not None and float(r[mkey]) < m`; `01-scope.md:51` requires `the combined "threshold AND margin" rule`

**F-10-2** · `runs/docs-abstention/02-baseline-sweep.py:363` · codex · open

The leave-one-set-out check does not evaluate the required single chosen setting: it selects a new best threshold/margin for every held-out set. This can declare robustness even when no single deployable setting clears every fold. Select the setting once using the preregistered rule and evaluate that same cell across all four folds, then regenerate the LOSO evidence.

*Evidence:* evidence: inside `for held in names`, the code assigns `best_c = min(cells(family), key=lambda c: (-minfrac(counts(train, c[0], c[1])), c[0] or 0.0, c[1] or 0.0))`; `01-scope.md:65` requires `the single chosen setting` to clear the leave-one-set-out check

**F-11-1** · `runs/docs-retrieval-3-proof/02-qa-result.md:9` · codex · open

The sole gating run terminated with exit 134, but the slice records the gate as passed. This violates fail-closed gate handling whenever evaluation crashes after printing a score. Treat the run as failed; fix the teardown crash, then validate using a fresh held-out set before claiming the gate was met.

*Evidence:* evidence: “the process aborted at teardown … exit 134” followed by “The score is unaffected; the exit code of that one run is not trustworthy as a pass/fail signal.”

**F-11-2** · `runs/docs-retrieval-3-proof/00-slice-plan.md:19` · codex · open

The committed gate labels were materially changed after the independent label review, so the exact set scored was never reviewed under the required fresh-QA process. This triggers whenever the committed set is used as held-out proof. Withdraw the gate claim or freeze the labeling policy and independently review an exact fresh set before scoring it.

*Evidence:* evidence: “It is NOT byte-identical to the reviewer’s `retrieval-heldout-4.reviewed.toml`: the owner’s version drops `docs/AGENTIC_SDLC.md` from every question’s sources … and trims some other additions.”

**F-11-3** · `runs/docs-retrieval-3-proof/STATE.md:24` · codex · open

Durable state marks Post-Launch as done even though the close-out says Post-Launch did not run. Status/resume or audit consumers will therefore treat a skipped stage as completed. Record it as `not run — owner’s decision`, consistent with the Security and Release rows.

*Evidence:* evidence: `¦ Post-Launch ¦ Orchestrator (owner directed; no spawn) ¦ done ¦ runs/docs-retrieval-3-proof/03-close-out.md ¦ — ¦`

**F-12-2** · `runs/docs-retrieval-2/STATE.md:72` · codex · open

The durable state contains completed proof results followed by obsolete instructions to create and run that proof slice. A resumed agent could commit another held-out set or score again, violating the required single held-out run. Replace the stale instructions with the failed-gate escalation and update the current stage/timestamp.

*Evidence:* evidence: `OUTCOME: slice B docs-retrieval-2-proof scored ... gate FAILED ... (Earlier text follows.) ... Owner: write and commit the third held-out set ... Orchestrator then ... creates slice B docs-retrieval-2-proof ... and QA scores once`

**F-12-3** · `runs/docs-retrieval-2/02-tech-spec.md:270` · codex · open

The Architect exceeded the Engineering Manager’s file cap without returning for the required re-split: applying the approved invariant edit makes 14 counted files, and the two additional ADR edits make 16, while Scope allowed at most 15 and required escalation above the cap. Record all touched files and obtain an Engineering Manager exception or re-split before freezing.

*Evidence:* evidence: `Total: 13 files (14 with the INV annotation), plus the two ADR status lines. Fits the cap; no re-split needed.` Scope line 172 requires: `Needs more than the section 4 cap ... hand back to the Engineering Manager for a re-split.`

**F-13-2** · `tests/test_judge_seen_skill.py:199` · codex · open

The model test always compares a newly derived sample-only key against the committed key after gate-set rows were appended, so `pytest -m model` fails even when derivation is correct. Compare only the original sample portion or generate the expected key including the appended set.

*Evidence:* evidence: the exact code loops over `("key/key.toml", "batch-1.txt", "sample-eval.toml")` and asserts `(tmp_path / name).read_bytes() == (SEEN / name).read_bytes()`

**F-13-3** · `tests/test_ingest.py:613` · codex · open

The tests named as proving offline operation with cached models never load either cached model: both ingestion and retrieval inject fake adapters. Network or loading regressions in the real cached embedder/reranker path therefore pass. Add model-marked tests that populate the verified cache and invoke `main` without injected adapters.

*Evidence:* evidence: the cached-reranker test calls `main(..., embedder=FAKE, reranker=FakeReranker())`; the cached-model test repeats the same injection at line 735

**F-13-4** · `tests/conftest.py:31` · codex · open

The claimed default-suite network block covers only `connect`, `create_connection`, and DNS lookup. Direct-IP traffic through `connect_ex`, UDP `sendto`, or a spawned client bypasses it, so an accidental network regression can pass. Use a socket-denial fixture that blocks socket creation/all connection methods and constrain network-capable subprocesses.

*Evidence:* evidence: the exact fixture patches only `socket.socket.connect`, `socket.create_connection`, and `socket.getaddrinfo`

**F-14-2** · `runs/docs-retrieval-3/STATE.md:68` · codex · open

The durable trace reports zero total tokens and tool calls despite three populated stage rows, corrupting run-cost and audit summaries. Replace the totals with 5.792M processed tokens, 314k peak-context spend, and 109 tool calls.

*Evidence:* evidence: lines 65–67 record “402k processed (peak ctx 60k)” with 22 calls, “2.69M processed (peak ctx 143k)” with 50 calls, and “2.70M processed (peak ctx 111k)” with 37 calls, but line 68 records “0” and “0”

**F-15-4** · `aveto_support/judge.py:115` · codex · open

An included Git filename containing a newline can inject forged judge-payload boundary lines because the path is interpolated verbatim while marker validation examines only passage text. Reject control/newline characters in archive paths or safely encode all payload metadata before interpolation.

*Evidence:* evidence: `lines.append(f"File {hit.rank}: {hit.path}")` inserts the raw path; the subsequent marker check iterates only `for offset, text_line in enumerate(p.text.splitlines())`

**F-15-5** · `aveto_support/ingest.py:472` · codex · open

Ingest succeeds and writes an unusable index when all included files are empty, heading-only, or skipped as non-UTF-8. The condition produces only a warning, while retrieval later rejects the index for having no passages. Fail ingest before model loading or index writing when `split` is empty.

*Evidence:* evidence: `if len(eligible_passages_by_file(passages)) < 5:` only appends a warning, then `write_index(index, out_path)` runs; retrieval separately raises `IndexFormatError("the index has no passages")`

**F-15-6** · `aveto_support/index.py:174` · codex · open

A fenced-code line beginning with the opening delimiter is treated as a closing fence even when non-whitespace follows it. Valid content such as `````python`` inside an existing backtick fence therefore exposes later code headings to the section parser and corrupts passage boundaries. Require a closing fence to contain only the delimiter followed by optional spaces or tabs. ¦ evidence: `re.match(r"^ {0,3}" + re.escape(char) + "{" + str(size) + ",}", line)` is not anchored and imposes no trailing-whitespace requirement

*Evidence:* none given

### P3

**F-03-4** · `.agentic/LOCAL_COMMANDS.md:37` · codex · open

The model-test instructions claim the WordPiece test fails until a fixture is added, but that fixture is already present; this sends operators toward the wrong remediation. Remove the stale warning and identify the currently failing sample-derivation test instead.

*Evidence:* evidence: `` `test_wordpiece_matches_golden`, which fails until QA adds `tests/fixtures/wordpiece_golden.json`.`` while `tests/fixtures/wordpiece_golden.json` exists and `.agentic/CURRENT_MVP_STATUS.md:98-99` says `` `tests/fixtures/wordpiece_golden.json` exists; the earlier line saying it was missing was stale.``

**F-10-3** · `runs/docs-abstention/02-baseline.md:30` · codex · open

The report identifies the same `t=0.40` row as both the always-abstain and never-abstain extremes. That row is only never-abstain (`0/20` abstentions), so consumers following this summary receive a false baseline description. Name `t=0.40` only as never-abstain and identify the actual always-abstain rows separately.

*Evidence:* evidence: `The "always abstain" and "never abstain" extremes are the t=0.40 row`; the generated table at line 121 records `t=0.40` as Bar 1 `0/20` and Bar 2 `56/56`

## What was not reviewed, and why

- Area `runs/docs-retrieval-2-proof` (medium, about 10,819 tokens): token cap reached.
- Area `runs/docs-retrieval#2` (medium, about 15,048 tokens): token cap reached.
- Area `(root)` (medium, about 6,829 tokens): token cap reached.
- Area `evals` (medium, about 11,381 tokens): token cap reached.
- Area `runs/docs-answerability-2/security-probes` (medium, about 4,916 tokens): after the cap.
- Area `runs` (medium, about 21,719 tokens): token cap reached.
- Area `tools` (medium, about 9,209 tokens): token cap reached.
- Area `runs/docs-retrieval#1` (low, about 58,355 tokens): token cap reached.
- Area `runs/docs-answerability-2#1` (low, about 57,227 tokens): token cap reached.
- Area `runs/docs-answerability-2#2` (low, about 56,959 tokens): token cap reached.
- Area `docs` (low, about 19,258 tokens): token cap reached.
- Area `intents` (low, about 12,738 tokens): token cap reached.
- Area `prompts` (low, about 136 tokens): after the cap.
- `runs/docs-answerability-2/08-security-review.md`: held back for a possible secret (hard-coded password); the owner decides.
- `tests/test_judge.py`: held back for a possible secret (hard-coded password); the owner decides.
- 6 file(s) vendored, binary, lock or minified.

## Tests and CI

Commands detected from manifests: test `pytest`; lint `ruff check .`; typecheck `mypy .`. **They were not run by this assessment.**

No CI files found.

## Proposed backlog

Nothing below has been done. Each item is an intent the owner can turn into a Charter; none changes anything until the owner picks it.

- **Intent (F-01-1, P1):** Fix the issue at `.claude/agents/release-manager.md:93`: Approval verification is limited to Tier 3, so a Tier 1/2 slice containing a send, destructive operation, deployment, or safety-control change can pass without validating its mandatory approval. Require approval verification for every applicable action regardless of release tier. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-2, P1):** Fix the issue at `.claude/agents/production-verification.md:101`: A failed production check automatically triggers a destructive rollback without pausing for direct human approval, contrary to the repository’s hard-stop rule. Require explicit in-session approval for the specific rollback before execution. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-3, P1):** Fix the issue at `.claude/agents/on-call-engineer.md:63`: During an incident, the agent may execute production-changing actions based solely on prior runbook authorization rather than obtaining the required direct human approval. Require approval for each production mutation and treat the runbook as instructions, not authorization. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-4, P1):** Fix the issue at `.claude/agents/on-call-engineer.md:71`: The agent is instructed to auto-execute rollback after detecting a regression, bypassing the mandatory human hard stop for destructive shared-state changes. Replace auto-execution with a specific approval request followed by an audited rollback. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-5, P1):** Fix the issue at `.claude/agents/sre.md:95`: The role treats a runbook as capable of pre-authorizing future production mutations, allowing incident actions without direct approval in the driving session. Require in-session approval for each destructive or external-effect mitigation. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-6, P1):** Fix the issue at `.claude/agents/cloud-deployment.md:4`: The role cannot invoke the required Azure skills, run deployment commands, or open the promised pull request because its enforced tool boundary contains neither `Skill` nor `Bash`; every cloud-deployment run therefore stops before its core work. Add the narrowly scoped skill/execution capability required by the workflow while retaining the approval gate. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-7, P1):** Fix the issue at `.claude/agents/cloud-deployment.md:53`: The prescribed installation executes mutable upstream skill code through an unpinned `npx skills add` command. A changed or compromised upstream repository would run with deployment privileges. Pin an audited commit or immutable package digest and verify it before installation. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-8, P1):** Fix the issue at `.claude/agents/production-verification.md:4`: The role has no `Skill`, shell, or live-environment tool, so it cannot invoke `azure-diagnostics`, query Azure, or execute the rollback that its required outputs promise. Grant narrowly scoped read-only diagnostic access plus separately approval-gated rollback execution. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-9, P1):** Fix the issue at `.claude/agents/on-call-engineer.md:4`: The on-call role has no observability or command tool, so it cannot inspect live logs, metrics, traces, execute an approved mitigation, or perform rollback during an incident. Add explicit least-privilege diagnostic tools and a separately gated mutation mechanism. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-12, P1):** Fix the issue at `.claude/agents/qa-evidence.md:133`: QA is both declared independent and instructed to land tests into the implementation under review. This mutates the reviewed tree after the recorded implementation SHA and lets the reviewer change the evidence it relies on. QA should only report the required regression test and hand it back to an engineer, then re-review the new commit. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-13, P1):** Fix the issue at `.claude/agents/security-privacy.md:4`: The security reviewer processes potentially adversarial diffs while holding unrestricted `Bash`, `Write`, and `Edit`, with no write-scope hook despite explicitly not owning code changes. Prompt injection in reviewed content can therefore cause repository mutation or command execution. Scope writes to the review artefact and replace unrestricted shell access with read-only, allow-listed checks. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-14, P1):** Fix the issue at `.claude/agents/aveto-answerability-judge.md:15`: Retrieved documentation is untrusted model input, but the judge prompt never tells the model to ignore instructions embedded in questions or passages. A passage containing prompt-injection text can redirect the verdict and defeat answerability gating. Delimit inputs, state that their contents are data only, and add adversarial injection evals. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-15, P1):** Fix the issue at `.claude/agents/customer-success.md:58`: Live customer data is written into committed `runs/` artefacts with account context and explicit at-risk-account reporting, but no redaction or pseudonymization requirement exists. Running this role against real customers can publish identities, renewal risk, ticket history, or QBR details. Store only opaque account IDs and aggregated/redacted evidence; keep raw customer data outside the repository. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-16, P1):** Fix the issue at `.claude/agents/customer-support.md:50`: The per-issue artefact consumes account context and records the resolution and customer-facing reply in `runs/`, without prohibiting raw PII, credentials, or ticket content from being committed. Require redacted inputs/outputs, opaque ticket IDs, and external storage for raw account data. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-1, P1):** Fix the issue at `.claude/protocols/APPROVAL_PROTOCOL.md:40`: Approval responses containing credentials, personal data, or confidential context are copied verbatim into the durable repository artefact, causing disclosure when runs are committed publicly. Store only the explicit decision and a redacted excerpt; keep any sensitive original in protected storage. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-2, P1):** Fix the issue at `.claude/protocols/HANDOFF_CHECK.md:10`: The model-based validator consumes stage-produced artefacts without any instruction/data boundary or tool restriction. An artefact containing prompt-injection instructions can redirect the validator, fabricate a pass, or invoke any tools it is offered. Use deterministic envelope checks where possible and run any model check tool-free with explicitly delimited, untrusted input. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-5, P1):** Fix the issue at `.claude/protocols/RUN_ECONOMICS.md:29`: The pre-spawn budget uses the last request’s peak context instead of total processed or cost-weighted tokens. A long agentic loop can consume 10–50 times the recorded amount and still pass the budget gate, recreating the account-exhaustion failure this protocol is intended to prevent. Budget against cumulative runtime usage or cost, including cache reads and writes. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-6, P1):** Fix the issue at `.claude/protocols/SLICE_STATE.md:16`: A malformed or missing budget block disables enforcement instead of stopping the spawn. Any accidental edit or adversarial stage output that makes `STATE.md` unparsable bypasses the mandatory pre-spend gate. Make parse failure a hard denial until valid state is restored. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-7, P1):** Fix the issue at `.claude/protocols/RUN_ECONOMICS.md:171`: A wall-clock timeout with no output is classified as an infrastructure interruption and excluded from the retry budget, contradicting `FAILURE_LOOP.md` and permitting an unlimited sequence of timed-out respawns. Count every stage wall-clock timeout as a retry; exempt only interruptions that did not exceed the stage budget. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-02-8, P1):** Fix the issue at `.claude/protocols/TELEMETRY.md:58`: Runtime token accounting omits `cache_read_tokens` and `cache_creation_tokens` even though they are emitted separately. Runs dominated by cached context therefore under-report stage spend, weakening budget and SLO enforcement. Sum all four token categories or use cost-weighted usage consistently. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-04-1, P1):** Fix the issue at `.claude/skills/aveto-judge-seen/SKILL.md:9`: A run ID containing a single quote escapes the shell argument before `seen_payload.py` can validate it, allowing arbitrary commands under the operator’s permissions; replace textual shell interpolation with argument-safe invocation and narrow the allowed-tools pattern. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-05-1, P1):** Fix the issue at `.claude/settings.json:9`: When the next stage exceeds the approved budget, the configured guard merely requests permission to continue, allowing an over-budget spawn despite the mandatory ceiling. Make the guard deny the spawn until the plan is degraded, a stage is dropped, or a new compliant plan is recorded. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-07-1, P1):** Fix the issue at `runs/docs-retrieval-4/06-release-checklist.md:170`: The gate declares the slice internally releasable even though its mandatory crash criterion is explicitly not met; when the owner relies on this verdict to push or merge, a failed slice can advance. Mark it not releasable and return it to the owning stage, or obtain a direct human amendment to the intent and rerun the gate. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-08-1, P1):** Fix the issue at `runs/docs-abstention/APPROVAL_RECORD-8.md:11`: Pack v17 widened a write-scope safety control and was installed based on approval relayed from another session, which cannot satisfy the direct human-approval requirement. Trigger: installing commit `ebd6c6e`. Revert that change, obtain the owner’s direct approval in the driving session, record it, and only then reinstall. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-08-2, P1):** Fix the issue at `runs/docs-abstention/SUPPORT_REPLIES.md:59`: The ten-file pack upgrade, including the write-scope guard change, landed after the recorded Security Review and Release Gate ranges, so the final branch’s safety-control change was never reviewed or gated. Trigger: treating the closed slice or final branch as gate-covered. Run adversarial Security and the Release Gate against the final commit, or remove the late pack upgrade. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-08-3, P1):** Fix the issue at `runs/docs-abstention/STATE.md:109`: The intent explicitly bound Security to adversarial depth for INV-4, but the Orchestrator lowered it to standard without a human decision recorded in the owner’s words. Trigger: running or accepting the standard-depth review as satisfying the named Security stage. Obtain explicit owner approval for the downgrade or rerun Security at adversarial depth. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-09-1, P1):** Fix the issue at `runs/docs-answerability-2/SUPPORT_REPLIES.md:41`: A support session deleted a permission/safety-control file based on an owner instruction received outside the driving session, although `APPROVAL_RECORD-9.md:10` explicitly left S6’s disposition unapproved. This bypasses the hard approval boundary. Record the breach and require a direct decision in the driving session before treating S6 as resolved. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-12-1, P1):** Fix the issue at `runs/docs-retrieval-2/01-scope.md:92`: The scope silently extends approvals explicitly limited to `docs-retrieval-2` across the newly created `docs-retrieval-2-proof` slice. This triggers when slice B relies on those approvals, violating the hard-stop rule against inferring approval scope. Obtain and record the owner’s direct approval naming slice B before using the changed safety control there. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-13-1, P1):** Fix the issue at `tests/test_judge_seen_skill.py:117`: The injection test bypasses the skill’s shell wrapper by passing the hostile value directly as an argv element. A run ID containing a single quote can escape the wrapper’s `'$ARGUMENTS'` quoting without this test failing. Exercise the actual command template with a single-quote payload and assert no command executes. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-14-1, P1):** Fix the issue at `runs/docs-retrieval-3/03-implementation.md:6`: The implementation fetched an unapproved third repository file outside `ingest`; this triggers when performing the tokenizer open check and violates the owner’s exact two-file authorization and INV-5’s ingest-only, hash-pinned download boundary. Fix by relying on approved metadata, or obtain new approval and pin/hash the file through `ingest`. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-15-1, P1):** Fix the issue at `aveto_support/judge.py:192`: A symlinked `.aveto-judge` directory is followed, so `judge-input` or cleanup can read and delete `reply.txt` outside the transport directory. This triggers when `.aveto-judge` points to another directory. Reject a symlinked transport directory and use no-follow directory-relative operations. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-15-2, P1):** Fix the issue at `aveto_support/evaluate.py:71`: Duplicate evaluation IDs are accepted and scored repeatedly, allowing duplicated hits to inflate the 80% release gate; judge evaluation also collapses different questions with the same ID into one result. Reject every repeated ID while loading the eval set. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-15-3, P1):** Fix the issue at `aveto_support/ingest.py:408`: The archive cap applies only to compressed bytes; each Markdown member is then read into memory without a per-member or aggregate uncompressed-size limit. A small highly compressed configured repository can exhaust memory during ingest. Enforce member-count, member-size, and total-uncompressed-size limits and decode incrementally. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.

**Recorded and deferred** (below P1; filing them is the owner's call):
- F-01-10 (P2) `.claude/agents/post-launch-learning.md:68`: Slice close-out requires running a Node analytics generator, but the enforced tool boundary excludes `Bash`, so analytics cannot be regenerated and the mandatory close-out check cannot complete. Add a narrowly scoped execution tool or delegate this command to a role that has one.
- F-01-11 (P2) `.claude/agents/software-architect.md:121`: Model-bearing slices require executing a throwaway pilot, but this role has only read/write/search tools and explicitly may use no others, making the mandatory pre-implementation pilot impossible. Delegate the pilot to an execution-capable role or provide a constrained runner after rule-5 approval.
- F-01-17 (P2) `.claude/agents/market-researcher.md:86`: Discovery artefacts are required to reproduce interview quotes and review excerpts, but the role has no consent, confidentiality, or redaction rule. Internal interviews or support tickets can therefore leak personal or confidential text into the repository. Require consent-aware paraphrasing/redaction and opaque source IDs for non-public evidence.
- F-02-3 (P2) `.claude/protocols/MODEL_ROUTING.md:59`: Tier-1 routing lowers gates to medium effort even though the same protocol says gates never drop below high. Every Tier-1 QA, Security, or Release gate therefore runs below the declared minimum. Keep gate effort at high for every tier.
- F-02-4 (P2) `.claude/protocols/MODEL_ROUTING.md:72`: A failed Tier-3 Architecture, Security, or Release stage already runs on the highest documented model class, so its mandatory final retry cannot run “one model class higher.” Define saturation behavior, such as retaining Opus while increasing effort or escalating directly to the human.
- F-02-9 (P2) `.claude/protocols/APPROVAL_PROTOCOL.md:47`: A denied approval stops the slice, but the state schema has no cancelled or denied terminal status; `done` is reserved for landed slices. Denied slices consequently remain blocked forever in durable state and inventory. Add a terminal `cancelled`/`denied` status and specify the transition.
- F-03-1 (P2) `.agentic/PROJECT_CONTEXT.md:78`: The project context falsely says no generative model is used anywhere; this triggers incorrect privacy and approval decisions because the operator-run judge sends questions, passages, and session context to Anthropic. Scope the claim to the Python program and document the judge workflow.
- F-03-2 (P2) `.agentic/CURRENT_MVP_STATUS.md:55`: The documented `eval` exit condition is wrong: unanswerable questions never control the exit status, and even `--verdicts` leaves the exit code tied to the retrieval gate. Change this to say only answerable retrieval accuracy is gated.
- F-03-3 (P2) `.agentic/SAFETY_INVARIANTS.md:63`: INV-4 claims unjudged retrieval can never print verdict-like lines, but a question containing newlines is echoed without normalization and can inject `no confident match` or `Deciding signal:` at line start. Normalize/reject control characters before rendering, or narrow the invariant to exclude echoed input.
- F-03-4 (P3) `.agentic/LOCAL_COMMANDS.md:37`: The model-test instructions claim the WordPiece test fails until a fixture is added, but that fixture is already present; this sends operators toward the wrong remediation. Remove the stale warning and identify the currently failing sample-derivation test instead.
- F-07-2 (P2) `runs/docs-retrieval-4/06-release-checklist.md:18`: The Release Manager did not perform the required immutable-bar comparison and proceeded despite admitting that an intervening commit could have changed the bar; this permits a post-result bar edit to pass unnoticed. Require a diff or committed-content hash against the pre-QA revision and fail closed if it cannot be obtained.
- F-07-3 (P2) `runs/docs-retrieval-4/06-qa-result.md:42`: QA omitted the planned INV-1 through INV-3 verification but the release checklist later marks the safety-invariant gate complete; a posting or grounding regression could therefore advance without the required evidence. Walk and record every invariant, or explicitly justify each inapplicable invariant before rerunning the verdict.
- F-08-4 (P2) `runs/docs-abstention/STATE.md:24`: Durable state marks Freeze—and the following Label review and Scoring rows—as `pending` even though the slice is closed and the owner explicitly skipped those stages. Trigger: a cold resume or status reader interprets them as work still awaiting execution. Mark all three `skipped/not run`, with the failed precondition and APPROVAL_RECORD-6 as the reason.
- F-08-5 (P2) `runs/docs-abstention/06-release-checklist.md:108`: The checklist says no end-to-end figure was reported, but `03-implementation.md:14-19` reports end-to-end top-5/top-1 figures for every seen set. Trigger: downstream planning or status work relies on this checklist and discards existing diagnostic evidence. Change the claim to “no fifth-set/held-out end-to-end figure” and retain the seen-set diagnostics.
- F-09-2 (P2) `runs/docs-answerability-2/trace.json:55`: The machine-readable trace dates approvals 5–7 as 2026-10-13, while each corresponding approval record says the owner typed it on 2026-10-12. Any audit generated from the trace therefore reports an incorrect approval chronology. Correct `requestedAt` and `decidedAt` for these three entries from their source records.
- F-09-3 (P2) `runs/docs-answerability-2/trace.json:134`: The tier-3 gate catch says six items were unmet but records only release approval, change-request approval, vendor/DPA risk, and governance gates. It omits the recorded rollback-rehearsal, monitoring-threshold, and final-tree-regression failures, so generated gate reporting loses material release conditions. Replace the summary with the six conditions recorded in `15-close-out.md:35`.
- F-09-4 (P2) `runs/docs-answerability-2/15-close-out.md:97`: The final close-out still projects total spend as about 2,613k because later stages were “not yet” recorded, while final durable state and trace report 2,773k. Using the close-out for retrospectives understates spend and plan overrun by about 160k. Reconcile its cost and lesson calculations with the finalized trace.
- F-09-5 (P2) `runs/docs-answerability-2/STATE.md:57`: Durable state still says the ruff failure must be settled, despite the same file recording that it was fixed and owner-acknowledged. A resumed run can incorrectly reopen a completed gate or modify frozen evidence again. Remove the obsolete note or mark it resolved with the fix commit.
- F-10-1 (P2) `runs/docs-abstention/02-baseline-sweep.py:140`: The combined sweep uses logical OR, although the scope requires the combined “threshold AND margin” rule. Whenever only one signal falls below its cutoff, the script incorrectly counts an abstention. Regenerate the combined results using logical AND, or obtain an approved scope change to OR before relying on them.
- F-10-2 (P2) `runs/docs-abstention/02-baseline-sweep.py:363`: The leave-one-set-out check does not evaluate the required single chosen setting: it selects a new best threshold/margin for every held-out set. This can declare robustness even when no single deployable setting clears every fold. Select the setting once using the preregistered rule and evaluate that same cell across all four folds, then regenerate the LOSO evidence.
- F-10-3 (P3) `runs/docs-abstention/02-baseline.md:30`: The report identifies the same `t=0.40` row as both the always-abstain and never-abstain extremes. That row is only never-abstain (`0/20` abstentions), so consumers following this summary receive a false baseline description. Name `t=0.40` only as never-abstain and identify the actual always-abstain rows separately.
- F-11-1 (P2) `runs/docs-retrieval-3-proof/02-qa-result.md:9`: The sole gating run terminated with exit 134, but the slice records the gate as passed. This violates fail-closed gate handling whenever evaluation crashes after printing a score. Treat the run as failed; fix the teardown crash, then validate using a fresh held-out set before claiming the gate was met.
- F-11-2 (P2) `runs/docs-retrieval-3-proof/00-slice-plan.md:19`: The committed gate labels were materially changed after the independent label review, so the exact set scored was never reviewed under the required fresh-QA process. This triggers whenever the committed set is used as held-out proof. Withdraw the gate claim or freeze the labeling policy and independently review an exact fresh set before scoring it.
- F-11-3 (P2) `runs/docs-retrieval-3-proof/STATE.md:24`: Durable state marks Post-Launch as done even though the close-out says Post-Launch did not run. Status/resume or audit consumers will therefore treat a skipped stage as completed. Record it as `not run — owner’s decision`, consistent with the Security and Release rows.
- F-12-2 (P2) `runs/docs-retrieval-2/STATE.md:72`: The durable state contains completed proof results followed by obsolete instructions to create and run that proof slice. A resumed agent could commit another held-out set or score again, violating the required single held-out run. Replace the stale instructions with the failed-gate escalation and update the current stage/timestamp.
- F-12-3 (P2) `runs/docs-retrieval-2/02-tech-spec.md:270`: The Architect exceeded the Engineering Manager’s file cap without returning for the required re-split: applying the approved invariant edit makes 14 counted files, and the two additional ADR edits make 16, while Scope allowed at most 15 and required escalation above the cap. Record all touched files and obtain an Engineering Manager exception or re-split before freezing.
- F-13-2 (P2) `tests/test_judge_seen_skill.py:199`: The model test always compares a newly derived sample-only key against the committed key after gate-set rows were appended, so `pytest -m model` fails even when derivation is correct. Compare only the original sample portion or generate the expected key including the appended set.
- F-13-3 (P2) `tests/test_ingest.py:613`: The tests named as proving offline operation with cached models never load either cached model: both ingestion and retrieval inject fake adapters. Network or loading regressions in the real cached embedder/reranker path therefore pass. Add model-marked tests that populate the verified cache and invoke `main` without injected adapters.
- F-13-4 (P2) `tests/conftest.py:31`: The claimed default-suite network block covers only `connect`, `create_connection`, and DNS lookup. Direct-IP traffic through `connect_ex`, UDP `sendto`, or a spawned client bypasses it, so an accidental network regression can pass. Use a socket-denial fixture that blocks socket creation/all connection methods and constrain network-capable subprocesses.
- F-14-2 (P2) `runs/docs-retrieval-3/STATE.md:68`: The durable trace reports zero total tokens and tool calls despite three populated stage rows, corrupting run-cost and audit summaries. Replace the totals with 5.792M processed tokens, 314k peak-context spend, and 109 tool calls.
- F-15-4 (P2) `aveto_support/judge.py:115`: An included Git filename containing a newline can inject forged judge-payload boundary lines because the path is interpolated verbatim while marker validation examines only passage text. Reject control/newline characters in archive paths or safely encode all payload metadata before interpolation.
- F-15-5 (P2) `aveto_support/ingest.py:472`: Ingest succeeds and writes an unusable index when all included files are empty, heading-only, or skipped as non-UTF-8. The condition produces only a warning, while retrieval later rejects the index for having no passages. Fail ingest before model loading or index writing when `split` is empty.
- F-15-6 (P2) `aveto_support/index.py:174`: A fenced-code line beginning with the opening delimiter is treated as a closing fence even when non-whitespace follows it. Valid content such as `````python`` inside an existing backtick fence therefore exposes later code headings to the section parser and corrupts passage boundaries. Require a closing fence to contain only the delimiter followed by optional spaces or tabs. ¦ evidence: `re.match(r"^ {0,3}" + re.escape(char) + "{" + str(size) + ",}", line)` is not anchored and imposes no trailing-whitespace requirement.

## Method and limits

- Files were mapped and tiered by a script from names, manifests and git history; reviewers read areas in order of risk until the cap.
- Reviewers worked in a copy with write tools, pushes and secret reads denied; the read-only check above is the evidence, not the instruction.
- Findings are from reading. None was reproduced unless its evidence says so.
- Recall and precision of this reviewer are reported in the calibration record, not here; a repo's report is only as good as that record.
