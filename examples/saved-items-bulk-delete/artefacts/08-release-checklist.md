# Release Checklist — Bulk-delete saved items

> Owner: Release Manager Agent
> Status: GO
> Release tier: **Tier 2** (behavioural change, no external effect)

## Tier rationale

The slice soft-deletes the user's own items via a confirmed, user-initiated
action. Nothing sends, deploys, or destroys shared state, and no
auth/permissions change → Tier 2, not Tier 3. No human-approval gate
required (`docs/HUMAN_APPROVAL_RULES.md` — none of rules 1–6 triggered).

## Core gates

| Gate | Status |
|------|--------|
| Typecheck / targeted tests / full suite / build | ✅ (QA evidence) |
| One commit, no lint warnings | ✅ |
| UI verified in preview (all states) | ✅ |
| Local regression (`npm run qa:mvp`) | ✅ |
| Safety invariants verified | ✅ (inv. 1–5) |
| No secrets / PII in logs | ✅ (security review) |
| Audit events cover state changes | ✅ |
| Rollback plan exists | ✅ (flag `bulkDelete` off) |

## Enterprise & governance gates

Not applicable — no overlay roles enabled for Stash.

## Rollback

- Toggle `bulkDelete` off → reverts to single-delete. No migration to
  reverse. Soft-deleted items remain recoverable.

## Human approvals

None required (Tier 2).

## Post-launch signal to watch

- `items.bulk_deleted` adoption (are users using it?).
- `items.bulk_delete_undone` rate (proxy for accidental deletion — should
  stay low).

## Decision

**GO.** All applicable gates pass. Hand to Post-Launch Learning after it
lands.
