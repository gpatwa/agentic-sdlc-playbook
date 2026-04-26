# Agentic SDLC

A reusable, multi-agent software development lifecycle for AI-built SaaS products.

This playbook is the source of truth for how a team of specialised agents — orchestrator,
engineering manager, product manager, designers, architects, developers, QA, security,
release, and post-launch — collaborate to ship safe, high-quality software with a small
human in the loop.

> **This folder is designed to be extracted into a standalone reusable repo.**
> Everything under `agentic-sdlc/` is intentionally project-agnostic so it can be
> lifted as-is into a separate `agentic-sdlc` repository and consumed by multiple
> products. Anything specific to a particular product lives in that product's
> `.agentic/` folder (one per product) — never inside `agentic-sdlc/` itself.
> When extracting, copy the entire `agentic-sdlc/` tree; leave `.agentic/` behind.

It lives inside `agentic-job-ops/` for now so it can evolve alongside its first user.
The intent is to extract it into a standalone repo (`agentic-sdlc`) once the structure
stabilises. Anything project-specific belongs in `.agentic/` (one folder per product).

## What's here

```
agentic-sdlc/
  README.md                        ← you are here
  docs/                            ← how the system works
    AGENTIC_SDLC.md                ← end-to-end lifecycle
    AGENT_ROLES.md                 ← who does what, who hands off to whom
    RELEASE_GATES.md               ← merge / release / launch gates
    OPERATING_MODEL.md             ← cadence, scope, context discipline
    HUMAN_APPROVAL_RULES.md        ← what a human MUST approve, always
  agents/                          ← role briefs, one per agent
    orchestrator.md
    engineering-manager.md
    product-manager.md
    ux-researcher.md
    ui-designer.md
    software-architect.md
    frontend-developer.md
    backend-architect.md
    ai-engineer.md
    qa-evidence.md
    security-privacy.md
    release-manager.md
    post-launch-learning.md
  templates/                       ← fill-in-the-blank artefacts
    FEATURE_SPEC_TEMPLATE.md
    PRD_TEMPLATE.md
    UX_SPEC_TEMPLATE.md
    TECH_SPEC_TEMPLATE.md
    QA_EVIDENCE_TEMPLATE.md
    RELEASE_CHECKLIST_TEMPLATE.md
    AGENT_HANDOFF_TEMPLATE.md
    POST_LAUNCH_REVIEW_TEMPLATE.md
  prompts/                         ← copy-paste prompts to invoke each agent
    orchestrator.md
    em-scope-review.md
    product-brief.md
    ux-audit.md
    architect-plan.md
    developer-task.md
    qa-evidence.md
    security-review.md
    release-gate.md
  project-packs/                   ← guidance per product archetype
    b2c-saas.md
    ai-agent-product.md
    browser-automation-product.md
    enterprise-saas-future.md
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
