# Protocol: Human Approval Interrupt

This is how an **autonomous** run handles an action that requires human
approval. It is the hard stop that keeps the system safe. The rules for
*which* actions require approval are in the playbook's
`docs/HUMAN_APPROVAL_RULES.md` (rules 1–6). This protocol is *how* the run
pauses for them.

## The interrupt is non-negotiable

When any stage determines the slice involves a gated action, the run
**STOPS**. It does not implement, ship, or proceed on the assumption that
approval will be granted. The pipeline parks until a human answers.

Approval-requiring actions are detected at the **earliest** stage that can
see them:

- Rules 4, 5, 6 (safety-control change, real model/client, new data
  processor) → flagged at **Intake/Scope**, approved **before
  implementation begins**.
- Rules 1, 2, 3 (send/submit, destructive shared-state, deploy/release) →
  confirmed at the **Release Gate** at the latest, but flagged as early as
  they're known.

## Steps

1. **Detect.** The owning agent names the action and the rule it trips.
2. **Pause.** Set `STATE.md` → `Status: blocked-on-approval` and add a row
   to the Approvals table with `Decision: PENDING`. Stop all downstream
   work.
3. **Request.** Write `runs/<slice-id>/APPROVAL_REQUEST-<n>.md` containing,
   per `HUMAN_APPROVAL_RULES.md` "How to ask":
   - **What** — the concrete action ("ship a code path that emails a digest
     on the user's behalf via a new email provider"), not a vague summary.
   - **Why** — the rule(s) that apply and why the slice needs it.
   - **What is reversible if denied** — so the human can weigh saying no.
   - **The smallest request** — one action, not a batch.
4. **Surface + wait.** Present the request to the human and **wait**. The
   run yields control. No timeout auto-approves. Silence is not consent.
5. **Record.** On an answer, write
   `runs/<slice-id>/APPROVAL_RECORD-<n>.md`: the decision, the approver,
   the UTC timestamp, and the human's response **verbatim**. Update the
   Approvals row.
6. **Resume or abort.**
   - **Approved** → set status back to `in-progress`; the Release Manager
     later verifies this record before landing.
   - **Denied** → stop the slice. Record the rationale, hand back to the
     Orchestrator. Do not look for a workaround.

## What counts as approval

Mirrors `HUMAN_APPROVAL_RULES.md`:

- An explicit "yes / approved / go ahead" to the **specific** request.
- NOT inferred from "looks good", "nice", or a thumbs-up.
- NOT carried over from a previous approval. Each gated action is its own
  request.
- NOT batchable unless each item was individually surfaced.

## Why a record, not just a reply

The `APPROVAL_RECORD` artefact is what makes the approval auditable after
the fact — the Release Manager reads it, and it survives the conversation.
A verbal "yes" that isn't written down didn't happen, as far as the audit
trail is concerned.
