# The engineering playbook for AI coding agents

> **Published 2026-10-20 at [aveto.dev/playbook](https://aveto.dev/playbook).** One entry
> point to how Aveto runs software work with AI coding agents. Each part is short and
> links to the document that holds the detail; nothing here overrides those documents.
> Where something is planned rather than built, it says so.

**The question every part answers:** for each piece of work, *what does the agent do,
what checks it, what does the human decide, and what record proves it?*

---

## 1. Principles

1. **Humans own direction, risk and outcome.** Agents own the work in between.
2. **The agent that verifies never wrote the change.** Builders and checkers are
   separate roles, run separately.
3. **Gates fail closed.** A missing artefact or an unclear result is a failure, not a pass.
4. **The human decides twice: before the run and after it.** A Charter approved by its
   hash, and an end review. Anything the Charter does not name stops the run.
5. **Every claim has evidence, and every bar is set before the test.** A result judged
   against a bar chosen afterwards is not a result.
6. **What was not confirmed is marked unconfirmed, with where you looked.**
7. **Budget is checked before the spend, not after.**

Detail: `execution/pack/AGENTS.md`, `docs/OPERATING_MODEL.md`.

## 2. When to use an agent

Not all work suits an agent equally. Decide per task, before the run.

| Delegate to the agent | Agent works, human checks closely | Keep with the human |
|---|---|---|
| Well-specified features with clear "done means" lines | New abstractions or architecture | Product direction: what to build, and why |
| Tests, including edge cases from the spec | Ambiguous requirements (clarify first; an intent with open questions does not start) | What ships to production (the merge) |
| Refactors and migrations with a test suite around them | Security-sensitive code (auth, permissions, payments, PII) | Sending anything on a user's behalf |
| Docs, release notes, diagrams from the code | Novel incidents and low-confidence root causes | Accepting risk: a lower review depth, a new data processor, a model in a deterministic path |
| First-pass code review, triage, log reading | Data and AI evals (the bar must be fixed before the run) | Commercial and legal commitments |

**Signals that a task is not ready for an agent:** no one can write "done means" in
one paragraph; success cannot be checked by a command or a reviewer; the change crosses
systems no one has mapped. Fix the intent first.

Detail: `templates/INTENT_TEMPLATE.md`, `docs/AGENTIC_SDLC.md` ("When to compress stages").

## 3. Roles: delegate, check, own

Twenty-eight specialist roles, each with one output, the decisions it owns, and one
handoff. Every role states three things:

- **The agent does:** the work delegated to it.
- **Checked by:** always another agent or a gate, never a person.
- **The human owns:** always a line in the Charter or an item in `END_REVIEW.md`, so
  naming it adds no stop.

| Group | Roles |
|---|---|
| Lead | Orchestrator, Engineering Manager |
| Product | Market Researcher, Product Manager, UX Researcher, UI Designer |
| Build | Software Architect, Backend Architect, Frontend Developer, AI Engineer, ML Engineer, Tech Writer |
| Verify | QA Evidence, Security & Privacy, Release Manager |
| Govern | AI Governance, Compliance Reviewer, Data Governance, FinOps |
| Data | Analytics Engineer, Data Analyst |
| Operate | Cloud Deployment, Production Verification, SRE, On-Call Engineer |
| Customers | Customer Support, Customer Success, Post-Launch Learning |

Detail: `docs/AGENT_ROLES.md` (the full delegate / check / own table), `agents/`.

## 4. The lifecycle

A slice moves through stages, each producing an artefact the next one reads:

**Intent → Scope review → Discovery → UX and UI → Architecture → Implementation →
QA evidence → Security review → Release gate → (Deploy → Verify → Operate) →
Post-launch learning.**

- Small slices compress stages; the Engineering Manager decides which, and says why.
- Every seam has a gate. Release tiers set how many: **tier 1** local, docs or
  refactor; **tier 2** behaviour change with no external effect; **tier 3** anything
  with an external effect.
- A run ends in a pull request. Merge, deploy and send are separate, named actions.

Detail: `docs/AGENTIC_SDLC.md`, `docs/RELEASE_GATES.md`.

## 5. Human approval

**Six kinds of action always need the human:** sending on a user's behalf; destructive
changes to shared state; deploys and releases with an external effect; changes to
safety controls; putting a model into a path that was deterministic; a new data
processor or data commitment.

**How it works under a Charter:**

1. The Orchestrator drafts `runs/<slice>/CHARTER.md`: scope, budget, models with their
   effort level, data processors, safety-text changes, permissions, depths, end actions.
2. `execution/charter-check.mjs` refuses blanks, open-ended grants and wildcards before
   the human sees it.
3. The human approves it **by its sha256, in their own words, in the session that runs
   it.** An approval typed in another session, or relayed by an agent, never counts.
4. Each action cites the Charter line that covers it. Anything not named stops the run.
5. At the end, `END_REVIEW.md` opens with **Blocked on me, Changed, Found**.

Detail: `docs/HUMAN_APPROVAL_RULES.md`, `templates/CHARTER_TEMPLATE.md`.

## 6. Context: what the agent reads

Agents work from files, not from conversation:

| File | Holds |
|---|---|
| `AGENTS.md` / `CLAUDE.md` | the run guide every session loads |
| `.agentic/PROJECT_CONTEXT.md` | what the product is and who it serves |
| `.agentic/LOCAL_COMMANDS.md` | the exact commands to type-check, test, build |
| `.agentic/SAFETY_INVARIANTS.md` | what must hold across every release |
| `REVIEW.md` | what this repo's reviewers should and should not flag |
| `runs/<slice>/STATE.md` | where the run is, so any session can resume it |

Keep each stage's context thin: an agent reads the artefacts it needs, not the whole
history. **Planned, not built:** onboarding a codebase Aveto did not build, which
proposes these files from the code and marks every invariant "proposed" until the human
confirms it (`docs/REVIEW_MODE_PLAN.md`, M1).

## 7. Quality: tests and review

- **Every new test fails first** on the base commit; QA re-runs it there itself.
- **Generated tests are filtered:** kept only if they build, pass three runs in a row,
  and cover a "done means" line or raise coverage. Removals are listed.
- **Review scales with risk.** The diff sets the tier: high for safety text, hooks,
  permissions, auth and CI; medium for product behaviour; low for the rest.
- **Every finding is recorded** with file and line, how to reproduce it, and a
  disposition: fixed, rejected or intentional. At most three review rounds, then re-plan.
- **The reviewer is tested too:** past incidents are kept as review cases, and the
  review step is rescored when its prompt, model or effort changes.

Detail: `docs/CODE_REVIEW.md`, `docs/review-evals/`, `agents/qa-evidence.md`.

## 8. Security and data

- Each agent gets the **fewest tools** its role needs, generated per role. **The limit:** roles
  that plan and review are held to their own folders by a hook; roles with a shell are not
  technically scoped, only bounded by the Charter's permission rules and review.
- Judge-style agents run with **no tools**, a deny list and a hook as a second layer.
- Hostile input is reviewed adversarially when the slice handles untrusted text.
- **Agents never handle credentials.** A step that needs one stops the run.
- Every data processor is named in the Charter with exactly what it may receive.
- **Built, not yet used in a run:** a tamper-evident event log of every tool call and the role
  that made it, and read-deny rules for secret file paths (`docs/AGENT_SECURITY_PLAN.md`).
  The log shows an edited or deleted line afterwards; it does not prevent one. The deny rules
  cover Claude Code's file tools, not a shell command.
- **Planned, not built:** scoping the shell roles with an operating-system sandbox, and
  excluding secret paths from review mode's reads with a test that proves it
  (`docs/AGENT_SECURITY_PLAN.md` A5, `docs/REVIEW_MODE_PLAN.md` M3b).
- **Not provided:** an identity per agent in cloud logs (a deploy pipeline will have its own),
  or protection against a person using the operator's own account.

Detail: `agents/security-privacy.md`, `docs/HUMAN_APPROVAL_RULES.md` rules 4 to 6.

## 9. Cost and capacity

- Each stage has an estimate; a hook checks `spent + estimate ≤ budget` **before** the
  step. Over budget means degrade, drop or stop, never raise the budget to fit.
- The Charter sets a plan total, a ceiling (notice) and a hard cap (stop).
- Model and effort are pinned per role in the Charter.
- Runs checkpoint at every stage, so a run that hits a usage limit resumes where it
  stopped.
- **Measured so far:** a slice runs four to ten stages at roughly 70k to 130k tokens
  each; one full greenfield build measured 947k. Review stages have run 1.5 to 3 times
  their estimates.

Detail: `execution/pack/protocols/RUN_ECONOMICS.md`, `execution/hooks/budget-guard.mjs`.

## 10. Measurement and adoption

**Measure the process, not just the output:**

| Measure | Why |
|---|---|
| Owner touches per run, and time to the first touch | whether "decide twice" is still true |
| Gate catches, by gate | which checks earn their cost |
| Escaped defects | what the gates missed |
| Review precision (findings neither rejected nor marked intentional) | whether review is signal or noise |
| Spend against estimate, per stage | whether budgets can be trusted |
| Tests confirmed failing first; generated tests kept and removed | whether tests prove the change |

**Adopting it (a path, not yet walked by a team):**

1. **One person, one repo, one slice.** Install the pack, write an intent, approve a
   Charter, read the end review. Measure owner touches.
2. **Declare bars before widening.** Pick the measures above and their targets before
   the second repo, not after.
3. **Existing codebases start read-only.** Review mode reports risk and changes nothing
   (planned, `docs/REVIEW_MODE_PLAN.md`).
4. **Then a team.** Shared gates, a run inventory across developers and an audit export
   are roadmap, not shipped.

Detail: `docs/PIPELINE_ANALYTICS.md`, `docs/VALIDATION_MATRIX.md`.

---

## What this playbook is not

- **Not a certification.** It records and reviews; it does not certify the absence of
  bugs or compliance with any standard.
- **Not proven at team scale.** The evidence is three small apps run by one person
  (`docs/VALIDATION_MATRIX.md`).
- **Not tied to one vendor's agent in principle,** but built and tested in Claude Code
  only. Aveto is independent and is not affiliated with or endorsed by Anthropic.

## Where it comes from

Aveto's own runs and failures (`docs/LESSONS.md`), and published guidance read against
them: Anthropic's *Building effective agents* and its course on the AI-native SDLC,
OpenAI's *Building an AI-Native Engineering Team* (delegate, review, own), Google's
report on internal code migrations, and Meta's work on filtering generated tests.
