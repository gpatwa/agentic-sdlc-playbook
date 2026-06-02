# Feature Spec — Bulk-delete saved items

> Owner: UX Researcher Agent
> Status: ready for design
> Source PRD: `artefacts/02-prd.md`

## Personas in scope

- **Active saver with a cluttered list:** wants to remove a batch quickly,
  but is anxious about deleting the wrong things.

## Primary journey (happy path)

1. User opens the saved-items list → System shows items with a "Select"
   affordance.
2. User taps Select → System enters selection mode (checkboxes, a counter,
   a "Select all on page" control, a disabled "Delete (0)" button).
3. User checks 5 items → System updates the button to "Delete (5)".
4. User taps "Delete (5)" → System shows a confirmation: "Delete 5 items?
   You can undo this right after."
5. User confirms → System soft-deletes the 5 items, exits selection mode,
   shows "5 items deleted" with an **Undo** action.
6. (Optional) User taps Undo → System restores the 5 items.

## Alternate journeys

- **Cancel at confirm:** Diverges at step 5. Nothing is deleted; selection
  is preserved.
- **Select all, delete everything:** Ends at the empty state (see below).
- **Undo after navigating away:** Undo is in-session only; once the toast
  is gone, recovery is via the 30-day soft-delete window (support for now).

## Edge cases

- Zero selected: "Delete" is disabled (no empty confirm).
- An item already deleted on another device: that ID is skipped; the count
  reflects what actually deleted.
- Network/save error mid-batch: nothing is partially shown as deleted; the
  user sees an error and the items remain (see UX spec error state).

## States to design

- **Saved-items list:** default / selection-mode / empty (after deleting
  all) / error.
- **Confirmation dialog:** the count-bearing confirm.
- **Post-action:** success toast with Undo.

## Accessibility

- Keyboard: checkboxes are focusable; "Select all" reachable; the confirm
  dialog traps focus and returns it on close; Undo reachable by keyboard
  before the toast auto-dismisses (give it 10s, pause on focus/hover).
- Screen reader: selection count announced via a live region ("5 selected");
  confirm dialog labelled; success toast announced.
- Contrast & motion: meet the product floor; respect reduced-motion for the
  toast.

## Out of scope

- Bulk move / tag; persistent trash view.

## Hand off

Next agent: UI Designer. Artefact to produce: UX spec.
