# Opportunity Scout: which problem next for Aveto

> Owner: Opportunity Scout Agent
> Status: ready for the human
> Question (verbatim): "Which problem should Aveto build a product or agent for next?"
> Date read: 2026-11-12. Sources S1 to S12 are in `SOURCES.md`.

Source IDs (S#) point to `SOURCES.md`. Counting rule: one signal per origin; vendor assertions with no data count as signals but are marked "assertion"; figures with no visible origin count for nothing.

## Ranking

| Rank | Candidate problem | Independent signals (origin) | Strongest source type | Confidence | Next step |
|---|---|---|---|---|---|
| 1 | C1. Leads cannot show an auditor what an AI coding agent did, read, and who approved | 3, all assertion: Sourcegraph (S4), Codacy (S5), one essay author (S6). Regulator text S7 counted 0: applicability to coding agents not shown | vendor assertion | Low: no data, no named auditor or customer; non-vendor evidence only S6, thin | needs more discovery |
| 2 | C2. No trustworthy way to know how many AI-written PRs a person reviewed | 2: Gao et al. (S1); Sonar survey (S3, adjacent: self-reported checking before commit, not PRs) | primary (academic) | Medium: one measured, non-vendor study, but open-source data | needs more discovery (closest to ready) |
| 3 | C5. (scout view) Small teams cannot tell, before building, whether a problem has independent evidence | 2: CB Insights (S11); Wilbur Labs survey (S12). Both measure why startups fail, not whether teams can assess evidence | primary | Low-medium: good samples, indirect to the stated pain | needs more discovery |
| 4 | C3. Managers cannot see or plan agent token spend | 1: Jellyfish (S8, S9 are one origin) | vendor | Low: one vendor; non-vendor evidence: none found | needs more discovery |
| 5 | C4. Teams inheriting a codebase cannot get an independent cited risk review | 1: SolGuruz (S10) | vendor assertion | Low: no figures, no non-vendor source read | needs more discovery |

Tie-break between C2 and C5 (both 2): C2 has measured data on the stated pain; C5's is indirect. No candidate reaches "ready for Market Researcher". No scout proposals added: nothing found pointed to a sixth problem. Note: C5 describes what the Scout itself does, so Aveto has an interest in it; weigh the row accordingly.

## C1. Audit trail for AI coding agents

**Problem:** A lead is asked "what did the agent read, and who approved the merge?" and cannot answer from existing logs.
**Evidence:** S4 says orgs cannot prove what an agent read; evidence is unnamed conversations with banks and healthcare, no counts (vendor). S5 says auditors are "starting to ask", no auditor named (vendor). S6 says auditors who have started asking focus on who initiated the change and whether it can be reconstructed months later; scenario hypothetical (essay). S7 shows a logging duty for high-risk AI systems; the page does not say coding assistants are in scope.
**Who feels it:** regulated engineering teams, per S4/S5 only. Size: not found.
**Instead today:** not found on a page read.
**Addressed by:** Sourcegraph Deep Search / MCP server (S4); Codacy AI inventory and guardrails (S5). Both sell it.
**Disconfirming:** S6 itself says "Most auditors haven't caught up to this yet", so demand may be ahead of audit practice. S5 names no auditing body. S7 does not tie the regulation to coding agents. Disconfirm search ("git history already sufficient") found no authoritative page saying git history satisfies auditors, and none saying it does not; unresolved.

## C2. Unknown human-review rate on AI-written PRs

**Problem:** Teams merging agent PRs cannot tell how many got a real human review.
**Evidence:** S1: about 80% of AI-co-authored PRs from non-owner contributors merged without any explicit review (AIDev dataset, MSR short paper; abstract only). S3: only 48% of 1,100+ surveyed developers say they always check AI-assisted code before committing (vendor survey, no method shown; self-reported).
**Who feels it:** maintainers and teams merging agent PRs. Size: not found.
**Instead today:** required approvals; S2 states a Copilot PR needs another reviewer and the requester's approval does not count toward the total.
**Addressed by:** GitHub branch protection and Copilot rules (S2). They enforce a count; they do not show review quality.
**Disconfirming:** S2 shows the platform already prevents unreviewed merges where the rule is on, so the pain may be "is it configured and is review real", not "no way to know". S1 measures open-source contributors, and "no explicit review" is not "not reviewed". S3 is a vendor with a stake in code verification. No search found a team reporting this as an operational pain.

## C5. Cannot tell if a problem has independent evidence

**Evidence:** S11: 43% of 385 analysed failures cite poor product-market fit, but 70% cite running out of capital, which CB Insights calls usually the final cause, not the root. S12: 54% of 200 founders named understanding product-market fit as the key lesson (self-reported, +/-6.9 points).
**Who feels it:** founders of small tech companies. **Instead today:** founders' own validation; not found in detail.
**Addressed by:** not searched; see Could not find.
**Disconfirming:** both sources are about failure causes, not about teams lacking a way to assess evidence. S12 flags recall bias and attribution bias. S11 is a gated marketing report. Capital as the top cause (S11) shows the problem is not the single dominant one.

## C3. Agent token spend visibility

**Evidence:** S8: Jellyfish's 2026 survey of 636 engineering leaders ranks rising AI tool costs as the top adoption challenge. S9: cost per merged PR from $0.28 to $89.32 across 12,000 developers at 200 companies (method not shown on the page). One origin. The visibility claims in S8 have no source.
**Who feels it:** engineering leaders (S8, vendor survey). **Instead today:** not found. **Addressed by:** Jellyfish (S8, S9); other vendors appeared in search results, none read.
**Disconfirming:** the survey shows cost is a concern, not that per-team visibility is missing. S8 gives no figure on how many teams track spend. The "overhyped / not worth it" search returned only vendor pages and nothing sceptical.

## C4. Independent review of an inherited codebase

**Evidence:** S10 only: diligence on AI-built code should add comprehension and ownership checks; no statistics; the seller offers fractional-CTO services.
**Who feels it / instead today:** not found. **Addressed by:** S10's firm; other audit vendors seen in search results, not read.
**Disconfirming:** S10 calls gaps "negotiating points rather than automatic dealbreakers". The search for buyer regret found no study. A KPMG M&A report was unreadable (encrypted PDF), so its figures are unconfirmed and not used.

## Could not find

- Non-vendor evidence for C3 and C4: searched vendor-dominated results for both; no practitioner thread, independent survey or regulator text read. Stated: none found.
- Any page where an auditor, security team or customer is named as asking for C1 evidence: S4, S5, S6 read; none names one.
- Whether Art. 12 (S7) or any other regulation covers coding agents: S7 silent; application dates conflict in search results and were not verified.
- A source for how many teams already track token spend (C3), or how many buyers skip code diligence (C4).
- The full text, limitations and exact percentages of S1; only the abstract was read. A second agent-PR study seen in search results (arXiv 2509.14745) and its dataset overlap with S1 were not fetched, so it is not counted.
- Hacker News or issue-tracker threads on any candidate: the search returned none; community forums were not directly browsed.
- Competitors for C5: not searched.
- Pricing, positioning, willingness to pay, market size: out of scope and not found.

## Source warnings

- No page attempted to instruct the agent.
- The New Stack article (403) and KPMG PDF (unreadable) could not be read.
- S3, S8, S9, S11 are gated or vendor pages whose method is not fully shown. C1's three signals are all assertion from sellers or a thin essay.

## Recommended next step

No candidate is ready. C2 is closest: it has the only independent measured study, so the next discovery is to read the full paper S1 and check whether a second, independent dataset agrees, then look for teams who report the pain in their own words. C1 has the most mentions but they are all assertion; the discovery it needs is a named auditor, security reviewer or practitioner thread, plus a read of whether Art. 12 or SOC 2 practice reaches coding agents. C3, C4 and C5 need a non-vendor source before they merit more time; C4 and C3 look like the weakest on current evidence, and C5 has the Scout's own stake. This recommends only; the human chooses.
