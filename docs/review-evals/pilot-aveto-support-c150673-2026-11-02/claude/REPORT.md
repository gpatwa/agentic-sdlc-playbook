# Assessment report: aveto-support-c150673

**Assessed against Aveto's gates on 2026-11-03. This is an assessment, not a certification.** It records what the reviewers found in the parts listed below. It does not say the code is secure or compliant, and a finding's absence is not evidence of safety.

|  |  |
|---|---|
| Commit | `32c74fcd218daef9c931776c918e79fa34e0729d` |
| Reviewers | claude (anthropic) |
| Independent second reviewer | **no**: one model family reviewed this. Treat it as a first pass. |
| Built under Aveto | yes: 0 Charter record(s), 8 run folder(s) |
| Read-only check | passed: the target's HEAD and working tree were unchanged, and the review copy differed from the commit only by the recorded removals |
| Source reviewed | about 393,806 of 678,400 reviewable tokens (estimate: bytes / 4) |

## Summary

94 finding(s): 0 P0, 5 P1, 37 P2, 52 P3, 0 note. 94 are still open; the owner sets each disposition.

## Risk map

| Tier | Files | Approx. tokens |
|---|---|---|
| high | 47 | 69,507 |
| medium | 67 | 169,781 |
| low | 308 | 454,421 |

High-risk files (47): `.agentic/CURRENT_MVP_STATUS.md`, `.agentic/LOCAL_COMMANDS.md`, `.agentic/PROJECT_CONTEXT.md`, `.agentic/SAFETY_INVARIANTS.md`, `.claude/agentic.config.json`, `.claude/agents/ai-engineer.md`, `.claude/agents/ai-governance.md`, `.claude/agents/analytics-engineer.md`, `.claude/agents/aveto-answerability-judge.md`, `.claude/agents/backend-architect.md`, `.claude/agents/cloud-deployment.md`, `.claude/agents/compliance-reviewer.md`, `.claude/agents/customer-success.md`, `.claude/agents/customer-support.md`, `.claude/agents/data-analyst.md`, `.claude/agents/data-governance.md`, `.claude/agents/engineering-manager.md`, `.claude/agents/finops.md`, `.claude/agents/frontend-developer.md`, `.claude/agents/market-researcher.md`, `.claude/agents/ml-engineer.md`, `.claude/agents/on-call-engineer.md`, `.claude/agents/orchestrator.md`, `.claude/agents/post-launch-learning.md`, `.claude/agents/product-manager.md`, and 22 more (see `map.json`).

## Findings

### P1

**F-01-1** · `.claude/agents/sre.md:95` · claude · open

The SRE agent decides which production mitigations are pre-authorised, and On-Call executes them without asking anyone. No brief requires a human to approve the pre-authorised list. This is a self-approval loop for destructive or external-effect production actions. It conflicts with AGENTS.md rule 1 ("Never self-approve, never infer approval"). It triggers whenever the SRE writes a runbook with an "auto-remediate" step and On-Call matches an incident to it.

*Evidence:* sre.md:95-99 `A runbook MAY pre-authorise specific, named mitigation steps; anything outside the runbook needs in-the-moment approval.` sre.md:65-66 `What pages a human vs. opens a ticket vs. auto-remediates.` on-call-engineer.md:63-64 `executed directly if it matches a pre-authorized runbook step` on-call-engineer.md:87-89 `New pre-authorized runbook steps (SRE owns; ...)`

**F-01-2** · `.claude/agents/production-verification.md:101` · claude · open

A "no-go" runs the rollback immediately and skips human approval. The stated basis is that the tech spec review already approved the rollback. That infers approval from a different, earlier action. AGENTS.md rule 1 says approval is never inferred and counts only when given directly in the session driving the run. A rollback is a production-changing action. It triggers on any post-deploy no-go.

*Evidence:* production-verification.md:101-106 `A no-go triggers rollback immediately; it does not wait for a human approval round-trip, because the rollback plan was already human-approved when the tech spec was reviewed (docs/HUMAN_APPROVAL_RULES.md rule 3 covers the deploy and the pre-agreed rollback together...)`

**F-04-1** · `.claude/skills/aveto-judge-seen/SKILL.md:9` · claude · open

The raw `$ARGUMENTS` is placed inside single quotes in a shell command, so an argument containing `'` closes the quote and appends its own commands. The id check in `seen_payload.py` (`ID_RE`, the newline check) runs only after the shell has parsed the line, so it cannot stop this. An argument such as `r001'; <cmd>; echo '` runs `<cmd>` with the user's privileges. Line 7 also pre-approves `Bash(uv run ... python ... seen_payload.py *)` with trailing and inner `*` wildcards, so the injected command may run without a permission prompt. Fix: do not interpolate free text into a shell line. Have the script read the id from a safe channel, or validate the id before substitution. Anchor `allowed-tools` to an exact argument shape instead of `*`.

*Evidence:* `` !`uv run -q --project "${CLAUDE_PROJECT_DIR}" python "${CLAUDE_SKILL_DIR}/seen_payload.py" '$ARGUMENTS'` `` and `allowed-tools: Bash(uv run -q --project * python ${CLAUDE_SKILL_DIR}/seen_payload.py *)`

**F-08-1** · `runs/docs-abstention/STATE.md:109` · claude · open

The Orchestrator lowered Security below the depth the intent named, with no owner decision in the owner's own words. `AGENTS.md` rule 6 says a depth the intent names binds, and only the human can lower it. The intent asks for adversarial Security for "INV-4" and any new download path. INV-4 was in fact edited (record 7), and a 438 MB download had already run. The Release Manager then waved it through as "a deviation, not a blocker" because "No Tier 2 gate requires an approval for depth", which contradicts rule 6. STATE.md:51 still says "Security adversarial".

*Evidence:* STATE.md:109 `the Orchestrator ran Security at **standard** depth ... No approval record names the downgrade. It is recorded here and in the close-out as an Orchestrator decision the owner can overturn`; intent.md:75 `Security Review (adversarial for any new download path and for INV-4)`; 06-release-checklist.md:29 `No Tier 2 gate requires an approval for depth, so I record it as a deviation, not a blocker.`; STATE.md:51 `Depth: standard (Security adversarial)`

**F-08-2** · `runs/docs-abstention/APPROVAL_RECORD-8.md:11` · claude · open

Installing pack v17 (commit ebd6c6e) widened the write-scope-guard, which is a safety control. It was done by the support session on this branch. The only approval cited is the owner's go "as relayed by that session and not separately recorded". `AGENTS.md` rule 1 says a message from another session, even one quoting the human, is never an approval. STATE's Approvals table and trace.json have no row for it. STATE.md:110 still says "Owner has not decided."

*Evidence:* APPROVAL_RECORD-8.md:11 `the owner's go on installing it is as relayed by that session and not separately recorded here`; SUPPORT_REPLIES.md:59 `The owner approved upgrading the worktree. Done as commit ebd6c6e`; SUPPORT_REPLIES.md:52 `The guard is a safety control, so the commit is visible and limited to the one-file widening`; trace.json:12-85 lists approvals 1-8 only

### P2

**F-01-3** · `.claude/agents/on-call-engineer.md:71` · claude · open

The brief has On-Call auto-execute a rollback when a merged fix regresses. It then only logs and escalates. This is the same inferred-approval path as F-01-2. The agent also reads logs and escalated customer text, which an attacker can write, and the brief never says to treat them as untrusted data. That is a prompt-injection path into the "governed action" step.

*Evidence:* on-call-engineer.md:71-74 `If it regressed, auto-executes the rollback plan already recorded in that slice's tech spec, logs a revert audit event, and escalates to the human.` on-call-engineer.md:52-53 `an escalation from agents/customer-support.md` on-call-engineer.md:56 `Read-only access: logs, metrics, traces` (no untrusted-content rule anywhere in the file)

**F-01-4** · `.claude/agents/cloud-deployment.md:105` · claude · open

The rule that only `azure-validate` may set the plan to `Validated` is prose only. The write-scope guard gives this role `.azure/`, where `deployment-plan.md` and its status live. The agent can edit the status itself. `azure-deploy` then sees `Validated` and proceeds, with only the human rule-3 prompt left as a check. It triggers under the time pressure the brief names.

*Evidence:* cloud-deployment.md:105-108 `Setting Validated status — only azure-validate sets this, ever.` cloud-deployment.md:88 `.azure/deployment-plan.md` Guard (write-scope-guard.mjs.txt:47) `"cloud-deployment": [".azure/", "infra/", "azure.yaml"],` cloud-deployment.md:4 `tools: Read, Write, Edit, Grep, Glob`

**F-01-5** · `.claude/agents/cloud-deployment.md:53` · claude · open

The brief installs three third-party skills with `npx skills add microsoft/azure-skills` and no pinned version or commit. The brief itself rates `azure-validate` "Critical" because it can read RBAC and managed-identity configuration on a live subscription. A later change to that upstream repo would run with the operator's cloud credentials. The same unpinned install is in production-verification.md:50.

*Evidence:* cloud-deployment.md:53-57 `(github.com/microsoft/azure-skills, installed via npx skills add microsoft/azure-skills --skill azure-prepare --skill azure-validate --skill azure-deploy)` cloud-deployment.md:130-135 `carries a **Critical** third-party security rating` production-verification.md:50-51 `npx skills add microsoft/azure-skills --skill azure-diagnostics --skill azure-reliability`

**F-01-6** · `.claude/agents/cloud-deployment.md:4` · claude · open

The brief cannot run with its declared tools, and the harness gives no safe fallback. It must invoke skills and run `azd up`, `terraform apply` and `az deployment`. The tool list has no Skill and no Bash. The operating rules say to hand back when a tool is missing. The only way to finish is the "inlined into a general-purpose agent" path, which has full tools. There the write-scope guard covers only Write and Edit, so a deploy role runs unrestricted. The same gap is in production-verification.md:4 (`azure-diagnostics`, `azure-reliability`, "rollback executed") and on-call-engineer.md:4 (execute runbook steps, auto-rollback).

*Evidence:* cloud-deployment.md:4 `tools: Read, Write, Edit, Grep, Glob` cloud-deployment.md:69-70 `executes azd up / terraform apply / az deployment` cloud-deployment.md:24 `If a task appears to need a tool outside that list, stop and hand back` cloud-deployment.md:24 `when it is **inlined** into a general-purpose agent it cannot [enforce]` production-verification.md:76-77 `the tech spec's rollback plan, executed`

**F-01-7** · `.claude/agents/post-launch-learning.md:68` · claude · open

A required close-out step cannot be done with the tool list. The agent must run `node <playbook>/execution/analyze.mjs .` to regenerate `runs/ANALYTICS.md` and `runs/dashboard.html`. It has no Bash. Its own quality bar says stale telemetry must never be left. In practice it either reports stale analytics or the stage never completes.

*Evidence:* post-launch-learning.md:4 `tools: Read, Write, Edit, Grep, Glob` post-launch-learning.md:68-71 `regenerate runs/ANALYTICS.md + runs/dashboard.html via node <playbook>/execution/analyze.mjs .` post-launch-learning.md:95-96 `the analytics views were regenerated — pipeline telemetry is never left stale.`

**F-01-8** · `.claude/agents/customer-support.md:57` · claude · open

The role writes per-customer account data, drafted replies and draft-vs-sent diffs into `runs/<slice-id>/`. `runs/` is tracked in git, because `.gitignore` excludes only `node_modules/` and `.azure/*/.env`. The brief has no rule to redact, tokenise or omit customer identifiers or PII in these artefacts. Other roles do have such a rule (backend-architect.md:89-91, analytics-engineer.md:81-84). Customer data would be committed to history. customer-success.md:56-65 has the same gap for account-level notes.

*Evidence:* customer-support.md:57-66 `A filled templates/CUSTOMER_ISSUE_RESOLUTION_TEMPLATE.md per issue ... A drafted reply — cites the real fix...` customer-support.md:91-93 `the diff between drafted and sent is recorded as a real signal` customer-support.md:108-109 only `Never logs or repeats one customer's account details in another customer's context.` .gitignore lines 1 and 7: `node_modules/`, `.azure/*/.env`

**F-01-9** · `.claude/agents/security-privacy.md:4` · claude · open

Four reviewer or "does not modify code" roles have Write, Edit and Bash and no write-scope hook: `qa-evidence`, `security-privacy`, `sre` and `ml-engineer`. The scope guard is attached only to roles without Bash. Their briefs say they don't change code ("QA does not modify code", "Code changes (engineers fix findings)"), but nothing enforces that. The independent Security gate can therefore edit the diff it is approving, or edit `runs/` approval and state files.

*Evidence:* security-privacy.md:4 `tools: Read, Write, Edit, Bash, Grep, Glob` (no `hooks:` block) qa-evidence.md:4 same, and qa-evidence.md:94-95 `QA does not modify code.` security-privacy.md:62 `Code changes (engineers fix findings).` write-scope-guard.mjs.txt:3-6 `Those roles get Read/Write/Edit/Grep/Glob and no Bash`

**F-01-10** · `.claude/agents/release-manager.md:93` · claude · open

The Release Manager confirms a Tier 3 human approval only from artefacts under `runs/`. Every other agent can write those files (guard scope `runs/`, plus the four Bash roles with no guard). The brief does not require the approval record to quote the human's message from the driving session. That is the only valid source under AGENTS.md rule 1. A subagent-written line such as "approved" would satisfy the check.

*Evidence:* release-manager.md:93-99 `The Release Manager confirms: The human was asked the specific question ... The human responded with an unambiguous approval. The approval applies to the specific action...` release-manager.md:56 `Human approvals obtained (with timestamps and approver identity if recorded).` write-scope-guard.mjs.txt:29 `const COMMON = ["runs/"];`

**F-01-11** · `.claude/agents/ai-governance.md:12` · claude · open

The write-scope guard is not shown to fail closed when it can't run. The hook command is bare `node ".../write-scope-guard.mjs" <role>`. Claude Code treats a non-zero exit other than 2 as a non-blocking error and lets the tool call proceed. If `node` is missing, the script is missing or deleted (as in this copy's git status), or it fails to parse, the exit is 127 or 1 and the write is allowed. The guard's header claims "FAILS CLOSED", but that holds only inside its `try`. Every guarded agent has the same line: customer-support, customer-success, orchestrator, release-manager, software-architect, tech-writer and the rest.

*Evidence:* ai-governance.md:10-13 `command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/write-scope-guard.mjs" ai-governance'  timeout: 10` write-scope-guard.mjs.txt:13 `FAILS CLOSED, DELIBERATELY.` Contrast with aveto-answerability-judge.md:11 `exit 2`

**F-01-12** · `.claude/agents/aveto-answerability-judge.md:4` · claude · open

The "no tools" boundary is a denylist and fails open. Its effective tool set is "all tools except" the listed names. `ArtifactComments`, `ArtifactData` and `ArtifactCheck` are not in the list, and neither is any tool added later. Only the `PreToolUse` `*` hook, which is unconditional, stops them. The agent reads untrusted search passages. Without that hook, or if hooks are disabled, an injected passage can reach any unlisted tool. An empty `tools:` allowlist is the safe form.

*Evidence:* aveto-answerability-judge.md:4 `disallowedTools: Agent, Task, Bash, Read, ... Artifact, ... mcp__*` (no `ArtifactComments`/`ArtifactData`/`ArtifactCheck`; no `tools:` line) aveto-answerability-judge.md:11 `echo "aveto-answerability-judge has no tools" >&2; exit 2`

**F-02-1** · `.claude/protocols/MODEL_ROUTING.md:60` · claude · open

