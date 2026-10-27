# Messaging: what Aveto says, to whom, and how we know it is true

> **Status: applied to the site and README 2026-10-18 (pending push and deploy).** It
> replaces the scattered positioning notes with one guide. The position it keeps
> is the owner's (2026-09-18): *anyone shipping software can have the engineering
> process of a large engineering organisation.* What it changes is the story
> about approval, which Process v2 rewrote, and it adds a **claims register** so
> that no public sentence outruns its evidence. `docs/MESSAGING_AUDIT.md` lists
> every document that needs to change to match.

## 1. Where the guidance comes from

Three sources, in this order of authority:

1. **Anthropic's published rules about naming and describing Claude.** Binding on
   what we may say and show (section 7).
2. **Anthropic's published thinking about agents,** used for shared vocabulary
   and as a standard to meet or beat: *Building effective agents* (workflows vs
   agents; simplicity, transparency, a well-documented agent-computer interface;
   pause for human feedback at checkpoints; stopping conditions), *Our framework
   for developing safe and trustworthy agents* (keep humans in control, be
   transparent, align with expectations, protect privacy, secure the interactions),
   *Effective harnesses for long-running agents* (durable artefacts between
   sessions), and *Solving code review at Anthropic* (review scaled to risk, the
   change sets the tier, an agent's approval never counts as a person's).
3. **Aveto's own evidence,** which is what lets us go beyond them (section 5).

## 2. The position, in one paragraph

Aveto gives a team of one the engineering process of a large organisation:
independent review, a security pass, a release gate, and a record. It runs in
your own Claude Code session on the plan you already have. **You approve one
bounded Charter at the start and review the result at the end; everything between
is checked, recorded and stopped at the Charter's edge.** Where Aveto has not
proven something, it says so on the same page.

## 3. Message architecture (three layers, never one line)

