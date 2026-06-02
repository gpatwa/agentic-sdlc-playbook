# Tech Spec — Bulk-delete saved items

> Owner: Software Architect Agent
> Status: ready for implementation
> Source: `artefacts/03-feature-spec.md` + `artefacts/04-ux-spec.md`

## Data model deltas

None. `SavedItem.deletedAt` (nullable timestamp) already exists from
single-delete. Bulk delete reuses it.

## Service surface

New method in `services/savedItems.ts`:

```ts
// All-or-nothing within a transaction.
bulkSoftDeleteItems(userId: string, itemIds: string[]):
  Promise<{ deletedCount: number; skippedIds: string[] }>
```

- Scoped by `userId` at the query boundary (inv. 5). IDs not owned by the
  user are ignored and returned in `skippedIds` — never deleted.
- Already-deleted IDs are skipped (idempotent), not re-deleted.
- Reuses the existing soft-delete write from `softDeleteItem` (sets
  `deletedAt = now`); does not duplicate it.
- Wrapped in one transaction: if any write fails, the whole batch rolls
  back → the UI's "nothing was removed" error state is truthful.

Undo reuses/extends restore:

```ts
restoreItems(userId: string, itemIds: string[]): Promise<{ restoredCount: number }>
```

- Clears `deletedAt` for the user's items still inside the 30-day window.

## Adapter boundaries

None. No LLM or third-party call involved (inv. 7 untouched).

## Audit / usage events

- `items.bulk_deleted` — emitted **once per batch** via
  `recordAuditEvent`. Payload: `{ count, itemIds }` (the user's own audit
  record, append-only, user-scoped).
- `items.bulk_delete_undone` — emitted on Undo. Payload: `{ count }`.
- **Logging (inv. 4):** application logs carry only `{ count, itemIdsHash }`
  — never item content, titles, URLs, or notes.

## Integration points

- `web/SavedItemsList.tsx`: selection mode, action bar, confirm modal
  (reuse shared modal), success toast with Undo (reuse toast).
- Behind feature flag `bulkDelete` (default off until release).

## Test plan

- Unit (`services/savedItems.test.ts`): happy path count; skips
  already-deleted; **enforces user-scoping** (other user's IDs rejected);
  transaction rollback on a forced write error (nothing deleted); exactly
  one audit event per batch; restore clears `deletedAt`.
- Component (`web/SavedItemsList.test.tsx`): enters/exits selection mode;
  "Delete (N)" reflects count; cancel preserves selection; empty state
  after deleting all; error state on service failure; Undo restores.
- Regression: single-item delete unchanged; list render perf at 500 items.

## Rollback plan

- Toggle feature flag `bulkDelete` off → list reverts to single-delete
  only. No data migration to reverse (`deletedAt` pre-exists). Soft-deleted
  items remain recoverable regardless.

## Hand off

To the Frontend + Backend engineers, then QA Evidence.