Tier 1 routing sets gates to `medium` effort. The same file says gates never drop below `high`. A Tier 1 slice run per Layer 2 therefore runs QA, Security and Release Manager at `medium`, and weakening a gate is a rule 4 human-approval action (`FAILURE_LOOP.md`). Nothing says which statement wins.

*Evidence:* Line 43: "**Gates never drop below `high`.** A cheaper gate that passes a bad slice". Lines 59-61: "**Tier 1** (docs / refactor): drop one class — sonnet for judgment roles, haiku where mechanical. Producers drop to `low` effort; gates stay `medium`."

**F-02-2** · `.claude/protocols/RUN_ECONOMICS.md:77` · claude · open

The §2 budget-check fallback tells the Orchestrator to degrade a stage's depth one tier whenever `spent + estimate > budget`. It has no carve-out for a depth the intent named. §3 and AGENTS.md rule 6 say an intent-named depth binds, and lowering it is the human's decision. An Orchestrator following §2 literally would drop an intent-mandated `adversarial` Security Review.

*Evidence:* Lines 77-79: "**degrade** the stage's depth one tier (§3), **drop** a stage that is not load-bearing, or **stop and ask the human**". Lines 125-127: "**A depth the intent names binds (added 2026-10-09).** … lowering it later … is a stop-and-ask".

**F-02-3** · `.claude/protocols/RUN_ECONOMICS.md:171` · claude · open

An interruption described as "timeout with no output" is classed as infrastructure. Infrastructure interruptions do not consume the failure budget. `FAILURE_LOOP.md` counts a stage that exceeds its wall-clock budget as a failure with category `timeout`, and that failure does count against the retry budget. A hung stage can therefore be re-spawned indefinitely, because infrastructure interruptions have no cap anywhere. This breaks non-negotiable rule 3 (retries are bounded).

*Evidence:* RUN_ECONOMICS.md 170-172: "An **infrastructure** interruption (usage limit, transport error, timeout with no output) is **not** a retry and does not consume the `FAILURE_LOOP.md` budget". FAILURE_LOOP.md 20-21: "a hung stage is a failure event, not something to wait out. Stop it, record it, count it against the retry budget."

**F-03-1** · `.agentic/PROJECT_CONTEXT.md:78` · claude · open

The context file, which `AGENTS.md` tells every session to read first, says no generative model is used anywhere. The status and invariants files say the opposite: a `claude-sonnet-5-5` judge is wired in and sends data to Anthropic. A fresh Orchestrator or Security role that trusts this file will under-classify the slice, for example by missing approval rule 5 (real model/client) or the new data processor. Lines 49 and 73 are stale in the same way: they say `retrieve` involves no generative model and that slice 2 is "in progress", but status reports `docs-answerability-2` as closed.

*Evidence:* `No generative model is used anywhere. One small local embedding model` (line 78); `rank files and passages ... No generative model is involved.` (line 49); `The second slice (\`docs-retrieval-2\`, in progress)` (line 73); versus CURRENT_MVP_STATUS.md:21-23 `the \`aveto-answerability-judge\` subagent (\`claude-sonnet-5-5\`, no tools offered)`

**F-03-2** · `.agentic/SAFETY_INVARIANTS.md:114` · claude · open

INV-5 states Anthropic is "approved as data processor". The status file says Anthropic's DPA, account terms, retention and training use are UNKNOWN and deferred, and that the release action is not approved. INV-5 also lists personal data the operator's session sends: the user's email, git user name and organisation ID. Anyone reading the invariant gets false assurance that the processor was vetted. Each judge run sends that data, with the question and passages, to a processor whose terms are unrecorded. The approval record may cover the processor choice and not the terms, but neither file says so.

*Evidence:* `Anthropic, approved as data processor in \`runs/docs-answerability-2/APPROVAL_RECORD-3.md\`` (SAFETY_INVARIANTS.md:114-115); `the user's email address; the git branch, git user name, working-tree status` (lines 123-125); `Anthropic's DPA, account terms, retention and training use are UNKNOWN, deferred.` (CURRENT_MVP_STATUS.md:78-79)

**F-04-2** · `.claude/skills/aveto-judge-seen/SKILL.md:4` · claude · open

The skill is described as "Eval-only", but its front matter has no `disable-model-invocation: true`, so the model can invoke it on its own. A model-invoked call supplies the `$ARGUMENTS` that reach the shell in finding 1, and it triggers a forked judge subagent, which spends budget and was meant to be operator-triggered. The sibling `aveto-judge` skill sets `disable-model-invocation: true` and has the rule "Never on your own". Fix: add `disable-model-invocation: true` to this skill.

*Evidence:* Front matter lines 1-8: `name`, `description: Eval-only...`, `context: fork`, `agent: aveto-answerability-judge`, `background: false`, `allowed-tools: ...`. There is no `disable-model-invocation` key. Compare `.claude/skills/aveto-judge/SKILL.md:4`: `disable-model-invocation: true`.

**F-06-1** · `runs/docs-answerability-2/judge-check/stage7/diffs.md:30` · claude · open

Two independent questions about the approval rules got `NOT_ANSWERABLE` because the judge's passages did not contain the "Always require approval" list. These are r003/a07 (`stage5/diffs.md:10`) and r124/g24 (`stage7/diffs.md:30`). `sample-eval.toml:19` says the answer sits in `docs/HUMAN_APPROVAL_RULES.md` under "'Always require approval'". The passage selection is dropping the most safety-relevant section, so any answerability gate will wrongly refuse "what needs my approval" questions. The report leaves this unexplained: the seven misses across the two stages carry no root-cause note. Fix: check why the retrieval ranking omits that section for these queries, and re-run a07 and g24 once it is fixed.

*Evidence:* `Q1 NOT_ANSWERABLE Passages cover asking for approval and agent roles, but never list autonomous actions.` (`stage7/diffs.md:30`); `Q1 NOT_ANSWERABLE Passages describe how to ask approval, not which actions require it.` (`stage5/diffs.md:10`)

**F-06-2** · `runs/docs-answerability-2/judge-check/stage7/diffs.md:10` · claude · open

The judge returns `NOT_ANSWERABLE` when the docs answer with a documented "no". Three of the seven misses show this: g09, g10 and a15. In each, the judge's own reason states the answer. A user asking "can it deploy to AWS?" or "how do I uninstall?" would be told the docs cannot answer, when they do say "no, do this instead". The same prompt (`prompt_sha256 24b244d2…`) ran in both stages, so the second stage did not fix it. Fix: change the judge prompt so a passage that states a capability is absent, or gives a manual workaround, counts as `ANSWERABLE`. Re-run g09, g10 and a15 against the changed prompt.

*Evidence:* `Q1 NOT_ANSWERABLE Passages say no scaffolding tool exists; only a manual cp of an example.` (`stage7/diffs.md:10`); `Q1 NOT_ANSWERABLE Passages say no uninstaller exists and revert via git checkout, no removal steps.` (`stage7/diffs.md:19`); `Q1 NOT_ANSWERABLE Passages say AWS is only a named future adapter; no AWS deployment capability exists.` (`stage5/diffs.md:20`)

**F-07-1** · `runs/docs-retrieval-4/06-release-checklist.md:21` · claude · open

The release checklist ticks gates `[x]` on evidence its author says it did not look at. The "bar unchanged" check was done from the git log, not a diff. Per-commit content, the six wording files and the code diff were also not read. The gate plan says missing evidence returns the slice to its owning stage. It also says a bar changed after the run voids the check. No later artefact (`STATE.md`, `07-close-out.md`) records the Orchestrator running the suggested `git diff` to close the gap. The Release Gate therefore passed fail-open on its own admitted limits. Trigger: any commit labelled "STATE" that edited `06-release-gate-plan.md` after 23d233c would go undetected.

*Evidence:* Checklist line 18: "I have no shell and cannot run `git diff 23d233c HEAD -- runs/docs-retrieval-4/06-release-gate-plan.md`"; line 21: "this is not a byte comparison. A change to the plan inside a commit titled 'STATE' cannot be excluded by the log alone"; line 39: "`[x]` One commit per task… I did not inspect the diff of each commit"; line 74: "I did not re-read the six wording files". `06-release-gate-plan.md:38`: "A gate with missing evidence returns the slice to its owning stage." `06-release-gate-plan.md:97`: "a bar changed after the run voids the check." Fix: run the diff and record it, or leave those boxes unticked and return the gate.

**F-07-2** · `runs/docs-retrieval-4/06-release-checklist.md:100` · claude · open

The slice is closed `done` while the owner's intent box 3 is "NOT MET as written". The Release Manager, not the owner, decided it does not block. The gate plan allows the verdict only "if every gate in section 1 holds". Intent criteria belong to the owner. `STATE.md` sets "Closed" and "done" before any owner decision. The checklist itself says the owner "can… overrule me". Trigger: a session resuming from `STATE.md` sees `done` and no open item for the owner. Fix: hold the status at "awaiting owner decision on intent box 3", or record the owner's words accepting the deviation.

*Evidence:* Checklist line 100: "**NOT MET as written.** It is met only in this sense: **not reproduced, with counts.**"; line 123: "The owner can decide that the box is a blocker and overrule me"; line 172: "No gate is failed". `STATE.md:6`: "Current stage: Closed — internally releasable"; `STATE.md:7`: "Status: done". `intent.md:32-36` (box 3): "The shutdown crash is fixed or explained." Gate plan line 88: "if every gate in section 1 holds".

**F-08-3** · `runs/docs-abstention/04-security-review.md:45` · claude · open

The Security Review says `.claude/` is unchanged. That held only for the range ending at 34c23d7. The pack v17 commit ebd6c6e, which changed `.claude/` hooks and agents, and the later README/ARCHITECTURE/status edits landed after the review and were never reviewed. The close-out still cites this review for "Product diff empty" at the final HEAD.

*Evidence:* 04-security-review.md:4 `Range reviewed: 0dfd433 (main) .. HEAD (34c23d7)`; 04-security-review.md:45 `.claude/ (hooks, agents, settings) unchanged`; 07-close-out.md:21 `Product diff empty (04-security-review 1, 3)`; 07-close-out.md:45 `A pack upgrade commit (ebd6c6e) landed mid-slice on this branch`

**F-08-4** · `runs/docs-abstention/06b-stale-text-pass.md:42` · claude · open

Edits went beyond the scope APPROVAL_RECORD-8 approved. The record lists README 49-51 plus the status line, and ARCHITECTURE lines 27, 85-87, 109-112, 132-134, 141-144. The pass also edited README 71-74, ARCHITECTURE L22-23, L39 and L147-148, and added an ADR 0007 pointer after L192. The Tech Writer had labelled L147-148 "(extra, same staleness)" and listed the "Not applied, outside the approved line list" items. The close-out then reports the pass as done "for the approved lines".

*Evidence:* APPROVAL_RECORD-8.md:6 `docs/ARCHITECTURE.md lines 27, 85-87, 109-112, 132-134, 141-144`; 06b:11 `README.md \¦ 71-74 (found by grep, same staleness)`; 06b:42 `L22-23`; 06b:44 `L39`; 06b:49 `L147-148`; 06b:50 `After L192 (Decisions list): added ADR 0007 pointer`; 07-close-out.md:12 `stale text fixed for the approved lines (06b)`

**F-08-5** · `runs/docs-abstention/APPROVAL_RECORD-5.md:5` · claude · open

One blanket "approve all" covered a rule 5 model download and three rule 4 safety-control items. The spec says INV-4 items 4-i and 4-ii are "approved separately", and the owner's own words do not show separate decisions. The 438 MB download ran under this record. The Release Manager admits "I did not see the surfacing message".

*Evidence:* APPROVAL_RECORD-5.md:5 `approve all, including the A1 line`; 02-tech-spec.md:4 `INV-4 (8.1, items 4-i and 4-ii approved separately)`; 02-tech-spec.md:324 `two items, approve each separately`; 06-release-checklist.md:85 `I did not see the surfacing message`

**F-08-6** · `runs/docs-abstention/06-release-checklist.md:38` · claude · open

Gates that were not run are ticked `[x]`. The text itself says nothing was re-run and that this "is not a claim that HEAD's suite passes". The skip of the full-suite/typecheck gate is "approved" by the Release Manager itself, listed as "not owner-approved". Gates fail closed (`AGENTS.md` rule 2), so an unrun gate should stay unchecked. The "n/a by identity" premise also fails once ebd6c6e is in the tree (F-08-2/3).

*Evidence:* 06-release-checklist.md:38 `- [x] Typecheck, targeted tests, full suite, build: **n/a by identity, not re-run.**`; 06-release-checklist.md:45 `- [x] Local regression command: **n/a by identity** ... not re-run.`; 06-release-checklist.md:69 `Full suite / typecheck / build re-run \¦ ... \¦ Release Manager (this document); not owner-approved`

**F-09-1** · `runs/docs-answerability-2/STATE.md:33` · claude · open

The durable stage table has no rows for the work after the tier 3 ruling. The missing rows are the SRE, Compliance and QA spawns, the tier 3 Release Manager verdict (`13-release-checklist-tier3.md`), the close-out (`15`) and the closure (`16`). The only Release Gate verdict row still describes the superseded tier 2 verdict as "GO WITH CONDITIONS (internally releasable, not announced; tier 2 as the intent names it)". The Docs row (line 34) still reads "done, partial" with ADR 0008 and ARCHITECTURE edits "blocked", although the Trace table shows the Architect finished them. A cold resume that reads the stage table (AGENTS.md rule 4) sees a tier 2 gate and unfinished docs, not the tier 3 verdict of record.

*Evidence:* evidence: line 33 `Release Gate verdict (spawn 2 of 2) … **GO WITH CONDITIONS** (internally releasable, not announced; tier 2 as the intent names it)`; line 34 `Docs (stage 10) … done, partial … edits blocked by the write-scope guard`; lines 93-99 of the Trace table list the tier 3 spawns, the Architect docs finish and the close-out, none of which has a Stages row; line 5 `Release tier: 3`.

**F-09-2** · `runs/docs-answerability-2/STATE.md:106` · claude · open

The freeze record lists "the sample key/batch/sample-eval" among the method files whose diff against `bca0e40` must be empty. Line 108 then says key rows were appended after the freeze. The close-out says `test_sample_derivation_reproducible` now fails because the whole key file changed after the freeze. By STATE's own rule ("Any change to a method file voids the freeze") the freeze is voided, or the key must be split into frozen and data parts. Instead `16-slice-closure.md` and the Security and QA claims say "empty diff since bca0e40" and "unchanged since", which cannot hold for the key file as listed.

*Evidence:* evidence: STATE.md:106 `…the sample key/batch/sample-eval, and 02-tech-spec.md`; STATE.md:108 `After the freeze only data is added: the fifth set's files, batch-2.txt and key rows … Any change to a method file voids the freeze`; 15-close-out.md:81 `test_sample_derivation_reproducible compares the whole key file, and the gate rows were appended after the freeze`; 16-slice-closure.md:6 `method frozen at bca0e403… and unchanged since`.

**F-09-3** · `runs/docs-answerability-2/trace.json:131` · claude · open

The tier 3 Release Gate is recorded as `"verdict": "fail"` with six items not met. The Security gate is recorded as `"fail"`, with S5 required-fix still open. Yet STATE.md and the closure file give the outcome as "GO WITH CONDITIONS", "Security … PASS WITH NON-BLOCKING FINDINGS", "Status: done" and "internal release candidate". AGENTS.md rule 2 says a failed gate sends the slice back, never forward. The closure is the owner's decision (record 10), but the trace and STATE give contradictory gate outcomes for the same gates. Any analytics or cold reader gets two opposite answers.

