# Standards & Ecosystem Watch

External developments that affect this playbook's design, and where each
one lands. Reviewed on a cadence (last: 2026-07-13). This file exists so
deferred items aren't lost between reviews — it's the counterpart to
`VALIDATION_MATRIX.md` (which tracks *our* validation) for *external* change.

## Applied (already folded in)

| Development | What we did | Where |
|-------------|-------------|-------|
| EU AI Act — Commission enforcement begins **2 Aug 2026** | Cited enforcement dates + GPAI Code of Practice as the compliance-demonstration vehicle | `agents/compliance-reviewer.md`, `templates/AI_RISK_ASSESSMENT_TEMPLATE.md` |
| ISO/IEC 42005:2025 (AI system impact assessment) | Named as the standard our AI-risk assessment realises | `agents/ai-governance.md`, `templates/AI_RISK_ASSESSMENT_TEMPLATE.md` |
| NIST GenAI Profile (AI-600-1) | Cited alongside base RMF functions for GenAI-specific risk | `agents/ai-governance.md`, template |
| DORA 2025 metric changes (MTTR→Failed Deployment Recovery Time; +Rework Rate) | Refreshed the DORA mapping | `execution/pack/protocols/PIPELINE_SLOS.md` |

## Deferred to Phase 2 (fold in as *enforcement*, not prose)

| Development | Why it fits Phase 2 | Trigger |
|-------------|---------------------|---------|
| **OWASP Top 10 for Agentic Applications** (ASI01–ASI10, Dec 2025) | Phase 2 is security-hardening; add an ASI mapping to `THREAT_MODEL_TEMPLATE.md` + the Security scan list, and **self-apply to the execution pack** (it is itself an agentic app) | Phase 2 start |
| Eval-gated merge (Braintrust pattern) | Becomes a CI required-check when CI exists | Phase 2 (CI) |
| Failure-category taxonomy (Patronus pattern) | A category column on the Trace / `FAILURE_LOOP` table makes Rework Rate diagnosable | Phase 2 |
| Cheap-evaluator handoff checks (Galileo pattern) | A haiku-class validator on each artefact handoff — continuous evals of the pipeline itself; gives the routing table's haiku tier a standing job | Phase 2 |
| Agent/run inventory (control-plane pattern) | `runs/INDEX.md` + a fleet section in `agentic.config.json` | Phase 2 |

## Watch (no action yet — building now would be rework)

| Development | Status | Re-evaluate when |
|-------------|--------|------------------|
| MCP + A2A under Linux Foundation AAIF; **joint interoperability spec expected Q3 2026** | Our artefact-file handoffs remain the source of truth; approval semantics can't be expressed in-protocol (see `execution/ADAPTERS.md`) | Q3 2026 — then consider an A2A adapter under `execution/<harness>/` |
| NIST AI RMF Profile for Critical Infrastructure (Apr 2026 concept note) | Not applicable unless a product targets critical infrastructure | If a product pack needs it |
| NIST RMF Playbook refresh (~2×/year) | Minor; citations stay generic to survive it | Next review |

## How to review

Each review: (1) move anything now-actioned to **Applied**; (2) check the
**Watch** triggers; (3) re-date this file. A development that changes a
safety or approval invariant is not a watch item — it's an immediate patch.
