# Aveto

**The AI-native SDLC, in one install.**

Ship with the review process of a big engineering team. No badge required. Great
software shouldn't need a big company.

In a large engineering organisation, nothing reaches production until an architect,
an independent reviewer, security and a release gate have all signed off. That process — not
the headcount — is what separates a demo from production software, and until
now almost nobody outside those companies could run it.

Aveto encodes it as **28 specialist agents**: orchestrator, engineering manager,
product manager, designers, architects, developers, QA, security, release,
deployment, on-call and post-launch. Narrow roles hand off through artefacts,
the agent that verifies is never the agent that wrote the code, every gate fails
closed, and a **named human** approves one bounded Charter before the run
starts (the models, data, safety changes and end actions it may use) and
reviews the result at the end; nothing outside the Charter happens without
asking. The record continues past the merge, through deploy and production.

It runs on the **Claude Code subscription you already pay for** — not a metered
API bill — so there is no separate API charge. A run spends your plan's usage
window and checkpoints at every stage, so one that reaches a limit resumes where
it stopped; falling token prices make it cheaper to run without anything changing here. Today it is built for one person
on one subscription; shared team gates, a cross-developer run inventory and the
conformity export are **roadmap, not shipped** (`docs/VALIDATION_MATRIX.md`
marks exactly what has been run and what hasn't).

It plans every
run before it spends: each stage costed against a budget it checks *before* the
spend, each artefact written to disk as it goes, each stage resumable. Long
autonomous work fails for unglamorous reasons — it overspends, stalls, and
restarts from zero. This is the part that makes it finish.

> **This repository is the reusable source of truth for Aveto.**
> *(Formerly "Agentic SDLC". The `.agentic/` directory, `/agentic-*` commands and
> the `agentic-sdlc/trace@N` schema keep their names — renaming them would break
> every installed pack and invalidate existing run traces.)*
> Everything here is intentionally project-agnostic so it can be consumed by
> multiple products. Each product repo should keep its own `.agentic/` folder
> with project-specific context — never add product-specific files here.

`stash-seed` and `streak-seed` are where it has actually been run end to
end — see "Real runs, not just a worked example" below.

## What's here

```
agentic-sdlc/
  README.md                        ← you are here
  docs/                            ← how the system works
    GETTING_STARTED.md             ← start here — what you get, exact commands
    ARCHITECTURE.md                ← system design + data flow
    VALIDATION_MATRIX.md           ← how the playbook is proven, phase by phase
    LESSONS.md                     ← what building the reference app taught the process, with evidence
    PLATFORM_EVAL.md               ← the platform success scorecard + benchmark
    STANDARDS_WATCH.md             ← external standards/ecosystem tracker
    AGENTIC_SDLC.md                ← end-to-end lifecycle
    AGENT_ROLES.md                 ← who does what, who hands off to whom
    RELEASE_GATES.md               ← merge / release / launch gates
    OPERATING_MODEL.md             ← cadence, scope, context discipline
    HUMAN_APPROVAL_RULES.md        ← what a human MUST approve, always
    CODE_REVIEW.md                 ← the review layer: tiers from the diff, bounded rounds, evals from real incidents
    PROCESS_V2_PLAN.md             ← one Charter approval at the start, a review at the end
    review-evals/                  ← past mistakes as test cases for the review step
    REVIEW_MODE_PLAN.md            ← planned, not built: reviewing a codebase Aveto did not build (bars declared up front)
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
    cloud-deployment.md            ← enterprise overlay
    production-verification.md     ← enterprise overlay
    on-call-engineer.md            ← enterprise overlay
    data-analyst.md
    post-launch-learning.md
    customer-success.md            ← enterprise overlay
    customer-support.md            ← enterprise overlay
  templates/                       ← fill-in-the-blank artefacts
    INTENT_TEMPLATE.md             ← start here — the one page the human writes
    CHARTER_TEMPLATE.md            ← the one approval of a Process v2 run, approved by its hash
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
    ADR_TEMPLATE.md                ← one architecture decision, never edited once accepted
    AGENT_HANDOFF_TEMPLATE.md
    CUSTOMER_ISSUE_RESOLUTION_TEMPLATE.md
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
  site/                            ← the public site, deployed to aveto.dev
    index.html
    _headers                       ← CSP + security headers for Cloudflare Pages
  scripts/
    check-site.mjs                 ← site gates: structure, theme tokens, anchors, origins
    setup-deploy.sh                ← one-time Cloudflare + GitHub setup, idempotent
  execution/                       ← makes the playbook self-running (.claude/ pack)
    install.mjs                    ← generates subagents from briefs; installs the pack
    usage.mjs                      ← measured tokens per slice/stage, from harness logs
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

**[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)** — start here. What
you actually get, what it costs (real numbers from real runs), and the
exact commands for both the autonomous (Claude Code) and manual paths.

The model, briefly:

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
asking for **one approval at the start**, a Charter checked for completeness
and approved by its hash, and stopping only for an action the Charter does not
name. Every run also reviews its own diff with a reviewer that did not write it,
sets a risk tier from the change, and records each finding as fixed, rejected or
intentional (`docs/CODE_REVIEW.md`). The pack is at **version 24**; re-run the
installer to upgrade a repo, and it tells you what changed. See
[execution/README.md](execution/README.md).

## Core principles

- **Less setup, more value.** A user (or developer) hits something useful
  fast — not a long form.
- **Deterministic-first, LLM as adapter.** Real models are an interface
  the system uses through a placeholder that throws by default. Tests run
  without keys.
- **Human approval where it matters, given once.** Agents never send, submit,
  post, publish, push to main, deploy, or destroy unless a line of the
  approved Charter names that exact action; the default Charter allows none of
  them. Anything the Charter does not name still stops and asks.
- **Audit everything material.** Every state-changing automated action
  produces an audit event the user can inspect.
- **Small tasks, one commit each.** Token budgets and reviewer cognition
  both prefer narrow, well-scoped changes.

## Real runs, not just a worked example

[`examples/saved-items-bulk-delete/`](examples/saved-items-bulk-delete/) is
a *fictional* worked example — every template filled in, but no agent
actually ran it.

`stash-seed` and `streak-seed`, two sibling product repos, are where the
playbook has actually been driven end to end: seven traced slices between
them, real PRs, real merges, real gate catches (a security gap the test
suite missed, caught before it shipped — `saved-item-folders`), real
budget overruns recorded honestly rather than smoothed over. `docs/VALIDATION_MATRIX.md`
is the narrative account; `runs/*/trace.json` in either repo is the
primary evidence.

A third repo, [`aveto-support`](https://github.com/gpatwa/aveto-support), is the
product Aveto builds about itself, in public: nine traced runs, held-out gates
fixed before each run, and the failures recorded as results. Four pre-registered
checks failed (two retrieval gates, then two attempts to know when the docs do
not answer) before an attended judge, run in the operator's own Claude Code
session, passed a set it had never seen: 24 of 24 unanswerable questions refused
and 16 of 19 answerable ones kept, the second bar by one question, with retrieval
finding the right file for 19 of 24 (79.2%, under its own bar). It reached `main`
through the first run under a Charter (one typed approval, then a pull request) as
an internal, tier 3 feature with no data-processing agreement and nothing deployed.
See `docs/LESSONS.md` L47 to L51.

*(An earlier pointer here named `agentic-job-ops` as "the first reference
implementation." That repo has a `.agentic/` folder and zero runs — it was
never actually exercised. Corrected 2026-09-15 rather than left to mislead
the next reader.)*