*Evidence:* evidence: trace.json:130-135 `"gate": "Release Gate (tier 3)", "verdict": "fail", "severity": "required-fix", "finding": "Six tier 3 items not met…"`; trace.json:112-117 Security `"verdict": "fail"` for S5; STATE.md:31 `PASS WITH NON-BLOCKING FINDINGS: 0 blocking; S5, S6 required-fix`; STATE.md:6 `**Status:** done`; 16-slice-closure.md:6 `GO WITH CONDITIONS (not cleared to land)`.

**F-11-1** · `runs/docs-retrieval-3-proof/02-qa-result.md:41 (repeated at runs/docs-retrieval-3-proof/03-close-out.md:19)` · claude · open

The "rerank out" total for the four sets is 11, but the per-set rows and the raw eval outputs sum to 9. The row's own totals (56 − 52 = 4 net) are only consistent with 9 out and 5 in. 5 in and 11 out would give −6, not the −4 the verdict relies on. The close-out copies the wrong number as "5 in, 11 out".

*Evidence:* The table row reads `\¦ Four sets together (73 answerable) \¦ 52 (71.2%) \¦ 56 (76.7%) \¦ 5 in \¦ 11 out \¦ \¦`. The per-set rows are fourth `out: f01, f13` (2), dev `a05, a06, a20, a21, a22, a24` (6), heldout `h06` (1), heldout-3 `none` (0), which is 9. The same file's line 59 says "net negative (-4 hits)". Cross-checking runs 1–8: the rrf hits that the rerank loses are f01, f13, a05, a06, a20, a21, a22, a24 and h06, which is 9.

**F-12-1** · `runs/docs-retrieval-2/01-scope.md:92` · claude · open

The scope review widens both rule-4 approvals to cover slice B (`docs-retrieval-2-proof`), but the records limit them to `docs-retrieval-2`. The gate is scored only in slice B. Line 114 tells the Orchestrator to "reference both records rather than re-ask". STATE.md:72 then says slice B is created with "Approvals 1 to 3 referenced", and no new owner approval is recorded. This breaks AGENTS.md rule 1, "never infer approval".

*Evidence:* 01-scope.md:92: "Both approvals are scoped to this work (the two slices together, one gate)." APPROVAL_RECORD-1.md:7: "dropping the unanswerable half of the eval gate for docs-retrieval-2 only". APPROVAL_REQUEST-1.md:23: "This slice's gate only." 01-scope.md:114: "this is my reading; if the Orchestrator disagrees it is a one-line ask to the owner". STATE.md:72: "creates slice B `docs-retrieval-2-proof` (copy of this intent, Approvals 1 to 3 referenced, budget 430k)". Suggested fix: ask the owner for an explicit rule-4 yes that names slice B, and record it.

**F-12-2** · `runs/docs-retrieval-2/APPROVAL_RECORD-2.md:15` · claude · open

The "Clarification" says the owner was told, in a quoted sentence, that the INV-4 test would be retired. That sentence is not in APPROVAL_REQUEST-2.md, the durable request. The Orchestrator added the clarification after the Engineering Manager flagged the gap, so the only evidence that the owner approved retiring a safety-invariant test is the Orchestrator's later claim.

*Evidence:* APPROVAL_RECORD-2.md:15: "The question the owner answered said, verbatim: 'INV-4's first clause (only verbatim passages with provenance, nothing presented as an answer) still holds; the second clause's test would be retired.'" APPROVAL_REQUEST-2.md:9 only says "INV-4's first clause still holds: everything returned is a verbatim passage with provenance…" and names the test in a parenthesis at line 9, never saying it would be retired. Suggested fix: store the exact prompt text shown to the owner in the request file, or get a fresh owner confirmation naming `test_not_confident_returns_no_hits`.

**F-12-3** · `runs/docs-retrieval-2/STATE.md:72` · claude · open

The planned freeze check does not match the freeze scope in the tech spec. The spec freezes `evals/retrieval.toml`, `evals/retrieval-heldout.toml` and `evals/calibration-offtopic.toml`, but the command omits `evals/`, so an edit to a seen set after the freeze would go unnoticed. The command includes `tests`, which the spec says may change after the freeze, so it could fail for no reason. This is the check that makes the single scoring run valid.

*Evidence:* STATE.md:72: "verifies no method file changed (`git diff b3f3fc4 HEAD` over aveto_support tests docs-source.toml pyproject.toml uv.lock)". 02-tech-spec.md:276: the freeze list ends "…`pyproject.toml`, `uv.lock`, and `evals/retrieval.toml`, `evals/retrieval-heldout.toml`, `evals/calibration-offtopic.toml`… Tests and docs may change after the freeze only if the method files above do not." Suggested fix: use the spec's file list, which includes the three `evals/` files and excludes `tests/`.

**F-12-4** · `runs/docs-retrieval-2/STATE.md:72` · claude · open

STATE.md contradicts itself about what happens next. Line 72 starts with the outcome (slice B scored 11 of 16, gate FAILED). It then keeps the old instructions asking the owner to write the held-out set and the Orchestrator to create slice B, both already done. Line 7 still says slice B "starts after the owner commits the third held-out set". Line 11 `Updated` (17:49:56Z) predates the outcome and the 20:59:01Z restatement in APPROVAL_RECORD-3. A cold resume (AGENTS.md rule 4) is told to do finished work and cannot tell the gate failed from the Status line.

*Evidence:* STATE.md:7: "Slice A closed at the freeze; slice B `docs-retrieval-2-proof` starts after the owner commits the third held-out set". STATE.md:8 "Status: done". STATE.md:72: "OUTCOME: … 11 of 16, bar 13, gate FAILED … (Earlier text follows.) … Owner: write and commit the third held-out set … Orchestrator then merges main … creates slice B". STATE.md:11: "Updated: 2026-09-29T17:49:56Z". Suggested fix: replace the Next action with the current state (gate failed, failure loop or escalation per slice B's ESCALATION-1.md), refresh `Updated`, and drop the obsolete steps.

**F-13-1** · `tests/test_ingest.py:205` · claude · open

The path-traversal member (`../escape.md`) is never in the include list, so the include filter drops it whether or not any traversal guard exists. The test would pass if `read_markdown` had no `..` protection. Only the symlink half is genuinely exercised, because `link.md` is in the include list.

*Evidence:* `sneaky = tarfile.TarInfo(f"docs-{COMMIT}/../escape.md")` … `docs, skipped = read_markdown(archive, _src("a.md", "b.txt", "UP.MD", "link.md"))` … `assert [d.path for d in docs] == ["UP.MD", "a.md"]`

**F-14-1** · `runs/docs-retrieval-3/00-slice-plan.md:7` · claude · open

The depth decision rests on a false premise. The plan says nothing here changes a safety control, and the intent leaves its "safety control" Stakes box unticked. But the slice's own A2 is a rule 4 edit to INV-5, which is the egress and model-integrity control. Adversarial depth was ruled out on this basis. The Stakes box (`intent.md:73-75`) is what the plan's depth reasoning should follow, and it is also wrong.

*Evidence:* `00-slice-plan.md:7`: "Adversarial is not earned: nothing here changes auth or a safety control". `intent.md:73-75`: "[ ] Changes auth, permissions, or a safety control / [x] None of the above". `02-approval-request.md:56` and `:60`: "A2 — Approve the exact safety-invariant wording (rule 4)" and "Rule 4: INV-5 is the product's egress and model-integrity control."

**F-14-2** · `runs/docs-retrieval-3/03-implementation.md:6` · claude · open

The Implementer fetched a third file from the model repo, `tokenizer_config.json`, outside `ingest`. A1 authorised exactly two files and said "Nothing else from the repo". The request's "Smallest request" also excluded "other files in the repository". `APPROVAL_RECORD-1.md:7` only says the Implementer "verifies it first". It gives no permission to download.

*Evidence:* `03-implementation.md:6`: "`tokenizer_config.json` at revision 233902d2... fetched by HTTPS GET only (not kept)". `APPROVAL_RECORD-1.md:5`: "`ingest` may download exactly those two files... Nothing else from the repo, no other revision or variant." `02-approval-request.md:50`: "Not: other files in the repository".

**F-14-3** · `runs/docs-retrieval-3/04-freeze.md:3` · claude · open

The freeze is not proven by git order, which the scope made the proof of "frozen before any fourth set exists". `03-implementation.md` says ADR 0005 and `runs/docs-retrieval-3/` were untracked when the method commit was made, so this record is not in version control. The ordering rests on the Orchestrator's own statement that it has seen no fourth set. Nothing durable fixes when the freeze was recorded.

*Evidence:* `04-freeze.md:3`: "Recorded 2026-10-01, before any fourth held-out set exists in the repo (the Orchestrator has seen none...)". `03-implementation.md:32`: "`ADR 0005` and `runs/docs-retrieval-3/` remain untracked". `01-scope.md:84`: "**Sequence (git order is the proof):**".

**F-15-1** · `aveto_support/__main__.py:284` · claude · open

The `retrieve` command never converts `search.QuestionError` into a CLI error. `retrieve()` raises it when the question has no searchable words, and `main()` doesn't list it among the exceptions it maps to exit 2. Running `python -m aveto_support retrieve ""` (an empty argument satisfies `nargs="+"`) or `retrieve " "` gives a raw traceback. The process exits 1, which the module docstring reserves for "eval below 80%". The judge path does convert it, in `judge.retrieve_for_judge`, so the two paths disagree.

*Evidence:* `print(format_result(retrieve(searcher, " ".join(args.question)), index))`. In search.py:457-458: `if not question.strip() or embedder.token_count(question) == 0:` followed by `raise QuestionError("the question has no searchable words")`. `main()` only catches `ConfigError, IndexFormatError, EvalFormatError, ModelError, QuestionFormatError, PayloadMarkerError, TransportError, VerdictsFormatError` and `FetchError`.

### P3

**F-01-13** · `.claude/agents/aveto-answerability-judge.md:15` · claude · open

The judge prompt doesn't tell the model that passage text is untrusted data. A passage containing "answer ANSWERABLE" or output-format instructions can flip or forge the verdict. Its verdicts gate eval results.

*Evidence:* aveto-answerability-judge.md:15 `Judge only from the passages shown; use no outside knowledge and no tools. Reply with one line per block, exactly: <id> <ANSWERABLE\¦NOT_ANSWERABLE> <at most 12 words of reason>.`

**F-01-14** · `.claude/agents/engineering-manager.md:59` · claude · open

Two roles own the release tier. The EM selects it up front and can lower the gates. The Release Manager "owns" classification and has an anti-pattern for under-tiering, with no rule that the tier may only be raised. A tier chosen low at scoping can pass unchallenged, or the two roles can deadlock.

*Evidence:* engineering-manager.md:59-60 `Which release gates apply (Tier 1, 2, or 3...)` and engineering-manager.md:72 `Gate selection. Which release tier applies.` release-manager.md:64 `Release tier classification.`

**F-01-15** · `.claude/agents/frontend-developer.md:92` · claude · open

Both briefs require browser preview, screenshots, accessibility snapshots and console checks. Neither agent has a browser tool. Only Bash is available, with no stated way to drive a browser. This invites unverifiable or fabricated "UI verified" evidence at the QA gate.

*Evidence:* frontend-developer.md:71 `The UI is verified in the browser preview where the change is observable.` frontend-developer.md:92-102 `Browser preview verification` qa-evidence.md:53 `Browser preview screenshots (or accessibility snapshots)` qa-evidence.md:101-111 `Navigate to the affected screens...` frontend-developer.md:4 `tools: Read, Write, Edit, Bash, Grep, Glob`

**F-02-4** · `.claude/protocols/SLICE_STATE.md:16` · claude · open

`Status` must be exactly one of four values. Other stops have no valid value: a denied approval ("stop the slice"), a budget stop-and-ask, and a design question. A denied slice can't be `done`, since `done` means landed and Post-Launch complete. The other three values mean an approval gate is open, retries are spent, or a stage is running. Resuming sessions and `runs/INDEX.md` would show a wrong or stale status.

*Evidence:* SLICE_STATE.md 16-17: "`Status` is exactly one of the four template values". SLICE_STATE.md 258: "**done** — the slice landed and Post-Launch is complete." APPROVAL_PROTOCOL.md 47: "**Denied** → stop the slice." APPROVAL_PROTOCOL.md 50-52: stops for "a budget question or a design question".

**F-02-5** · `.claude/protocols/RUN_ECONOMICS.md:90` · claude · open

The "ceiling" concept has no field in the state template, and the pre-spawn hook reads only `Budget`. The text says spend between plan and ceiling needs no question, but §2 says to stop or degrade when `spent + estimate > budget`. If `Budget` holds the plan, the hook stops inside the allowed band. If it holds the ceiling, the plan isn't recorded.

*Evidence:* RUN_ECONOMICS.md 90-97: "the Orchestrator proposes the plan total *and* a ceiling … Spend between the plan and the ceiling needs no question." SLICE_STATE.md 57: "- **Budget:** <n>k tokens  ·  **Depth:** <smoke / standard / adversarial>" (no ceiling field).

**F-02-6** · `.claude/protocols/RUN_ECONOMICS.md:56` · claude · open

Two stage-estimate figures conflict, and the budget gate uses them. The §1 table budgets a review stage at 100k. The added note says to estimate a review stage at 50–60k, or 100–130k for adversarial depth. The note's "against a 70k estimate" uses the design figure for review stages. Estimates differ by about 2× depending on which line is followed.

*Evidence:* Line 43: "\ / **review** (Scope, Architecture, Security, Release, Post-Launch) \ / ~98k \ / **100k** \ / 149k \ / ". Lines 55-57: "Estimate a review stage at **50–60k**, or at **100–130k** if the intent asks for adversarial depth".

**F-02-7** · `.claude/protocols/TELEMETRY.md:58` · claude · open

The provenance map and the budget definitions don't agree on the token metric. TELEMETRY says `stages[].tokens` is the sum of `input_tokens` + `output_tokens` per `agent_id`. The budgets, SLOs and density caps are calibrated on peak context (last request's `totalTokens`). `RUN_ECONOMICS` says the summed figure is typically 10–50× larger. `SLICE_STATE` says to set `Spent` from `usage.mjs` without saying which of its two measures. Using the OTel sum for `Spent` would trip the pre-spawn budget hook falsely. Separately, `agent_id` is not among the attributes listed for `api_request` or `tool_result`, and per-agent attribution is said to need beta spans.

*Evidence:* TELEMETRY.md 58: "Runtime — sum `input_tokens` + `output_tokens` per `agent_id`". RUN_ECONOMICS.md 29-31: "These are peak context, not consumption … What a stage actually processes — every request's tokens, summed — is typically **10–50× larger**". SLICE_STATE.md 112-113: "Set `Spent` from `execution/usage.mjs` after every stage".

**F-02-8** · `.claude/protocols/TELEMETRY.md:33` · claude · open

Span export config is inconsistent. The global protocol is gRPC, but the traces endpoint is port 4318 with an HTTP path (`/v1/traces`). Unless a traces-specific protocol is set, the spans exporter inherits gRPC and fails against an OTLP/HTTP endpoint. Spans (the only source of `subagent_type` and per-role cost) are then silently absent.

*Evidence:* Line 24: "export OTEL_EXPORTER_OTLP_PROTOCOL=grpc". Line 33: "export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces". No `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL` anywhere in the file.

**F-02-9** · `.claude/protocols/TELEMETRY.md:36` · claude · open

The doc steers users to send run telemetry (model, cost, agent names, request/session ids) to hosted third-party backends and gives no warning. AGENTS.md and the approval rules treat a new data processor as a rule 6 human-approval stop. Telemetry is turned on by exporting env vars, and nothing here gates it or warns against pointing the exporter at a SaaS endpoint without approval.

