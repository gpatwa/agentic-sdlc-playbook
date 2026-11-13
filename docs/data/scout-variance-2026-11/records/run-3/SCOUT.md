# Opportunity Scout: which problem next

> Owner: Opportunity Scout Agent
> Status: ready for the human
> Question (verbatim): "Which problem should Aveto build a product or agent for next?"
> Date read: 2026-11-12. Sources S1 to S12 are in `SOURCES.md`.

"Independent signal" below means one origin that shows the pain exists (observed, not predicted). Sources that only say what auditors or buyers are "likely" to want are listed as expectation, not counted. Same-origin pages count once.

## Ranking

| Rank | Candidate problem | Independent signals (origin) | Strongest source type | Confidence | Next step |
|---|---|---|---|---|---|
| 1 | 3. Managers cannot see or plan agent token spend per team, slice or outcome | 2: Pragmatic Engineer interviews of 15 companies (S4); LeadDev practitioner quote that managers must justify spend (S5). Not counted: Uber/WSJ claims, origin not shown (S6) | primary, anonymized | medium: figures are specific but come from one author's interviews; nobody says "I cannot attribute spend" | needs more discovery |
| 2 | 2. No trustworthy way to know how many AI-written PRs were reviewed by a person | 2: MSR '26 paper (S1); Sonar survey (S3, vendor). Adjacent, not counted: S2 measures merging, not review | primary, academic | medium: the pain exists in open source; teams lacking a way to measure it is not shown | needs more discovery |
| 3 | 4. Inheriting a codebase with no independent, cited risk review | 2: CIO account (S11); Black Duck (S10, vendor, no figures) | secondhand | low: both qualitative, no figures, S11 covers systems broadly, not code | needs more discovery |
| 4 | 1. Cannot show an auditor what an agent did, read, and who approved | 1: LeadDev anecdotes, unnamed (S6). Expectation only: Codacy (S7), tianpan (S8), EU Art. 12 (S9, high-risk systems only) | secondhand | low: no observed audit request found | needs more discovery |
| 5 | 5. Small teams cannot tell before building if a problem has independent evidence | 1: CB Insights (S12), a general startup-failure signal | primary | low: shows failure from poor fit, not that this tool is wanted | needs more discovery |

No candidate reaches three independent signals, so none can be "ready for the Market Researcher". Order follows signal count, then source strength: 3 over 2 because it has named figures from many companies; 4 over 1 because it has two origins versus one.

## Candidate 3: token spend visibility

**Problem:** Per-seat budgets fail once agents bill by usage, and managers lack a view by team, slice or outcome. This could be wrong: some firms see spend and do not care.

**Evidence:** S4 (read 2026-11-12): spend up about 10x in six months at two companies; $200 to about $3,000 per developer per month at one; $100 per-user limits used in 3 to 5 days at one; one engineer $1,400 in a day. About half let spend rise, half cap it. Primary, anonymized. S5: "prove that it creates business value" era quote. Secondhand.

**Who feels it:** engineering managers and finance at companies of about 50 to 10,000+ people (S4). Population size: not found.

**Today:** caps, cheaper default models (one firm reports about 30% lower cost), pooled spend, a monthly leaderboard (S4).

**Already addressed by:** not established from pages read. Vendor pages appeared in search but were not read.

**Disconfirming (S4):** an infra founder treats tokens as an engineering cost and says top users rarely exceed about $1K a week; a healthcare manager reports "massive leverage"; some "let it rip" firms rejected curbing as premature. A disconfirm search for "not worth tracking" found only opinion posts, not read. Non-vendor evidence: S4, S5.

## Candidate 2: review of AI-written PRs

**Problem:** Teams merge AI-written PRs and cannot say how many a person reviewed.

**Evidence:** S1: about 80% of AI-co-authored PRs from non-owners merged "without any explicit review"; 67.5% of such PRs come from non-owners. Primary. S3: 48% always check AI code before commit, 96% do not fully trust it; self-reported, method not shown, vendor sells verification. Non-vendor evidence: S1.

**Who feels it:** open-source maintainers (S1); companies with agent PRs not shown.

**Today:** not found. **Already addressed by:** not found in pages read.

**Disconfirming:** S1 does not define "review" on the page and gives no sample size. S2 finds 83.77% of Claude Code PRs merged against 91.00% for human PRs, with no significant difference in merge time, so merging fast may not be abnormal. S3's 48% is self-reported. All data is open source; no evidence for private company repos. No dedicated disconfirm search was run (see gaps).

## Candidate 4: inherited codebase risk review

**Problem:** Buyers of or heirs to a codebase discover risk after commitment.

**Evidence:** S11: CIO says diligence comes late and undocumented integrations, debt and unsupported systems surface after close; anecdotal. S10: Black Duck sells such audits (vendor, which shows a paid market exists but gives no figures).

**Disconfirming:** the category is already served by paid audit firms (S10). The "independent, cited" angle is not shown to be unmet. S11 gives no code-level evidence. No dedicated disconfirm search run. Non-vendor evidence: S11 only.

## Candidate 1: auditor evidence for agent activity

**Problem:** Leads cannot show what an agent did, read and who approved.

**Evidence:** S6: unnamed anecdotes of approved PRs nobody could explain; an incident with no decision log. Expectation only: S7 (vendor, "likely to ask"), S8 (hypothetical), S9 (Art. 12 applies to high-risk systems; coding agents not shown in scope).

**Disconfirming:** S7 contains no audit case; S8 names no audited company; S9 dates start 2027. A disconfirm search found no one abandoning logging, but did find unread secondhand claims that audit-heavy platforms get bypassed. Non-vendor evidence: S6, S8, S9, all weak.

## Candidate 5: pre-build evidence check

**Evidence:** S12: poor product-market fit cited in 43% of 385 analysed shutdowns. This is general, not specific to small teams or to any tool.

**Disconfirming:** no evidence found that teams want a tool for this. Search found opinion that AI validation tools may create false confidence; not read, unconfirmed. This candidate is also Aveto's own method, so judge it with care. Non-vendor evidence: S12.

## Could not find

- Anyone saying they cannot attribute agent spend by team or outcome: searched S4, S5, S6 and search results; found spend growth, not attribution gaps.
- A real auditor request about an AI agent: searched S6 to S8 and search results; only predictions.
- Dataset size and "review" definition for S1: the abstract page and PDF did not show them.
- Dedicated disconfirm searches for Candidates 2 and 4: not run. Candidate 4's second query found only vendor and blog pages.
- Competitor features and pricing for every candidate: not read; vendor pages were not fetched.
- Market size, willingness to pay, pricing: out of scope; no figure used.
- Whether Aveto's current users (individual engineers and small teams) face any of Candidates 1 to 4: no data on file.

## Source warnings

- No page tried to instruct the agent.
- thenewstack.io returned 403 and was not read.
- Uber and WSJ budget claims in S6 are quoted, origin not shown, and count for nothing.
- S3 (vendor) and S10 (vendor) are vendor-made. S7 is vendor-made and expectation only.
- Candidates 1 and 5 rest mostly on commentary, with limited primary evidence.

## Recommended next step

Evidence is thin across all five; nothing is ready. Candidate 3 has the strongest observed pain, and Candidate 2 the strongest independent data. Both could go to the Market Researcher only after more discovery: for 3, find practitioner posts or issue trackers showing managers cannot attribute spend, and what they use today; for 2, learn how "review" is defined in S1 and whether company repos behave like open source. Candidate 1 needs one real auditor request. Candidates 4 and 5 look weakest, with 5 also self-referential. This recommends; the human chooses.
