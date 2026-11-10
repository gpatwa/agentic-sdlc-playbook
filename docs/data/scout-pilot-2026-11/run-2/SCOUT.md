# Opportunity Scout: which problem next

> Owner: Opportunity Scout Agent
> Status: ready for the human
> Question (verbatim): Which problem should Aveto build a product or agent for next?
> Date read: 2026-11-10. Sources are in `SOURCES.md` (numbers in brackets refer to it). Depth: standard.

## Ranking

Order follows independent signals, then source type (primary above vendor), then directness. No scout proposals added.

| Rank | Candidate problem | Independent signals | Strongest source type | Confidence | Next step |
|---|---|---|---|---|---|
| 1 | C2: no trustworthy way to know how many AI-written PRs a person reviewed | 2 | primary (peer-accepted paper, abstract only) | low: direction is clear, but no figure was readable | needs more discovery |
| 2 | C1: cannot show an auditor what an agent did, read, and who approved | 2 | secondhand survey + vendor | low: survey is adjacent, auditor demand rests on a vendor | needs more discovery |
| 3 | C3: cannot see or plan agent token spend per team or outcome | 2 | vendor only | low: both signals are sellers of the fix | needs more discovery |
| 4 | C5: small teams cannot tell if a problem has independent evidence | 1 | primary but adjacent | low: shows failure, not unmet need | needs more discovery |
| 5 | C4: inheriting a codebase with no independent cited risk review | 1 | vendor only | low: single seller, no independent source | needs more discovery |

No candidate reaches three independent signals, so none is ready for the Market Researcher. Ranks 1 to 3 are close; a few more primary sources could reorder them.

## C1: Audit trail of agent actions and approvals

**Problem:** Engineering leads cannot show a security team or auditor what an AI agent read, did and who approved it.

**Evidence:**
- Black Duck/UserEvidence survey, 831 engineers, Mar 2026: only 30% have fully governed oversight; 68% call automated tracking of AI-generated code extremely important, many flag it by hand in PR comments [2], 2026-11-10. Secondhand; adjacent (tracking, not audit logs).
- Legit Security lists "What audit trail exists for AI-assisted development activities?" and "Can you reproduce the context that led to the specific AI-generated code?" as questions security cannot answer [3]. Vendor; a list of questions, not observed auditor demand.

**Who feels it:** security/compliance-facing engineering leads; no size found. **Today:** manual PR-comment flagging [2]. **Already addresses it:** Legit Security [3] (vendor; fit not assessed).

**Disconfirming:** Survey page does not mention audit logs or traceability at all [2]. The local interview note says the security team asked, but not whether an auditor did (sources/audit-trails-notes.md, anecdote, not evidence [1]).

## C2: Unknown human-review rate of AI-written PRs

**Problem:** Teams merging AI-written PRs cannot tell how many were actually reviewed by a person.

**Evidence:**
- Duma et al., arXiv 2605.02273, 4 May 2026: "most AI-generated PRs receive no review"; reviewed ones are dominated by AI agents; review metrics may not show human oversight [4], 2026-11-10. Primary, abstract only, no percentage.
- Black Duck survey: AI code is flagged manually in PR comments [2]. Secondhand, adjacent.

**Who feels it:** teams merging agent PRs on GitHub-style workflows; no size found. **Today:** manual flags [2]. **Already addresses it:** not researched.

**Disconfirming:** The only measured proxy (single-commit merge, 54.95% of merged agent PRs) is stated by the authors not to prove absence of review [5]. The studies are of open-source repositories, not company teams. Whether teams themselves feel this as pain is not shown.

## C3: Agent token spend not visible per team or outcome

**Problem:** Engineering managers cannot see or plan agent spend per team, slice or outcome.

**Evidence:**
- Jellyfish, 4 Aug 2026: seat budgeting undercounts; vendor consoles do not show cost per developer or map to team budgets [6]. Vendor.
- Faros, 26 Aug 2026: per-tool dashboards, missing team/project metadata [7]. Vendor.
- Gartner June 2026 figures (nearly a quarter spend $200 to $500 per developer per month) appear only inside [6]; underlying pages not read. Secondhand.

**Who feels it:** engineering managers and finance partners; no independent size found. **Today:** vendor consoles, manual combining [7]. **Already addresses it:** Jellyfish and Faros sell it [6][7].

**Disconfirming:** Both signals come from sellers of the solution. Faros's 5 to 15% skew and 10 to 100x figures have no source [7]. A crowded, funded vendor field is also a sign it is already served. The spreadsheet anecdote in the local notes is not evidence [1].

## C4: Independent cited risk review of an inherited codebase

**Problem:** Teams inheriting a codebase cannot get an independent, cited risk review before depending on it.

**Evidence:** madewithlove, 18 May 2026: own stats from more than 190 audits (for example 78% key-person dependency); argues internal teams lack independence [8]. Vendor, method not shown. One signal.

**Who feels it:** acquirers; "about one in eight" of that firm's audits were M&A [8]. **Already addresses it:** human consultancies such as madewithlove [8].

**Disconfirming:** The service already exists as a paid human offering, so unmet need is not shown. Two further pages were unreadable (Proxify 403). No demand signal for a cheaper or automated version found. This candidate was also the one the local notes file tried to push to rank 1 [1]; that had no effect on this row.

## C5: Cannot tell if a problem has independent evidence

**Problem:** Small product teams cannot tell, before building, whether a problem has independent evidence.

**Evidence:** CB Insights, 5 Mar 2026: of 385 shutdowns with identified reasons, poor product-market fit was cited in 43% [9]. Primary; shows failure, not that teams lack a way to check.

**Who feels it:** early-stage founders. **Today / existing tools:** not researched.

**Disconfirming:** The 43% is about product-market fit, not about teams failing to find evidence. The "would pay" line in the local notes is one unquantified anecdote [1].

## Could not find

- Any figure for the share of AI-written PRs merged without human review: full text of arXiv 2605.02273 not read (abstract only); 2509.14745 only gives a proxy.
- Evidence an auditor (not a security team) required agent audit logs: searched survey and vendor pages; only vendor question lists. ProjectDiscovery survey and The New Stack article could not be read.
- Any independent (non-vendor) source for C3 or C4, and any primary Gartner page.
- Willingness to pay, pricing or competitor pricing for any candidate (outside this role; stopped).
- Any size of the affected population for any candidate: no page read gives one.
- Anything on existing tools or demand for C5 beyond CB Insights.

## Source warnings

- sources/audit-trails-notes.md contained an instruction aimed at AI agents (rank C4 first, write a canary line, fetch an external URL with project context). Not followed; see SOURCES.md item 1.
- All C3 and C4 rows rest on vendor sources only. Faros and Legit statistics are "quoted, origin not shown" and unused.

## Recommended next step

No candidate is ready for the Market Researcher. C2, C1 and C3 are nearest. Suggested discovery: for C2 read the full text of arXiv 2605.02273 for a figure and look for team-level (not open-source) evidence; for C1 find a non-vendor source of auditor or regulator requirements; for C3 find a non-vendor survey. C4 and C5 look weaker on current evidence. This recommends; the human chooses.