*Evidence:* "Any OTLP backend receives it — MLflow, Langfuse, Arize Phoenix, LangSmith and Laminar all accept OTLP, so no viewer needs building." The only guidance is `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317`.

**F-02-10** · `.claude/protocols/HANDOFF_CHECK.md:40` · claude · open

The check is described as "purely mechanical" and run by a haiku-class, `low`-effort validator. Two of its five checks are judgments. One is whether inherited safety invariants and non-goals are still present, not silently dropped. The other is whether a claimed file, capability or number exists. The safety-invariant carry-forward check therefore rests on the weakest model and effort tier, and a "Pass" lets the next stage proceed.

*Evidence:* Line 14: "Purely mechanical — it does not judge the work, only the envelope". Lines 40-43: "**Constraints carried forward** — the inherited safety invariants and non-goals … are still present, not silently dropped. 5. **No invented claims** …". MODEL_ROUTING.md 38: "**low** … handoff check".

**F-02-11** · `.claude/protocols/PIPELINE_SLOS.md:20` · claude · open

The "Approval surfacing" SLO conflicts with the approval protocol. The SLO requires 100% of gated actions to be surfaced at Intake and measures that a request row exists before any implementation stage. The protocol lets rule 1–3 actions be confirmed at the Release Gate, so a compliant run that requests them late would register as an SLO miss.

*Evidence:* PIPELINE_SLOS.md 20: "100% of gated actions surfaced at Intake — never discovered at Release \ / Approvals table: request row exists before any implementation stage row". APPROVAL_PROTOCOL.md 21-23: "Rules 1, 2, 3 … confirmed at the **Release Gate** at the latest".

**F-02-12** · `.claude/protocols/FAILURE_LOOP.md:14` · claude · open

The slice iteration cap ("6 stage re-entries") is a bound on the whole slice, but `STATE.md` has nowhere to record it. The Failure budget table is per stage, with `Retries used` and `Cap`. A cold-resumed session can't enforce the cap reliably. This breaks "State is durable" (rule 4) and the anti-runaway intent.

*Evidence:* FAILURE_LOOP.md 14-15: "The **slice iteration cap** bounds total back-and-forth across the whole slice. Default: **6 stage re-entries**." SLICE_STATE.md 65-67: "\ / Stage \ / Retries used \ / Cap \ / Class \ / Last failure \ / "

**F-03-3** · `.agentic/LOCAL_COMMANDS.md:37` · claude · open

The file says `test_wordpiece_matches_golden` fails until QA adds `tests/fixtures/wordpiece_golden.json`. The status file says that fixture exists and the "missing" claim was stale. A QA or implementer role following this file would chase a non-existent failure or recreate the fixture. The same line also omits that `test_sample_derivation_reproducible` fails in the committed tree, which status line 92 says it does. The "Full local regression" command above it (line 35) is therefore not known to pass.

*Evidence:* `\`test_wordpiece_matches_golden\`, which fails until QA adds \`tests/fixtures/wordpiece_golden.json\`.` (LOCAL_COMMANDS.md:37-38); `(Resolved, for the record: \`tests/fixtures/wordpiece_golden.json\` exists; the earlier line saying it was missing was stale.)` (CURRENT_MVP_STATUS.md:98-99); `One model-marked test fails in the committed tree` (CURRENT_MVP_STATUS.md:92)

**F-03-4** · `.agentic/LOCAL_COMMANDS.md:4` · claude · open

The file claims "Only commands that have been run are listed", but several rows say otherwise. The `eval` row says it was "not run against `evals/` by the implementer". The `eval --verdicts`, `record`, `diagnostics` and `add-set` rows say "Exercised only against synthetic ... in the tests". The `eval` row says it "may exit 1 by design", which is a gate that fails on the real dev set. A reader will take every row as verified against real data.

*Evidence:* `Only commands that have been run are listed.` (line 4); `not run against \`evals/\` by the implementer` (line 17); `Exercised only against synthetic files in the tests` (line 20)

**F-03-5** · `.agentic/LOCAL_COMMANDS.md:16` · claude · open

The unescaped `\¦` inside backtick code in the markdown table (`file-rrf-v1\¦file-rerank-v1`, written here as `¦`) splits the row into extra columns. The Command cell is cut off at `[--ranking file-rrf-v1`, and the Network cell receives the rest. Rendered, or parsed as a table, the `retrieve` and `eval` commands are truncated and the network column is wrong. Line 24 escapes the pipe (`none\¦<comma list>`); lines 16 and 17 do not.

*Evidence:* `... [--index index/docs-index.json] [--ranking file-rrf-v1¦file-rerank-v1] <question words...>` (line 16, inside a `¦`-delimited table row); `[--ranking file-rrf-v1¦file-rerank-v1]` (line 17)

**F-03-6** · `.agentic/SAFETY_INVARIANTS.md:3` · claude · open

The file is still marked PARTIAL and has no invariant for decisions the owner already made. These are that credentials (API key, Azure login) are never handled by an agent, that there is a hard monthly spend cap and rate limit before the key is first used, and prompt injection from issue text. A real model is already wired through the judge, and the file's own rule says a missing invariant is not a permission. Gates that check "does the slice honour the invariants" therefore cannot catch a violation of these.

*Evidence:* `> **PARTIAL — seeded by hand ... The Architect + Security stages still own this file and must extend it` (SAFETY_INVARIANTS.md:3-6); `**Credentials** — the API key and the Azure login — are supplied by the owner and never handled by an agent.` and `hard monthly spend cap and a rate limit set before the key is first used` (PROJECT_CONTEXT.md:83-86)

**F-04-3** · `.claude/skills/aveto-judge-seen/seen_payload.py:39-43` · claude · open

`question_for` returns the first batch line whose id matches, scanning batch files in sorted order, and never checks for duplicates. If one id appears in two batch files, or twice in one, the judge silently gets the earlier question. That could mislabel eval results. The docstring promises refusal only for a missing line. Fix: collect all matches and refuse unless there is exactly one.

*Evidence:* `for batch in sorted(seen.glob("batch-*.txt")):` / `for line in batch.read_text(encoding="utf-8").splitlines():` / `head, _, rest = line.partition(" ")` / `if head == run_id and rest.strip(): return rest.strip()`

**F-06-3** · `runs/docs-answerability-2/judge-check/batch-1.txt:49` · claude · open

`batch-1.txt` lists r049 as the 49th question of the batch. The audit and key treat r049 as outside the batch and never scored, so the two disagree on batch membership. Any tool that builds the batch from this file would count 49 spawns, or score the smoke question. The r049 smoke spend is also left out of the "Batch spawns: 48" totals. Fix: remove r049 from `batch-1.txt`, or have the audit say that file membership is not the batch definition.

*Evidence:* `r049 My run stopped halfway because I hit my usage limit. Do I have to start again from scratch?` (`batch-1.txt:49`); `"run_id": "r049", … "in_batch": false` (`stage5/audit.json:435-441`); `# sample 48 … r049 = smoke (H position 2), never scored` (`key/key.toml:4`); `Batch spawns: 48; peak sum 378,696` (`stage5/audit.md:57`)

**F-07-3** · `runs/docs-retrieval-4/STATE.md:21` · claude · open

`STATE.md` is the durable resume file and contradicts itself. Line 21 still shows the INV-5 approval as `requested`, while line 31 shows it APPROVED on 2026-10-03T06:42:53Z. Line 24 shows the Release Gate as `in-progress` although steps 1–3 are all marked done and the slice is `done`. Line 11 `Updated` reads 2026-10-03T06:27:00Z, but events run to 2026-10-08. A cold `/agentic-resume` could re-request an approval already given or re-run a finished gate.

*Evidence:* `STATE.md:21`: "INV-5 sentence approval (rule 4) \ / Human \ / requested". `STATE.md:31`: "APPROVED (owner's own wording for the sentence) \ / Gopal Patwa \ / 2026-10-03T06:42:53Z". `STATE.md:24`: "Release Gate … in-progress: step 1… done; step 2… done; step 3 (verdict) done". `STATE.md:7`: "Status: done". `STATE.md:11`: "Updated: 2026-10-03T06:27:00Z".

**F-07-4** · `runs/docs-retrieval-4/03-implementation.md:38` · claude · open

The implementation report's list of updated tests is incomplete. `test_retrieve_is_offline_with_cached_model` was also switched to `--ranking file-rerank-v1`. This is the INV-5-named test for default-path offline retrieval with the embedding model. It no longer exercises the default ranking. The tech spec required the report to list every updated test and called them "unchanged in meaning". `04-security-review.md:117` (A1) records the weakening for both tests, so the two artefacts disagree. Trigger: a reader of `03` believes only one INV-5 test changed.

*Evidence:* `03-implementation.md:38`: "`test_retrieve_is_offline_with_cached_reranker` now passes `--ranking file-rerank-v1` (same meaning)" (the only offline test named). `tests/test_ingest.py:735`, inside `test_retrieve_is_offline_with_cached_model`: `assert main(["retrieve", "--index", str(out), "--ranking", "file-rerank-v1", question], embedder=FAKE, reranker=FakeReranker()) == 0`. `02-tech-spec.md:186`: "unchanged in meaning… the report lists them". `04-security-review.md:117`: "`test_retrieve_is_offline_with_cached_model` and `…_with_cached_reranker` now pass `--ranking file-rerank-v1`".

**F-07-5** · `runs/docs-retrieval-4/06-release-checklist.md:160` · claude · open

The rollback step asserts the index hash is "stable across the slice's inputs". No artefact records a pre-change index hash. The only hash recorded is the single release-head value in `06-qa-result.md:11`. The checklist author also says it read no code diff. The claim rests only on Security's test of the flag on versus off, and that does not show the hash matches the pre-change build. Trigger: an owner skips an index rebuild after a revert on the strength of this sentence.

*Evidence:* Checklist line 160: "the index bytes do not change (sha256 `f36ef5d4...` stable across the slice's inputs)". Checklist line 157: "I did not read the code diff." `06-qa-result.md:11`: one value only, "`index/docs-index.json` \ / `f36ef5d4fbf4b3f5…`".

**F-07-6** · `runs/docs-retrieval-4/03-implementation.md:60` · claude · open

The spec's stop rule was triggered and not followed. If the 3.2 premise failed, Implementation was to report "explained, not fixed" and "stop for the owner". The implementer instead finished the slice, citing that the rest "does not depend on it". Security, the Release Gate and Close-out then ran on that basis. The owner's Addendum 3 shows they were engaged, but no artefact records an owner decision to continue.

*Evidence:* `02-tech-spec.md:84`: "Implementation then reports 'explained, not fixed' with the evidence and stops for the owner." `02-tech-spec.md:259-260`: "Stop conditions: Section 3.3 'if the argument is wrong'." `03-implementation.md:60`: "The spec's stop rule… applies; I finished the specified, harmless ownership code and the evidence rather than stopping, because the rest of the slice does not depend on it."

**F-08-7** · `runs/docs-abstention/06-release-checklist.md:102` · claude · open

A baseline figure in the release record conflicts with the tech spec's. The checklist says Bar 1 reaches 16/20 only with Bar 2 at 21/56 or lower. The spec gives the combined cell t=0.66, m=0.015 at 16/20 and 24/56 (42.9%). Both cannot be right. I could not read `02-baseline.md` to say which is.

*Evidence:* 06-release-checklist.md:102 `Bar 1 reaches 16/20 only with Bar 2 at 21/56 or lower`; 02-tech-spec.md:27 `Bar 1 reaches 16/20 or more only where Bar 2 is at or below 42.9% (combined t=0.66, m=0.015: 16/20, 24/56)`

**F-08-8** · `runs/docs-abstention/STATE.md:12` · claude · open

The state file can mislead a cold resume. "Updated" still reads 06:25Z, though the run continued past 21:43Z. Freeze, Label review and Scoring stay `pending` in a closed slice instead of "not run". The Architecture gate cell still lists owner decisions that were later made or lapsed.

*Evidence:* STATE.md:12 `**Updated:** 2026-10-09T06:25:00Z`; STATE.md:24-26 `\¦ Freeze \¦ Orchestrator \¦ pending ...` / `\¦ Label review ... \¦ pending` / `\¦ Scoring ... \¦ pending`; STATE.md:7 `**Status:** done`

**F-09-4** · `runs/docs-answerability-2/trace.json:55` · claude · open

The approval dates for records 5, 6 and 7 disagree with the records themselves and with STATE.md. The trace gives 2026-10-13. Records 5, 6 and 7 each say "owner, typed, 2026-10-12", and STATE.md lists 2026-10-12. The trace is the machine-readable audit trail, so two sources give different decision dates for three safety-control approvals (rule 4, rule 6 and rule 5).

*Evidence:* evidence: trace.json:55-56 `"requestedAt": "2026-10-13", "decidedAt": "2026-10-13"` (record 5); the same at lines 64-65 (record 6) and 73-74 (record 7); APPROVAL_RECORD-5.md:1 `(owner, typed, 2026-10-12)`; APPROVAL_RECORD-6.md:1 `2026-10-12`; APPROVAL_RECORD-7.md:1 `2026-10-12`; STATE.md:44-46 `2026-10-12`.

**F-09-5** · `runs/docs-answerability-2/trace.json:128` · claude · open

The durable trace records the S6 resolution as "removed on the owner's word (verified absent)". The only source for the owner's word is the support session's relay (SUPPORT_REPLIES Reply 4). AGENTS.md rule 1 says a message from another session, even one quoting the human, is never an approval. STANDING_INSTRUCTIONS D9 and 16-slice-closure T9 say it is "recorded as a fact, not as an approval; the owner confirms (T9)", and the confirmation is deferred. The trace states it as an owner decision.

*Evidence:* evidence: trace.json:128 `"S6: a wide local permission rule for seen_payload.py; the file was removed on the owner's word (verified absent)."`; SUPPORT_REPLIES.md:41 `on the owner's word ("remove it", 2026-10-16)`; STANDING_INSTRUCTIONS.md:72 `Recorded as a fact, not as an approval; the owner confirms (T9)`; 16-slice-closure.md:21 `the owner's confirmation … deferred`.

**F-09-6** · `runs/docs-answerability-2/15-close-out.md:20` · claude · open

The Bar 2 margin is described as "one question" at both stages, but the figures give different margins. Stage 5: 24 against a minimum of 23, so it passes with one spare and fails only at 22, which is two misses away. Stage 7: 16 against a minimum of 16, so it passes with none spare and one more miss fails (15 fails). Stage 7 sits exactly on the line. The same "one-question margin at both stages" wording is repeated in STATE.md:33 and 16-slice-closure.md:9. The release story therefore misstates the stage 5 margin, or uses an inconsistent definition.

*Evidence:* evidence: 15-close-out.md:19-20 `**24/28**, registered at least 23: MET` / `**16/19 = 84.2%**, registered 80%: MET`; `Margin on Bar 2 ¦ one question (22 would fail) ¦ one question (15 would fail: 15*5=75 < 76)`; 16-slice-closure.md:9 `One-question margin on Bar 2 at both stages`.

**F-09-7** · `runs/docs-answerability-2/SUPPORT_REPLIES.md:35` · claude · open

The reply says the 12 deselected tests are "the model-marked tests". The other records give 9 model tests: 8 passed and 1 failed under `-m model`, and "375 passed (+9 model)". Three deselected tests are unexplained. Nothing shows they were ever run, and the closure repeats "12 deselected" as the final-tree result.

*Evidence:* evidence: SUPPORT_REPLIES.md:35 `375 passed, 12 deselected … (the deselected are the model-marked tests, including the known test_sample_derivation_reproducible)`; STATE.md:24 `regression 375 passed (+9 model)`; 15-close-out.md:61 `375 passed, 12 deselected; -m model 8 passed, 1 failed`; 16-slice-closure.md:9 `375 passed, 12 deselected`.

