# Safety Invariants — Stash

> Sample `.agentic/` for the worked example. These are the invariants that
> MUST hold across releases. A slice may not weaken them without explicit
> human approval (`docs/HUMAN_APPROVAL_RULES.md`).

## Data & deletion

1. **Deletes are soft and recoverable.** Deleting an item sets `deletedAt`;
   it is not removed from storage for 30 days. Recovery is possible within
   that window.
2. **Destructive user actions are confirmed.** Any action that removes more
   than one item in a single gesture requires an explicit confirmation step
   that states how many items are affected.
3. **Every delete is audited.** Each deletion (single or bulk) emits an
   append-only audit event the user can inspect.

## Privacy

4. **No item content in logs.** Logs may carry item IDs, counts, and
   hashes — never the saved content, titles, URLs, or notes.
5. **A user only ever sees or affects their own items.** Every query is
   scoped by `userId` at the service boundary.

## Automation

6. **Nothing is sent, posted, or shared on the user's behalf** without an
   explicit, per-action approval in the UI.
7. **LLM adapters throw by default.** No live model call enters the build
   without approval (`HUMAN_APPROVAL_RULES.md` rule 5).

## For this slice

The bulk-delete slice touches invariants 1, 2, 3, 4, and 5. It must honour
all of them; QA and Security verify each.
