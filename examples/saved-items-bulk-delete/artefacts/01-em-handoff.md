# EM Scope Review & Handoff — Bulk-delete saved items

> Stage 3 · Owner: Engineering Manager
> Hand off to: Product Manager

## Scope decision

Accepted as a **single slice**. It's one cohesive change to the list view +
one service method. Estimated 4–6 files, well under one implementation
pass.

## Compression decision (recorded)

- **Skip Market Research (stage 2).** Well-understood ask; single-delete
  usage and explicit user requests already evidence the need. (Per the
  compression rules in `docs/AGENTIC_SDLC.md`.)
- All other core stages run. Design stages (UX/UI) are light but produce
  their specs because there's a new interaction (multi-select + confirm).

## The artefact to produce next

A PRD (`templates/PRD_TEMPLATE.md`), owned by the Product Manager.

## Minimal context for downstream

- Existing code: `services/savedItems.ts` (`softDeleteItem`),
  `services/audit.ts` (`recordAuditEvent`), `web/SavedItemsList.tsx`.
- Reuse `softDeleteItem`'s soft-delete + audit logic; do not duplicate it.
- List view supports ~500 items; don't regress its render performance.

## Success criteria for the slice

As in the slice plan (1–4). The PM must make these observable.

## Constraints carried in

- Safety invariants 1–5 (soft delete, confirm, audit, no content in logs,
  user-scoped). Non-negotiable.
- Non-goals: bulk move/tag, persistent trash view.

## Gates that apply

- Release **Tier 2** (behavioural change, no external effect): full
  implementation + QA + security gates, rollback plan required, **no
  human-approval gate** (nothing sends/deploys/destroys shared state — the
  user confirms their own soft-delete).
- No enterprise/governance overlay gates (no overlays enabled).

→ Handed to Product Manager.
