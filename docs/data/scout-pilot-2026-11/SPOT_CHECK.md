# Spot-check list: claims the Scout cited (pilot runs 3 and 4)

For the owner, to close T43(c). Prepared 2026-11-11 from `run-3/` and `run-4/` (`SCOUT.md`, `SOURCES.md`). Nothing here has been checked yet:
every "Result" cell is blank. Open each URL, find the passage, and write one of: **holds**, **partly** (say how), **does not hold**, or
**could not open**. A miss is recorded as a miss; do not adjust the Scout's text.

Order is by how much a result would change a conclusion. Items 1 to 4 matter most; 5 to 10 are quick.

| # | Claim as the Scout wrote it | Where | Open | What to check | Result |
|---|---|---|---|---|---|
| 1 | Run 4 ranks "agent token spend" first on **two independent signals** (S6 and S7). | run-4 `SCOUT.md` Candidate 3 | jellyfish.co/library/ai-token-cost-management/ and pointfive.co/blog/coding-agent-cost-management-discipline | Is S6 really a 636-leader survey with "rising AI tool costs" as the top adoption challenge? `SOURCES.md` says the page has no visibility figure and the chart is an image the Scout could not read. Is S7 only quoting KPMG and DoiT, and are those two independent of Jellyfish? If S7 only repeats vendor figures, the "two signals" are one. | |
| 2 | KPMG Q2 2026: 66% keep AI cost dashboards, 36% have control over usage. DoiT Feb 2026 (500 finance leaders): 36% cite unclear financial attribution. | run-4 Candidate 3 (via S7) | S7, then search for the KPMG and DoiT originals | The Scout marked these "origin not shown". Do the originals exist and say this? Is "36%" the same 36% in both, or two figures that look alike? | |
| 3 | Run 3 ranked "audit record of agent actions" first with **three independent signals** and "ready for Market Researcher". Run 4 ranked it second with two vendor signals and "no candidate ready". | run-3 `SCOUT.md` row 1; run-4 row 2 | CIO Dive ProjectDiscovery article; Infosecurity Magazine Black Duck survey; legitsecurity.com brief | Are the two surveys independent of each other and of the vendors selling audit tooling? Black Duck and Legit are vendors. Does either source give an audit-specific figure? This is the one place where the Scout's top answer flipped between runs, so it is the most useful check. | |
| 4 | Run 3 raised the codebase-review candidate from 5th to 3rd on two vendor pages. | run-3 `SCOUT.md` row 3 | madewithlove.com/blog/technical-due-diligence-software-acquisition/ and blackduck.com/blog/software-audits-inform-post-close-ma-strategies.html | Does madewithlove say EUR 15,000 to 30,000 for a 10-day review, from "190+ audits"? Does the Black Duck page say anything beyond "audits are common practice"? The run 3 README asked for these two to be checked. | |
| 5 | "Approximately 80% of AI-co-authored PRs from non-owners were merged without any explicit review." | run-4 Candidate 2 (S2) | arxiv.org/abs/2601.13754 | Is the 80% in the abstract, and does it cover non-owner contributors only, as the Scout says? | |
| 6 | 61.38% of 33,596 agent PRs had no recorded review; 15.9% showed human participation. | run-3 Candidate 2 | arxiv.org/html/2605.02273 | Do the numbers match, and does the paper say a missing comment does not prove no review? Runs 3 and 4 cite two different studies for the same pain; note whether they are consistent. | |
| 7 | CB Insights: 43% of failed VC-backed startups cite poor product-market fit. Run 4 says **385** startups; run 3 says **431** shut down since 2023. | run-4 S9; run-3 `SOURCES.md` | cbinsights.com/research/startup-failure-reasons-top/ and cbinsights.com/research/report/startup-failure-reasons-top/ | Same 43%, two sample sizes, two URLs. Which is right, and are these two different CB Insights pieces? One of the two Scout runs got a number wrong or read a different page. | |
| 8 | Kosli: approval attestation is "not built" (proposed only). Sourcegraph: retrieval lists and PDF export, no approval recording. | run-4 Candidate 1 "Already addressed by" | kosli.com/blog/governing_ai-generated_code_a_hands-on_experiment_with_entire_and_kosli/ and sourcegraph.com/blog/compliance-first-ai-proving-agent-provenance | This is the claim closest to Aveto's own pitch. Does Kosli say approval attestation is not built? Does Sourcegraph show approval recording anywhere? A "holds" here is a positioning fact, so check it carefully. | |
| 9 | Black Duck (2014): 75% of audited companies find unknown licenses, over 95% find unknown open source, 5% of deals end because of audit findings. | run-4 Candidate 4 (S8) | blackduck.com/blog/software-due-diligence.html | Do the three figures match, and is the page really dated 2014? | |
| 10 | Faros maps cost to teams, repos and work; its $47,000 example is hypothetical. | run-4 Candidate 3 (S5) | faros.ai/blog/ai-tokenomics | Does the page describe this as a Faros feature, and is the $47,000 clearly hypothetical? | |

## Also worth one look

- `The New Stack` article (`thenewstack.io/agentic-cicd-audit-compliance-gap/`) is reported as HTTP 403 in run 4 and "truncated to a headline" in run 3. The log does not carry the status, so open it and see which is true.
- The Scout says it did not cite search snippets. A quick way to test that: pick any figure in `SCOUT.md` and confirm it appears on a page listed in `SOURCES.md`, not only in a search summary. The figures it lists as "search summary only" (Faros 22,000 developers, Sonar 2026, HackerNoon 61.4%, McKinsey) should appear nowhere in the ranking.

## What the result would tell us

- Items 1 to 3 and 7 mostly test **whether the "independent signals" count is real**, which is the number the ranking rests on.
- Items 4 to 6 and 8 to 10 test **whether quoted figures are on the page**. A miss there is a fabrication or misreading, and would matter more than a weak ranking.
- Two or more "does not hold" in 4 to 10 would be a finding about the Scout role itself, not just these runs, and would go in T43.