| Layer | Current | Proposed | Why |
|---|---|---|---|
| **Brandline** | Built for the subscription you already pay for. | *Unchanged.* | Still true and still ours. Always followed by "in your own Claude Code session" where it could be read as Aveto brokering access (section 7). |
| **Headline** | From prompt to production, at agent speed. | **Move beyond supervising agents to reviewing outcomes.** Kicker above it: *Agentic engineering you can verify.* First line of the sub: **From spec to reviewed pull request, with the record.** (applied 2026-10-19; replaced "Describe it. Get a reviewed pull request." on the owner's word that it was not industry vocabulary) | The headline says what a person can do, as Kiro and Devin do; the mechanism (approve once, review once, the record) moves to the sub line. See `docs/drafts/HERO_V3.md`. |
| **Descriptor** | 28 specialist roles; the agent that verifies never wrote the code; gates fail closed; every stage checkpoints. | *Keep, and add:* one Charter approved by its hash; the run stops only where the Charter ends; every finding recorded as fixed, rejected or intentional. | The old descriptor says what is inside; the addition says what the human experiences. |

**The rule for the one-liner:** it must be falsifiable by a run in the repo. "Approve
once, review once" (now in the sub line) is: `runs/<slice>/APPROVAL_RECORD-1.md` and `END_REVIEW.md`.

## 4. Who it is for, and what each reads first

| Audience | They want | We lead with | We must not say to them |
|---|---|---|---|
| **Solo builder / small team** | production-grade process without the headcount | the Charter run, the cost in their own usage window, the honest limits | "enterprise-ready"; "no cost" |
| **Claude Code power user** | to stop babysitting agents | one approval, no prompts mid-run, notices not questions, the review layer | that Aveto replaces Claude Code or is made by Anthropic |
| **Engineering lead with an existing codebase** | to know where the risk is before agents touch it | review mode (planned, bars declared up front) | that it is available; it is a plan (`docs/REVIEW_MODE_PLAN.md`) |

**A framing for this reader, not a headline (planned, 2026-10-21):** *the forward-deployed
team you install.* In the industry a forward-deployed engineer is a person embedded with a
customer who adapts the technology to their code and owns the path to a live system; AWS,
Palantir, Ramp and others use the model, and Constellation Research warns it can paper
over an immature product. Aveto is not a services business, so the honest version is
narrower: it onboards to your repo (`REVIEW_MODE_PLAN.md` M1), remembers your conventions
(`MEMORY_PLAN.md`) and works under your Charter. Until review mode has pilot results this
stays out of the README, the site and any headline (claim C14, planned).
| **Security / compliance reader** | evidence of who decided what | named approver, hash-bound Charter, verbatim records, no relayed approvals | that records equal a certification; that a review certifies absence of bugs |

## 5. Beyond the guidance: what Aveto adds

Anthropic's guidance states principles. Aveto turns each into something checkable:

| Principle (Anthropic) | What Aveto does with it | Evidence |
|---|---|---|
| Humans keep control, especially before high-stakes actions | A Charter approved by its sha256, irreversible actions off by default, a stop for anything the Charter does not name; an approval typed in another session never counts | `docs/HUMAN_APPROVAL_RULES.md`, `execution/charter-check.mjs`, pack v26 |
| Transparency in agent behaviour | A record per stage, a notice at each boundary, an `END_REVIEW.md` that lists every deviation and every question asked after the Charter | `runs/*/END_REVIEW.md` |
| Align with what people actually want | A one-page intent with non-goals; the plan and success criteria are checked against it | `templates/INTENT_TEMPLATE.md` |
| Secure the interactions | Adversarial review of hostile input, tool-less judge agents with a hook as second layer | aveto-support `runs/*/08-security-review.md`, `06-security-recheck.md` |
| Protect privacy (planned, not built) | secret paths never reach a model; data classification required in the Charter | `docs/REVIEW_MODE_PLAN.md` M3b |
| Review scaled to risk | Tier from the diff, bounded rounds, findings recorded; past mistakes as review tests | `docs/CODE_REVIEW.md`, `docs/review-evals/` |
| Keep it simple; add complexity only when it demonstrably helps | A measured owner-touch count per run, and a stop when a milestone misses its declared bar | `docs/PROCESS_V2_PLAN.md`, `docs/REVIEW_MODE_PLAN.md` |

**Three things we can say that the guidance does not:** the approval is a *file you can
verify*, not a prompt you clicked; every pass or failure is judged against a bar
fixed *before* the run; and the limits sit beside the claims.

## 6. Voice and words

- **Plain, evidence-first.** Numbers with denominators. A limit goes in the same
  paragraph as the claim it limits, not in a footnote.
- **Use:** Charter, slice, gate, record, independent review, held-out set,
  "approved by its hash", "fails closed", "within the Charter".
- **Anthropic's terms, used the way they use them.** A *workflow* follows
  predefined code paths; an *agent* directs its own steps. Aveto's pipeline is an
  orchestrator with specialist workers and independent evaluators, and says so
  once, in the architecture doc, not in the headline.
- **Avoid, with reasons:**
  - *autonomous* unqualified (say: "runs to a pull request after one approval");
  - *no marginal cost* / *free* (the plan's usage window is the currency; a run
    can hit a limit and pause);
  - *enterprise-ready*, *FAANG-grade*, *Google-quality*, *Ship like FAANG* (an
    outcome comparison we cannot support). **The descriptive use is kept** (owner,
    2026-10-18): "At FAANG scale, nothing reaches production until an architect, an
    independent reviewer, security and a release gate have all signed off" is a
    statement about how large organisations work, not a promise about our output;
  - *certified*, *compliant*, *secure by design* (we record and review; we do not certify);
  - *replaces engineers / reviewers* (humans own direction, risk and outcome);
  - *governance, framework, methodology* in headlines (jargon; the roles that use
    the word may keep it).
- **SDLC** is the category Anthropic's own course uses, so it may name the
  category; it is not a headline word.

## 7. Naming, logos and what we may show of Anthropic

From Anthropic's trademark guidelines and the Agent SDK branding note, as read
2026-10-18 (re-read before any launch):

- Use Anthropic's marks **only as it permits, and in materials it approves**;
  never **alter** them; never place a **trademark symbol** on them; never use them in
  a way that **implies sponsorship, endorsement or affiliation**. The page does
  not address factual references such as "works with Claude Code", so we keep them
  factual, minimal and without any logo.
- **No Claude or Claude Code in a product, company or domain name.** Aveto's
  name and domain have neither. No Claude Code-style ASCII art or visuals.
- **Keep a site-wide statement:** *Aveto is independent. It is not affiliated
  with or endorsed by Anthropic. It runs in Claude Code.* Today it appears only in
  the course section and one FAQ answer. It belongs in the footer.
- **Do not offer or imply that Aveto supplies claude.ai login or usage limits.**
  Anthropic does not allow third-party products to offer them. Aveto only
  describes how a person uses *their own* Claude Code session. The wedge "survive the
  usage window" is stated as: *a run stops cleanly and resumes from its state*, never as a
  way around a limit. Multi-account rotation stays out of the product.
- **"Powered by Claude" and the Agent SDK wording** apply to partners who
  integrate the Agent SDK. Aveto does not use the SDK, so they do not apply; if
  that changes, the SDK's branding list applies in full.
- Permission to use marks or logos: marketing@anthropic.com, which the page offers
  to parties with an existing relationship. We have none, so we use no marks.

## 8. The claims register

Every public claim has a row. A row has a status, the evidence, and the limit that
must travel with it. `scripts/check-claims.mjs` fails CI if a row's evidence path in
this repo does not exist. A claim not in the register is not published.

| id | Claim | Status | Evidence | Limit that travels with it |
|---|---|---|---|---|
| C1 | 28 specialist agents | proven | `agents/` | roles are briefs run by Claude; enterprise overlays are specified, not all exercised |
| C2 | The agent that verifies is never the agent that wrote the change | enforced | `execution/pack/AGENTS.md`, `execution/pack/protocols/APPROVAL_PROTOCOL.md` | same model family; human review remains for architecture and the riskiest code |
| C3 | Gates fail closed | enforced | `docs/RELEASE_GATES.md` | |
| C4 | One approval at the start, then a review at the end | shown twice | `docs/PROCESS_V2_PLAN.md`, aveto-support `runs/land-answerability/`, streak-seed `runs/health-version/` | two runs; a person starts each run and decides the merge; permission prompts are prevented only if the Charter's permissions row is set |
| C5 | An approval typed in another session does not count | enforced | `docs/HUMAN_APPROVAL_RULES.md` | |
| C6 | A review layer with risk tiers and recorded findings | built, used once | `docs/CODE_REVIEW.md`, aveto-support `runs/land-answerability/code-review.md` | one finding in one run; its precision is unmeasured |
| C7 | A judge passed a held-out gate: 24/24 unanswerable refused, 16/19 answerable kept | measured | aveto-support `runs/docs-answerability-2/07-gate-scoring.md` | passes the second bar by one question on 19; retrieval found the right file for 19/24 (79.2%, under its bar); this gate was of the attended judge (see C16 for the live service) |
| C8 | Four pre-registered checks failed and were recorded as results | measured | aveto-support `runs/docs-retrieval/`, `runs/docs-retrieval-2-proof/`, `runs/docs-abstention/`, `runs/docs-answerability/` | |
| C9 | Runs on your Claude Code plan, not an API bill | true as designed | `execution/pack/AGENTS.md` | usage still counts against the plan's limits; a long run can pause; the terminal client here offers only an API login |
| C10 | A budget is checked before each step | enforced | `execution/hooks/budget-guard.mjs`, `execution/pack/protocols/RUN_ECONOMICS.md` | estimates for review stages have run 1.5 to 3 times over, three times |
| C11 | Review mode for existing codebases | **planned, not built** | `docs/REVIEW_MODE_PLAN.md` | never described as available |
| C13 | A greenfield app built from a one-paragraph brief (StreakKeeper) | shown once | `docs/VALIDATION_MATRIX.md` | one small app; a person approves each gate |
| C14 | The forward-deployed team you install (onboards to your repo, remembers conventions, works under your Charter) | **planned, not built** | `docs/REVIEW_MODE_PLAN.md`, `docs/MEMORY_PLAN.md` | never published until review mode has pilot results; not a services claim |
| C15 | Every tool call is recorded in a tamper-evident log with the role that made it | **built, not yet used in a run** | `docs/AGENT_SECURITY_PLAN.md`, `execution/hooks/event-log.mjs` | detects an edited or deleted line after the fact; fails open; a shell role can still reach the file until the sandbox (planned) is on; never "audit-grade" |
| C16 | The support agent runs live as a public service on Azure; scored once on 20 new questions it refused 10/10 it should and kept 8/10 answerable | measured | aveto-support `runs/public-ask-the-docs/18-gate/RESULT.md`, `runs/fix-service-accounting/18-production-verification.md` | the second bar was met exactly, with no margin, on 10 questions; a static or small sample cannot separate 80% from slightly below; spend limits reset when the service restarts (the $10 console limit is the only lasting cap); the DPA text was read by no agent; never "production-ready" or "enterprise" |
| C17 | The public chat's new experience (answer and refusal cards, suggested questions, receipts, scorecard) was one Aveto run: 731 tests pass (668 before); no serious accessibility issue on five views (automated, local); live cold start 25.8 s, warm median about 1.4 s, about $0.0086 a question; a rollback rehearsal served again about 65 s after the command | measured | aveto-support `runs/polished-chat-experience/END_REVIEW.md`, `13-live/rehearsal-timing.json`, `13-live/cold.json`, `08-browser-checks.md` | one run, seven live questions and six warm requests, so the timings are single samples; accessibility was tested locally, not on touch devices or real hardware; the visit and question counts are raw totals since a restart and can be inflated, so they are not evidence of use; the outside model's blind review of the pull request (Codex) found one issue, already known, and ran only part of the tests |
| C18 | A public, read-only page (aveto.dev/runs) lists every run recorded in aveto-support with its status, spend against plan and cap, Charter hash, event-log result and pull request, read by a script from each run's own records | measured | `execution/runs-dashboard.mjs`, `execution/tests/runs-dashboard.test.mjs`, `site/runs.html` | a snapshot regenerated by hand and dated on the page, not a live feed; a figure a run's records do not state shows as "not recorded" (for example 9 of 13 runs state no pull request, and the question and open-item counts are the run's own, which has been wrong before); spend is self-reported token use, not a bill; it is not a control plane, holds no approvals or credentials, and has no script |
| C12 | Seven traced slices across stash-seed and streak-seed | measured | stash-seed and streak-seed `runs/*/trace.json` (3 + 4) | the site must use this count, not another |

## 9. Keeping it true

- **Owner of messaging:** the owner. Changes to a status in section 8 are made in
  this file first, then in the site and README in the same commit.
- **A sentence moves from "planned" to a claim only when its evidence file exists
  and the limit is attached.**
- **Re-read the Anthropic pages in section 7 before any launch, and every
  quarter.** They change.
- **Measure the message by the product:** owner touches per run and time to the first touch, reported
  in `END_REVIEW.md`, are the numbers that say whether "approve once, review once"
  is still true.
