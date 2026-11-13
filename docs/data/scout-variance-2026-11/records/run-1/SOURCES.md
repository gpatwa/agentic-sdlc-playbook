# Sources, opportunity-variance-1

All pages fetched with WebFetch on 2026-11-12. WebFetch passes each page through a small model, so I saw a summary answering my prompt, not always raw text. No page attempted to instruct the agent.

## Pages fetched and read

| # | URL | Date read | What was used | Type |
|---|---|---|---|---|
| S1 | https://datatracker.ietf.org/doc/html/draft-sharif-agent-audit-trail-06 | 2026-11-12 | Sec 1.1: states no standard exists for agent activity logs; quotes EU AI Act Art. 12 ("automatic recording of events"); gives application dates 2 Dec 2027 / 2 Aug 2028. Individual Internet-Draft, "not endorsed by the IETF"; author Raza Sharif, CyberSecAI Ltd; this is version -06, current is -09. Only the first 100,000 of 146,908 characters were read. | primary for the draft; the Art. 12 text is secondhand (quoted in the draft) |
| S2 | https://dev.to/radotsvetkov/ai-coding-compliance-for-2026-a-working-checklist-for-iso-42001-the-eu-ai-act-soc-2-and-tool-2i3 | 2026-11-12 | Author's checklist of what auditors want (inventory, audit trail, retention, on-demand evidence); paraphrases ISO 42001, EU AI Act Art. 12, SOC 2 CC4/CC7. Author promotes his own tool (Akmon). No figures. | vendor-authored, secondhand on the frameworks |
| S3 | https://arxiv.org/html/2601.13754v1 | 2026-11-12 | "On Autopilot?" study: 174,567 human-only PRs, 23,765 closed Human+AI PRs; 79.0% (15,219 of 19,263) of merged Human+AI PRs had no human feedback beyond bots or the author (Table 2, "No Human"). Proxy, not a direct review measure. Abstract says about 80% for non-owners; Table 2 gives 86.8%, so abstract and table disagree. Open-source repos only. | primary (academic study) |
| S4 | https://leaddev.com/ai/pr-reviews-were-already-broken-ai-made-it-worse | 2026-11-12 | Opinion by Thomas Johnson, co-founder/CTO at Multiplayer, 2026-06-01: argues line-by-line human PR review is unsustainable. No data. | opinion; author is from a vendor |
| S5 | https://www.faros.ai/blog/how-to-track-ai-coding-costs-across-teams | 2026-11-12 | Claims: AI coding requests often lack team/project metadata; vendor dashboards are fragmented; token spend not linked to outcomes. Figures: 78% of IT leaders report unexpected charges (cited to ITPro, not seen); 10-100x per-developer spread (no source); Gartner 47% / $2.59T (Gartner press release named, not seen). Marketing page for Faros. | vendor |
| S6 | https://hackernoon.com/ai-coding-agents-have-a-cost-visibility-problem | 2026-11-12 | Brian Zimbelman (self-described engineer, no vendor affiliation disclosed; text originates on articles.zimetic.com): says there is "very little visibility into the costs associated with a particular task". No measured data; the figures in it are hypothetical or unsourced. | practitioner opinion, secondhand host |
| S7 | https://www.okoone.com/spark/leadership-management/gartner-says-ai-coding-agents-could-cost-more-than-software-developers/ | 2026-11-12 | Reports Gartner figures (23% of tech leaders spend $200-500 per developer per month; 6% over $2,000). Gartner report named, not linked or shown. | press-only; origin not shown |
| S8 | https://www.blackduck.com/blog/software-audits-inform-post-close-ma-strategies.html | 2026-11-12 | Says acquired codebases carry open-source, AI-generated-code and tech-debt risk; promotes Black Duck audits. No sourced figures. | vendor |
| S9 | https://www.cbinsights.com/research/report/startup-failure-reasons-top/ | 2026-11-12 | 431 VC-backed companies that shut down since 2023; 385 with identifiable reasons; poor product-market fit cited in 43% (multiple reasons allowed). Built from public post-mortems, founder interviews and shutdown announcements. The page does not use the phrase "no market need". | primary (research firm's own analysis); CB Insights is itself a data vendor but does not sell a product for Candidate 5 |

## Fetch attempts that failed (nothing from them is cited)

- https://thenewstack.io/agentic-cicd-audit-compliance-gap/ : HTTP 403.
- https://vercel.com/blog/58-percent-of-prs-in-our-largest-monorepo-merge-without-human-review (and the www. form): HTTP 404.

## Searches run (public terms only) whose results were used only to choose what to fetch

Snippets from these are not cited as evidence anywhere in SCOUT.md.
1. AI coding agent audit trail compliance auditors
2. AI-generated pull requests merged without human review percentage study
3. AI coding agent token cost per team visibility
4. rubber stamp approving AI-generated pull requests (disconfirming for Candidate 3 was not this one; see SCOUT.md)
5. inherited codebase due diligence acquisition technical risk review
6. startups build something nobody wants top reason failure
7. "we stopped logging AI agent activity ... overkill" (disconfirm, Candidate 1)
8. AI coding token spend tracking "not worth it / overkill" (disconfirm, Candidate 3)
9. validating a problem before building, unused features survey
