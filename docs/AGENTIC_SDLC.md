# Agentic SDLC — End-to-End Lifecycle

This is the canonical lifecycle a slice of work moves through from a business
ask to a shipped, reviewed, learned-from change. Each stage has an owning
agent, an input artefact, an output artefact, and an explicit handoff.

The lifecycle is the same whether the unit of work is a phase, a feature, or
a single bug. Skip stages only when the project pack explicitly allows it.

---

## Stages

```
1. Intake          → Orchestrator
2. Scope Review    → Engineering Manager
3. Discovery       → Product Manager
4. UX Research     → UX Researcher
5. UI Design       → UI Designer
6. Architecture    → Software Architect
7. Implementation  → Frontend / Backend / AI Engineers
8. QA Evidence     → QA Evidence Agent
9. Security Review → Security & Privacy Agent
10. Release Gate   → Release Manager
11. Post-Launch    → Post-Launch Learning Agent
```

Not every slice needs every stage. The Engineering Manager (stage 2) is
responsible for compressing the lifecycle when the change is small (e.g. a
trivial bug fix may collapse stages 3–6 into a single tech spec).

---

## 1. Intake — Orchestrator

**Input:** Free-form ask from a human or a parent agent.

**Output:** A short slice plan that names which stages will run, which agents
will be invoked, and what the success criteria are.

**Hand off to:** Engineering Manager.

The Orchestrator is the only agent that talks directly to the human user
across stages. It owns the agenda for the slice. See `agents/orchestrator.md`.

---

## 2. Scope Review — Engineering Manager

**Input:** Slice plan from the Orchestrator.

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

## 3. Discovery — Product Manager

**Input:** Scoped work item from the EM.

**Output:** Filled `templates/PRD_TEMPLATE.md` — problem, target user,
success criteria, scope, non-goals, open questions.

**Hand off to:** UX Researcher.

---

## 4. UX Research — UX Researcher

**Input:** PRD.

**Output:** Filled `templates/FEATURE_SPEC_TEMPLATE.md` — user stories, key
journeys, edge cases, accessibility considerations.

**Hand off to:** UI Designer.

---

## 5. UI Design — UI Designer

**Input:** Feature spec.

**Output:** Filled `templates/UX_SPEC_TEMPLATE.md` — layout, states (loading,
empty, error, success), copy, interaction notes, component reuse map.

**Hand off to:** Software Architect.

---

## 6. Architecture — Software Architect

**Input:** Feature spec + UX spec.

**Output:** Filled `templates/TECH_SPEC_TEMPLATE.md` — data model deltas,
service surface, adapter boundaries, integration points, rollback plan,
audit/feedback/usage event additions.

**Hand off to:** Frontend / Backend / AI Engineers as appropriate.

---

## 7. Implementation — Frontend / Backend / AI Engineers

**Input:** Tech spec.

**Output:** Code changes plus targeted tests, all in a single, narrowly-
scoped commit (or a small set of related commits). See
`docs/OPERATING_MODEL.md` for the one-task-one-commit rule.

**Hand off to:** QA Evidence Agent.

Engineers MUST run typecheck, the targeted test files, the full test suite,
and the build before reporting completion. They never report success based
on intent — only on observed evidence.

---

## 8. QA Evidence — QA Evidence Agent

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

## 9. Security Review — Security & Privacy Agent

**Input:** Implementation diff + QA evidence.

**Output:** Pass / fail with explicit findings. New audit events, new
secrets surfaces, new external data flows, and any prompt-injection or
log-leak risks must be addressed before this stage passes.

**Hand off to:** Release Manager.

---

## 10. Release Gate — Release Manager

**Input:** All prior artefacts.

**Output:** Filled `templates/RELEASE_CHECKLIST_TEMPLATE.md` and a
go/no-go decision. The Release Manager checks every gate in
`docs/RELEASE_GATES.md` and confirms human approval for any action listed
in `docs/HUMAN_APPROVAL_RULES.md`.

**Hand off to:** Post-Launch Learning Agent (after the release lands).

---

## 11. Post-Launch — Post-Launch Learning Agent

**Input:** Released change + any production signals available.

**Output:** Filled `templates/POST_LAUNCH_REVIEW_TEMPLATE.md` — what we
learned, what surprised us, what to fold into the next slice's PRD.

**Hand off to:** Orchestrator (closes the loop).

---

## When to compress stages

- **Trivial bug fix:** Skip 3–5. EM hands directly to Engineer with a tech
  spec stub. QA + Security still run.
- **Pure refactor with no user-facing change:** Skip 3–5 and 11.
- **Documentation-only change:** Skip 6–9 but still get the EM scope review
  and a release gate check (because docs can leak claims that affect users).

The EM owns the decision and records the rationale in the slice plan.