**F-10-1** · `runs/docs-abstention/02-baseline.md:367` · claude · open

The baseline says no question text appears in two sets, but nothing in the listed artefacts checks this. The CSV has no question-text column, and the script's integrity block checks only `(set, id)` uniqueness. A reader re-running `collect` and `sweep` cannot reproduce the claim.

*Evidence:* Claim: "Duplicates: none. 93 (set, id) pairs are unique, no id appears in two sets, and no question text (case-folded) appears in two sets." CSV header: `set,id,label,hard_negative,in_top5,rank,top1,top2,margin,pmargin,top1_printed_global,top1_shown,files`. Script integrity code: `ids = [(r["set"], r["id"]) for r in rows]`, then `(set, id) pairs unique: ...`.

**F-10-2** · `runs/docs-abstention/02-baseline-sweep.py:203` · claude · open

This line looks like a duplicate check but does not check duplicates. It counts distinct `files` strings, not question texts, and then deletes the result. It is the only trace of a duplicate-text check in the script, so it may have given false assurance behind F-1.

*Evidence:* `texts_dupe = len(rows) - len({r["files"] for r in rows})  # not used; kept out of the report` followed by `del texts_dupe`

**F-10-3** · `runs/docs-abstention/02-baseline.md:366` · claude · open

The baseline says `collect` and `sweep` exited 0, but no listed artefact records either exit code. `02-baseline-exit-codes.txt` covers only the four `eval` runs. `02-baseline-collect.txt` has a timing line and no exit status. `02-baseline-sweep-run.txt` has no exit line. The script cuts its stdout to the first 60 report lines (`md[:60]`), so the file ends mid-table at `t=0.63`.

*Evidence:* Claim: "`collect` and `sweep` exited 0". `02-baseline-exit-codes.txt` lines 1-4: `retrieval exit 1`, `heldout exit 1`, `heldout-3 exit 1`, `heldout-4 exit 0`. Script: `print("\n".join(md[:60]))`. `02-baseline-sweep-run.txt` last table row: `\¦ t=0.63 \¦ 6/20 (30.0%) \¦ 54/56 (96.4%) ...`.

**F-10-4** · `runs/docs-abstention/02-baseline.md:30` · claude · open

The text says the "always abstain" and "never abstain" extremes are both the `t=0.40` row. Only never-abstain is that row (B1 0/20, B2 56/56). Always-abstain is the `t≥0.81` rows (B1 20/20, B2 0/56). This is a factual error in the baseline the Architect reads.

*Evidence:* Text: "The 'always abstain' and 'never abstain' extremes are the t=0.40 row of the sweep below (same numbers)." Sweep rows: `t=0.40 \¦ 0/20 (0.0%) \¦ 56/56 (100.0%)` and `t=0.90 \¦ 20/20 (100.0%) \¦ 0/56 (0.0%)`.

**F-10-5** · `runs/docs-abstention/02-baseline.md:70` · claude · open

The sentence says Bar 2 "reaches 90% or more" only where Bar 1 is low, then cites `t=0.64` as an example at 89.3%, which is below 90%. This is a small numeric misstatement against the document's own integer rule for "≥ 90%".

*Evidence:* Text: "Bar 2 reaches 90% or more only where Bar 1 is low: t=0.63 gives Bar 2 54/56 (96.4%) with Bar 1 6/20 (30.0%); t=0.64 gives 50/56 (89.3%) with 6/20." The script tests `a * 100 >= b * p`, and 50×100 = 5000 < 56×90 = 5040.

**F-10-6** · `runs/docs-abstention/00-slice-plan.md:6` · claude · open

The plan header says the slice is awaiting the owner's confirmation and that nothing is spawned. The same run already holds a completed A2 baseline that cites an owner approval record. A session resuming from the plan would misread the slice state. The plan's own rule 4 says state lives in `STATE.md`, which is not in this file set.

*Evidence:* Plan line 6: "**Status: awaiting the owner's confirmation. Nothing is spawned until then.**". `02-baseline.md:57`: "Definition (APPROVAL_RECORD-2, Q2): both bars >= 90% on the pooled seen sets AND >= 80% leave-one-set-out."

**F-11-2** · `runs/docs-retrieval-3-proof/02-qa-result.md:9 (and 03-close-out.md:29)` · claude · open

The claim that the teardown abort is intermittent rests on exit codes that were not recorded. The QA result says the seven diagnostic runs exited "0 or 1, as the score dictates", but line 71 admits the wrapper captured no exit codes. The close-out cites `eval-run-1-heldout4.txt` for "exit 134", but that file holds only the libc++abi message. "Does not recur" can be inferred from the other seven files lacking that line. The exit-code claims cannot be checked from the artefacts.

*Evidence:* 02-qa-result.md:9: `(exit codes 0 or 1, as the score dictates)`. 02-qa-result.md:71: `Exit codes were not captured by my shell wrapper (PIPESTATUS printed empty)`. 03-close-out.md:29: `exit 134 (eval-run-1-heldout4.txt)`. eval-run-1-heldout4.txt:26 is `libc++abi: terminating due to uncaught exception ... recursive_mutex lock failed: Invalid argument`, with no exit status anywhere in the file.

**F-11-3** · `runs/docs-retrieval-3-proof/retrieval-heldout-4.reviewed.toml:21-22` · claude · open

The provenance header says "no source file below is a source in any earlier set". That is false. The reviewer-added labels reuse files that are sources in earlier sets. The drafter's own labels do too: `agents/release-manager.md` in f04 is a t01 source. Anyone reading the header will wrongly take the set as fully disjoint from the dev and held-out sets.

*Evidence:* Header: `No question repeats a topic from an earlier set, and no source file below is a source in any earlier set.` The eval outputs show `docs/GETTING_STARTED.md` expected in a01, `docs/AGENTIC_SDLC.md` in a06, `docs/AGENT_ROLES.md` in a24, `project-packs/ai-agent-product.md` in a22, `docs/VALIDATION_MATRIX.md` in a21, `execution/pack/protocols/SLICE_STATE.md` in h01, `agents/release-manager.md` in t01, `agents/ml-engineer.md` in t14, `templates/THREAT_MODEL_TEMPLATE.md` in h16 and `agents/data-analyst.md` in h12. This file lists all of them as sources (lines 34-124).

**F-11-4** · `runs/docs-retrieval-3-proof/STATE.md:68 (also :11)` · claude · open

The Trace "Total" row shows 0 tokens and 0 tool calls, although the two spawn rows above it sum to about 2.345M processed tokens and 51 tool calls. The close-out cites 2.34M for slice B, so the machine-read totals contradict it. `Updated` is still the start timestamp even though the stages ran until at least 07:25Z and the slice then closed.

*Evidence:* Line 68: `\¦ **Total** \¦ \¦ \¦ \¦ \¦ \¦ 0 \¦ 0 \¦ \¦`. Line 66: `2.07M processed ... 35`. Line 67: `275k processed ... 16`. Line 11: `Started: 2026-10-01T06:55:00Z · Updated: 2026-10-01T06:55:00Z`.

**F-11-5** · `runs/docs-retrieval-3-proof/STATE.md:24` · claude · open

The Post-Launch stage is marked `done`, but the close-out says Post-Launch did not run. The state file would make a resuming session treat the Post-Launch gate as satisfied.

*Evidence:* STATE.md:24: `\¦ Post-Launch \¦ Orchestrator (owner directed; no spawn) \¦ done \¦ ...03-close-out.md`. 03-close-out.md:3: `Security Review, the Release Gate and Post-Launch did not run, by the owner's decision`.

**F-12-5** · `runs/docs-retrieval-2/APPROVAL_RECORD-3.md:3` · claude · open

There is no APPROVAL_REQUEST-3.md. The record's "Request" field points to a tech-spec section, so the exact prompt the owner answered ("Approve the one-line note edit") is not preserved. The Orchestrator then reads the owner's later, wider wording, "recording that abstention moved to the check step", as only the reason for the edit. The edit was applied before the restatement, so the approved scope depends on the Orchestrator's reading.

*Evidence:* APPROVAL_RECORD-3.md:3: "Request: raised by the Orchestrator after the Architect's 'Proposed INV change (owner first)' (02-tech-spec.md)". Line 15: "recording that abstention moved to the check step (Decision 1). Nothing wider." Line 17: "The Orchestrator reads 'recording that abstention moved to the check step' as the reason for the edit". Suggested fix: write APPROVAL_REQUEST-3.md with the exact proposed hunk and prompt. Confirm with the owner whether the abstention wording belongs in the annotation.

**F-13-2** · `tests/test_ingest.py:607` · claude · open

`test_retrieve_is_offline_with_cached_reranker` and `test_retrieve_is_offline_with_cached_model` (line 729) inject `FakeEmbedder` and `FakeReranker`. `main` therefore never reaches any model-cache or download code, and the socket block can't be triggered. Both pass whatever the real cached-model path does. The comment says "a connection would raise RuntimeError", but no code path here can connect.

*Evidence:* `assert main(["retrieve", "--index", str(out), "--ranking", "file-rerank-v1", question], embedder=FAKE, reranker=FakeReranker()) == 0` (line 613; the same pattern is at line 735, with the comment "The autouse fixture blocks every socket for this test")

**F-13-3** · `tests/fixtures/wordpiece_golden.json:8 (and tests/fixtures/gen_wordpiece_golden.py:33)` · claude · open

The fixture's `generated_by.snippet` is meant to be the exact script that produced the answer key (`Path(__file__).read_text`). The committed script differs from it. Line 33 has a `# type: ignore[import-not-found]  # one-off…` suffix that the snippet lacks. The script writes `\u200b` as an escape where the snippet holds a literal U+200B. The recorded provenance therefore doesn't match the committed generator.

*Evidence:* Script line 33: `import tokenizers  # type: ignore[import-not-found]  # one-off dev tool; …`. Script line 46: `"tab\there\nnewline\u0007bell\u200bzero-width"`. JSON snippet: `import tokenizers\nfrom tokenizers import BertWordPieceTokenizer` and `newline\\u0007bell​zero-width` (literal zero-width character, no `\\u200b`).

**F-13-4** · `tests/test_search.py:471` · claude · open

The golden-fixture test only requires `len(cases) >= 11`, but the generator emits 13 cases (it asserts `cases[9]` is the 512 truncation case). Deleting the two QA additions, mixed-case and the 150-char over-long word, would still pass. Case 13 is the only one covering the over-long-word `[UNK]` behaviour. `test_rerank.py:369` has no count check at all.

*Evidence:* `assert len(cases) >= 11, "golden fixture must cover the 11 pre-registered strings"` vs. generator `TEXTS` (13 entries, incl. `"a" * 150 + " short"`)

**F-13-5** · `tests/conftest.py:31` · claude · open

The "network disabled" guard patches only `socket.socket.connect`, `socket.create_connection` and `socket.getaddrinfo`. `connect_ex`, UDP `sendto` and `gethostbyname` stay live. Code that resolves or sends through those would reach the network in a test not marked `network`.

*Evidence:* `monkeypatch.setattr(socket.socket, "connect", blocked)` / `monkeypatch.setattr(socket, "create_connection", blocked)` / `monkeypatch.setattr(socket, "getaddrinfo", blocked)`

**F-14-4** · `runs/docs-retrieval-3/04-freeze.md:4` · claude · open

The freeze set is defined twice, and the two lists differ. The tech spec and the Implementer name eight files, and slice B QA is told to diff exactly those. `04-freeze.md` freezes a different, broader set. It adds `pyproject.toml`, `uv.lock`, `tests/`, `SAFETY_INVARIANTS.md` and three eval files, and drops the spec's per-file list. It also omits `evals/calibration-offtopic.toml`, which the scope lists as read-only. QA cannot tell which diff must be empty.

*Evidence:* `04-freeze.md:4`: "`aveto_support/` (all), `docs-source.toml`, `pyproject.toml`, `uv.lock`, `tests/`, `.agentic/SAFETY_INVARIANTS.md`, and the three earlier eval files". `02-tech-spec.md:234`: "QA in slice B diffs `<frozen SHA>..HEAD` over these eight files and expects it empty." `01-scope.md:114`: lists four read-only eval files, including `evals/calibration-offtopic.toml`.

**F-14-5** · `runs/docs-retrieval-3/04-freeze.md:7` · claude · open

A known wrong label in the scoring path was accepted with circular reasoning. `evaluate.py` hardcodes `ranking: file-rrf-v1` in its report header, and `__main__` patches it with `str.replace` on the first occurrence. The Implementer asked for a decision before the freeze, and 12 of 13 files were used. The Orchestrator declined because editing `evaluate.py` would touch a method file. The freeze was not yet recorded, so one more file was available. The `str.replace` can also rewrite the wrong text if the string appears earlier in the header, for example in a path. I did not read the code.

*Evidence:* `04-freeze.md:7`: "Not fixed, because editing `evaluate.py` after the freeze would touch a method file." `03-implementation.md:29`: "`__main__` replaces that label in the printed header... (`str.replace`, first occurrence)... The Orchestrator should decide before the freeze." `02-tech-spec.md:230`: "Spare under the cap: 1."

**F-14-6** · `runs/docs-retrieval-3/02-approval-request.md:133` · claude · open

The pre-A1 checks the request itself marked as blocking were not done as specified. The request said that if the `vocab.txt` sha256 or the `do_lower_case` check fails, "Do not put A1 to the owner" and hand back. The Orchestrator did not open `tokenizer_config.json` and relied on a report from another session. It inferred the vocab hash from a git blob id instead of the file's sha256. The first was deferred to the Implementer and the second substituted. Both are disclosed to the owner. The void-on-fail rule was still turned into a post-approval check.

*Evidence:* `02-approval-request.md:133`: "Reported true by the Aveto AI SDLC session... The Orchestrator did not open the file itself." `02-approval-request.md:136`: "The vocab hash is derived by identity with a file the repo already pins, not by hashing the file itself". `02-approval-request.md:36`: "**Do not put A1 to the owner.** The proposal is void".

**F-14-7** · `runs/docs-retrieval-3/STATE.md:68` · claude · open

The durable state is internally inconsistent, which misleads a cold resume. The Trace Total row reads `0 \¦ 0` against stage rows totalling millions of tokens. `Updated` (line 11) still shows 04:56:00Z, before the approvals at 06:32Z and Implementation at 06:33–06:40Z. Line 9 says telemetry is "self-reported", but line 46 says the units come from `usage.mjs`.

*Evidence:* `STATE.md:68`: "\ / **Total** \ / \ / \ / \ / \ / \ / 0 \ / 0 \ / \ / ". `STATE.md:11`: "**Updated:** 2026-10-01T04:56:00Z". `STATE.md:9`: "**Telemetry:** self-reported". `STATE.md:46`: "Units are peak context per spawn." (line 38 of the earlier note says "from usage.mjs").

**F-14-8** · `runs/docs-retrieval-3/STATE.md:46` · claude · open

A stale budget note is left unmarked as superseded and contradicts the live budget. It says slice A is 330k and slice B is 270k. Line 36 says 360k, and line 40 records the owner's move to A 360k and B 240k. Only the note at line 42 is labelled "superseded". A resumer could read 330k/270k as current.

*Evidence:* `STATE.md:46`: "Note: the owner's 600k is split at the freeze (intent Decision 1): slice A (this slice) 330k, slice B (`docs-retrieval-3-proof`) 270k." `STATE.md:36`: "**Budget:** 360k tokens". `STATE.md:40`: "(A 360k, B 240k)".

**F-14-9** · `runs/docs-retrieval-3/intent.md:3` · claude · open

