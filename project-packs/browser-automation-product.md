# Project Pack — Browser Automation Product

Use for: a product that drives a real browser to fill, click, navigate,
or extract on the user's behalf — extension, headless agent,
Playwright/Puppeteer worker, or similar.

This pack is the strictest in the playbook. Browser automation has the
highest blast radius: a single missed approval gate can submit the
wrong form to the wrong site under the user's name.

---

## Product principles

- **Approval before every external effect.** Every fill, click, submit,
  or navigation that produces an external effect requires explicit user
  approval. The approval is for *that specific action*, not a session.
- **Dry-run first.** Every flow can run against a fixture / snapshot
  before it runs against a live site. The dry-run produces the same
  audit trail as the live run.
- **No CAPTCHA / anti-bot bypass.** The product never solves CAPTCHAs,
  spoofs fingerprints, or evades rate limits. If a site presents a
  CAPTCHA, the product surfaces it to the user and waits.
- **Page-structure awareness.** Hash the page structure before fill;
  refuse to fill if the structure changed since the dry-run.
- **Per-field uncertainty.** Each filled field carries a confidence
  level. Low-confidence fields surface to the user before approval.

## Lifecycle adjustments

- **Real-site dry-run is a stage.** Before the Release Manager can
  approve a Tier 3 release, a fixture-backed dry-run must pass and
  produce a snapshot.
- **Security review is mandatory.** No exceptions. The Security Agent
  scans for approval bypasses and CAPTCHA-evasion code in every diff.
- **QA includes a manual smoke on a sandbox site.** Not just unit
  tests.

## Default release tier

- Anything that touches the browser fill / submit code path: **Tier 3**.
- New ATS adapter / new site integration: **Tier 3**.
- Internal refactor of the dry-run engine: **Tier 2**.

## Safety invariants (recommended floor)

- No code path reaches a real-site submit without an explicit approval
  event preceding it in the same session.
- Approval events are typed (e.g. `submit_approved`,
  `fill_approved`) and audited.
- Page-structure hash mismatch aborts the action.
- CAPTCHA detection pauses the session and surfaces it to the user.
- Sensitive inputs (resume text, application answers) are never logged
  in full.
- The product never auto-installs an extension or modifies browser
  settings without consent.

## Required service surfaces

- **Dry-run engine** that produces a full audit trail without external
  effects.
- **Adapter per ATS / site** with a fixture for tests.
- **Approval gate** as a typed event, not a boolean flag.
- **Snapshot persistence** so the user can inspect what the agent saw
  and what it would have filled.

## Anti-patterns specific to browser automation

- A "trusted mode" where approval is auto-granted.
- Solving a CAPTCHA "for the user".
- Treating rate limit evasion as a feature.
- Logging the resume content "for debugging".
- A fill function that has no equivalent dry-run.
- Approval recorded as "session opened" rather than the specific
  action.

## Worked examples

- Agentic Job Ops:
  - `src/services/browserApplicationAssistant.ts` — submit requires
    `approveBrowserSubmit()` to have been called first; the function
    name and audit event are explicit.
  - `src/services/realSiteDryRunService.ts` — snapshot-backed dry-run.
  - `src/services/extensionService.ts` — page structure hash on every
    fill plan, gate on hash match before fill.
