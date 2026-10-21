# Agent Roles

Every role in this playbook is a focused agent: it has one input artefact,
one output artefact, one set of decisions it owns, and one explicit handoff.
Roles never bleed into each other — if work crosses a boundary, the agent
hands off rather than reaching across.

This document is the role matrix. Each role has a longer brief in
`agents/<role>.md`.

---

## Why roles instead of one big agent

Single-agent systems suffer two failure modes:

1. **Context bloat.** A general agent ends up holding the PRD, the design
   spec, the architecture, the implementation, and the QA notes — and runs
   out of context window mid-task.
2. **Skill mixing.** Product judgement and security judgement use different
   reasoning patterns. Mixing them in one prompt produces mediocre output
   in both.

Roles fix both: each agent owns a narrow surface, hands off through a
template, and leaves the rest of the system out of its head.

---

## Role matrix

| Role | Input | Output | Hand off to | Brief |
|------|-------|--------|-------------|-------|
| Orchestrator | Human ask, or an intent the human wrote | Confirmed `intent.md` + slice plan | Market Researcher or Engineering Manager | `agents/orchestrator.md` |
| Market Researcher | Human ask + project context | Discovery brief | Engineering Manager (or PM if pre-approved) | `agents/market-researcher.md` |
| Engineering Manager | Slice plan or discovery brief | Scoped work item, gate map | PM or Architect | `agents/engineering-manager.md` |
| Product Manager | Scoped work item | PRD | UX Researcher | `agents/product-manager.md` |
| UX Researcher | PRD | Feature spec | UI Designer | `agents/ux-researcher.md` |
| UI Designer | Feature spec | UX spec | Software Architect | `agents/ui-designer.md` |
| Software Architect | Intent, + feature spec and UX spec when those stages ran | Tech spec, and the living `docs/ARCHITECTURE.md` + ADRs | Frontend / Backend / AI / ML, plus Analytics Engineer | `agents/software-architect.md` |
| Analytics Engineer | PRD success criteria + tech spec | Event contract + metric definitions | Engineers + QA Evidence | `agents/analytics-engineer.md` |
| Data Governance *(enterprise)* | Tech spec data deltas | Classification + retention + catalog | Compliance Reviewer + engineers | `agents/data-governance.md` |
| Frontend Developer | Tech spec | Code + targeted tests | QA Evidence | `agents/frontend-developer.md` |
| Backend Architect | Tech spec | Code + targeted tests | QA Evidence | `agents/backend-architect.md` |
| AI Engineer | Tech spec | Code + evals + targeted tests | QA Evidence | `agents/ai-engineer.md` |
| ML Engineer | Tech spec (modelling problem) | Model + dataset + model card + monitoring contract | Backend Architect + QA Evidence | `agents/ml-engineer.md` |
| QA Evidence | Diff + tech spec + the intent's "Done means" | QA evidence doc, each criterion verified verbatim | Security & Privacy | `agents/qa-evidence.md` |
| Security & Privacy | Diff + QA evidence | Pass/fail + findings | Release Manager | `agents/security-privacy.md` |
| Compliance Reviewer *(enterprise)* | Security pass + tech spec | Control mapping + evidence | Release Manager | `agents/compliance-reviewer.md` |
| AI Governance *(enterprise)* | Model card + intended use | Risk tier + eval coverage | Compliance Reviewer + Release Manager | `agents/ai-governance.md` |
| FinOps *(enterprise)* | Tech spec + projected volume | Cost model + budget + kill-switch | Release Manager | `agents/finops.md` |
| Tech Writer *(overlay)* | Diff + QA + specs | Doc delta, applied to README / CHANGELOG / `docs/` | Release Manager | `agents/tech-writer.md` |
| Release Manager | All artefacts | Go/no-go + checklist | Cloud Deployment (or Post-Launch where nothing deploys) | `agents/release-manager.md` |
| Cloud Deployment *(enterprise)* | Release go + tech spec | Deployed infrastructure + the approval recorded once | Production Verification | `agents/cloud-deployment.md` |
| Production Verification *(enterprise)* | Live deploy + safety invariants + success criteria | Health verdict under real traffic — go or roll back | SRE + Post-Launch | `agents/production-verification.md` |
| Data Analyst | Question + warehouse + experiment spec | Readout (experiment or post-launch) | Asking agent (PM, Post-Launch, Release Manager) | `agents/data-analyst.md` |
| Post-Launch Learning | Released change + Data Analyst readout | Post-launch review | Orchestrator | `agents/post-launch-learning.md` |
| Site Reliability Engineer *(enterprise)* | Tech spec + monitoring contracts | SLOs, runbooks in `docs/runbooks/`, incident reviews | On-Call Engineer + Post-Launch + Orchestrator | `agents/sre.md` |
| On-Call Engineer *(enterprise)* | Alert or support escalation + SRE's runbook | Mitigation, recovery check, or a new slice at Intake | Orchestrator + Post-Launch | `agents/on-call-engineer.md` |
| Customer Success *(enterprise)* | Live customer signal | Customer signal review | Post-Launch + Orchestrator | `agents/customer-success.md` |
| Customer Support *(enterprise)* | Inbound issue + account context | Drafted reply — never sent — plus escalation | On-Call Engineer + Customer Success | `agents/customer-support.md` |