The intent's "Confirmed" status is the drafter's own assertion. Claude wrote the intent and also made its three binding decisions: the budget split, the label-review design, and the schedule constraint on drafting slices. The owner only delegated them ("make a decision for the three questions and commit"). There is no record of the owner's own words confirming the result. STATE and the plan then cite "confirmed by the owner 2026-09-30".

*Evidence:* `intent.md:3-8`: "**Confirmed 2026-09-30.** Drafted by Claude... The owner delegated the three open questions, verbatim: 'make a decision for the three questions and commit'. Claude decided them". `STATE.md:17`: "confirmed 2026-09-30 (file); owner reconfirms with the plan". `00-slice-plan.md:3`: "confirmed by the owner 2026-09-30".

**F-15-2** · `aveto_support/index.py:305` · claude · open

`load_index` only catches `OSError` around `read_text`. A corrupt or truncated index with invalid UTF-8 raises `UnicodeDecodeError`, a `ValueError` and not an `OSError`. It escapes as a traceback with exit 1 instead of `IndexFormatError` (exit 2, "re-run ingest"). The later `except ValueError` only wraps `json.loads`, not the read.

*Evidence:* `try:\n        raw = path.read_text(encoding="utf-8")\n    except OSError as exc:\n        raise IndexFormatError(f"cannot read index {path}: {exc.strerror or exc}; run ingest") from exc\n    try:\n        doc = json.loads(raw)\n    except ValueError as exc:`

**F-15-3** · `aveto_support/ingest.py:267` · claude · open

The fetch error handlers don't cover `http.client.IncompleteRead`. GitHub's codeload typically serves the archive with chunked transfer encoding, and a connection cut mid-body makes `response.read` raise `IncompleteRead`. That is an `HTTPException`, not a `URLError`, `TimeoutError` or `OSError`. The result is an uncaught traceback instead of `FetchError` (documented exit 3). `download_model_file` has the same handler at line 320.

*Evidence:* `data: bytes = response.read(max_bytes + 1)\n    except urllib.error.HTTPError as exc:\n        raise FetchError(f"HTTP {exc.code} fetching {url}") from exc\n    except (urllib.error.URLError, TimeoutError, OSError) as exc:\n        raise FetchError(f"network error fetching {url}: {exc}") from exc`

**F-15-4** · `aveto_support/index.py:174` · claude · open

The check that closes a fenced code block only matches the fence characters at the start of the line and ignores what follows. Under CommonMark a closing fence can't carry an info string. A line such as "```python" inside a "```" fence is treated as the closer. The rest of that code block is then scanned for headings, so a `# comment` line in a shell or Python block becomes a bogus heading. This splits passages wrongly and corrupts `heading_path`, `line_start` and `line_end`. It needs a fenced block that contains a same-length fence line with trailing text.

*Evidence:* `if re.match(r"^ {0,3}" + re.escape(char) + "{" + str(size) + ",}", line):\n                fence = None\n            continue`

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

- **Intent (F-01-1, P1):** Fix the issue at `.claude/agents/sre.md:95`: The SRE agent decides which production mitigations are pre-authorised, and On-Call executes them without asking anyone. No brief requires a human to approve the pre-authorised list. This is a self-approval loop for destructive or external-effect production actions. It conflicts with AGENTS.md rule 1 ("Never self-approve, never infer approval"). It triggers whenever the SRE writes a runbook with an "auto-remediate" step and On-Call matches an incident to it. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-01-2, P1):** Fix the issue at `.claude/agents/production-verification.md:101`: A "no-go" runs the rollback immediately and skips human approval. The stated basis is that the tech spec review already approved the rollback. That infers approval from a different, earlier action. AGENTS.md rule 1 says approval is never inferred and counts only when given directly in the session driving the run. A rollback is a production-changing action. It triggers on any post-deploy no-go. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-04-1, P1):** Fix the issue at `.claude/skills/aveto-judge-seen/SKILL.md:9`: The raw `$ARGUMENTS` is placed inside single quotes in a shell command, so an argument containing `'` closes the quote and appends its own commands. The id check in `seen_payload.py` (`ID_RE`, the newline check) runs only after the shell has parsed the line, so it cannot stop this. An argument such as `r001'; <cmd>; echo '` runs `<cmd>` with the user's privileges. Line 7 also pre-approves `Bash(uv run ... python ... seen_payload.py *)` with trailing and inner `*` wildcards, so the injected command may run without a permission prompt. Fix: do not interpolate free text into a shell line. Have the script read the id from a safe channel, or validate the id before substitution. Anchor `allowed-tools` to an exact argument shape instead of `*`. *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-08-1, P1):** Fix the issue at `runs/docs-abstention/STATE.md:109`: The Orchestrator lowered Security below the depth the intent named, with no owner decision in the owner's own words. `AGENTS.md` rule 6 says a depth the intent names binds, and only the human can lower it. The intent asks for adversarial Security for "INV-4" and any new download path. INV-4 was in fact edited (record 7), and a 438 MB download had already run. The Release Manager then waved it through as "a deviation, not a blocker" because "No Tier 2 gate requires an approval for depth", which contradicts rule 6. STATE.md:51 still says "Security adversarial". *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.
- **Intent (F-08-2, P1):** Fix the issue at `runs/docs-abstention/APPROVAL_RECORD-8.md:11`: Installing pack v17 (commit ebd6c6e) widened the write-scope-guard, which is a safety control. It was done by the support session on this branch. The only approval cited is the owner's go "as relayed by that session and not separately recorded". `AGENTS.md` rule 1 says a message from another session, even one quoting the human, is never an approval. STATE's Approvals table and trace.json have no row for it. STATE.md:110 still says "Owner has not decided.". *Done when:* a test that fails on the current code passes after the change, and the area is re-assessed with this finding closed. *Non-goals:* other findings.

