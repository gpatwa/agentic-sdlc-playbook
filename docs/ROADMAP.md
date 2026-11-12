# Aveto roadmap (draft for the owner's review)

> Written 2026-11-11 by the support session; order approved by the owner the same day (decisions at the end). It adds no research: it is built from
> `docs/BACKLOG.md`, `HANDOFF.md`'s order of work, the Scout pilot (`docs/data/scout-pilot-2026-11/run-4/SCOUT.md`), and two
> notes written today: `docs/research/2026-11-vorflux-comparison.md` and `docs/research/2026-11-mckinsey-agentic-pdlc-talk.md`.
> The one new read is vorflux.com's home page (2026-11-11, in-app browser, signed out) for the landing-page and
> "Each AutoBot thinks like a senior employee" sections below. Any wording marked *proposed* is the owner's to approve before it
> goes into the README, the site or `docs/MESSAGING.md`.

## Where Aveto stands today

Pack v34, 29 agent briefs, 493 tests passing. Built and measured by one operator on small repos. What it does that others we
read do not state: one approval bound to a hashed Charter (scope, budget, models, processors), no agent approval counts, refusal
at intake, records kept in the repo. What it lacks: a team using it, a design partner, a measured model-change check, any
enforced cap during a run, and a landing page a stranger can take in quickly.

## What we learned from others

