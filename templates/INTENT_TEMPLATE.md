# Intent: <one line — what you want>

> Write this once. Every agent downstream reads it as the source of truth for
> what you asked for. Keep it to a page — if it needs more, it is probably
> more than one slice.
>
> Lives at `runs/<slice-id>/intent.md`. You can write it yourself and pass the
> path to `/agentic-slice`, or pass a one-line ask and the Orchestrator drafts
> it for you to confirm. Either way, nothing past Scope Review starts until
> you have confirmed it.

## What I want

<The outcome, in your own words. What will someone be able to do that they
cannot do today?>

## Who it's for

<The user, and the moment they would reach for this.>

## Done means

<Checkable statements. QA verifies the finished slice against these, word for
word — so write each as something a person could confirm or refute by using
the software, not as a feeling.>

- [ ] <e.g. "A saved item can be moved into a folder from the item's menu">
- [ ] <e.g. "Deleting a folder never deletes the items inside it">

## Must not break

<Anything that has to keep working. Name invariants from
`.agentic/SAFETY_INVARIANTS.md` rather than restating them.>

## Constraints

<Technology, dependencies, deadlines, and anything you have already decided.>

## Out of scope

<What this slice deliberately does not do.>

## Stakes

Tick every one that applies. This decides how much of the lifecycle runs — see
"When to compress stages" in `docs/AGENTIC_SDLC.md`.

- [ ] Touches real user data
- [ ] Moves money, or changes billing
- [ ] Irreversible — deletes, sends, or deploys to live users
- [ ] Changes auth, permissions, or a safety control
- [ ] Adds a screen or UI a user will see
- [ ] None of the above

## Open questions

<Anything not yet decided. The Orchestrator resolves these with you before
planning. An intent with open questions does not take the short path.>

---

### If the Orchestrator drafted this

Anything the Orchestrator inferred rather than read from your ask is marked
**(inferred)**. Those are its guesses about what you meant, not your words.
Confirm, correct, or delete each one — an unconfirmed inference is never used
as an acceptance criterion.