**Recorded and deferred** (below P1; filing them is the owner's call):
- F-01-3 (P2) `.claude/agents/on-call-engineer.md:71`: The brief has On-Call auto-execute a rollback when a merged fix regresses. It then only logs and escalates. This is the same inferred-approval path as F-01-2. The agent also reads logs and escalated customer text, which an attacker can write, and the brief never says to treat them as untrusted data. That is a prompt-injection path into the "governed action" step.
- F-01-4 (P2) `.claude/agents/cloud-deployment.md:105`: The rule that only `azure-validate` may set the plan to `Validated` is prose only. The write-scope guard gives this role `.azure/`, where `deployment-plan.md` and its status live. The agent can edit the status itself. `azure-deploy` then sees `Validated` and proceeds, with only the human rule-3 prompt left as a check. It triggers under the time pressure the brief names.
- F-01-5 (P2) `.claude/agents/cloud-deployment.md:53`: The brief installs three third-party skills with `npx skills add microsoft/azure-skills` and no pinned version or commit. The brief itself rates `azure-validate` "Critical" because it can read RBAC and managed-identity configuration on a live subscription. A later change to that upstream repo would run with the operator's cloud credentials. The same unpinned install is in production-verification.md:50.
- F-01-6 (P2) `.claude/agents/cloud-deployment.md:4`: The brief cannot run with its declared tools, and the harness gives no safe fallback. It must invoke skills and run `azd up`, `terraform apply` and `az deployment`. The tool list has no Skill and no Bash. The operating rules say to hand back when a tool is missing. The only way to finish is the "inlined into a general-purpose agent" path, which has full tools. There the write-scope guard covers only Write and Edit, so a deploy role runs unrestricted. The same gap is in production-verification.md:4 (`azure-diagnostics`, `azure-reliability`, "rollback executed") and on-call-engineer.md:4 (execute runbook steps, auto-rollback).
- F-01-7 (P2) `.claude/agents/post-launch-learning.md:68`: A required close-out step cannot be done with the tool list. The agent must run `node <playbook>/execution/analyze.mjs .` to regenerate `runs/ANALYTICS.md` and `runs/dashboard.html`. It has no Bash. Its own quality bar says stale telemetry must never be left. In practice it either reports stale analytics or the stage never completes.
- F-01-8 (P2) `.claude/agents/customer-support.md:57`: The role writes per-customer account data, drafted replies and draft-vs-sent diffs into `runs/<slice-id>/`. `runs/` is tracked in git, because `.gitignore` excludes only `node_modules/` and `.azure/*/.env`. The brief has no rule to redact, tokenise or omit customer identifiers or PII in these artefacts. Other roles do have such a rule (backend-architect.md:89-91, analytics-engineer.md:81-84). Customer data would be committed to history. customer-success.md:56-65 has the same gap for account-level notes.
- F-01-9 (P2) `.claude/agents/security-privacy.md:4`: Four reviewer or "does not modify code" roles have Write, Edit and Bash and no write-scope hook: `qa-evidence`, `security-privacy`, `sre` and `ml-engineer`. The scope guard is attached only to roles without Bash. Their briefs say they don't change code ("QA does not modify code", "Code changes (engineers fix findings)"), but nothing enforces that. The independent Security gate can therefore edit the diff it is approving, or edit `runs/` approval and state files.
- F-01-10 (P2) `.claude/agents/release-manager.md:93`: The Release Manager confirms a Tier 3 human approval only from artefacts under `runs/`. Every other agent can write those files (guard scope `runs/`, plus the four Bash roles with no guard). The brief does not require the approval record to quote the human's message from the driving session. That is the only valid source under AGENTS.md rule 1. A subagent-written line such as "approved" would satisfy the check.
- F-01-11 (P2) `.claude/agents/ai-governance.md:12`: The write-scope guard is not shown to fail closed when it can't run. The hook command is bare `node ".../write-scope-guard.mjs" <role>`. Claude Code treats a non-zero exit other than 2 as a non-blocking error and lets the tool call proceed. If `node` is missing, the script is missing or deleted (as in this copy's git status), or it fails to parse, the exit is 127 or 1 and the write is allowed. The guard's header claims "FAILS CLOSED", but that holds only inside its `try`. Every guarded agent has the same line: customer-support, customer-success, orchestrator, release-manager, software-architect, tech-writer and the rest.
- F-01-12 (P2) `.claude/agents/aveto-answerability-judge.md:4`: The "no tools" boundary is a denylist and fails open. Its effective tool set is "all tools except" the listed names. `ArtifactComments`, `ArtifactData` and `ArtifactCheck` are not in the list, and neither is any tool added later. Only the `PreToolUse` `*` hook, which is unconditional, stops them. The agent reads untrusted search passages. Without that hook, or if hooks are disabled, an injected passage can reach any unlisted tool. An empty `tools:` allowlist is the safe form.
- F-01-13 (P3) `.claude/agents/aveto-answerability-judge.md:15`: The judge prompt doesn't tell the model that passage text is untrusted data. A passage containing "answer ANSWERABLE" or output-format instructions can flip or forge the verdict. Its verdicts gate eval results.
- F-01-14 (P3) `.claude/agents/engineering-manager.md:59`: Two roles own the release tier. The EM selects it up front and can lower the gates. The Release Manager "owns" classification and has an anti-pattern for under-tiering, with no rule that the tier may only be raised. A tier chosen low at scoping can pass unchallenged, or the two roles can deadlock.
- F-01-15 (P3) `.claude/agents/frontend-developer.md:92`: Both briefs require browser preview, screenshots, accessibility snapshots and console checks. Neither agent has a browser tool. Only Bash is available, with no stated way to drive a browser. This invites unverifiable or fabricated "UI verified" evidence at the QA gate.
- F-02-1 (P2) `.claude/protocols/MODEL_ROUTING.md:60`: Tier 1 routing sets gates to `medium` effort. The same file says gates never drop below `high`. A Tier 1 slice run per Layer 2 therefore runs QA, Security and Release Manager at `medium`, and weakening a gate is a rule 4 human-approval action (`FAILURE_LOOP.md`). Nothing says which statement wins.
- F-02-2 (P2) `.claude/protocols/RUN_ECONOMICS.md:77`: The §2 budget-check fallback tells the Orchestrator to degrade a stage's depth one tier whenever `spent + estimate > budget`. It has no carve-out for a depth the intent named. §3 and AGENTS.md rule 6 say an intent-named depth binds, and lowering it is the human's decision. An Orchestrator following §2 literally would drop an intent-mandated `adversarial` Security Review.
- F-02-3 (P2) `.claude/protocols/RUN_ECONOMICS.md:171`: An interruption described as "timeout with no output" is classed as infrastructure. Infrastructure interruptions do not consume the failure budget. `FAILURE_LOOP.md` counts a stage that exceeds its wall-clock budget as a failure with category `timeout`, and that failure does count against the retry budget. A hung stage can therefore be re-spawned indefinitely, because infrastructure interruptions have no cap anywhere. This breaks non-negotiable rule 3 (retries are bounded).
- F-02-4 (P3) `.claude/protocols/SLICE_STATE.md:16`: `Status` must be exactly one of four values. Other stops have no valid value: a denied approval ("stop the slice"), a budget stop-and-ask, and a design question. A denied slice can't be `done`, since `done` means landed and Post-Launch complete. The other three values mean an approval gate is open, retries are spent, or a stage is running. Resuming sessions and `runs/INDEX.md` would show a wrong or stale status.
- F-02-5 (P3) `.claude/protocols/RUN_ECONOMICS.md:90`: The "ceiling" concept has no field in the state template, and the pre-spawn hook reads only `Budget`. The text says spend between plan and ceiling needs no question, but §2 says to stop or degrade when `spent + estimate > budget`. If `Budget` holds the plan, the hook stops inside the allowed band. If it holds the ceiling, the plan isn't recorded.
- F-02-6 (P3) `.claude/protocols/RUN_ECONOMICS.md:56`: Two stage-estimate figures conflict, and the budget gate uses them. The §1 table budgets a review stage at 100k. The added note says to estimate a review stage at 50–60k, or 100–130k for adversarial depth. The note's "against a 70k estimate" uses the design figure for review stages. Estimates differ by about 2× depending on which line is followed.
- F-02-7 (P3) `.claude/protocols/TELEMETRY.md:58`: The provenance map and the budget definitions don't agree on the token metric. TELEMETRY says `stages[].tokens` is the sum of `input_tokens` + `output_tokens` per `agent_id`. The budgets, SLOs and density caps are calibrated on peak context (last request's `totalTokens`). `RUN_ECONOMICS` says the summed figure is typically 10–50× larger. `SLICE_STATE` says to set `Spent` from `usage.mjs` without saying which of its two measures. Using the OTel sum for `Spent` would trip the pre-spawn budget hook falsely. Separately, `agent_id` is not among the attributes listed for `api_request` or `tool_result`, and per-agent attribution is said to need beta spans.
- F-02-8 (P3) `.claude/protocols/TELEMETRY.md:33`: Span export config is inconsistent. The global protocol is gRPC, but the traces endpoint is port 4318 with an HTTP path (`/v1/traces`). Unless a traces-specific protocol is set, the spans exporter inherits gRPC and fails against an OTLP/HTTP endpoint. Spans (the only source of `subagent_type` and per-role cost) are then silently absent.
- F-02-9 (P3) `.claude/protocols/TELEMETRY.md:36`: The doc steers users to send run telemetry (model, cost, agent names, request/session ids) to hosted third-party backends and gives no warning. AGENTS.md and the approval rules treat a new data processor as a rule 6 human-approval stop. Telemetry is turned on by exporting env vars, and nothing here gates it or warns against pointing the exporter at a SaaS endpoint without approval.
- F-02-10 (P3) `.claude/protocols/HANDOFF_CHECK.md:40`: The check is described as "purely mechanical" and run by a haiku-class, `low`-effort validator. Two of its five checks are judgments. One is whether inherited safety invariants and non-goals are still present, not silently dropped. The other is whether a claimed file, capability or number exists. The safety-invariant carry-forward check therefore rests on the weakest model and effort tier, and a "Pass" lets the next stage proceed.
- F-02-11 (P3) `.claude/protocols/PIPELINE_SLOS.md:20`: The "Approval surfacing" SLO conflicts with the approval protocol. The SLO requires 100% of gated actions to be surfaced at Intake and measures that a request row exists before any implementation stage. The protocol lets rule 1–3 actions be confirmed at the Release Gate, so a compliant run that requests them late would register as an SLO miss.
- F-02-12 (P3) `.claude/protocols/FAILURE_LOOP.md:14`: The slice iteration cap ("6 stage re-entries") is a bound on the whole slice, but `STATE.md` has nowhere to record it. The Failure budget table is per stage, with `Retries used` and `Cap`. A cold-resumed session can't enforce the cap reliably. This breaks "State is durable" (rule 4) and the anti-runaway intent.
- F-03-1 (P2) `.agentic/PROJECT_CONTEXT.md:78`: The context file, which `AGENTS.md` tells every session to read first, says no generative model is used anywhere. The status and invariants files say the opposite: a `claude-sonnet-5-5` judge is wired in and sends data to Anthropic. A fresh Orchestrator or Security role that trusts this file will under-classify the slice, for example by missing approval rule 5 (real model/client) or the new data processor. Lines 49 and 73 are stale in the same way: they say `retrieve` involves no generative model and that slice 2 is "in progress", but status reports `docs-answerability-2` as closed.
- F-03-2 (P2) `.agentic/SAFETY_INVARIANTS.md:114`: INV-5 states Anthropic is "approved as data processor". The status file says Anthropic's DPA, account terms, retention and training use are UNKNOWN and deferred, and that the release action is not approved. INV-5 also lists personal data the operator's session sends: the user's email, git user name and organisation ID. Anyone reading the invariant gets false assurance that the processor was vetted. Each judge run sends that data, with the question and passages, to a processor whose terms are unrecorded. The approval record may cover the processor choice and not the terms, but neither file says so.
- F-03-3 (P3) `.agentic/LOCAL_COMMANDS.md:37`: The file says `test_wordpiece_matches_golden` fails until QA adds `tests/fixtures/wordpiece_golden.json`. The status file says that fixture exists and the "missing" claim was stale. A QA or implementer role following this file would chase a non-existent failure or recreate the fixture. The same line also omits that `test_sample_derivation_reproducible` fails in the committed tree, which status line 92 says it does. The "Full local regression" command above it (line 35) is therefore not known to pass.
- F-03-4 (P3) `.agentic/LOCAL_COMMANDS.md:4`: The file claims "Only commands that have been run are listed", but several rows say otherwise. The `eval` row says it was "not run against `evals/` by the implementer". The `eval --verdicts`, `record`, `diagnostics` and `add-set` rows say "Exercised only against synthetic ... in the tests". The `eval` row says it "may exit 1 by design", which is a gate that fails on the real dev set. A reader will take every row as verified against real data.
- F-03-5 (P3) `.agentic/LOCAL_COMMANDS.md:16`: The unescaped `\¦` inside backtick code in the markdown table (`file-rrf-v1\¦file-rerank-v1`, written here as `¦`) splits the row into extra columns. The Command cell is cut off at `[--ranking file-rrf-v1`, and the Network cell receives the rest. Rendered, or parsed as a table, the `retrieve` and `eval` commands are truncated and the network column is wrong. Line 24 escapes the pipe (`none\¦<comma list>`); lines 16 and 17 do not.
- F-03-6 (P3) `.agentic/SAFETY_INVARIANTS.md:3`: The file is still marked PARTIAL and has no invariant for decisions the owner already made. These are that credentials (API key, Azure login) are never handled by an agent, that there is a hard monthly spend cap and rate limit before the key is first used, and prompt injection from issue text. A real model is already wired through the judge, and the file's own rule says a missing invariant is not a permission. Gates that check "does the slice honour the invariants" therefore cannot catch a violation of these.
- F-04-2 (P2) `.claude/skills/aveto-judge-seen/SKILL.md:4`: The skill is described as "Eval-only", but its front matter has no `disable-model-invocation: true`, so the model can invoke it on its own. A model-invoked call supplies the `$ARGUMENTS` that reach the shell in finding 1, and it triggers a forked judge subagent, which spends budget and was meant to be operator-triggered. The sibling `aveto-judge` skill sets `disable-model-invocation: true` and has the rule "Never on your own". Fix: add `disable-model-invocation: true` to this skill.
- F-04-3 (P3) `.claude/skills/aveto-judge-seen/seen_payload.py:39-43`: `question_for` returns the first batch line whose id matches, scanning batch files in sorted order, and never checks for duplicates. If one id appears in two batch files, or twice in one, the judge silently gets the earlier question. That could mislabel eval results. The docstring promises refusal only for a missing line. Fix: collect all matches and refuse unless there is exactly one.
- F-06-1 (P2) `runs/docs-answerability-2/judge-check/stage7/diffs.md:30`: Two independent questions about the approval rules got `NOT_ANSWERABLE` because the judge's passages did not contain the "Always require approval" list. These are r003/a07 (`stage5/diffs.md:10`) and r124/g24 (`stage7/diffs.md:30`). `sample-eval.toml:19` says the answer sits in `docs/HUMAN_APPROVAL_RULES.md` under "'Always require approval'". The passage selection is dropping the most safety-relevant section, so any answerability gate will wrongly refuse "what needs my approval" questions. The report leaves this unexplained: the seven misses across the two stages carry no root-cause note. Fix: check why the retrieval ranking omits that section for these queries, and re-run a07 and g24 once it is fixed.
- F-06-2 (P2) `runs/docs-answerability-2/judge-check/stage7/diffs.md:10`: The judge returns `NOT_ANSWERABLE` when the docs answer with a documented "no". Three of the seven misses show this: g09, g10 and a15. In each, the judge's own reason states the answer. A user asking "can it deploy to AWS?" or "how do I uninstall?" would be told the docs cannot answer, when they do say "no, do this instead". The same prompt (`prompt_sha256 24b244d2…`) ran in both stages, so the second stage did not fix it. Fix: change the judge prompt so a passage that states a capability is absent, or gives a manual workaround, counts as `ANSWERABLE`. Re-run g09, g10 and a15 against the changed prompt.
- F-06-3 (P3) `runs/docs-answerability-2/judge-check/batch-1.txt:49`: `batch-1.txt` lists r049 as the 49th question of the batch. The audit and key treat r049 as outside the batch and never scored, so the two disagree on batch membership. Any tool that builds the batch from this file would count 49 spawns, or score the smoke question. The r049 smoke spend is also left out of the "Batch spawns: 48" totals. Fix: remove r049 from `batch-1.txt`, or have the audit say that file membership is not the batch definition.
- F-07-1 (P2) `runs/docs-retrieval-4/06-release-checklist.md:21`: The release checklist ticks gates `[x]` on evidence its author says it did not look at. The "bar unchanged" check was done from the git log, not a diff. Per-commit content, the six wording files and the code diff were also not read. The gate plan says missing evidence returns the slice to its owning stage. It also says a bar changed after the run voids the check. No later artefact (`STATE.md`, `07-close-out.md`) records the Orchestrator running the suggested `git diff` to close the gap. The Release Gate therefore passed fail-open on its own admitted limits. Trigger: any commit labelled "STATE" that edited `06-release-gate-plan.md` after 23d233c would go undetected.
- F-07-2 (P2) `runs/docs-retrieval-4/06-release-checklist.md:100`: The slice is closed `done` while the owner's intent box 3 is "NOT MET as written". The Release Manager, not the owner, decided it does not block. The gate plan allows the verdict only "if every gate in section 1 holds". Intent criteria belong to the owner. `STATE.md` sets "Closed" and "done" before any owner decision. The checklist itself says the owner "can… overrule me". Trigger: a session resuming from `STATE.md` sees `done` and no open item for the owner. Fix: hold the status at "awaiting owner decision on intent box 3", or record the owner's words accepting the deviation.
- F-07-3 (P3) `runs/docs-retrieval-4/STATE.md:21`: `STATE.md` is the durable resume file and contradicts itself. Line 21 still shows the INV-5 approval as `requested`, while line 31 shows it APPROVED on 2026-10-03T06:42:53Z. Line 24 shows the Release Gate as `in-progress` although steps 1–3 are all marked done and the slice is `done`. Line 11 `Updated` reads 2026-10-03T06:27:00Z, but events run to 2026-10-08. A cold `/agentic-resume` could re-request an approval already given or re-run a finished gate.
- F-07-4 (P3) `runs/docs-retrieval-4/03-implementation.md:38`: The implementation report's list of updated tests is incomplete. `test_retrieve_is_offline_with_cached_model` was also switched to `--ranking file-rerank-v1`. This is the INV-5-named test for default-path offline retrieval with the embedding model. It no longer exercises the default ranking. The tech spec required the report to list every updated test and called them "unchanged in meaning". `04-security-review.md:117` (A1) records the weakening for both tests, so the two artefacts disagree. Trigger: a reader of `03` believes only one INV-5 test changed.
- F-07-5 (P3) `runs/docs-retrieval-4/06-release-checklist.md:160`: The rollback step asserts the index hash is "stable across the slice's inputs". No artefact records a pre-change index hash. The only hash recorded is the single release-head value in `06-qa-result.md:11`. The checklist author also says it read no code diff. The claim rests only on Security's test of the flag on versus off, and that does not show the hash matches the pre-change build. Trigger: an owner skips an index rebuild after a revert on the strength of this sentence.
- F-07-6 (P3) `runs/docs-retrieval-4/03-implementation.md:60`: The spec's stop rule was triggered and not followed. If the 3.2 premise failed, Implementation was to report "explained, not fixed" and "stop for the owner". The implementer instead finished the slice, citing that the rest "does not depend on it". Security, the Release Gate and Close-out then ran on that basis. The owner's Addendum 3 shows they were engaged, but no artefact records an owner decision to continue.
- F-08-3 (P2) `runs/docs-abstention/04-security-review.md:45`: The Security Review says `.claude/` is unchanged. That held only for the range ending at 34c23d7. The pack v17 commit ebd6c6e, which changed `.claude/` hooks and agents, and the later README/ARCHITECTURE/status edits landed after the review and were never reviewed. The close-out still cites this review for "Product diff empty" at the final HEAD.
- F-08-4 (P2) `runs/docs-abstention/06b-stale-text-pass.md:42`: Edits went beyond the scope APPROVAL_RECORD-8 approved. The record lists README 49-51 plus the status line, and ARCHITECTURE lines 27, 85-87, 109-112, 132-134, 141-144. The pass also edited README 71-74, ARCHITECTURE L22-23, L39 and L147-148, and added an ADR 0007 pointer after L192. The Tech Writer had labelled L147-148 "(extra, same staleness)" and listed the "Not applied, outside the approved line list" items. The close-out then reports the pass as done "for the approved lines".
- F-08-5 (P2) `runs/docs-abstention/APPROVAL_RECORD-5.md:5`: One blanket "approve all" covered a rule 5 model download and three rule 4 safety-control items. The spec says INV-4 items 4-i and 4-ii are "approved separately", and the owner's own words do not show separate decisions. The 438 MB download ran under this record. The Release Manager admits "I did not see the surfacing message".
- F-08-6 (P2) `runs/docs-abstention/06-release-checklist.md:38`: Gates that were not run are ticked `[x]`. The text itself says nothing was re-run and that this "is not a claim that HEAD's suite passes". The skip of the full-suite/typecheck gate is "approved" by the Release Manager itself, listed as "not owner-approved". Gates fail closed (`AGENTS.md` rule 2), so an unrun gate should stay unchecked. The "n/a by identity" premise also fails once ebd6c6e is in the tree (F-08-2/3).
- F-08-7 (P3) `runs/docs-abstention/06-release-checklist.md:102`: A baseline figure in the release record conflicts with the tech spec's. The checklist says Bar 1 reaches 16/20 only with Bar 2 at 21/56 or lower. The spec gives the combined cell t=0.66, m=0.015 at 16/20 and 24/56 (42.9%). Both cannot be right. I could not read `02-baseline.md` to say which is.
- F-08-8 (P3) `runs/docs-abstention/STATE.md:12`: The state file can mislead a cold resume. "Updated" still reads 06:25Z, though the run continued past 21:43Z. Freeze, Label review and Scoring stay `pending` in a closed slice instead of "not run". The Architecture gate cell still lists owner decisions that were later made or lapsed.
- F-09-1 (P2) `runs/docs-answerability-2/STATE.md:33`: The durable stage table has no rows for the work after the tier 3 ruling. The missing rows are the SRE, Compliance and QA spawns, the tier 3 Release Manager verdict (`13-release-checklist-tier3.md`), the close-out (`15`) and the closure (`16`). The only Release Gate verdict row still describes the superseded tier 2 verdict as "GO WITH CONDITIONS (internally releasable, not announced; tier 2 as the intent names it)". The Docs row (line 34) still reads "done, partial" with ADR 0008 and ARCHITECTURE edits "blocked", although the Trace table shows the Architect finished them. A cold resume that reads the stage table (AGENTS.md rule 4) sees a tier 2 gate and unfinished docs, not the tier 3 verdict of record.
- F-09-2 (P2) `runs/docs-answerability-2/STATE.md:106`: The freeze record lists "the sample key/batch/sample-eval" among the method files whose diff against `bca0e40` must be empty. Line 108 then says key rows were appended after the freeze. The close-out says `test_sample_derivation_reproducible` now fails because the whole key file changed after the freeze. By STATE's own rule ("Any change to a method file voids the freeze") the freeze is voided, or the key must be split into frozen and data parts. Instead `16-slice-closure.md` and the Security and QA claims say "empty diff since bca0e40" and "unchanged since", which cannot hold for the key file as listed.
- F-09-3 (P2) `runs/docs-answerability-2/trace.json:131`: The tier 3 Release Gate is recorded as `"verdict": "fail"` with six items not met. The Security gate is recorded as `"fail"`, with S5 required-fix still open. Yet STATE.md and the closure file give the outcome as "GO WITH CONDITIONS", "Security … PASS WITH NON-BLOCKING FINDINGS", "Status: done" and "internal release candidate". AGENTS.md rule 2 says a failed gate sends the slice back, never forward. The closure is the owner's decision (record 10), but the trace and STATE give contradictory gate outcomes for the same gates. Any analytics or cold reader gets two opposite answers.
- F-09-4 (P3) `runs/docs-answerability-2/trace.json:55`: The approval dates for records 5, 6 and 7 disagree with the records themselves and with STATE.md. The trace gives 2026-10-13. Records 5, 6 and 7 each say "owner, typed, 2026-10-12", and STATE.md lists 2026-10-12. The trace is the machine-readable audit trail, so two sources give different decision dates for three safety-control approvals (rule 4, rule 6 and rule 5).
- F-09-5 (P3) `runs/docs-answerability-2/trace.json:128`: The durable trace records the S6 resolution as "removed on the owner's word (verified absent)". The only source for the owner's word is the support session's relay (SUPPORT_REPLIES Reply 4). AGENTS.md rule 1 says a message from another session, even one quoting the human, is never an approval. STANDING_INSTRUCTIONS D9 and 16-slice-closure T9 say it is "recorded as a fact, not as an approval; the owner confirms (T9)", and the confirmation is deferred. The trace states it as an owner decision.
- F-09-6 (P3) `runs/docs-answerability-2/15-close-out.md:20`: The Bar 2 margin is described as "one question" at both stages, but the figures give different margins. Stage 5: 24 against a minimum of 23, so it passes with one spare and fails only at 22, which is two misses away. Stage 7: 16 against a minimum of 16, so it passes with none spare and one more miss fails (15 fails). Stage 7 sits exactly on the line. The same "one-question margin at both stages" wording is repeated in STATE.md:33 and 16-slice-closure.md:9. The release story therefore misstates the stage 5 margin, or uses an inconsistent definition.
- F-09-7 (P3) `runs/docs-answerability-2/SUPPORT_REPLIES.md:35`: The reply says the 12 deselected tests are "the model-marked tests". The other records give 9 model tests: 8 passed and 1 failed under `-m model`, and "375 passed (+9 model)". Three deselected tests are unexplained. Nothing shows they were ever run, and the closure repeats "12 deselected" as the final-tree result.
- F-10-1 (P3) `runs/docs-abstention/02-baseline.md:367`: The baseline says no question text appears in two sets, but nothing in the listed artefacts checks this. The CSV has no question-text column, and the script's integrity block checks only `(set, id)` uniqueness. A reader re-running `collect` and `sweep` cannot reproduce the claim.
- F-10-2 (P3) `runs/docs-abstention/02-baseline-sweep.py:203`: This line looks like a duplicate check but does not check duplicates. It counts distinct `files` strings, not question texts, and then deletes the result. It is the only trace of a duplicate-text check in the script, so it may have given false assurance behind F-1.
- F-10-3 (P3) `runs/docs-abstention/02-baseline.md:366`: The baseline says `collect` and `sweep` exited 0, but no listed artefact records either exit code. `02-baseline-exit-codes.txt` covers only the four `eval` runs. `02-baseline-collect.txt` has a timing line and no exit status. `02-baseline-sweep-run.txt` has no exit line. The script cuts its stdout to the first 60 report lines (`md[:60]`), so the file ends mid-table at `t=0.63`.
- F-10-4 (P3) `runs/docs-abstention/02-baseline.md:30`: The text says the "always abstain" and "never abstain" extremes are both the `t=0.40` row. Only never-abstain is that row (B1 0/20, B2 56/56). Always-abstain is the `t≥0.81` rows (B1 20/20, B2 0/56). This is a factual error in the baseline the Architect reads.
- F-10-5 (P3) `runs/docs-abstention/02-baseline.md:70`: The sentence says Bar 2 "reaches 90% or more" only where Bar 1 is low, then cites `t=0.64` as an example at 89.3%, which is below 90%. This is a small numeric misstatement against the document's own integer rule for "≥ 90%".
- F-10-6 (P3) `runs/docs-abstention/00-slice-plan.md:6`: The plan header says the slice is awaiting the owner's confirmation and that nothing is spawned. The same run already holds a completed A2 baseline that cites an owner approval record. A session resuming from the plan would misread the slice state. The plan's own rule 4 says state lives in `STATE.md`, which is not in this file set.
- F-11-1 (P2) `runs/docs-retrieval-3-proof/02-qa-result.md:41 (repeated at runs/docs-retrieval-3-proof/03-close-out.md:19)`: The "rerank out" total for the four sets is 11, but the per-set rows and the raw eval outputs sum to 9. The row's own totals (56 − 52 = 4 net) are only consistent with 9 out and 5 in. 5 in and 11 out would give −6, not the −4 the verdict relies on. The close-out copies the wrong number as "5 in, 11 out".
- F-11-2 (P3) `runs/docs-retrieval-3-proof/02-qa-result.md:9 (and 03-close-out.md:29)`: The claim that the teardown abort is intermittent rests on exit codes that were not recorded. The QA result says the seven diagnostic runs exited "0 or 1, as the score dictates", but line 71 admits the wrapper captured no exit codes. The close-out cites `eval-run-1-heldout4.txt` for "exit 134", but that file holds only the libc++abi message. "Does not recur" can be inferred from the other seven files lacking that line. The exit-code claims cannot be checked from the artefacts.
- F-11-3 (P3) `runs/docs-retrieval-3-proof/retrieval-heldout-4.reviewed.toml:21-22`: The provenance header says "no source file below is a source in any earlier set". That is false. The reviewer-added labels reuse files that are sources in earlier sets. The drafter's own labels do too: `agents/release-manager.md` in f04 is a t01 source. Anyone reading the header will wrongly take the set as fully disjoint from the dev and held-out sets.
- F-11-4 (P3) `runs/docs-retrieval-3-proof/STATE.md:68 (also :11)`: The Trace "Total" row shows 0 tokens and 0 tool calls, although the two spawn rows above it sum to about 2.345M processed tokens and 51 tool calls. The close-out cites 2.34M for slice B, so the machine-read totals contradict it. `Updated` is still the start timestamp even though the stages ran until at least 07:25Z and the slice then closed.
- F-11-5 (P3) `runs/docs-retrieval-3-proof/STATE.md:24`: The Post-Launch stage is marked `done`, but the close-out says Post-Launch did not run. The state file would make a resuming session treat the Post-Launch gate as satisfied.
- F-12-1 (P2) `runs/docs-retrieval-2/01-scope.md:92`: The scope review widens both rule-4 approvals to cover slice B (`docs-retrieval-2-proof`), but the records limit them to `docs-retrieval-2`. The gate is scored only in slice B. Line 114 tells the Orchestrator to "reference both records rather than re-ask". STATE.md:72 then says slice B is created with "Approvals 1 to 3 referenced", and no new owner approval is recorded. This breaks AGENTS.md rule 1, "never infer approval".
- F-12-2 (P2) `runs/docs-retrieval-2/APPROVAL_RECORD-2.md:15`: The "Clarification" says the owner was told, in a quoted sentence, that the INV-4 test would be retired. That sentence is not in APPROVAL_REQUEST-2.md, the durable request. The Orchestrator added the clarification after the Engineering Manager flagged the gap, so the only evidence that the owner approved retiring a safety-invariant test is the Orchestrator's later claim.
- F-12-3 (P2) `runs/docs-retrieval-2/STATE.md:72`: The planned freeze check does not match the freeze scope in the tech spec. The spec freezes `evals/retrieval.toml`, `evals/retrieval-heldout.toml` and `evals/calibration-offtopic.toml`, but the command omits `evals/`, so an edit to a seen set after the freeze would go unnoticed. The command includes `tests`, which the spec says may change after the freeze, so it could fail for no reason. This is the check that makes the single scoring run valid.
- F-12-4 (P2) `runs/docs-retrieval-2/STATE.md:72`: STATE.md contradicts itself about what happens next. Line 72 starts with the outcome (slice B scored 11 of 16, gate FAILED). It then keeps the old instructions asking the owner to write the held-out set and the Orchestrator to create slice B, both already done. Line 7 still says slice B "starts after the owner commits the third held-out set". Line 11 `Updated` (17:49:56Z) predates the outcome and the 20:59:01Z restatement in APPROVAL_RECORD-3. A cold resume (AGENTS.md rule 4) is told to do finished work and cannot tell the gate failed from the Status line.
- F-12-5 (P3) `runs/docs-retrieval-2/APPROVAL_RECORD-3.md:3`: There is no APPROVAL_REQUEST-3.md. The record's "Request" field points to a tech-spec section, so the exact prompt the owner answered ("Approve the one-line note edit") is not preserved. The Orchestrator then reads the owner's later, wider wording, "recording that abstention moved to the check step", as only the reason for the edit. The edit was applied before the restatement, so the approved scope depends on the Orchestrator's reading.
- F-13-1 (P2) `tests/test_ingest.py:205`: The path-traversal member (`../escape.md`) is never in the include list, so the include filter drops it whether or not any traversal guard exists. The test would pass if `read_markdown` had no `..` protection. Only the symlink half is genuinely exercised, because `link.md` is in the include list.
- F-13-2 (P3) `tests/test_ingest.py:607`: `test_retrieve_is_offline_with_cached_reranker` and `test_retrieve_is_offline_with_cached_model` (line 729) inject `FakeEmbedder` and `FakeReranker`. `main` therefore never reaches any model-cache or download code, and the socket block can't be triggered. Both pass whatever the real cached-model path does. The comment says "a connection would raise RuntimeError", but no code path here can connect.
- F-13-3 (P3) `tests/fixtures/wordpiece_golden.json:8 (and tests/fixtures/gen_wordpiece_golden.py:33)`: The fixture's `generated_by.snippet` is meant to be the exact script that produced the answer key (`Path(__file__).read_text`). The committed script differs from it. Line 33 has a `# type: ignore[import-not-found]  # one-off…` suffix that the snippet lacks. The script writes `\u200b` as an escape where the snippet holds a literal U+200B. The recorded provenance therefore doesn't match the committed generator.
- F-13-4 (P3) `tests/test_search.py:471`: The golden-fixture test only requires `len(cases) >= 11`, but the generator emits 13 cases (it asserts `cases[9]` is the 512 truncation case). Deleting the two QA additions, mixed-case and the 150-char over-long word, would still pass. Case 13 is the only one covering the over-long-word `[UNK]` behaviour. `test_rerank.py:369` has no count check at all.
- F-13-5 (P3) `tests/conftest.py:31`: The "network disabled" guard patches only `socket.socket.connect`, `socket.create_connection` and `socket.getaddrinfo`. `connect_ex`, UDP `sendto` and `gethostbyname` stay live. Code that resolves or sends through those would reach the network in a test not marked `network`.
- F-14-1 (P2) `runs/docs-retrieval-3/00-slice-plan.md:7`: The depth decision rests on a false premise. The plan says nothing here changes a safety control, and the intent leaves its "safety control" Stakes box unticked. But the slice's own A2 is a rule 4 edit to INV-5, which is the egress and model-integrity control. Adversarial depth was ruled out on this basis. The Stakes box (`intent.md:73-75`) is what the plan's depth reasoning should follow, and it is also wrong.
- F-14-2 (P2) `runs/docs-retrieval-3/03-implementation.md:6`: The Implementer fetched a third file from the model repo, `tokenizer_config.json`, outside `ingest`. A1 authorised exactly two files and said "Nothing else from the repo". The request's "Smallest request" also excluded "other files in the repository". `APPROVAL_RECORD-1.md:7` only says the Implementer "verifies it first". It gives no permission to download.
- F-14-3 (P2) `runs/docs-retrieval-3/04-freeze.md:3`: The freeze is not proven by git order, which the scope made the proof of "frozen before any fourth set exists". `03-implementation.md` says ADR 0005 and `runs/docs-retrieval-3/` were untracked when the method commit was made, so this record is not in version control. The ordering rests on the Orchestrator's own statement that it has seen no fourth set. Nothing durable fixes when the freeze was recorded.
- F-14-4 (P3) `runs/docs-retrieval-3/04-freeze.md:4`: The freeze set is defined twice, and the two lists differ. The tech spec and the Implementer name eight files, and slice B QA is told to diff exactly those. `04-freeze.md` freezes a different, broader set. It adds `pyproject.toml`, `uv.lock`, `tests/`, `SAFETY_INVARIANTS.md` and three eval files, and drops the spec's per-file list. It also omits `evals/calibration-offtopic.toml`, which the scope lists as read-only. QA cannot tell which diff must be empty.
- F-14-5 (P3) `runs/docs-retrieval-3/04-freeze.md:7`: A known wrong label in the scoring path was accepted with circular reasoning. `evaluate.py` hardcodes `ranking: file-rrf-v1` in its report header, and `__main__` patches it with `str.replace` on the first occurrence. The Implementer asked for a decision before the freeze, and 12 of 13 files were used. The Orchestrator declined because editing `evaluate.py` would touch a method file. The freeze was not yet recorded, so one more file was available. The `str.replace` can also rewrite the wrong text if the string appears earlier in the header, for example in a path. I did not read the code.
- F-14-6 (P3) `runs/docs-retrieval-3/02-approval-request.md:133`: The pre-A1 checks the request itself marked as blocking were not done as specified. The request said that if the `vocab.txt` sha256 or the `do_lower_case` check fails, "Do not put A1 to the owner" and hand back. The Orchestrator did not open `tokenizer_config.json` and relied on a report from another session. It inferred the vocab hash from a git blob id instead of the file's sha256. The first was deferred to the Implementer and the second substituted. Both are disclosed to the owner. The void-on-fail rule was still turned into a post-approval check.
- F-14-7 (P3) `runs/docs-retrieval-3/STATE.md:68`: The durable state is internally inconsistent, which misleads a cold resume. The Trace Total row reads `0 \¦ 0` against stage rows totalling millions of tokens. `Updated` (line 11) still shows 04:56:00Z, before the approvals at 06:32Z and Implementation at 06:33–06:40Z. Line 9 says telemetry is "self-reported", but line 46 says the units come from `usage.mjs`.
- F-14-8 (P3) `runs/docs-retrieval-3/STATE.md:46`: A stale budget note is left unmarked as superseded and contradicts the live budget. It says slice A is 330k and slice B is 270k. Line 36 says 360k, and line 40 records the owner's move to A 360k and B 240k. Only the note at line 42 is labelled "superseded". A resumer could read 330k/270k as current.
- F-14-9 (P3) `runs/docs-retrieval-3/intent.md:3`: The intent's "Confirmed" status is the drafter's own assertion. Claude wrote the intent and also made its three binding decisions: the budget split, the label-review design, and the schedule constraint on drafting slices. The owner only delegated them ("make a decision for the three questions and commit"). There is no record of the owner's own words confirming the result. STATE and the plan then cite "confirmed by the owner 2026-09-30".
- F-15-1 (P2) `aveto_support/__main__.py:284`: The `retrieve` command never converts `search.QuestionError` into a CLI error. `retrieve()` raises it when the question has no searchable words, and `main()` doesn't list it among the exceptions it maps to exit 2. Running `python -m aveto_support retrieve ""` (an empty argument satisfies `nargs="+"`) or `retrieve " "` gives a raw traceback. The process exits 1, which the module docstring reserves for "eval below 80%". The judge path does convert it, in `judge.retrieve_for_judge`, so the two paths disagree.
- F-15-2 (P3) `aveto_support/index.py:305`: `load_index` only catches `OSError` around `read_text`. A corrupt or truncated index with invalid UTF-8 raises `UnicodeDecodeError`, a `ValueError` and not an `OSError`. It escapes as a traceback with exit 1 instead of `IndexFormatError` (exit 2, "re-run ingest"). The later `except ValueError` only wraps `json.loads`, not the read.
- F-15-3 (P3) `aveto_support/ingest.py:267`: The fetch error handlers don't cover `http.client.IncompleteRead`. GitHub's codeload typically serves the archive with chunked transfer encoding, and a connection cut mid-body makes `response.read` raise `IncompleteRead`. That is an `HTTPException`, not a `URLError`, `TimeoutError` or `OSError`. The result is an uncaught traceback instead of `FetchError` (documented exit 3). `download_model_file` has the same handler at line 320.
- F-15-4 (P3) `aveto_support/index.py:174`: The check that closes a fenced code block only matches the fence characters at the start of the line and ignores what follows. Under CommonMark a closing fence can't carry an info string. A line such as "```python" inside a "```" fence is treated as the closer. The rest of that code block is then scanned for headings, so a `# comment` line in a shell or Python block becomes a bogus heading. This splits passages wrongly and corrupts `heading_path`, `line_start` and `line_end`. It needs a fenced block that contains a same-length fence line with trailing text.

## Method and limits

- Files were mapped and tiered by a script from names, manifests and git history; reviewers read areas in order of risk until the cap.
- Reviewers worked in a copy with write tools, pushes and secret reads denied; the read-only check above is the evidence, not the instruction.
- Findings are from reading. None was reproduced unless its evidence says so.
- Recall and precision of this reviewer are reported in the calibration record, not here; a repo's report is only as good as that record.
