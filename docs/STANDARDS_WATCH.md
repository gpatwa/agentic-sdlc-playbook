# Standards & Ecosystem Watch

External developments that affect this playbook's design, and where each
one lands. Reviewed on a cadence (last: 2026-08-09). This file exists so
deferred items aren't lost between reviews — it's the counterpart to
`VALIDATION_MATRIX.md` (which tracks *our* validation) for *external* change.

## Applied (already folded in)

| Development | What we did | Where |
|-------------|-------------|-------|
| EU AI Act — **enforcement now LIVE (2 Aug 2026)**, no longer a future date | Cited enforcement dates + GPAI Code of Practice as the compliance-demonstration vehicle. **Partially applied**: the citation landed, the Article 50 product obligation did not — see the live-obligation note below | `agents/compliance-reviewer.md`, `templates/AI_RISK_ASSESSMENT_TEMPLATE.md` |
| ISO/IEC 42005:2025 (AI system impact assessment) | Named as the standard our AI-risk assessment realises | `agents/ai-governance.md`, `templates/AI_RISK_ASSESSMENT_TEMPLATE.md` |
| NIST GenAI Profile (AI-600-1) | Cited alongside base RMF functions for GenAI-specific risk | `agents/ai-governance.md`, template |
| DORA 2025 metric changes (MTTR→Failed Deployment Recovery Time; +Rework Rate) | Refreshed the DORA mapping | `execution/pack/protocols/PIPELINE_SLOS.md` |

## Deferred to Phase 2 (fold in as *enforcement*, not prose)

| Development | Why it fits Phase 2 | Trigger |
|-------------|---------------------|---------|
| **OWASP Top 10 for Agentic Applications** (ASI01–ASI10, Dec 2025) | Phase 2 is security-hardening; add an ASI mapping to `THREAT_MODEL_TEMPLATE.md` + the Security scan list, and **self-apply to the execution pack** (it is itself an agentic app) | ✅ applied — `THREAT_MODEL_TEMPLATE` ASI section, `security-privacy` scan, `execution/SECURITY.md` |
| Eval-gated merge (Braintrust pattern) | Becomes a CI required-check when CI exists | ✅ pattern codified in `RELEASE_GATES` "Enforcing gates in CI"; per-product eval suites plug in |
| Failure-category taxonomy (Patronus pattern) | A category column on the Trace / `FAILURE_LOOP` table makes Rework Rate diagnosable | ✅ applied — `FAILURE_LOOP` categories + `SLICE_STATE` column |
| Cheap-evaluator handoff checks (Galileo pattern) | A haiku-class validator on each artefact handoff — continuous evals of the pipeline itself; gives the routing table's haiku tier a standing job | ✅ applied — `HANDOFF_CHECK.md` protocol |
| Agent/run inventory (control-plane pattern) | `runs/INDEX.md` + a fleet section in `agentic.config.json` | ✅ applied — `RUN_INVENTORY.md` + `/agentic-status` |

## Watch (no action yet — building now would be rework)

| Development | Status | Re-evaluate when |
|-------------|--------|------------------|
| **NIST COSAiS — SP 800-53 control overlays for AI**, two of the five use cases targeting agentic systems directly (**single-agent and multi-agent**) | Not yet mapped. This is the closest thing to a control framework aimed at what this playbook *is*, and it lands on the same surfaces OWASP Agentic Top 10 did | Overlays published → map to `agents/compliance-reviewer.md` + `templates/THREAT_MODEL_TEMPLATE.md`, and **self-apply to the execution pack** (it is itself a multi-agent system) |
| MCP + A2A under Linux Foundation AAIF; **joint interoperability spec still in development, tracking Q3 2026** (checked 2026-08-09 — not yet shipped; the A2A governance spec targets the same quarter) | Unchanged. Our artefact-file handoffs remain the source of truth; approval semantics can't be expressed in-protocol (see `execution/ADAPTERS.md`). Every major vendor except OpenAI now supports both protocols, so the stack is settling — but settling is not shipped | Spec ships → consider an A2A adapter under `execution/<harness>/`. Not before: adopting a protocol whose interop story is unfinished buys nothing here, where every agent runs in one harness |
| **Alternate agent harnesses** proliferating (DeepSeek `dsh` "everything is a plugin", plus Cursor / Codex / Cline) | The adapter *pattern* in `execution/ADAPTERS.md` is **validated** by their existence — harness churn is the argument for keeping the spec provider-neutral, not a gap. `dsh` is developer-preview with breaking changes, so an adapter against it is guaranteed rework | Write a second `execution/<harness>/` adapter only when the first (Claude Code) is proven in a real run **and** a concrete need appears — not on harness novelty alone |
| NIST AI RMF Profile for Critical Infrastructure (Apr 2026 concept note) | Not applicable unless a product targets critical infrastructure | If a product pack needs it |
| NIST RMF Playbook refresh (~2×/year) | Minor; citations stay generic to survive it | Next review |

## Live obligation — EU AI Act Article 50 (added 2026-08-09)

The Commission's enforcement powers activated **2 Aug 2026**: model access for
evaluation, mandated corrective measures, and fines up to **€15M or 3% of
worldwide turnover**. GPAI obligations themselves have applied since Aug 2025 —
what changed is that someone can now act on them.

The part that reaches a *product* built with this playbook is **Article 50
transparency**: disclose to users that they are interacting with AI, and attach
provenance signals (watermark or metadata) to generated or altered content.

This does not bite today only because the one AI capability we ship —
`stash-seed`'s summariser — is deterministic-first behind a placeholder adapter
that throws unconditionally. **It bites the moment the rule-5 slice wires a real
model.** Recorded here rather than in a backlog because the trigger is a slice
someone will one day run, not a date someone will one day notice.

Carried into `agents/compliance-reviewer.md` as a rule-5 precondition.

## How to review

Each review: (1) move anything now-actioned to **Applied**; (2) check the
**Watch** triggers; (3) re-date this file. A development that changes a
safety or approval invariant is not a watch item — it's an immediate patch.
