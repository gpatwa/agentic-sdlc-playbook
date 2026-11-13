# Opportunity Scout: next problem for Aveto

> Owner: Opportunity Scout Agent
> Status: ready for the human (partial: search budget used, gaps listed below)
> Question (verbatim): "Which problem should Aveto build a product or agent for next?"
> Date read: 2026-11-12. Sources S1-S9 are in `SOURCES.md`.

## Ranking

Order follows evidence only. Three candidates tie on count (2 signals each); within the tie I ordered by whether a primary, non-vendor source exists. No candidate has three independent signals, so none can be "ready for the Market Researcher". No scout proposals added.

| Rank | Candidate problem | Independent signals (origin) | Strongest source type | Confidence | Next step |
|---|---|---|---|---|---|
| 1 | 2. No trustworthy way to know how many AI-written PRs a person reviewed | 2: (a) academic study S3; (b) opinion from a vendor-employed author S4 | primary (S3) | Low-medium: one real dataset, but open-source only and a proxy measure | needs more discovery |
| 2 | 1. Cannot show auditor what an AI agent did, read, and who approved | 2: (a) IETF individual draft S1 (CyberSecAI); (b) vendor-authored checklist S2 (Akmon) | secondhand (Art. 12 quoted inside S1) | Low: both sources are product-adjacent; no regulator text read directly | needs more discovery |
| 3 | 3. Cannot see or plan agent token spend per team, slice or outcome | 2: (a) Faros marketing S5; (b) practitioner opinion S6 with no data. Gartner via S7 counts 0 (report not shown) | secondhand | Low: one vendor, one opinion, no measured data | needs more discovery |
| 4 | 5. Small teams cannot tell, before building, if a problem has independent evidence | 1: CB Insights S9 (shows products without fit fail; does not show teams cannot tell) | primary | Low: evidence is about the outcome, not the stated pain | needs more discovery |
| 5 | 4. Inheritors cannot get an independent, cited risk review | 1: Black Duck S8 (vendor) | vendor | Low: one vendor page, no figures | needs more discovery |

## Candidate 2: Human review of AI-written PRs cannot be counted

**Problem:** Teams merging AI-authored PRs cannot say how many a person actually reviewed.

**Evidence:**
- S3 (arxiv.org/html/2601.13754v1, 2026-11-12): 79.0% of merged Human+AI PRs (15,219 of 19,263) had no human feedback beyond bots or the author. Primary. Caveats are stated by the paper: this is a proxy, open-source repos only, bot detection is imperfect.
- S4 (leaddev.com, 2026-11-12): argues line-by-line review is becoming unsustainable. Opinion, no data; author is a vendor co-founder.

**Who feels it:** maintainers and teams merging agent PRs; no count of teams found.
**Today:** not found beyond S4's advice to reserve human review for intent and architecture.
**Who addresses it:** not researched (could not fetch Vercel's page, 404).
**Non-vendor evidence:** S3 is non-vendor.
**Disconfirming:** S3 itself weakens the premise: "no comments" is not "not reviewed", and the paper's abstract (about 80%) and Table 2 (86.8% for non-owners) disagree. The pain as stated (inside a company's private repos) is not shown by an open-source sample. No disconfirming search was run for this candidate.

## Candidate 1: Audit evidence for AI coding agents

**Problem:** An engineering lead cannot show an auditor what an agent did, read, and who approved.

**Evidence:**
- S1 (datatracker.ietf.org draft-sharif-agent-audit-trail-06, 2026-11-12): says no standard exists for agent logs; quotes EU AI Act Art. 12. Draft has no standing; the same page gives application dates of 2 Dec 2027 / 2 Aug 2028. Primary for the draft, secondhand for the Act.
- S2 (dev.to, 2026-11-12): lists audit-trail, retention and on-demand evidence as what frameworks ask for; author sells a tool; paraphrase, not standard text.

