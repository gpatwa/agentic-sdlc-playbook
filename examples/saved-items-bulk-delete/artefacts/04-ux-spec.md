# UX Spec — Bulk-delete saved items

> Owner: UI Designer Agent
> Status: ready for architecture
> Source feature spec: `artefacts/03-feature-spec.md`

## Layout & interaction

- **Selection toggle:** a "Select" text button in the list header. Tapping
  it reveals a checkbox at the leading edge of each row and a sticky action
  bar at the bottom.
- **Action bar (selection mode):** left — "N selected" + "Select all on
  page"; right — "Delete (N)" (primary destructive style, disabled at 0)
  and "Cancel".
- **Confirmation dialog:** title "Delete N items?", body "They'll move to
  trash and can be recovered for 30 days. You can undo right after.",
  actions "Delete" (destructive) and "Keep".
- **Success toast:** "N items deleted" + "Undo", auto-dismiss 10s
  (pauses on hover/focus).

## States (reuse existing list component)

| Screen | State | Copy / behaviour |
|--------|-------|------------------|
| List | default | existing list; new "Select" button in header |
| List | selection | checkboxes + action bar; live "N selected" |
| List | empty (all deleted) | "Nothing saved here yet" + "Add an item" CTA (reuse existing empty state) |
| List | error | inline banner: "Couldn't delete those items. Nothing was removed — try again." |
| Dialog | confirm | count-bearing confirm above |
| Toast | success | "N items deleted" + Undo |

## Copy

- Button: "Delete (5)" — count always shown.
- Confirm body names the 30-day recovery so the action feels reversible.
- Error copy reassures that **nothing** was removed (matches the
  all-or-nothing behaviour in the tech spec).

## Component reuse map

- Reuse the existing row component; add a leading checkbox slot.
- Reuse the existing empty state and toast components.
- The confirmation dialog reuses the shared modal (focus-trap built in).

## Hand off

Next agent: Software Architect. Artefact to produce: tech spec.
