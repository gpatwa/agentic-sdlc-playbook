# Agentic SDLC — End-to-End Lifecycle

This is the canonical lifecycle a slice of work moves through from a business
ask to a shipped, reviewed, learned-from change. Each stage has an owning
agent, an input artefact, an output artefact, and an explicit handoff.

The lifecycle is the same whether the unit of work is a phase, a feature, or
a single bug. Skip stages only when the project pack explicitly allows it.

---

## Stages

```
 1. Intake           → Orchestrator
 2. Market Research  → Market Researcher                       (optional)
 3. Scope Review     → Engineering Manager
 4. Discovery        → Product Manager
 5. UX Research      → UX Researcher
 6. UI Design        → UI Designer
 7. Architecture     → Software Architect
       (in parallel) → Analytics Engineer  (instrumentation contract)
 8. Implementation   → Frontend / Backend / AI / ML Engineers
 9. QA Evidence      → QA Evidence Agent
10. Security Review  → Security & Privacy Agent
11. Release Gate     → Release Manager
12. Post-Launch      → Post-Launch Learning Agent
       (data spine)  → Data Analyst        (experiment + metric readout)
```

Not every slice needs every stage. The Engineering Manager (stage 3) is
responsible for compressing the lifecycle when the change is small (e.g. a
trivial bug fix may collapse stages 2 and 4–7 into a single tech spec).

---

## 1. Intake — Orchestrator

**Input:** Free-form ask from a human or a parent agent.

**Output:** A short slice plan that names which stages will run, which agents
will be invoked, and what the success criteria are.

**Hand off to:** Market Researcher (when problem validation is needed) or
Engineering Manager (when the problem is already validated).

The Orchestrator is the only agent that talks directly to the human user
across stages. It owns the agenda for the slice. See `agents/orchestrator.md`.

---

## 2. Market Research — Market Researcher (optional)

**Input:** The original human ask plus project context.

**Output:** Filled `templates/DISCOVERY_BRIEF_TEMPLATE.md` — problem
hypothesis, evidence the problem is real, segment, today's workaround,
competitive landscape, disconfirming evidence, and a recommendation
(proceed / more discovery / drop).

**Hand off to:** Engineering Manager (or directly to Product Manager when
the EM has pre-approved a discovery loop).

This stage is the first defence against building the wrong thing. Skip it
when the problem is well-understood (a known bug, a defined gap with prior
evidence) and run it when the ask is fuzzy, novel, or expensive. See
`agents/market-researcher.md`.

---

## 3. Scope Review — Engineering Manager

**Input:** Slice plan from the Orchestrator (or discovery brief from the
Market Researcher).

**Output:** A scoped, sized work item with explicit non-goals, gates, and
the list of artefacts that will be produced. The EM is the first defender
of context-window discipline: they break work down so each subsequent stage
fits in one focused agent invocation.

**Hand off to:** Product Manager (if discovery is needed) or directly to
Software Architect (if the ask is well understood).

The EM is a first-class role. They are accountable for: (a) work being the
right size, (b) the right gates being applied, (c) artefacts being
discoverable, and (d) the team not painting itself into a context-limit
corner. See `agents/engineering-manager.md`.

---

## 4. Discovery — Product Manager

**Input:** Scoped work item from the EM.

**Output:** Filled `templates/PRD_TEMPLATE.md` — problem, target user,
success criteria, scope, non-goals, open questions.

**Hand off to:** UX Researcher.

---

## 5. UX Research — UX Researcher

**Input:** PRD.

**Output:** Filled `templates/FEATURE_SPEC_TEMPLATE.md` — user stories, key
journeys, edge cases, accessibility considerations.

**Hand off to:** UI Designer.

---

## 6. UI Design — UI Designer

**Input:** Feature spec.

**Output:** Filled `templates/UX_SPEC_TEMPLATE.md` — layout, states (loading,
empty, error, success), copy, interaction notes, component reuse map.

**Hand off to:** Software Architect.

---

## 7. Architecture — Software Architect

**Input:** Feature spec + UX spec.

**Output:** Filled `templates/TECH_SPEC_TEMPLATE.md` — data model deltas,
service surface, adapter boundaries, integration points, rollback plan,
audit/feedback/usage event additions.

**Hand off to:** Frontend / Backend / AI / ML Engineers as appropriate,
plus the Analytics Engineer in parallel.

The Analytics Engineer runs alongside this stage to turn the PRD success
criteria into a concrete event contract and metric definitions, so the
implementation wires real measurement rather than placeholders. See
`agents/analytics-engineer.md`.

---

## 8. Implementation — Frontend / Backend / AI / ML Engineers

**Input:** Tech spec (and event contract from the Analytics Engineer for
any surface that emits events).

**Output:** Code changes plus targeted tests, all in a single, narrowly-
scoped commit (or a small set of related commits). See
`docs/OPERATING_MODEL.md` for the one-task-one-commit rule.

The ML Engineer is invoked when the slice depends on a model the team
trains, fine-tunes, or selects from a candidate set — distinct from the
AI Engineer, who wires hosted-LLM adapters and prompts. ML Engineer
outputs include a model card and monitoring contract. See
`agents/ml-engineer.md`.

**Hand off to:** QA Evidence Agent.

Engineers MUST run typecheck, the targeted test files, the full test suite,
and the build before reporting completion. They never report success based
on intent — only on observed evidence.

---

## 9. QA Evidence — QA Evidence Agent

**Input:** Implementation diff + tech spec.

**Output:** Filled `templates/QA_EVIDENCE_TEMPLATE.md` — what was tested,
how, what passed, what failed, what was deferred.

