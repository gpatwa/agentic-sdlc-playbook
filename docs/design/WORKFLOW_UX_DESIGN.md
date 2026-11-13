# Workflow and decisions: design proposal (from a design review)

> Written 2026-11-12 by the support session, combining four reviews the owner asked for: a UX Researcher and a UI Designer (each
> working from Aveto's own role briefs and a real run's records, `aveto-support/runs/fix-service-accounting/`), an independent
> design lead, and market research on small companies in this space (pages read 2026-11-12, sources at the end). **A proposal:
> nothing is built.** It revises `docs/WEB_APP_PLAN.md`, which stays as the later phase.

## What the four reviews agree on

1. **The jobs, in order:** see at a glance what is waiting on you; close a finished run's open decisions (the spend-fix run left 5,
   two still open with nowhere to track them); approve a Charter knowing what it allows; answer a mid-run stop quickly and safely.
2. **Friction is a feature at the risky end.** A routine choice should take two taps; anything that leads to a deploy, a new data
   processor, a safety-control change or a model change should need reading and a deliberate step; the Charter stays a typed hash.
3. **Making approvals easy can make them worthless.** Anthropic's own engineering post (2026-03-25) reports users accept 93% of
   permission prompts and names "approval fatigue". Mitigations: the consequence and numbers on each option, no preselected option
   on high-risk choices, a count of questions per run shown as a warning sign, never a new kind of stop.
4. **Aveto's position is unoccupied.** Of ten products surveyed, none binds an approval to a document's hash, only one shows a named
   approver on the decision, and none keeps the record in the user's repo.

## What changed the plan: the session can already reach the phone

The market research found that **Claude Code's own Remote Control** (first-party, Pro and Max plans) connects a running session to
claude.ai and the iOS and Android apps, with push "when actions required", and that **a question asked with the in-session choice
tool stays open until answered** (other forwarded dialogs time out after 5 minutes). Products such as Happy and Omnara built their
own relay for this; Aveto may not need to.

If it works for Aveto's runs, the owner gets tap-to-answer on the phone with **no hosted app, no token, no polling and no new data
processor**, and the answer is still given in the session driving the run. **Not confirmed:** whether Remote Control works with
sessions started in the desktop app (the docs describe the `claude` process); a throwaway test settles it, as the status line test did.

## Recommended order

