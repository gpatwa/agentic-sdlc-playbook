# F4: the three sources the Conductor and Amazon notes had not read

> Read 2026-11-04 by the support session (plan item F4 in `docs/PRODUCTIVITY_AND_ORG_PLAN.md`). The two Conductor pages were read
> in full in the built-in browser. The Amazon page was read through a page fetcher that summarises the page, so it is a summary
> of the page, not the page verbatim, and the page shows no date. The subscription question rests on secondary coverage; the
> Anthropic support page itself was not read.

## 1. "Conductor is joining Meta" (conductor.build/announcement)

What it says: Conductor is joining Meta. The founder says a new interface is coming "early next year" and does not say what it is.
The page's timeline is dated from today:

| Date | What happens |
|---|---|
| 2026-11-04 | New users can no longer sign up **or download the app**. Existing free users stay free; pro users keep pro features for free. |
| 2026-11-13 | Conductor Cloud goes read-only; active subscribers are refunded. |
| 2026-11-20 | Conductor Cloud shuts down and its data is deleted. |
| early 2027 | Local Conductor receives new models and critical fixes until then, then winds down; user data is deleted at shutdown. |

It also says it has never sold or trained on user data. That is a company statement; the privacy policy was not read.

**What it changes for Aveto.** Conductor is not a dependency, a competitor to track, or something to test against. A new user
cannot install it from today, and the product winds down by early 2027. The compatibility test (plan item F3) is dropped; its
question (do the pack's hooks, settings and plugin load when another tool starts the Claude Code session) stays alive as part of
the parallel-worktree test O4, run with plain Claude Code worktrees. What Meta builds next is unknown.

## 2. "Claude subscription update for Conductor" (conductor.build/blog/claude-subscription-update, 2026-06-15)

What it says: on 2026-05-13 Anthropic announced subscription changes for **Claude Agent SDK usage in third-party tools**.
Conductor runs Claude Code through the Agent SDK, so the policy applied to it. On 2026-06-15 Anthropic announced the changes
were delayed indefinitely, and Conductor users could keep using their Claude plan as before.

**Secondary coverage (not primary; relayed quotes of an Anthropic support page).** The planned change would have moved
Agent SDK usage, **`claude -p`** and third-party apps from subscription limits to a separate monthly credit ($20 to $200). On the
due date Anthropic paused it; the quoted support text is "for now, nothing has changed". One source calls it cancelled; that is
unconfirmed.

**What it means for Aveto.**
- The site's "A subscription to build" claim is about interactive Claude Code, which this change did not name. It stands.
- Assessment mode's Claude reviewer runs `claude -p` (`execution/assess-run.mjs`), the usage the paused change named. If the change
  returns, assessment runs could draw on a separate credit or API billing, and our wording "your Claude Code plan, not an API
  key" would be wrong for them. This is a risk to note, not a fault today.
- Open: read Anthropic's own support page for the current terms before anyone edits site or README wording. No wording change is proposed until then.

## 3. Amazon's memo, on Amazon's own page (aboutamazon.com, "An update from Amazon engineering leadership on the role of the developer in the age of AI")

Author: Terk Terkowitz, VP and Distinguished Engineer, Worldwide Amazon Stores. The page is undated; press coverage says it
reached staff in September and went public on 2026-10-27. What the page says, and where it differs from what the plan had taken
from press:

- **It does not say "outcomes, not inputs" in the plan's sense.** It prefers long-term outcome measures but says they are slow and
  hard to isolate, so Amazon **sometimes uses input metrics** (token use, AI tool adoption) and throughput metrics (code changes,
  reviews). It calls them flawed if turned into targets (token use conflicts with frugality, counting lines of code with
  simplifying), and says they correlate well enough with outputs to be used "with care and judgment".
- **A distribution view.** Leaders should watch the 10th percentile of AI adoption (teams not using it effectively) and the 90th
  (heavy users), and check whether heavy users show matching delivery gains.
- **"A finding, not a failing"** is confirmed: when AI does not help someone's work, they should document why, share it with
  peers and raise it with their manager.
- **Customer connection:** ICs and software development managers have drifted from customers and the business as Amazon grew;
  the memo wants that reversed, with ownership scope growing with seniority.
- **Not on the page:** team sizes, one owner per piece, who reviews or approves AI-written code, any PM, EM or TPM role, the
  KiroRank leaderboard. Those came from press and executive interviews and remain secondhand.

**What it changes in our plan.** The Aveto position (outcomes and teams, never inputs or individuals) is stricter than Amazon's,
which is fine, but the plan must not say Amazon "measures outcomes, not inputs". The percentile idea is worth keeping in a form that
suits one operator: report the spread across slices (slowest and costliest tenth), never across people.

## 4. Anthropic's own support page (read 2026-11-04, through a summarising fetcher)

Page: "Use the Claude Agent SDK with your Claude plan" (support.claude.com, article 15036540). It says:
- 2026-06-15 update: the previously announced changes to Agent SDK usage are **paused**; Agent SDK, `claude -p` and third-party
  app usage **still draw from subscription limits**. The page does not describe the paused change or its original date, and says
  the pause holds "for now".
- 2026-10-07 update: Max, Ultra and Team plans include monthly API credits. They cover the API, Managed Agents, and the Agent SDK
  and `claude -p` **when used with an API key from a linked Console organization**. Signed in with the Claude plan, the SDK and
  `claude -p` still draw from subscription limits.

**What it settles.** The secondary reports in section 2 were right that the change is paused, and the primary page confirms
`claude -p` is covered by subscription limits today. Assessment mode's Claude reviewer (`claude -p`, signed in with the plan) is
within the wording "your Claude Code plan, not an API key". No site or README change is needed. The risk stays: the page says
"for now", so re-read it before any release that repeats the claim.

## Still unread

Conductor's privacy policy and terms; the press claims about Amazon team
sizes and reviewer rules (no primary source found).
