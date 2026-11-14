# Role profiles: how many agent roles a slice needs (proposal)

> **Proposal, written 2026-11-13 by the support session at the owner's request** ("when we are building AI native solutions or
> agents, do we need many roles?"). Nothing here changes a gate, a brief or the installer. It organises what the playbook already
> says (`docs/AGENTIC_SDLC.md` "When to compress stages", the four project packs, `docs/ORG_MODEL.md`) into profiles, and marks
> what is measured and what is a hypothesis. It is not measured: the experiment that would measure it is `docs/PRODUCTIVITY_AND_ORG_PLAN.md`
> step O3 ("fewer producing roles, same gates"), which has not run.

## The answer in one paragraph

A slice does not need many roles. It needs **a few producing roles and every checking role that its stakes require**, and the
playbook already lets the Engineering Manager choose that per slice. The 29 briefs are a menu, not a pipeline every change walks.
What must not shrink: the checking roles, the gates, the human decisions. What may shrink, and what O3 would test: the roles that
produce design artefacts before code.

## What outside sources say (read 2026-11-13; full note `docs/research/2026-11-company-agent-team-shapes.md`)

Anthropic, OpenAI, Google and Meta agree on four things: start simple; **keep producing and checking separate, with a checker that does
not share the producer's reasoning**; use mechanical checks beside model checks; and keep final ownership of what ships with a
person. **None publishes an org chart or a count of agent roles, and none shows that more specialisation beats fewer agents on coding
work.** Anthropic's own multi-agent post calls multi-agent a poor fit for most coding tasks (shared context, about 15 times the
tokens), and OpenAI's agent guide says to maximise a single agent first. The research reading: these sources support a few roles split
by function, not one specialist per SDLC activity, and a 29-role design has to rest on Aveto's own evidence.

**So this document's position is:** the **checking column is the part that is supported**; the **producing column is the part that is
only a hypothesis**, and the one most worth shrinking and measuring (O3).

## Two layers, kept apart

| Layer | What it is | How many | Fixed by |
|---|---|---|---|
| **Human roles** | Who is accountable for a decision: Owner of a Charter, Independent reviewer, Steward, Incident owner, Platform owner, Delivery owner | Few, and one person can hold several | `docs/ORG_MODEL.md` |
| **Agent roles** | A narrow brief with least-privilege tools and one artefact to hand on | As many as the slice's stakes need: the EM picks per slice and records why | `agents/`, `docs/AGENTIC_SDLC.md` |

The agent roles exist for **context discipline** (each reads only its input and writes one artefact), **least privilege**, and
**independence** (the agent that verifies never wrote the change). They are not a copy of a company's departments.

## What never compresses

From `docs/AGENTIC_SDLC.md`: "Gates never compress. Stages 9–11 run on every path." And: real user data, money, an irreversible
action, or an auth or safety-control change in the intent's Stakes means the full chain, however complete the intent is. So every
profile below contains **QA Evidence, Security & Privacy and the Release Manager**, plus the Orchestrator and Engineering Manager.

## Producing and checking roles

| Producing (may be merged or skipped by the EM) | Checking and gating (never merged with a producer, never skipped on a gate) |
|---|---|
| Market Researcher, Product Manager, UX Researcher, UI Designer, Software Architect, the engineers (Frontend, Backend, AI, ML), Analytics Engineer, Tech Writer | QA Evidence, Security & Privacy, Release Manager, Compliance Reviewer, AI Governance, Data Governance, the independent code reviewer |

The McKinsey talk (reviewed 2026-11-11, an unsourced seller's account) says top teams merge producing roles into a "definer" and a
"builder". That is the same split as the left column. The right column has no counterpart in that talk.

## Profiles (what the playbook's own compression rules leave running)

Read from `docs/AGENTIC_SDLC.md` stage numbers: 1 Intake, 2 Market Research, 3 Scope Review, 4 Discovery, 5 UX Research, 6 UI Design,
7 Architecture, 8 Implementation, 9 QA Evidence, 10 Security Review, 11 Release Gate, 12 Post-Launch.

| Profile | When | Stages that run | Added by the project pack or stakes |
|---|---|---|---|
| **A. Small change** (bug fix, refactor, docs) | trivial fix, pure refactor, docs only | 1, 3, 7 (a stub), 8, 9, 10, 11; 12 unless a pure refactor | none |
| **B. Well-specified feature** (the short path) | checkable "Done means", no open questions, no stakes beyond a screen | 1, 3, 7, 8, 9, 10, 11, 12 (6 only if the UI box is ticked) | none |
| **C. AI or agent product slice** | the product contains an agent or a model call | B, plus the **AI Engineer** (separate from Backend, `project-packs/ai-agent-product.md`), the **eval suite** as a gate, **AI Governance** to risk-tier it and own the evals, **FinOps** where a path has unbounded cost | Security at the depth the intent names: prompt injection, tool permissions, data leaving |
| **D. Data or ML slice** | a pipeline, warehouse model or trained model | B, plus Analytics Engineer, ML Engineer, Data Governance | **No Data Engineer exists** (backlog T50, trigger: a slice that is a pipeline) |
| **E. Enterprise or regulated** | audit, residency, SLAs | the full chain plus Compliance Reviewer, SRE, Customer Success, Tech Writer | `project-packs/enterprise-saas-future.md` |

**Reading the table:** an agent-product slice (profile C) adds roles at the **checking** end (evals, governance, cost, security
depth), not the producing end. That is the part of AI-native work where the risk is, and it is why a small agent can run on profile
B plus the AI Engineer and an eval gate.

## What would make the pipeline smaller, in this order

1. Profile choice per slice (already allowed): the EM records "profile B, plus AI Engineer".
2. Merge producing roles where context is shared (PM, UX, UI and Architect for a short-path feature) and keep every checker.
3. Let a checker run in a fresh context with read-only tools (the pack already does this for QA, Security and review).
4. Cut a role only after O3 shows the gates still catch the same things.

## What is measured, and what is not

- **Measured:** nothing about role counts. No run has compared a short chain with a long one on the same work.
- **Recorded elsewhere:** the short path cut agent-written design artefacts before code from six to two (`docs/AGENTIC_SDLC.md`).
  That is a design-time count, not a token or quality result.
- **The test:** O3 runs the same slice shape with fewer producing roles and the same gates, and compares gate catches (Q1),
  post-merge fixes (Q2) and token cost. If catches or fixes get worse, the roles stay. It needs a baseline from the same repo, so it
  waits on the P5 pilot repo.

## Open decisions for the owner

1. Adopt the profiles A to E as the vocabulary the Engineering Manager records in each slice plan ("profile B, plus AI Engineer"),
   with no change to any brief?
2. Treat the left column as mergeable first and the right column as never mergeable, as a stated rule in `docs/AGENT_ROLES.md`?
3. For the next AI-agent slice, run profile C with the producing roles merged (an O3 trial), or keep the full chain until P5?