| Step | What | Hosting | Needs |
|---|---|---|---|
| D1 | **Choices for mid-run stops.** The Orchestrator asks each stop with the choice tool: what it wants, the Charter line it falls outside, what "no" reverses, the numbers, options with the recommended one first. Two tiers: routine (two taps) and high-risk (no preselection; a confirm step restating the action). The chosen option's id and full text go verbatim into `APPROVAL_RECORD` | none | rule wording: a choice clicked in the driving session counts |
| D2 | **Test Remote Control** on a throwaway desktop session: does a choice question reach the phone, can it be answered there, is a push sent | none | owner's phone, 10 minutes |
| D3 | **Rendered end review and Charter diff.** A script turns `END_REVIEW.md` into the six-step page style (verdicts, spend against cap, findings, each open decision as its own card) and shows a Charter as a diff against the last approved one before the hash is typed | none (a local file, or the repo's own pages) | none |
| D4 | **Fix and regenerate `/runs`** at the end of each run (see "Found during the review") | the existing site | a deploy |
| D5 | **The web app** (`docs/WEB_APP_PLAN.md`), only if D2 fails, or when a second person must see or approve runs | new | the plan's decisions, plus the fixes below |

**One measure:** words the owner types per run, not counting the Charter hash, over five runs before D1 and five after, with a check
that no stop lost its numbers or its reversal cost.

## D2 result: Remote Control works from the desktop app (2026-11-12)

Remote Control was turned on for a desktop-app session (Claude Code in the Claude desktop app; state reported "on"), and two
test questions were asked with the choice tool. **First question:** the owner answered on the desktop; the session was not yet
open on the phone. **Second question,** after the owner opened the session in the iPhone Claude app: **a push notification
arrived and the owner answered on the phone.** The answer reached the session as an ordinary choice answer.

**What this shows:** a desktop-app session can put a choice question on the owner's phone with a push, and take the answer
from there, with no hosted app. **What it does not show:** that it works inside a run's Orchestrator session started from a chip
(a different session; the switch is per session), how long a question waits unanswered, behaviour when the laptop sleeps, or
pushes when the session is not already open on the phone. One test, one phone. Setup the owner needs: open the session once in
the Claude app (Code), and allow pushes.

## Fixes to the web app plan, if it is built later

- Sign a hash of the **exact question and option text**, not only the question id, so a vague question cannot collect a real signature.
- The verifier script and the pinned key must be files a run cannot edit without a stop; otherwise "verified" is ceremony.
- Decide which channel wins when the session and the app both answer; a late answer is "not counted", shown as such.
- A waiting script cannot block longer than a shell call allows; each re-poll costs a model turn and plan usage Aveto cannot see.
- A posting hook is a network call in the build path (rule 5) and a new data processor (rule 6): both go in the Charter.

## Screens (for D3, and later for the app)

From the UI Designer, using the real run: a runs list with a "Waiting on you" section; a run timeline from `STATE.md` (stage,
owner, verdict, file link, interruptions such as the stage 3 usage-limit pause); the Charter as ten collapsible sections under a
hash bar with the budget and the stops; a question screen with full-width option cards (56 px), each with its consequence and cost;
an end review with items closed one at a time and the owner's quote and time on closed ones. States: stale ("the session has not
posted for 40 min"), already decided, offline, stopped. Visual system: the site's tokens and components; one contrast failure to fix
(form-control borders at 1.68:1, below 3:1). The full proposal is kept with the review notes below.

## Found during the review

1. **`aveto.dev/runs` misreads the spend-fix run** (checked 2026-11-12 against the files): the hard cap shows "not recorded" (the
   state file says "hard cap 1,200k (C2.3)", a form the parser does not match); questions asked shows "not recorded" (the end
   review reports 0 as a bullet, the parser expects a heading); open items show "not recorded" (the end review says "Blocked on
   you", the parser looks for "Blocked on me"); the event log shows 533 lines, read from the pre-release check file, while the final
   check says 777. Three of four understate; the 533 is a wrong figure on a public page.
2. **The spend-fix run's approval record quotes a short hash** (`afc984d1…aefe4`). Either the record shortened what the owner typed
   or a short form was accepted; to check against `charter-check.mjs` and the approval rules.

## Market research summary (ten products, pages read 2026-11-12)

Claude Code Remote Control (first-party); Happy (open source, wrapper CLI, phone apps, end-to-end encrypted relay); Omnara
(YC; now a managed agent platform; per-tool auto, ask or block; approvals in a dashboard or Slack, Discord, GitHub; "Allowed by
@user" on the decision); HumanLayer (YC; began as approvals over Slack, SMS and email; now a team agent IDE); Conductor (Mac app,
parallel agents, plan approval); Vibe Kanban (sunsetting); Crystal, now Nimbalyst (diff approval, iOS app); Claude Squad (tmux, an
auto-accept flag); Sculptor (containers); Happier (an approvals inbox instead of a modal). Recurring patterns: QR pairing, the
local session must stay alive, push then Allow or Deny, per-tool policy tiers, plan approval as the main checkpoint, answers in chat
threads, a persistent inbox. Done badly: blanket auto-accept modes, approval requests that sit unread past a timeout in Slack or
email, notifications too thin to decide on, and a silent default after a timeout.

Sources: code.claude.com/docs/en/remote-control · github.com/slopus/happy · happy.engineering · github.com/omnara-ai/omnara ·
omnara.com · github.com/humanlayer/humanlayer · humanlayer.dev · conductor.build/docs · github.com/BloopAI/vibe-kanban ·
github.com/stravu/crystal · nimbalyst.com · github.com/smtg-ai/claude-squad · imbue.com/sculptor ·
guides.happier.dev/human-in-the-loop-approvals-from-your-phone-for-claude-code-codex-opencode · anthropic.com/engineering/claude-code-auto-mode.
Read by a research agent; secondhand items (an HN thread, an App Store listing, a vendor blog) are marked as such in its notes and
not relied on above.
