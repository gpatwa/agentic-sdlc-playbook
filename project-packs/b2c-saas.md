# Project Pack — B2C SaaS

Use for: a consumer-facing SaaS product where the user is the human
making the decisions and the goal is value-per-click, not workflow
adoption.

---

## Product principles

- **Less setup, more value.** A user reaches something useful within a
  few clicks of landing. No long forms before the first payoff.
- **Action-first home.** The default home is a short list of decisions
  the user actually needs to make today — not a dashboard of metrics.
- **Progressive disclosure.** Ask for missing fields only when they
  unblock something specific, not as a wall of onboarding.
- **One clear next step.** Every screen presents one obvious action plus
  optional secondaries.

## Lifecycle adjustments

- **Discovery is short.** B2C PRDs are 1–2 pages. The user behaviour
  signal is more important than long internal debate.
- **UX research weighs accessibility heavily.** Most B2C users hit the
  product on mobile or with screen readers more often than B2B users.
- **Post-launch is fast.** Run the post-launch review within a week.
  B2C signal is high-volume.

## Default release tier

- New screens / features: **Tier 2**.
- Anything that sends, posts, charges, or publishes: **Tier 3**.
- Internal-only refactor / docs: **Tier 1**.

## Safety invariants (recommended floor)

- Final user-affecting actions (send, submit, publish, charge) require
  explicit human approval.
- No PII in logs.
- Audit events for every state-changing action a user can later inspect.
- Deterministic-first for any AI feature; LLM as adapter behind a
  placeholder that throws.

## Useful navigation patterns

- Primary nav has at most six items. Anything else lives in an
  "Advanced" section.
- The first post-onboarding home is the Action Center (or equivalent
  decisions-needed surface).
- Settings / admin / dev surfaces never live in the primary nav.

## Anti-patterns specific to B2C

- A long onboarding form before the user sees any value.
- A dashboard full of metrics with no clear next action.
- Burying the safety / approval action inside Settings.
- "Demo mode" data that's indistinguishable from real data.

## Worked example

Agentic Job Ops is the canonical B2C SaaS example for this pack. See
`/.agentic/PROJECT_CONTEXT.md` and the Action Center in
`src/pages/ActionCenterPage.tsx` for the patterns above in code.
