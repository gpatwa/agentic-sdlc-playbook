# Discovery interview guide

> Written 2026-11-12 by the support session (roadmap Theme 5). For the owner's conversations with people who run coding agents on
> a team. Two aims: **(1)** non-vendor evidence on the Opportunity Scout's top three candidates (run 4,
> `docs/data/scout-pilot-2026-11/run-4/SCOUT.md`), and **(2)** whether this person's team could be the P5 baseline pilot or a design
> partner. 30 minutes. The owner edits this freely.

## Rules for the conversation

- **Ask about what happened, not what they would do.** "Last time X happened, what did you do?" beats "Would you use a tool that…?"
  Opinions about the future are not evidence.
- **Do not pitch Aveto until the last five minutes.** Once they know what we sell, answers drift toward being polite.
- **Count what they already spend** (time, money, tools, workarounds). A problem nobody spends anything on is not urgent.
- **Write down their words**, not our summary. Note where they hesitated or changed the subject.
- **Consent and privacy:** ask before taking notes or recording; notes in the repo carry no names, employers or anything that
  identifies them (use "Interview 3, team of 8, fintech"). Nothing they say is quoted publicly without their written yes.

## Opening (3 minutes)

1. What does your team build, and how many people write code?
2. Which coding agents does the team use today, and for what kind of work?
3. Roughly what share of merged changes last month started with an agent?

## Candidate A · Spend per team (Scout rank 1) (6 minutes)

4. Who sees what the team spends on agents (tokens, seats, plans)? How often do they look?
5. Tell me about the last time someone asked "what did that cost?" What happened next?
6. Has a run or a person ever hit a usage limit at a bad moment? What did you do?
7. If spend went up 30% next month, how would you find out, and how long would that take?

**Signal it is real:** they name a person who chases this, a spreadsheet or script they built, or a limit that stopped work.

## Candidate B · Audit record of agent actions (Scout rank 2) (6 minutes)

8. Has anyone (security, an auditor, a customer, a manager) asked what an agent did or who approved a change? Walk me through it.
9. What could you show them? Where did it come from?
10. Who on the team is allowed to approve an agent's change, and is that written down anywhere?
11. Has an agent ever done something nobody approved? How was it found?

**Signal it is real:** a real request they could not answer well, a compliance deadline, or a review rule they had to invent.

## Candidate C · Reviewing AI-written pull requests (Scout rank 3, tie) (6 minutes)

12. How are agent-written pull requests reviewed today, compared with a person's?
13. Last week, roughly how many agent pull requests did one reviewer look at? Did any get merged with a light look?
14. Has a problem reached production from an agent change? How was it caught, and what changed afterwards?

**Signal it is real:** review is described as the bottleneck, or as skipped, with an example.

## Pilot fit (5 minutes)

15. Is there a repo with at least three months of history from **before** the team used agents, with merged pull requests and CI?
16. Do the people writing code use Claude Code today? On which plan?
17. Who would have to agree to a two-week trial on one repo?
18. What would make you stop a trial early?

## Close (4 minutes; Aveto may be mentioned now)

19. Of the three areas we covered, which costs your team the most today? (Let them rank; do not suggest one.)
20. Is there someone else I should talk to who feels this more than you do?
21. May I send you a one-page description of a small pilot? (Use `PILOT_ONE_PAGER.md`.)

## After the call (10 minutes, same day)

Record in `docs/discovery/notes/<yyyy-mm-dd>-interview-<n>.md` (no names):

| Field | Entry |
|---|---|
| Team | size, domain, agents used |
| Candidate A / B / C | **past event** described (yes or no), their words, what they spend on it today |
| Their own ranking (Q19) | |
| Pilot fit | pre-agent history (yes/no), Claude Code (yes/no), who decides |
| Referrals | count only |
| Surprises | anything outside the three candidates |

**When to stop and decide:** after five interviews, count, per candidate, how many people described a **past event** and something
they already spend on it. A candidate with three or more of five goes to the Market Researcher as evidence the Scout lacked. Fewer
than two of five on every candidate is also a result: record it, and do not build for any of them.
