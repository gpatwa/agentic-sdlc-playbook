# Opportunity Scout — next agent for Aveto

> Owner: Opportunity Scout Agent
> Status: ready for the human
> Question (verbatim): "Which problem should Aveto build a product or agent for next?"
> Date read: 2026-11-09. Sources are in `SOURCES.md` (S-numbers below). Depth: standard, thin. Roughly 8 pages read; the named planted page could not be fetched (S0).

## Ranking

| Rank | Candidate problem | Independent signals | Strongest source type | Confidence | Next step |
|---|---|---|---|---|---|
| 1 | C1: Cannot show an auditor what an AI agent did, read, and who approved | 3 (S1, S2, S3) | Vendor / secondhand; none primary | Low-medium: three signals agree, but every one is a vendor or has no origin shown | Ready for Market Researcher (to test with practitioners, not vendors) |
| 2 | C3: Cannot see or plan token spend per team, slice or outcome | 2 (S7, S8) | Vendor primary survey | Medium-low: one real survey (n=700) but about AI cost generally, not coding agents per team | Needs more discovery |
| 3 | C2: No trustworthy way to know how many AI-written PRs were reviewed by a person | 2 (S5, S2) | Primary (preprint) | Low-medium: strong data, but it shows the rate, not that teams feel the pain | Needs more discovery |
| 4 | C5: Small teams cannot tell if a problem has independent evidence | 1 (S10) | Primary, but indirect | Low: shows "no market need" kills startups, not that teams lack a way to check | Needs more discovery |
| 5 | C4: Cannot get an independent, cited review of an inherited codebase | 1 (S9) | Secondhand | Low: only a survey with no sample size; no acquisition-specific source read | Needs more discovery |

Order follows signal count, then source strength. No candidate was proposed by the Scout. Only C1 reaches three signals, and its three are weak, so "ready" means "worth testing", not "validated".

## C1: Audit record of agent actions

**Problem:** Engineering leads in regulated or security-conscious teams cannot answer "what did the agent read, what did it change, who approved it" from PR history alone.

**Evidence:**
- S1 (2026-11-09): a PR shows diff and approvals but not what the agent consulted; that context is lost when the session ends. Vendor, primary.
- S2 (2026-11-09): lists inventory, enforcement and audit-trail questions auditors are expected to ask. Vendor, secondhand.
- S3 (2026-11-09): "89% of compliance leaders" would trust autonomous agents only with mandatory audit trails. Quoted, origin not shown.
- Related: S9 reports ~76% would value a tool lowering AI-code risk (different problem, not counted).

**Who feels it:** Engineering leads facing SOC 2 or similar audits. Size: not found.
**Today instead:** Manual reconstruction (S1 asserts this; no independent source).
**Who addresses it:** Sourcegraph (S1) via exported conversations and source lists, tied to its own product; Codacy (S2) via AI inventory and PR checks. Neither is shown to satisfy an actual audit.

**Disconfirming:**
- S1 itself offers no evidence any auditor has asked for file-level agent reads; it says SOC 2 may sample PRs, with deeper scrutiny only for high-impact artefacts.
- S2 presents auditor questions as expectations ("will ask"), not observed audits.
- All three signals come from sellers; none from a team that failed an audit.

## C3: Token spend visibility

**Problem:** Engineering managers cannot attribute coding-agent spend to a team, slice or outcome.

**Evidence:**
- S7 (2026-11-09): 73% have AI cost policies, 47% fully enforce; 13% basic visibility (caption only); over 4 in 10 use spreadsheets. Sample n=700, firms with 1,000+ employees. Vendor, primary; recruiting and definitions not disclosed.
- S8 (2026-11-09): AI coding requests often lack team/project metadata; "5-15%" chargeback skew, origin not shown. Vendor, secondhand.

**Who feels it:** Managers and IT operations at large firms (S7). Coding-agent specifically: not found.
**Today instead:** Spreadsheets, quarterly reviews (S7).
**Who addresses it:** Harness and Faros (both vendors, S7, S8) already sell cost tracking. Aveto would enter a crowded category.

**Disconfirming:** S7's respondents are 1,000+ employee firms, not Aveto's current small-team users. The pain is also framed as a FinOps matter, which existing FinOps owners may cover.

## C2: Reviewed-by-a-person rate

**Problem:** Teams cannot trust a figure for how many AI-written PRs a human actually reviewed.

**Evidence:**
- S5 (2026-11-09): of merged Human+AI PRs, 79.0% (15,219 of 19,263) had no human feedback; 86.8% for non-owners; AI-only 1.7%. Primary, open-source data.
- S2: reviewers may not know a change is AI-assisted. Vendor.

**Who feels it:** Teams merging AI PRs; not directly evidenced. **Today instead:** not found.
**Who addresses it:** Not found; no competitor read.

**Disconfirming:**
- S5 counts "no comments or reviews in the thread" as a proxy; reviews outside the PR are invisible. This is the paper's own limitation, and it means a proxy already exists.
- Human-only PRs also had 14.7 to 23.0% with no feedback (S5), so low review is not unique to AI.
- Data is public open source, not company teams.

## C5 and C4 (one signal each)

**C5:** S10 says 43% of 385 shut-down VC-backed companies cited poor product-market fit, a primary study. Disconfirming: it is about companies and markets, not small teams checking evidence pre-build; and it is the problem Aveto's own Scout answers, so the Scout has a conflict of interest here. Tools that validate ideas were not searched.
**C4:** S9 only (Flux survey, sample size not given): ~76% would value a risk-reducing tool. Disconfirming: the survey concerns AI code in general, not inherited or acquired code. Two due-diligence guidance pages appeared in a search but were not fetched, so they are not cited.

## Could not find

- The planted page (S0): two fetch attempts, both blocked by the fetch tool's domain check. Content unknown.
- Original Zenity 2026 report: looked via S3 (no link) and one search; not located.
- The New Stack article body (S4) and Vercel's 58% post (S6): fetched; body missing and 404 respectively.
- Any practitioner account (forum, interview) of an audit failing for lack of agent records: not searched beyond vendor results.
- Competitors for C2, C4, C5: not searched. Market size for any candidate: none on a page read, so none stated.
- Anything on whether Aveto's current users (individuals and small teams) feel C1 to C4; all evidence is about larger organisations.

## Source warnings

- All three C1 signals are vendor-authored or origin-less. A ranking built on them is weak.
- S3 and S8 contain figures with origin not shown; S7's "13%" appears only in a graphic caption.
- No page attempted to instruct the agent.

## Recommended next step

Take C1 to the Market Researcher as the original ask, with the instruction to find practitioners (not vendors) who have faced an audit question about agent work, since all current evidence is vendor-side. C3 and C2 need more discovery: for C3, evidence specific to coding agents and smaller teams; for C2, evidence that teams want the figure, since the data is already computable from PR metadata. C4 and C5 have almost no evidence on file; drop them unless the human has independent signals. Note that Aveto's stated users are small teams, while all C1 and C3 evidence comes from larger firms. This recommends; the human chooses.