| Source | Lesson | Do we take it? |
|---|---|---|
| Vorflux docs and home page | Users want to see **one piece of work go through the steps**, with the real artefacts, not read about it | **Yes**: landing page (Theme 2) |
| Vorflux billing | "Bring your own subscription" is packaged as a product feature: quota banner, stop at a remaining-quota %, hard per-session cap that stops | **Partly**: what we can honestly offer inside Claude Code (Theme 3) |
| Vorflux | "Built for the subscription you already pay for" is **not unique** to Aveto; neither are plan approval or an audit log | Yes, as a wording limit (see "What Aveto must NOT claim" in the Vorflux note) |
| Vorflux | Approval can be "recorded by agent"; Auto Review can approve; autonomy grows by a "trust ramp" | **No**: this is where our position differs. Keep it |
| Vorflux | "Practically free" / "almost free" | **No**: we never write "no marginal cost" |
| McKinsey talk and articles | The bottleneck moves to requirements, review and release; standard artefacts; a "trust layer" | Already our design; **not evidence** (seller's account, figures overstated against their own article) |
| McKinsey | Top teams collapse roles (definer, builder) | **Test it**: O3 (fewer producing roles, same gates) stays in the plan |
| McKinsey | "Take the human review back" as confidence grows | **No**: we keep the review; be ready to say what evidence would justify a lighter tier (the Charter's tier rule) |
| McKinsey | Curated "golden examples" of good code fed to agents at each checkpoint | **Maybe later**: small, cheap, but no evidence it helps; not before the model-change check exists to measure it |
| McKinsey | AI scoring the value of what is built; velocity targets in OKRs | **No**: against `PRODUCTIVITY_AND_ORG_PLAN.md` (Goodhart) |
| Opportunity Scout (run 4) | No candidate is ready for the Market Researcher; the evidence is vendor-made; look for non-vendor signals and **talk to Aveto's own users** | **Yes**: joined with the design-partner work (Theme 5) |

## Themes, in order

The order follows the one the owner accepted (make the record trustworthy, test injection via the web, model-change check,
then baseline pilot and design partner), with today's two additions placed where they fit.

### Theme 1 · Keep the public record true (now, small)

Cheap fixes, most of them wording the owner must approve.

- **Done 2026-11-11:** the agent count said 28 in three places (home page heading, `docs/PLAYBOOK.md` and its page, MESSAGING C1) with 29
  briefs in `agents/`. C1 fixed in PR #6; the rest fixed with the Scout added to the role groups. Deploy waits for the landing page.
  `check-claims.mjs` did not catch it because it checks only that evidence paths exist.
- Owner's spot-check of the Scout's 10 cited claims (`docs/data/scout-pilot-2026-11/SPOT_CHECK.md`).
- C4.1: the owner states the web-search terms status (blank in all four Charters).
- Review-eval rescore (`docs/review-evals/RESULTS.md` is empty): this is **model spend**, so it needs a Charter.

### Theme 2 · Landing page that tells one story (built 2026-11-12, deploy waits for the owner)

Built to the proposal below, on the owner's choices of 2026-11-12: the six steps show `fix-service-accounting` (aveto-support), wording
reviewed once at the deploy gate, cut sections linked to the playbook and docs, pushed to main. About 1,330 visible words
(4,540 before), seven sections plus the hero. The four industry statistics, the span diagram, the standards list, the course
table, the live-demo walkthrough and the role chips left the home page; the live service is linked from the proof list.

### Theme 2b · Decisions as choices, not typing (next, small)

Raised by the owner 2026-11-11: asking for a human decision should not need a paragraph typed back. In Aveto runs, the
Orchestrator's stops (a lower review depth, a gate exception, an over-budget spawn) could be asked as a choice with a
recommended option and the numbers, and the answer recorded verbatim in `APPROVAL_RECORD`. **Exception, deliberate:** the Charter
approval stays a typed sha256, because it binds the approval to the exact text. Open question before building: whether a
clicked choice counts as an approval "given directly, in the session driving the run" (it is in that session; record which
option was picked and its full text).

### Theme 3 · Subscription-aware spend controls (next)

Aveto already runs on the owner's subscription through the desktop app (no API key, no metered `claude -p`). What it lacks,
compared with what Vorflux packages:

| Control | Vorflux states | Aveto today | What we could build honestly |
|---|---|---|---|
| Hard stop during a run | Per-session cap, default $1,000, that stops | Budget checked only before each spawn (C10); no stop mid-spawn (T43e) | `maxTurns` in generated subagent frontmatter (Claude Code 2.1.246+): a turn limit, not a cost cap. Needs a measured turns-per-run figure first, then a pack version |
| Live spend during a run | Spend analytics | Measured after the spawn (PostToolUse sees `totalTokens`) | Running total in `STATE.md` updated after each spawn, shown by `/agentic-status` |
| Quota visibility | Quota banner, stop at remaining-quota % | None | Checked 2026-11-12 (`docs/research/2026-11-quota-visibility-check.md`): only the status line receives the five-hour and weekly **used** %, on Pro, Max and Ultra. A status line could write it to a file the budget guard reads before each spawn. Tested 2026-11-12: the desktop app did **not** run a project status line (one session). So no quota stop for desktop runs; point users to `/usage` |
| Cost per slice, in plain words | Machine hours plus tokens | Run economics and calibration ratios | A one-line cost summary per run in the record |

Limit to keep in view: Vorflux connects a customer's Claude plan to a third-party product; whether that use fits Anthropic's
consumer terms was **not checked**. Aveto runs inside the owner's own Claude Code; we still should not describe it as free.

### Theme 4 · Model-change check, first measured run (next)

B3: the 11 cases on the current model, to measure spend and variance. Needs the owner's spend approval and a Charter typed in
that session. Prerequisite for judging memory, golden examples or any brief change.

### Theme 5 · Discovery with real users and a design partner (guide ready 2026-11-12; introductions are the owner's)

Ready: `docs/discovery/INTERVIEW_GUIDE.md` (30 minutes, past events not opinions, one block per Scout candidate, a stop rule after five
interviews) and `docs/discovery/PILOT_ONE_PAGER.md` (two weeks, one repo, before and after figures; fee left to the owner).

The Scout's own recommendation (run 4) and Phase C point to the same act: talk to people who run agents on a team. One set of
conversations serves three needs: non-vendor evidence on the Scout's candidates (spend per team, audit trail), the P5 baseline
pilot's team repo, and a design partner. Owner's introductions are the blocker; Aveto can prepare a short interview guide and a
one-page "what a pilot costs you" sheet.

### Theme 6 · Later, with triggers

- **O3** fewer producing roles with the same gates (tests the McKinsey role-collapse claim on our own runs).
- **T46** approver identity: triggered when the site wants to say "a named human approved", or a design partner asks.
- Search-result injection test for the Scout (run 4 showed a fetched page, not a search result).
- Scout improvements 1 to 7 (paused by the owner before the Vorflux review).
- Golden examples, per-role scorecards: only after Theme 4 can measure them.

### Deliberately not building

Memory (`docs/MEMORY_PLAN.md`); a hosted cloud service; Slack-resident standing agents; an agent merge queue; a trust ramp or
agent self-approval; AI value scoring; velocity targets; Jira or New Relic integrations; more roles. Each is either outside a
process that runs in your own Claude Code, or against the position.

## Review: Vorflux's "Each AutoBot thinks like a senior employee"

**What the section is.** One heading, one line ("For every piece of work, it plans, designs, builds, tests, and reviews it"),
then four tabs (Plan, Design, Build, Test) that scroll through **one example**, fixing duplicate Stripe charges. Each tab shows a
product screen with real-looking content: the plan has a goal, an architecture sketch, three steps and three verification checks
("Replay the same webhook twice → one charge"); design shows a checkout mock with two pinned comments being applied; build
shows four sub-agents with a migration diff and a test run (12 passed); test shows a browser and iPhone recording with a test
report. The same example opens the page (a Slack thread) and returns in the PR-review section.

**What works, and we should copy:**
1. **One story, carried through every step.** The reader learns the workflow by watching one change, not by reading a list.
2. **Artefacts, not adjectives.** Each step shows the thing it produces (plan, diff, test report). Aveto produces the same kinds
   of artefacts and today describes them in prose.
3. **Verification is in the plan, before the build.** The plan names how the result will be checked. Aveto's spec and QA
   Evidence do this; the site does not show it.
4. **Short text per step:** about 25 words each.

**What to avoid, or where Aveto differs:**
1. **The heading claims more than the section shows.** It says five steps including "reviews"; the tabs show four. Review is a
   separate section, and there it is a risk score that can approve.
2. **No approval step in the walkthrough.** The only human approval on the page is a chat reply in the Slack mock ("@Maya Chen
   approve?" / "Approved. Go ahead."). For Aveto the approval *is* the story: the walkthrough should start with it.
3. **"Thinks like a senior employee" is an unverifiable, human-likening claim.** We should not write anything like it. Aveto's
   equivalent says what is checked and by whom, not how the agent thinks.
4. The demo is illustrative; Aveto's should use **one real run's artefacts** with a link to the record, which Vorflux's does not.

**Proposed Aveto equivalent (wording not approved):** a section titled along the lines of *"Every change takes the same six
steps"*: **You approve** the Charter (its hash) → **Spec** with how it will be checked → **Build** with fail-first tests →
**Evidence** (QA and security) → **Independent review** → **You merge**. One real slice from a seed repo, with each step's real
file, and a link to the run's records.

## Landing page redesign (proposal)

**Measured today (visible text, scripts and styles removed):** aveto.dev's home page is about **4,540 words under 17 headings**.
vorflux.com's main area is about **1,600 words under 10 headings**, and only about **640** of those are in headings and
paragraphs; the rest sits inside product mock-ups.

**Proposed section list** (about eight, aim under 1,500 words; long material moves to `site/playbook.html` and the docs):

1. **Hero:** one line on what it is, one line on who it is for, one picture of a real approval record. Keep the brandline.
2. **The six steps**, one real run (the section above). The core of the page.
3. **What it refuses:** the intake refusal, shown with the real record (already a strength the site has).
4. **Runs on the subscription you already have:** what you pay for, what is not metered, the spend controls that exist, the ones
   that do not (Theme 3). No "free".
5. **How far it is proven:** the existing honesty table, compressed to five rows with a link to the full one.
6. **What it is not:** one short block (no hosted service, one operator so far, not a certification).
7. **Questions:** five, not more.
8. **Start:** install command and a link to the playbook.

**Rules that still apply:** every claim needs a row in `docs/MESSAGING.md`; `scripts/check-claims.mjs` and
`scripts/check-site.mjs` must pass; contrast fixes from earlier deploys stay; the deploy is the owner's click.

**Order of work:** (a) owner approves the section list; (b) I draft the wording as a doc for approval, not on the site;
(c) build in a branch with screenshots at phone and desktop width; (d) owner reviews and clicks the deploy.

## Next three items

| # | Item | Cost | Owner decision needed |
|---|---|---|---|
| 1 | Landing-page wording as a doc, plus 2 to 3 candidate real runs for the six-steps section | No model spend | Approve the wording; pick the run |
| 2 | Docs-only check: can a hook or script read the plan's remaining quota | No model spend | None (approved) |
| 3 | Interview guide plus pilot one-pager for discovery and a design partner | No spend | Who to introduce |

B3 is on hold. Theme 3's `maxTurns` work follows B3, because it needs a measured turns-per-run figure.

## Decisions (owner, 2026-11-11, chosen in the session)

1. Order: kept as written.
2. 28 to 29: fix and commit now; deploy later, with the landing page.
3. Landing page: eight-section list approved; wording drafted as a doc first, not on the site.
4. Six-steps section: yes; I propose 2 to 3 real runs, the owner picks.
5. Quota check: yes, documentation only, no spend, nothing installed.
6. B3 model-change run: hold.
7. Discovery: yes; prepare the interview guide and pilot one-pager.
8. "Deliberately not building": kept as written.
