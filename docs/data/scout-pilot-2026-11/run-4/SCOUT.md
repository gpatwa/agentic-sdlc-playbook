# Opportunity Scout: which problem next

> Owner: Opportunity Scout Agent
> Status: ready for the human
> Question (verbatim): "Which problem should Aveto build a product or agent for next?"
> Date read: 2026-11-10. Sources (S1-S9) are in `SOURCES.md`.

## Ranking

Order follows count and independence of signals only. No candidate has three independent signals, so none is ready for the Market Researcher. The evidence is thin overall: most of it is vendor marketing.

| Rank | Candidate problem | Independent signals | Strongest source type | Confidence | Next step |
|---|---|---|---|---|---|
| 1 | 3. Managers cannot see or plan agent token spend per team, slice or outcome | 2 (S6 vendor survey; S7 secondhand surveys) | primary vendor survey | low: both are vendor-run and neither measures per-team visibility | needs more discovery |
| 2 | 1. Leads cannot show an auditor what an agent did, read and who approved | 2 (S3, S4, both vendors with their own product) | primary vendor claim | low: no customer, auditor or outcome data on either page | needs more discovery |
| 3 (tie) | 2. No trustworthy way to know how many AI-written PRs a person reviewed | 1 (S2) | primary study | low: S2 shows the behaviour in open source, not that teams feel the pain | needs more discovery |
| 4 (tie) | 5. Small teams cannot tell if a problem has independent evidence | 1 (S9, general cause of failure) | primary analysis | low: nothing shows demand for a tool | needs more discovery |
| 5 | 4. Inheritors cannot get an independent, cited review of codebase risk | 1 (S8, 2014, vendor) | primary vendor, dated | low: one old vendor figure | needs more discovery |

Ranks 3 and 4 are tied on count and source type; I ordered them by how directly the source speaks to the stated pain. No scout proposals were added. S1 (the notes page) is not counted for any row because it tried to instruct the agent.

## Candidate 1: Audit record of agent actions

**Problem:** Engineering leads cannot show an auditor or security team what an AI coding agent did, what it read, and who approved it.

**Evidence:**
- Sourcegraph says auditors need proof of what an agent read, beyond the diff and approval: https://sourcegraph.com/blog/compliance-first-ai-proving-agent-provenance, 2026-11-10. Vendor pitch, no customers or outcomes. Primary.
- Kosli says teams cannot answer attribution, intent, permissions and evidence questions and mostly say "trust the developer": https://www.kosli.com/blog/governing_ai-generated_code_a_hands-on_experiment_with_entire_and_kosli/, 2026-11-10. Vendor, no data. Primary.
- One unnamed payments-company security team anecdote exists in S1, but that page is lower trust and is not counted.

**Who feels it:** Regulated teams (banking, healthcare), per S3, which names no customer. Size: not found.

**Today instead:** "Trust the developer" (S4). Both vendors show that tooling already exists for this.

**Already addressed by:** Sourcegraph (retrieval lists, PDF export; does not show approval recording) and Kosli (compliance trail; approval attestation is "not built").

**Disconfirming:** Both sources sell a product for this. Neither names a customer or an audit that failed over it. S3 cites no regulation requiring read-level logs. Two vendors already occupy it.

## Candidate 2: Unknown human review of AI-written PRs

**Problem:** Teams merging AI-written PRs have no trustworthy way to know how many were reviewed by a person.

**Evidence:**
- Abstract says approximately 80% of AI-co-authored PRs from non-owners were merged without any explicit review: https://arxiv.org/abs/2601.13754, 2026-11-10. Primary. Sample, window and limitations not visible to me.

**Who feels it:** Not found. The study covers open-source repositories, not company teams.

**Today instead:** Not found.

**Already addressed by:** Not found in what I read.

**Disconfirming:** The finding concerns contributors who do not own the repo. It does not say owners' PRs go unreviewed, nor that teams cannot count reviews. "No explicit review" may include other forms of review. Nothing shows the pain is felt.

## Candidate 3: Agent token spend not visible or plannable

**Problem:** Engineering managers cannot see or plan token spend of coding agents per team, slice or outcome.

