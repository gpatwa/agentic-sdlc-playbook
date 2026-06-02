# Post-Launch Review — Bulk-delete saved items

> Owner: Post-Launch Learning Agent
> Status: complete → Orchestrator
> Window: first 7 days after release (Tier 2 cadence)

## Did the slice meet its success criteria?

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Delete 2+ items in one confirmed action | ✅ met | `items.bulk_deleted` events present; median batch size 6 |
| Accidental mass deletion mitigated | ✅ met (partial signal) | undo rate ~4% of bulk deletes — low, but small n |
| Deleted items recoverable 30 days | ✅ met | soft-delete confirmed in QA; no data-loss reports |

## What surprised us

- A meaningful share of bulk deletes used **"Select all on page"** then
  deselected a few — users think in "delete most of these" terms, not
  "pick the ones to remove." Signal: select-all used in ~40% of bulk
  actions (audit-adjacent usage event).
- Undo was used almost entirely within the first ~3 seconds — the 10s toast
  is generous, which is fine.

## What we'd do differently

- The empty state after deleting everything felt abrupt for users who
  cleared a whole list — a one-line "X items moved to trash, recoverable
  for 30 days" reassurance would land better.

## Carry-forward (for the next PRD)

- Add a recovery affordance beyond the in-session toast — the undo-rate and
  the "select all then trim" behaviour both point to demand for a
  **self-serve trash/restore view** (already noted as a future slice).
- Consider a post-delete confirmation line citing the 30-day window.

## Follow-up slices to file

- **Self-serve trash / restore view** (was an explicit non-goal here; the
  data now supports prioritising it).
- **Bulk move / tag** (re-evaluate; lower signal than restore).

## Hand off

To the Orchestrator. Recommend discussing the trash-view slice with the
human now, given converging signals (undo usage + select-all behaviour).
