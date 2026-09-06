# Human Approval Rules

These are the actions an agent MUST NOT take without explicit human
approval. The list is small on purpose: the more you trust automation,
the more it costs you when it gets a single one of these wrong.

If any of these rules conflicts with a project pack, this document wins.

---

## Always require approval

### 1. Sending or submitting on behalf of a user

This includes:

- Submitting a job application, form, or transaction.
- Sending an email, message, post, or DM.
- Posting to a public-facing channel (blog, social, status page).
- Triggering a payment, charge, refund, or transfer.
- Calling any third-party API that the user is billed for.

The product surface MUST present an explicit approval gate. The agent
MUST NOT have a code path that submits without user input.

This invariant is non-negotiable. It does not relax for "advanced users",
"trusted integrations", or "demo mode".

### 2. Destructive operations on shared state

This includes:

- Deleting a database row, table, or migration.
- Force-pushing to a shared branch.
- Resetting a remote ref.
- Removing files from a published release.
- Revoking an active credential or session.
- Dropping a queue, cache, or topic in production.

The agent MUST surface what would be destroyed and ask before destroying
it. If the answer is "go ahead", the agent records what it destroyed in
an audit event.

### 3. External-effect changes via deploy / release

This includes:

- Deploying to staging or production.
- Promoting a release.
- Toggling a feature flag for real users.
- Changing a domain, DNS record, or auth provider config.
- Granting or modifying RBAC roles.

The Release Manager confirms the human sign-off, records who approved,
and records the time.

**"Who approved" is an identity, not a role.** Record the person — the same
handle used as the run's `operator` in `trace.json` — not "the human" or "the
user". An approval that cannot be attributed to a named person is not an audit
record; it is a note saying one was made. This costs nothing while one person
approves everything, and is the field every later control depends on: RBAC
Tier 3 named approvers, separation of duties, and any answer to "who signed
off on this" that outlives the session it happened in.

### 4. Changes to safety controls

This includes:

- Disabling an approval gate.
- Disabling an audit event.
- Removing a CAPTCHA / anti-bot guard.
- Skipping a release gate.
- Bypassing a pre-commit or pre-push hook (`--no-verify` and friends).

If a slice needs to touch one of these, the slice plan must call it out
explicitly and the human must approve before implementation begins.

### 5. Inviting an LLM into a previously-deterministic path

This includes:

- Wiring a real model client behind a previously-placeholder adapter.
- Adding a network call to the build / test / commit path.
- Removing the "throw" from a placeholder adapter.

This is its own category because it changes the cost shape of every test
run and the data shape of every artefact. The human approves it knowing
they're agreeing to ongoing token spend.

### 6. Onboarding a new third-party data processor or data commitment

This includes:

- Routing user or customer data to a new third-party / subprocessor (an
  API, model provider, analytics vendor, storage provider).
- Signing, altering, or relying on a Data Processing Agreement (DPA) or a
  customer data-handling commitment.
- Expanding what an existing processor receives beyond its current scope.

Before any such integration ships, the agent surfaces the processor, the
data it would receive (with classification), and the DPA status, and the
human approves. A new subprocessor is risk-assessed with
`templates/VENDOR_RISK_TEMPLATE.md` first.

This is its own category because it creates an ongoing external data flow
and a contractual obligation the customer is owed visibility into — neither
of which a code review alone surfaces.

---

## Allowed without approval

To make the boundary clear, here is what an agent IS authorised to do
within a slice:

- Read any file in the project repo.
- Run typecheck, linters, tests, and build locally.
- Run the project's local regression command (e.g. `npm run qa:mvp`).
- Create, edit, and delete files inside the project repo.
- Create local commits on the project's working branch.
- Run dry-runs that do not produce external effects (e.g. mocked
  integrations, fixture-backed runs).
- Use the browser preview to verify a UI change.
- Take screenshots of the local preview for QA evidence.

Anything not on the "always require approval" list and not obviously
destructive is allowed within the slice.

---

## How to ask for approval

When an agent needs approval, it MUST surface, in one message:

1. **What it wants to do**, in concrete terms (not "ship the change",
   but "merge PR #42 to main and trigger the staging deploy").
2. **Why**, including which gate or rule applies.
3. **What would be reversed if approval is denied** (so the human can
   weigh the cost of saying no).
4. **The smallest possible request** — never "approve all of these"
   when one would do.

The human's response is the audit record. The agent should reference
the approval (e.g. "approved by user at 14:02 UTC") in the resulting
audit event.

### The combined verify-and-send gate

Some requests bundle two things the human must confirm together, not
as separate back-and-forths: that a resolution is *correct*, and that
the resulting communication is *authorized to send*. `agents/customer-
support.md` uses this shape — surface the diagnosis or fix alongside
the exact drafted reply, in one ask, so the human verifies and
authorizes in a single response rather than approving a fix and then
being asked again to approve the message about it. This is still one
rule-1 gate, not two; it's a presentation choice, not a relaxation —
"approved" here means both the resolution and the exact text sent are
correct, and an edit before sending is recorded as a distinct decision,
not folded silently into the approval.

---

## What "explicit approval" means

- A direct, unambiguous "yes" / "go ahead" / "approved" from the human
  in response to the specific request just made.
- NOT inferred from "looks good", "nice work", "thanks" — those are
  acknowledgements, not approvals.
- NOT carried over from a previous request. Each gated action gets its
  own approval.
- NOT batchable. "Yes to all of these" only counts when each item was
  individually surfaced first.

---

## When in doubt

Ask. The cost of one extra confirmation is a few seconds. The cost of
sending the wrong email, dropping the wrong table, or pushing to the
wrong branch is much higher. An agent that asks too often is correctable;
an agent that acts without asking can do real damage.
