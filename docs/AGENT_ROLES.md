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
| Orchestrator | Human ask | Slice plan | Market Researcher or Engineering Manager | `agents/orchestrator.md` |
| Market Researcher | Human ask + project context | Discovery brief | Engineering Manager (or PM if pre-approved) | `agents/market-researcher.md` |
| Engineering Manager | Slice plan or discovery brief | Scoped work item, gate map | PM or Architect | `agents/engineering-manager.md` |
| Product Manager | Scoped work item | PRD | UX Researcher | `agents/product-manager.md` |
| UX Researcher | PRD | Feature spec | UI Designer | `agents/ux-researcher.md` |
| UI Designer | Feature spec | UX spec | Software Architect | `agents/ui-designer.md` |
| Software Architect | Feature spec + UX spec | Tech spec | Frontend / Backend / AI / ML, plus Analytics Engineer | `agents/software-architect.md` |
| Analytics Engineer | PRD success criteria + tech spec | Event contract + metric definitions | Engineers + QA Evidence | `agents/analytics-engineer.md` |
| Data Governance *(enterprise)* | Tech spec data deltas | Classification + retention + catalog | Compliance Reviewer + engineers | `agents/data-governance.md` |
| Frontend Developer | Tech spec | Code + targeted tests | QA Evidence | `agents/frontend-developer.md` |
| Backend Architect | Tech spec | Code + targeted tests | QA Evidence | `agents/backend-architect.md` |
| AI Engineer | Tech spec | Code + evals + targeted tests | QA Evidence | `agents/ai-engineer.md` |
| ML Engineer | Tech spec (modelling problem) | Model + dataset + model card + monitoring contract | Backend Architect + QA Evidence | `agents/ml-engineer.md` |
| QA Evidence | Diff + tech spec | QA evidence doc | Security & Privacy | `agents/qa-evidence.md` |
| Security & Privacy | Diff + QA evidence | Pass/fail + findings | Release Manager | `agents/security-privacy.md` |
| Compliance Reviewer *(enterprise)* | Security pass + tech spec | Control mapping + evidence | Release Manager | `agents/compliance-reviewer.md` |
| AI Governance *(enterprise)* | Model card + intended use | Risk tier + eval coverage | Compliance Reviewer + Release Manager | `agents/ai-governance.md` |
| FinOps *(enterprise)* | Tech spec + projected volume | Cost model + budget + kill-switch | Release Manager | `agents/finops.md` |
| Tech Writer *(overlay)* | Diff + QA + specs | Doc delta + release notes | Release Manager | `agents/tech-writer.md` |
| Release Manager | All artefacts | Go/no-go + checklist | Post-Launch | `agents/release-manager.md` |
| Data Analyst | Question + warehouse + experiment spec | Readout (experiment or post-launch) | Asking agent (PM, Post-Launch, Release Manager) | `agents/data-analyst.md` |
| Post-Launch Learning | Released change + Data Analyst readout | Post-launch review | Orchestrator | `agents/post-launch-learning.md` |
| Site Reliability Engineer *(enterprise)* | Tech spec + monitoring contracts | SLOs, runbooks, incident reviews | Post-Launch + Orchestrator | `agents/sre.md` |
| Customer Success *(enterprise)* | Live customer signal | Customer signal review | Post-Launch + Orchestrator | `agents/customer-success.md` |

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
to the EM rather than guessing.

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
