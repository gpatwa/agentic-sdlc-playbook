# Agentic SDLC

A reusable, multi-agent software development lifecycle for AI-built SaaS products.

This playbook is the source of truth for how a team of specialised agents — orchestrator,
engineering manager, product manager, designers, architects, developers, QA, security,
release, and post-launch — collaborate to ship safe, high-quality software with a small
human in the loop.

> **This repository is the reusable source of truth for Agentic SDLC.**
> Everything here is intentionally project-agnostic so it can be consumed by
> multiple products. Each product repo should keep its own `.agentic/` folder
> with project-specific context — never add product-specific files here.

Agentic Job Ops is the first reference implementation.

## What's here

```
agentic-sdlc/
  README.md                        ← you are here
  docs/                            ← how the system works
    ARCHITECTURE.md                ← system design + data flow (start here)
    VALIDATION_MATRIX.md           ← how the playbook is proven, phase by phase
    PLATFORM_EVAL.md               ← the platform success scorecard + benchmark
    STANDARDS_WATCH.md             ← external standards/ecosystem tracker
    AGENTIC_SDLC.md                ← end-to-end lifecycle
    AGENT_ROLES.md                 ← who does what, who hands off to whom
    RELEASE_GATES.md               ← merge / release / launch gates
    OPERATING_MODEL.md             ← cadence, scope, context discipline
    HUMAN_APPROVAL_RULES.md        ← what a human MUST approve, always
  agents/                          ← role briefs, one per agent
    orchestrator.md
    market-researcher.md
    engineering-manager.md
    product-manager.md
    ux-researcher.md
    ui-designer.md
    software-architect.md
    analytics-engineer.md
    data-governance.md             ← enterprise overlay
    frontend-developer.md
    backend-architect.md
    ai-engineer.md
    ml-engineer.md
    ai-governance.md               ← enterprise overlay
    qa-evidence.md
    security-privacy.md
    compliance-reviewer.md         ← enterprise overlay
    finops.md                      ← enterprise overlay
    tech-writer.md                 ← overlay
    release-manager.md
    sre.md                         ← enterprise overlay
    data-analyst.md
    post-launch-learning.md
    customer-success.md            ← enterprise overlay
  templates/                       ← fill-in-the-blank artefacts
    DISCOVERY_BRIEF_TEMPLATE.md
    PRD_TEMPLATE.md
    FEATURE_SPEC_TEMPLATE.md
    UX_SPEC_TEMPLATE.md
    TECH_SPEC_TEMPLATE.md
    MIGRATION_PLAN_TEMPLATE.md
    THREAT_MODEL_TEMPLATE.md
    DATA_GOVERNANCE_REVIEW_TEMPLATE.md
    EXPERIMENT_SPEC_TEMPLATE.md
    MODEL_CARD_TEMPLATE.md
    AI_RISK_ASSESSMENT_TEMPLATE.md
    QA_EVIDENCE_TEMPLATE.md
    COMPLIANCE_REVIEW_TEMPLATE.md
    VENDOR_RISK_TEMPLATE.md
    COST_BUDGET_TEMPLATE.md
    RELEASE_CHECKLIST_TEMPLATE.md
    CHANGE_REQUEST_TEMPLATE.md
    DOC_DELTA_TEMPLATE.md
    OBSERVABILITY_BOOTSTRAP_TEMPLATE.md
    INCIDENT_REVIEW_TEMPLATE.md
    POST_LAUNCH_REVIEW_TEMPLATE.md
    CUSTOMER_SIGNAL_REVIEW_TEMPLATE.md
    AGENT_HANDOFF_TEMPLATE.md
  prompts/                         ← copy-paste prompts to invoke each agent
    orchestrator.md
    market-research.md
    em-scope-review.md
    product-brief.md
    ux-audit.md
    architect-plan.md
    analytics-contract.md
    data-governance-review.md
    developer-task.md
    ml-training.md
    ai-risk-review.md
    qa-evidence.md
    security-review.md
    compliance-review.md
    cost-review.md
    release-gate.md
    doc-update.md
    reliability-review.md
    experiment-readout.md
    customer-signal.md
  project-packs/                   ← guidance per product archetype
    b2c-saas.md
    ai-agent-product.md
    browser-automation-product.md
    enterprise-saas-future.md
  examples/                        ← end-to-end worked examples
    saved-items-bulk-delete/       ← one slice traced through every stage
  execution/                       ← makes the playbook self-running (.claude/ pack)
    install.mjs                    ← generates subagents from briefs; installs the pack
    pack/                          ← commands, protocols, CLAUDE template
```

And in the product repo (`/.agentic/`):

```
.agentic/
  PROJECT_CONTEXT.md     ← what this product is, who it serves, current focus
  SAFETY_INVARIANTS.md   ← invariants that MUST hold across releases
  LOCAL_COMMANDS.md      ← the exact commands an agent runs locally
  CURRENT_MVP_STATUS.md  ← where the MVP stands today
```

## How to use

1. **Pick the project pack.** Read `project-packs/<archetype>.md` and identify
   which invariants and gates apply.
2. **Stage the project's `.agentic/` folder.** It tells every agent what's
   in scope, what's out, what to never break.
3. **Open with the orchestrator.** Use `prompts/orchestrator.md` to plan a
   slice of work. The orchestrator decomposes it into agent handoffs.
4. **Hand off through the lifecycle.** Each agent reads its brief in
   `agents/<role>.md`, produces an artefact from `templates/`, and hands
   off to the next agent using `templates/AGENT_HANDOFF_TEMPLATE.md`.
5. **Hit the gates.** No code merges without the gates in
   `docs/RELEASE_GATES.md`. No automated send/submit/destructive action
   without the approvals in `docs/HUMAN_APPROVAL_RULES.md`.

## Worked example

[`examples/saved-items-bulk-delete/`](examples/saved-items-bulk-delete/)
traces a single slice — bulk-delete for a fictional B2C SaaS — through every
lifecycle stage, with a filled artefact at each step and a sample product
`.agentic/`. Start there to see how the templates chain and where the gates
fire.

## Running it autonomously

The [`execution/`](execution/) pack turns these briefs into a self-running
system. Install it into a product repo (`node <playbook>/execution/install.mjs .`)
and a Claude Code session can drive the lifecycle with `/agentic-slice` —
delegating each stage to a generated subagent, tracking resumable state, and
**pausing for human approval** where the rules require it. See
[execution/README.md](execution/README.md).

## Core principles

- **Less setup, more value.** A user (or developer) hits something useful
  fast — not a long form.
- **Deterministic-first, LLM as adapter.** Real models are an interface
  the system uses through a placeholder that throws by default. Tests run
  without keys.
- **Human approval where it matters.** Agents never send, submit, post,
  publish, push to main, deploy, or destroy without explicit approval.
- **Audit everything material.** Every state-changing automated action
  produces an audit event the user can inspect.
- **Small tasks, one commit each.** Token budgets and reviewer cognition
  both prefer narrow, well-scoped changes.

## First example project

[Agentic Job Ops](../) is the first product built with this playbook. See
`/.agentic/` in the same repo for its concrete adapter files. Use it as a
worked example of how the templates fill in for a real product.
