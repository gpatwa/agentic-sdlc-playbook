# Slice Plan — Bulk-delete saved items

> Stage 1 · Owner: Orchestrator
> Hand off to: Engineering Manager

## User-facing outcome

A user can select several saved items and delete them in one action, with a
confirmation step that prevents accidental mass deletion.

## Slice plan (proposed stages)

This is a small, well-understood enhancement to an existing flow
(single-item delete already ships). Proposed lifecycle:

- **Skip** Market Research — the need is already evidenced by existing
  single-delete usage and direct user requests (see CURRENT_MVP_STATUS).
- **Run** Discovery → UX → UI → Architecture → Implementation → QA →
  Security → Release → Post-Launch.
- **No overlay roles** — Stash is a pre-enterprise B2C MVP.

Final compression decision belongs to the EM (stage 3).

## Success criteria (human-verifiable)

1. A user can delete 2+ selected items in a single confirmed action.
2. The confirmation states exactly how many items will be deleted.
3. Deleted items are recoverable (soft delete) and the action is audited.
4. The existing single-delete flow is unchanged.

## Non-goals & carried-in constraints

- Non-goals: bulk move, bulk tag, a self-serve trash/restore view.
- Constraints from `.agentic/SAFETY_INVARIANTS.md`: deletes are soft +
  recoverable (1), destructive multi-item actions are confirmed (2), every
  delete is audited (3), no item content in logs (4), user-scoped (5).

## Open questions for the human

- Is an in-session **Undo** enough for v1, or is a persistent trash view
  expected now? (Recommendation: Undo now, trash view as a later slice.)

→ Handed to Engineering Manager for scope review.