---

## Engineering Manager — first-class role

The EM is not a coordinator that passes notes around. The EM is the agent
that defends the team from itself: from doing too much in one slice, from
skipping a gate because it feels slow, from letting one engineer's context
window become the bottleneck.

Concrete EM responsibilities:

- **Scope.** Reject slices that are too large for one focused implementation
  pass. Demand a split.
- **Sequencing.** Decide which stages run, which are compressed, and in
  what order. Document why.
- **Context discipline.** Make sure each downstream agent gets only what it
  needs — not the whole repo, not the whole PRD if a one-paragraph excerpt
  will do.
- **Gates.** Confirm the right release gates apply for this slice.
- **Handoffs.** Verify each handoff artefact is complete before the next
  agent starts, so they don't have to re-derive context.
- **Escalation.** If a downstream agent is stuck because of missing input,
  the EM is the agent that escalates back up the chain rather than letting
  the engineer guess.

The EM's output is captured in `templates/AGENT_HANDOFF_TEMPLATE.md`. See
`agents/engineering-manager.md` and `prompts/em-scope-review.md`.

---

## Handoff principles

Every handoff carries:

1. **The artefact** (the thing the next agent reads).
2. **The minimal repo context** (file paths, commands, test names — not
   "the whole codebase").
3. **The success criteria** (what "done" looks like for this stage).
4. **The constraints inherited from prior stages** (e.g. "no submit code
   path", "don't weaken the existing approval gate").

If a handoff is missing any of these, the receiving agent rejects it back
to the EM rather than guessing. In an autonomous run, a cheap handoff check
enforces exactly this at every stage boundary before the next agent starts
(`execution/pack/protocols/HANDOFF_CHECK.md`).

---

## Roles you will not see here

This system intentionally does not include:

- **Project manager** — the EM owns sequencing, the Orchestrator owns
  conversation with the human.
- **Generic developer** — front, back, and AI work have different
  invariants (UI states vs. data integrity vs. eval safety). One generic
  role would erase that.
- **Generic DevOps** — day-to-day platform plumbing belongs to the Backend
  Architect and the Release Manager. (Production *reliability* is now a
  first-class enterprise overlay role — see below.)
- **Go-to-market / marketing / pricing** — out of build-time scope. The
  Orchestrator surfaces market and customer signal (from the Market
  Researcher and Customer Success) to the human, who owns positioning,
  pricing, and launch. The playbook informs these decisions; it doesn't
  make them.

### Enterprise overlay roles

These roles sit outside the universal lifecycle and switch on for
enterprise / governance / operational contexts (see
`project-packs/enterprise-saas-future.md`):

- **Data Governance** (`agents/data-governance.md`) — classifies new data
  and sets residency, retention, and the catalog / RoPA, alongside
  Architecture.
- **AI Governance** (`agents/ai-governance.md`) — risk-tiers AI
  capabilities (NIST AI RMF / EU AI Act / ISO 42001) and owns the eval
  suite as a standing asset.
- **Compliance Reviewer** (`agents/compliance-reviewer.md`) — maps a change
  to named controls and produces auditor-grade evidence, between Security
  and the Release Gate.
- **FinOps** (`agents/finops.md`) — cost-per-action, unit economics, and
  kill-switches for unbounded-cost paths.
- **Tech Writer** (`agents/tech-writer.md`) — user docs, API reference, and
  release notes matched to what actually shipped, before the Release Gate.
- **Site Reliability Engineer** (`agents/sre.md`) — SLOs, error budgets,
  runbooks, and blameless incident reviews in production.
- **Customer Success** (`agents/customer-success.md`) — account-level
  customer signal feeding Post-Launch, triangulated against the Data
  Analyst's quant.

## Reviews and approval in a run (Process v2)

Two things sit around the roles above rather than being roles. The **review
layer** (`docs/CODE_REVIEW.md`) has a reviewer that did not write the change look
at the diff, sets a risk tier from the change, bounds the fix-and-review rounds at
three, and records each finding as fixed, rejected or intentional; the Release
Manager checks the record. The **Charter** (`templates/CHARTER_TEMPLATE.md`) is the
one approval a run needs: the Orchestrator's setup phase builds and tests what the
run needs, drafts the Charter, and the human approves it by its hash.

## Delegate, check, own (pack v26)

Adapted from OpenAI's *Building an AI-Native Engineering Team* (delegate, review, own),
with one change: **"checked by" is always an agent or a gate, never a person.** The
human's part in every role sits in two places only, the Charter before the run and
`END_REVIEW.md` after it, so naming it adds no stop. Each agent file carries its own row;
`execution/tests/install.test.mjs` fails if a role's "human owns" points anywhere else.

| Role | The agent does | Checked by | The human owns |
|---|---|---|---|
| AI Engineer | Splits deterministic logic from model calls, writes the prompts and adapters, and builds the evals. | AI Governance (eval coverage) and Security & Privacy (hostile input). | which model runs, at which effort, and where (Charter C3), and what data it may receive (Charter C4); eval results are in `END_REVIEW.md`. |
| AI Governance | Sets the AI risk tier, judges eval coverage and curates the golden set. | the Compliance Reviewer and the Release Manager. | the data processors and their terms (Charter C4); the decision to ship is the merge in `END_REVIEW.md`. |
| Analytics Engineer | Specifies events, fields and metric definitions, and checks a success criterion is measurable. | the Data Analyst and QA. | the success measures in the intent (Charter C1.1). |
| Backend Architect | Implements the services and schema to the spec, with targeted tests recorded failing before the change. | QA (re-runs the new tests on the base commit to confirm they fail there), the review layer and Security & Privacy. | the merge, decided from `END_REVIEW.md`; the end action itself is Charter C8.2. |
| Cloud Deployment | Plans and validates the deployment; only `azure-validate` sets Validated. | `azure-validate` and Production Verification. | any deploy, which is an irreversible action named with its target and rollback in Charter C8.3, or it does not happen. |
| Compliance Reviewer | Maps the slice to the required controls and checks the evidence would satisfy an auditor. | the Release Manager. | the processors and their terms (Charter C4); certification and legal questions are raised in `END_REVIEW.md`, never decided in the run. |
| Customer Success | Separates signal from noise in customer themes and proposes candidate slices. | the Data Analyst (significance). | what to build next (the next Charter's C1); candidates are listed in `END_REVIEW.md`. |
| Customer Support | Triages issues and drafts replies; never sends. | the On-Call Engineer for technical causes. | sending, which never happens in a run unless Charter C8.3 names it (rule 1); drafts are listed in `END_REVIEW.md`. |
| Data Analyst | Cuts the data, judges sample size and writes the readout with its caveats. | the Analytics Engineer (metric definitions) and the Post-Launch Learning stage. | the decision the readout informs, listed in `END_REVIEW.md`. |
| Data Governance | Classifies each data element, sets retention and residency, and checks each data flow is permitted. | the Compliance Reviewer and Security & Privacy. | which processor receives which data (Charter C4). |
| Engineering Manager | Sizes the slice, sequences the stages, bundles each stage's context and picks the gate tier. | the Orchestrator (against the confirmed plan) and the Release Manager, which re-derives the tier from the diff. | the plan and its non-goals (Charter C1.2, C1.3) and the depths that may not be lowered (Charter C7). |
| FinOps | Builds the cost model, budget thresholds and kill-switch rules. | the budget guard hook (checked before each step) and the Release Manager. | the budget and its hard cap (Charter C2); a bet on negative unit economics is raised in `END_REVIEW.md`. |
| Frontend Developer | Implements the UI to the spec within existing patterns, with targeted tests recorded failing before the change. | QA (fail-first re-run, browser preview of every state), the review layer and Security & Privacy. | the merge, decided from `END_REVIEW.md`; the end action itself is Charter C8.2. |
| ML Engineer | Trains and evaluates models, fixes the splits and the held-out set. | AI Governance and the Data Analyst. | the models and data processors (Charter C3, C4) and what a failed pre-registered check means (Charter C8.1). |
| Market Researcher | Gathers the evidence for and against the problem and recommends proceed, more discovery or drop. | the Product Manager, who builds on it and may push back, and the Orchestrator. | whether to build at all (the intent, Charter C1.1); pricing or positioning questions are listed in `END_REVIEW.md`. |
| On-Call Engineer | Triages, attributes root cause and runs runbook steps already authorised. | the SRE, and the Release Manager for any code fix. | any novel infrastructure action, which stops the run (Charter section 9) unless Charter C8.3 names it. |
| Orchestrator | Splits the ask into slices, routes each stage, runs to the Charter's edge and writes `END_REVIEW.md`. | the Release Manager (every gate) and `charter-check` (the Charter is complete before the run). | the intent, the plan and the budget (Charter C1, C2), and every stop in Charter section 9; reads the run in `END_REVIEW.md`. |
| Post-Launch Learning | Captures carry-forward, judges whether the slice met its goal and proposes follow-ups. | the Data Analyst and the Orchestrator. | what to build next (the next Charter's C1); the judgement is in `END_REVIEW.md`. |
| Product Manager | Defines the problem, the success criteria and what is out of scope. | the Engineering Manager (scope review) and QA, which verifies each "Done means" line. | the intent and its non-goals (Charter C1.1, C1.3), and whether the result met it (`END_REVIEW.md`). |
| Production Verification | Watches the post-deploy window and runs the recorded rollback on a regression. | the SRE. | the deploy and its rollback (Charter C8.3); the outcome is in `END_REVIEW.md`. |
| QA Evidence | Verifies every "Done means" line, runs the regression sequence, confirms new tests fail on the base commit, and keeps only generated tests that pass the acceptance filter. | the Release Manager. | what a failed check means for the run (Charter C8.1); the evidence is summarised in `END_REVIEW.md`. |
| Release Manager | Classifies the release tier, checks every gate and lands the slice as the Charter's end action. | the review layer (which re-derives the tier from the diff) and `verify-approvals.mjs` (approval records checked against GitHub). | the end action and any irreversible action (Charter C8.2, C8.3); a gate bypass is never in the run (Charter section 9); the merge is decided from `END_REVIEW.md`. |
| Security & Privacy | Reviews the diff adversarially, classifies severity and marks blockers. | the Release Manager, and the review evals in `docs/review-evals/` for the review step itself. | the review depth, which may not be lowered (Charter C7.1), and any safety-text change (Charter C5); open findings are in `END_REVIEW.md`. |
| Site Reliability Engineer | Sets SLOs and SLIs, paging rules, incident severity and runbooks. | the On-Call Engineer (who runs the runbooks) and the Release Manager. | new pre-authorised runbook steps and any SLA commitment (Charter C8.3, or raised in `END_REVIEW.md`). |
| Software Architect | Decides the data shape, the service boundaries, the adapters and the rollback story. | Security & Privacy, the review layer and the Release Manager. | any new model, processor or safety text (Charter C3, C4, C5); architecture changes are listed in `END_REVIEW.md`. |
| Tech Writer | Writes the user-facing docs, release notes and migration guidance a change needs. | the Software Architect (no contradiction with the architecture record) and QA. | public wording, seen in `END_REVIEW.md` before the merge. |
| UI Designer | Designs layout, copy, components and state transitions. | the Frontend Developer (feasibility) and QA (a screenshot or snapshot of every state). | the shipped look and words, seen in `END_REVIEW.md` before the merge. |
| UX Researcher | Names the personas, the happy path, the edge cases and the accessibility floor. | the UI Designer, who designs to it, and QA, which checks each state renders. | who the slice is for (the intent, Charter C1.1); the result is shown in `END_REVIEW.md`. |
