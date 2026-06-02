# Security & Privacy Review — Bulk-delete saved items

> Owner: Security & Privacy Agent
> Status: pass → Release Manager
> Source: diff + `artefacts/06-qa-evidence.md`

## Scan results

| Check | Finding |
|-------|---------|
| Secrets / credentials in diff | None. |
| PII / content in logs | None — logs carry `{count, itemIdsHash}`; no titles, URLs, or notes (inv. 4). |
| Approval bypass (send/submit/destroy) | N/A — no external effect; soft-delete of the user's own items, user-initiated and confirmed. No agent-initiated destruction (HUMAN_APPROVAL_RULES rule 2 not triggered). |
| Audit coverage | `items.bulk_deleted` emitted once per batch; `items.bulk_delete_undone` on undo. No events removed. |
| Adapter boundary | Untouched — no LLM/third-party path (rule 5 N/A). |
| Authorization / tenancy | `bulkSoftDeleteItems` scoped by `userId`; cross-user IDs rejected (verified in QA). |

## Safety invariant confirmation

- Inv. 1 (soft + recoverable): confirmed — rows retained, `deletedAt` set.
- Inv. 2 (confirm states count): confirmed.
- Inv. 3 (audited): confirmed.
- Inv. 4 (no content in logs): confirmed.
- Inv. 5 (user-scoped): confirmed.

## Findings

| Finding | Severity |
|---------|----------|
| Transaction is all-or-nothing, so a partial failure can't leave a misleading "deleted" state | Advisory (positive) |
| None requiring a fix | — |

## Recommendation

**Pass to Release Manager.** No blocker or required-fix findings. The slice
strengthens, not weakens, the deletion invariants.