**Hand off to:** Security & Privacy Agent.

QA Evidence is independent. It re-runs the full local regression command
(named in `.agentic/LOCAL_COMMANDS.md` — typically `npm run qa:mvp` or a
project-pack equivalent), spot-checks the UI in the browser preview where
the change is observable, and verifies the safety invariants listed in
`.agentic/SAFETY_INVARIANTS.md`.

---

## 10. Security Review — Security & Privacy Agent

**Input:** Implementation diff + QA evidence.

**Output:** Pass / fail with explicit findings. New audit events, new
secrets surfaces, new external data flows, and any prompt-injection or
log-leak risks must be addressed before this stage passes.

**Hand off to:** Release Manager.

---

## 11. Release Gate — Release Manager

**Input:** All prior artefacts.

**Output:** Filled `templates/RELEASE_CHECKLIST_TEMPLATE.md` and a
go/no-go decision. The Release Manager checks every gate in
`docs/RELEASE_GATES.md` and confirms human approval for any action listed
in `docs/HUMAN_APPROVAL_RULES.md`.

**Hand off to:** Post-Launch Learning Agent (after the release lands).

---

## 12. Post-Launch — Post-Launch Learning Agent

**Input:** Released change, any production signals available, and the
Data Analyst's experiment / metric readout when one applies.

**Output:** Filled `templates/POST_LAUNCH_REVIEW_TEMPLATE.md` — what we
learned, what surprised us, what to fold into the next slice's PRD.

**Hand off to:** Orchestrator (closes the loop).

The Data Analyst is the data spine of this stage: they take the metric
definitions the Analytics Engineer registered against the PRD success
criteria, run the readout, and hand the result to the Post-Launch agent
for synthesis. For slices shipped behind an experiment, the Data Analyst
also runs the experiment readout following
`templates/EXPERIMENT_SPEC_TEMPLATE.md`. See `agents/data-analyst.md`.

---

## When to compress stages

- **Trivial bug fix:** Skip 2 and 4–6. EM hands directly to Engineer with
  a tech spec stub. QA + Security still run.
- **Pure refactor with no user-facing change:** Skip 2, 4–6, and 12.
- **Documentation-only change:** Skip 7–10 but still get the EM scope
  review and a release gate check (because docs can leak claims that
  affect users).
- **Well-understood ask (known bug, defined gap):** Skip 2 (Market
  Research). The EM records why in the slice plan.
- **No new measurement or modelling:** Skip the Analytics Engineer parallel
  in 7 and the Data Analyst spine in 12.

The EM owns the decision and records the rationale in the slice plan.

---

## Enterprise & operations overlay

The 12 stages above are the universal product-slice lifecycle. Enterprise,
governance, and production-operations contexts add roles that **overlay**
the lifecycle rather than replace a stage. Enable them via the enterprise
project pack; the EM records which overlay roles apply in the slice plan.

- **Compliance Review — Compliance Reviewer.** Runs between Security Review
  (stage 10) and the Release Gate (stage 11) for any slice touching
  regulated data, audit logs, access control, or contractual commitments.
  Maps the change to named controls (SOC 2, ISO 27001, GDPR, and ISO 42001
  for AI) and produces auditor-grade evidence. Output:
  `templates/COMPLIANCE_REVIEW_TEMPLATE.md`. See
  `agents/compliance-reviewer.md`.
- **Reliability — Site Reliability Engineer.** Owns production after
  release: SLOs, error budgets, alerting, runbooks, and incident response.
  Receives the monitoring contracts produced in Architecture (stage 7) and
  by the ML Engineer (stage 8). Turns incidents into blameless postmortems
  (`templates/INCIDENT_REVIEW_TEMPLATE.md`) whose action items feed the
  Orchestrator as new slices. See `agents/sre.md`.
- **Customer Signal — Customer Success.** Feeds Post-Launch (stage 12) with
  account-level qualitative signal — support themes, health scores, renewal
  risk — triangulated against the Data Analyst's quantitative readout.
  Output: `templates/CUSTOMER_SIGNAL_REVIEW_TEMPLATE.md`. See
  `agents/customer-success.md`.
- **Data Governance — Data Governance Agent.** Runs alongside Architecture
  (stage 7) for slices that add or change data. Classifies each new data
  element, sets residency and retention, and updates the catalog / RoPA the
  Compliance Reviewer checks against. Output:
  `templates/DATA_GOVERNANCE_REVIEW_TEMPLATE.md`. See
  `agents/data-governance.md`.
- **AI Governance — AI Governance Agent.** For AI / ML slices, assigns a
  risk tier (NIST AI RMF / EU AI Act / ISO 42001), confirms the tier's
  obligations, and owns the eval suite as a standing asset (the Eval
  Curator function). Output: `templates/AI_RISK_ASSESSMENT_TEMPLATE.md`.
  See `agents/ai-governance.md`.
- **Cost — FinOps Agent.** For slices with compute / LLM / third-party
  cost, models cost-per-action and unit economics and requires a tested
  kill-switch for unbounded-cost paths. Output:
  `templates/COST_BUDGET_TEMPLATE.md`. See `agents/finops.md`.
- **Documentation — Tech Writer.** Before the Release Gate, produces the
  user-facing doc delta — help, API reference, changelog, release notes —
  matched to what actually shipped (the diff / QA), not the PRD's intent.
  Output: `templates/DOC_DELTA_TEMPLATE.md`. See `agents/tech-writer.md`.

These roles are additive: a B2C MVP can ignore them; an enterprise
deployment turns them on.