**Who feels it:** teams under SOC 2 / ISO 42001 / EU AI Act high-risk scope; no size found.
**Today:** not found.
**Who addresses it:** not researched beyond S2's author.
**Non-vendor evidence:** none found that I read directly (looked: S1, S2; The New Stack page returned 403). Art. 12 applies to high-risk AI systems, and a coding agent is not shown to be one.
**Disconfirming:** search "we stopped logging AI agent activity ... overkill" found no one dropping logging, but its results were drafts and vendor blogs and were not fetched, so this is unconfirmed. S1's dates put the EU obligation 2027-28, and Art. 12 scope for coding tools is not shown.

## Candidate 3: Token spend visibility

**Problem:** Engineering managers cannot see or plan agent spend by team, slice or outcome.

**Evidence:**
- S5 (faros.ai, 2026-11-12): attribution metadata often missing; vendor dashboards fragmented; spend not linked to outcomes. Vendor; its figures are unsourced or origin not seen.
- S6 (hackernoon, 2026-11-12): "very little visibility into the costs associated with a particular task." Opinion, no data.
- S7 (okoone, 2026-11-12): Gartner figures (23% spend $200-500 per developer per month; 6% over $2,000). Quoted, origin not shown; counts 0.

**Who feels it:** engineering managers and finance; no measured count found.
**Today:** vendor dashboards, per S5.
**Who addresses it:** Faros (S5), and others named only in unfetched snippets.
**Non-vendor evidence:** S6 is non-vendor opinion only; no independent survey read.
**Disconfirming:** search "not worth it / flat seat pricing enough" surfaced snippets suggesting small teams should buy seats and add tracking later; not fetched, so unconfirmed. S5 and S7 show vendors already ship per-team views, so the gap may be narrower than stated.

## Candidate 5: Evidence before building

**Evidence:** S9 (cbinsights.com, 2026-11-12): poor product-market fit cited in 43% of 385 analysed VC-backed shutdowns. This shows building without fit is costly; it does not show small teams cannot judge evidence, nor that they would pay for it.
**Non-vendor evidence:** S9.
**Disconfirming:** none searched. Note this candidate is the Scout's own function, so the human should weigh that.

## Candidate 4: Independent risk review of an inherited codebase

**Evidence:** S8 (blackduck.com, 2026-11-12): says acquired codebases carry open-source, AI-code and debt risk; vendor, no sourced figures.
**Non-vendor evidence:** none found; looked: S8 only.
**Disconfirming:** none searched. Established vendors already sell this service (S8).

## Could not find

- Any independent survey or study (not a vendor's) on how many teams are asked by auditors for AI-agent evidence (Candidate 1): searched audit-evidence terms; only vendor posts, drafts and one 403 page.
- Any dataset on AI PRs merged without review inside private or company repos (Candidate 2); Vercel's page returned 404.
- A source showing Gartner's token-cost figures (Candidate 3); the secondhand page does not link it.
- Buyer, pricing, or willingness-to-pay for any candidate. Those are outside the Scout's remit; the question turns on them, so stopping there.
- Disconfirming searches for Candidates 2, 4 and 5 were not run; no budget left for them.
- Candidate 4 and 5 competitor landscape: not researched.

## Source warnings

- S1 is an individual draft with no standing; S7 is press-only with origin not shown.
- S2, S5, S8 are vendor pages; S4's author works at a vendor.
- No page attempted to instruct the agent.

## Recommended next step

No candidate has enough independent evidence for the Market Researcher. The most useful discovery is: for Candidate 2, look for evidence from private or enterprise repos and for how "reviewed" is defined in practice; for Candidate 1, read the EU AI Act and SOC 2 texts directly and look for practitioner accounts of an audit that asked for agent evidence; for Candidate 3, find an independent survey on spend visibility. Candidates 4 and 5 need a first round of non-vendor sources. This recommends; the human chooses.