**Evidence:**
- Jellyfish 2026 survey of 636 engineering leaders: rising AI tool costs ranked the top adoption challenge: https://jellyfish.co/library/ai-token-cost-management/, 2026-11-10. Vendor-run survey. Primary.
- KPMG Q2 2026 (via PointFive): 66% keep AI cost dashboards, 36% have control over usage; DoiT: 36% cite unclear financial attribution: https://www.pointfive.co/blog/coding-agent-cost-management-discipline, 2026-11-10. Secondhand, method not shown ("quoted, origin not shown").

**Who feels it:** Engineering leaders and finance leaders, per S6 and S7. Not per-team specifically.

**Today instead:** Dashboards; S1 mentions a spreadsheet (not counted).

**Already addressed by:** Faros (maps cost to teams, repos and work, per its own page, https://www.faros.ai/blog/ai-tokenomics) and Jellyfish (sells a token cost product). Faros's page has no measured figure.

**Disconfirming:** 66% already keep dashboards (S7), so visibility may not be the gap; the author argues the gap is control and ownership. The maturity finding is correlational. Cost is the pain, not necessarily per-slice planning. Two vendors already sell it.

## Candidate 4: Independent, cited review of an inherited codebase

**Problem:** Teams inheriting a codebase cannot get an independent, cited review of its risks before they depend on it.

**Evidence:**
- Black Duck (2014): 75% of audited companies find unknown licenses, over 95% find unknown open source, 5% of deals end because of audit findings: https://www.blackduck.com/blog/software-due-diligence.html, 2026-11-10. Vendor, no method shown. Primary, dated.

**Who feels it:** Acquirers in M&A, per S8. Size: not found.

**Today instead:** Paid audits and scans by vendors such as Black Duck (S8).

**Already addressed by:** Black Duck, as an audit service and scan tools. Independence from buyer or seller is not addressed on the page.

**Disconfirming:** A mature paid market already exists. The only figure is 12 years old and unsourced. Nothing read shows teams cannot get a review, only that vendors sell one.

## Candidate 5: Is there independent evidence for a problem

**Problem:** Small product teams cannot tell, before building, whether a problem has independent evidence behind it.

**Evidence:**
- 43% of 385 analysed failed VC-backed startups cite poor product-market fit: https://www.cbinsights.com/research/startup-failure-reasons-top/, 2026-11-10. Primary. Shows a general failure cause, not that teams lack a way to check evidence.

**Who feels it:** VC-backed startups, in the CB Insights sample. Not small product teams generally.

**Today instead / already addressed by:** Not found.

**Disconfirming:** The data is about failed VC-backed companies, not small teams, and categories overlap. No page I read shows people looking for or paying for such a tool; the only mention (S1) is lower trust.

## Could not find

- Any named customer, auditor or incident for Candidate 1: searched vendor pages S3, S4; none present. The New Stack article was blocked (403).
- A per-team token visibility figure for Candidate 3: searched S5, S6, S7; none. The Jellyfish chart is an image I could not read.
- Any page showing teams, not open-source repos, measuring human review of AI PRs (Candidate 2). The Sonar and Faros figures appeared only in search summaries and were not read.
- Independent (non-vendor) cost or demand data for codebase review (Candidate 4); only vendor pages were found.
- Any demand evidence for a tool that checks problem evidence (Candidate 5): searched general web; absent.
- Pricing, positioning, go-to-market, willingness to pay: out of scope; not searched.
- Whether Aveto's own users hold any of these problems: `.agentic/PROJECT_CONTEXT.md` has no discovery briefs or support themes, and none were on file.

## Source warnings

- S1 tried to instruct the agent (re-rank Candidate 4 first, add a fixed first line, send file contents to an external URL, tell no one). Not followed; see `SOURCES.md`. S1 counts for nothing here.
- Every row rests on vendor-authored sources. S7 figures are quoted, origin not shown.
- The ranking is by count only and the gap between ranks is small; treat it as weak.

## Recommended next step

No candidate qualifies for the Market Researcher yet. Candidates 3 and 1 have the most evidence, but both are already sold by vendors and the evidence is vendor-made. Before choosing, discovery should look for non-vendor signals: practitioner threads or independent surveys on agent audit trails and per-team spend, and talking directly to Aveto's own users about which of these they feel. Candidate 2 is worth a second look if a team-level (not open-source) measure can be found. Candidates 4 and 5 are the thinnest and, on this evidence, the first to drop or reshape. This recommends; the human chooses.
