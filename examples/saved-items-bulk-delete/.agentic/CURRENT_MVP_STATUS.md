# Current MVP Status — Stash

> Sample `.agentic/` for the worked example. Where the product stands today,
> so agents don't propose what already exists or assume what doesn't.

## Shipped

- Account + auth.
- Saved-items **list view** (per user, scoped by `userId`).
- **Add item** (link / note / clip).
- **Single-item delete** — soft delete (`deletedAt`), emits a
  `items.deleted` audit event, recoverable for 30 days.
- **Audit view** — the user can see their own audit events.

## Not yet built

- **Bulk delete** ← this slice.
- Bulk move / bulk tag (future; explicitly out of scope for this slice).
- Restore-from-trash UI (single-item restore exists via support only; a
  self-serve trash view is a separate future slice).

## Relevant existing code (for the architect)

- `services/savedItems.ts` — `listItems`, `addItem`, `softDeleteItem`.
- `services/audit.ts` — `recordAuditEvent`.
- `web/SavedItemsList.tsx` — the list view + single-delete button.

## Known constraints

- The list view already supports up to ~500 items per user; bulk actions
  must not regress its render performance.
- `softDeleteItem` is single-ID today; the bulk path should reuse its
  soft-delete + audit logic, not duplicate it.
