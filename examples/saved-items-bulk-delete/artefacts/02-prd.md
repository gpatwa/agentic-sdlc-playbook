# PRD — Bulk-delete saved items

> Owner: Product Manager Agent
> Status: ready for UX
> Source slice: `artefacts/01-em-handoff.md`

## Problem

A user who saves a lot of items eventually wants to clear out a batch of
them. Today deletion is one item at a time, so tidying up a list of 40 old
links means 40 separate deletes. People give up and the list becomes the
junk drawer Stash is supposed to prevent.

Signal: single-delete is among the most-used actions; several users have
asked for "select multiple and delete" (CURRENT_MVP_STATUS).

## Target user

- **Persona:** an active saver with a cluttered list (dozens to hundreds of
  items).
- **Trigger moment:** they're reviewing their list and recognise a cluster
  of items they no longer need.

## Success criteria

- [ ] A user can delete 2+ selected items in one confirmed action —
  measured by `items.bulk_deleted` audit events.
- [ ] Accidental mass deletion is mitigated — measured by (a) a required
  confirmation that states the count, and (b) Undo usage tracked via an
  `items.bulk_delete_undone` event staying low relative to deletes.
- [ ] Deleted items remain recoverable for 30 days (soft delete) — verified
  in QA, not just claimed.

## Scope

- Multi-select on the saved-items list.
- A "Delete (N)" action with a confirmation stating N.
- Soft-delete the selected items in one batch, with one audit event.
- An in-session Undo immediately after the action.

## Non-goals

- Bulk move or bulk tag (a reasonable expectation — explicitly later).
- A persistent trash / restore view (Undo covers the immediate case now).
- Changing single-item delete behaviour.

## Constraints carried in

From `.agentic/SAFETY_INVARIANTS.md` and the EM handoff:

- Deletes are soft + recoverable (inv. 1).
- Destructive multi-item action requires confirmation stating the count
  (inv. 2).
- Every delete is audited (inv. 3); no item content in logs (inv. 4);
  user-scoped (inv. 5).

## Open questions

- [ ] Undo vs. persistent trash for v1 — **resolved:** Undo now, trash view
  is a separate future slice (per Orchestrator + human).

## Hand off

Next agent: UX Researcher. Artefact to produce: feature spec.
