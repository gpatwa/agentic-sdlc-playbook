# Worked Example — Bulk-delete saved items (Stash)

A paper run of one slice through the full lifecycle, for a fictional B2C
SaaS called **Stash** (a saved-items / bookmarks app).

## The ask

> "Users with lots of saved items can only delete them one at a time. Let
> them select several and delete them together — without making accidental
> mass-deletion easy."

## Why this slice

It's small and generic (CRUD), but it touches a **product safety
invariant** — destructive actions must be confirmed, soft-deleted, and
audited — so the example shows the QA, security, and release gates doing
real work rather than rubber-stamping.

## Stages: what ran, what compressed

The Engineering Manager compressed the lifecycle for a small, well-
understood slice (see `artefacts/00-slice-plan.md` for the rationale):

| Stage | Ran? | Note |
|-------|------|------|
| 1 Intake (Orchestrator) | ✅ | `00-slice-plan.md` |
| 2 Market Research | ⏭️ skipped | Well-understood ask; existing single-delete proves the need |
| 3 Scope Review (EM) | ✅ | `01-em-handoff.md` |
| 4 Discovery (PM) | ✅ | `02-prd.md` |
| 5 UX Research | ✅ (light) | `03-feature-spec.md` |
| 6 UI Design | ✅ | `04-ux-spec.md` |
| 7 Architecture | ✅ | `05-tech-spec.md` |
| 8 Implementation | ✅ | code is described in the tech spec; this is a paper run |
| 9 QA Evidence | ✅ | `06-qa-evidence.md` |
| 10 Security Review | ✅ | `07-security-review.md` |
| 11 Release Gate | ✅ | `08-release-checklist.md` (Tier 2) |
| 12 Post-Launch | ✅ | `09-post-launch-review.md` |
| Overlay roles | ⏭️ | None enabled — Stash is a pre-enterprise B2C MVP |

## What this example validates

- The artefacts **chain**: each stage's output is enough for the next stage
  to act without re-deriving context.
- The **compression rule** works: the EM skips Market Research with a
  recorded reason.
- A **safety invariant** flows from `.agentic/SAFETY_INVARIANTS.md` →
  PRD constraint → tech spec design → QA verification → security sign-off.
- The **release tier** logic: this is Tier 2 (behavioural, no external
  effect), so it needs QA + security + rollback but no human-approval gate.

## What it does NOT validate

This is a paper run. It does not prove that live LLM agents, each loaded
with only their brief, can actually produce this chain. That's the separate
"live multi-agent run" validation.
