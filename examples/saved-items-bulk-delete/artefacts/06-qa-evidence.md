# QA Evidence — Bulk-delete saved items

> Owner: QA Evidence Agent
> Status: pass → Security
> Source diff: `bulkDelete` slice (paper run — commands shown as they'd run)

## Commands run (in order)

| Command | Result |
|---------|--------|
| `npm run typecheck` | pass |
| `npx vitest run services/savedItems.test.ts` | pass (7 cases) |
| `npx vitest run web/SavedItemsList.test.tsx` | pass (6 cases) |
| `npm test` | pass (full suite, no regressions) |
| `npm run build` | pass |
| `npm run qa:mvp` | pass (list / add / delete smoke green) |

## UI verification per state (preview)

| State | Verified | Evidence |
|-------|----------|----------|
| Selection mode on/off | ✅ | checkboxes + action bar appear/clear |
| "Delete (N)" reflects count | ✅ | 0 → disabled; 5 → "Delete (5)" |
| Confirm states the count | ✅ | "Delete 5 items?" |
| Cancel preserves selection | ✅ | nothing deleted, 5 still checked |
| Success toast + Undo | ✅ | "5 items deleted" + Undo restores |
| Empty state (deleted all) | ✅ | reuse of existing empty state |
| Error state | ✅ | forced service error → "Nothing was removed" |

## Safety invariant verification

| Invariant | Verified how | Result |
|-----------|--------------|--------|
| 1 Soft + recoverable | DB shows `deletedAt` set, rows present; restore works | ✅ |
| 2 Confirm states count | confirm dialog blocks delete until confirmed | ✅ |
| 3 Every delete audited | exactly one `items.bulk_deleted` per batch | ✅ |
| 4 No content in logs | logs show `{count, itemIdsHash}` only — no titles/URLs | ✅ |
| 5 User-scoped | unit test: other user's IDs rejected, returned as skipped | ✅ |

## Deferred items

- Persistent trash/restore view — out of scope (separate slice).
- Undo after toast dismiss — by design, recovery via 30-day window.

## Recommendation

**Pass to Security & Privacy.** All gates green; all touched invariants
verified by observation, not intent.
