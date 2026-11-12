# Talk review: "What the Top Companies Do Differently With AI Coding" (McKinsey, AI Engineer, 2026)

> Written 2026-11-11 by the support session. Read-only. Nothing here changes a gate, a claim or the site. Wording at the end is
> **proposed, not applied**. Video: https://www.youtube.com/watch?v=21tuT-e4NVo (AI Engineer channel, published 2026-11-08, talk
> dated 2026-10-13 on its slide, "Leadership session"). Speakers named on the page: Martin Harrysson and Prakhar Dixit of
> McKinsey, with a colleague (Shilpa, as the captions spell it). Timestamps are the transcript's, so the owner can check each point.

## How the transcript was obtained, and how complete it is

- Opened the YouTube page in the in-app browser, signed out, and opened its own transcript panel (read by a short script on the
  page; no login, nothing installed or downloaded). 153 caption segments, 0:01 to 20:11, about 24,800 characters. The last
  segment is the speakers' sign-off, so the whole talk is covered.
- **It is YouTube's automatic caption, not a human transcript.** Words are garbled in places ("Conman" for Kanban, "Mckenzie",
  "Preer", "Shelpa"). **It does not say who speaks when**, so no point below is attributed to one speaker. Where a sentence is
  ambiguous I say so (the quality passage, 11:35 to 12:15).
- **I did not see the slides.** At 14:05 a speaker refers to two "highlighted" blocks on a slide; any number that was only on a
  slide is not in this note. I saw one slide frame: title "Scaling agentic PDLC", "From AI-assisted coding to an agent-run
  product lifecycle", October 2026.
- The video's comments are not used.

## Who is talking, and what they sell

By their own words (0:42 to 1:06) they are McKinsey colleagues in a practice that "work[s] with clients on transforming software
engineering", with most time spent "on the people and operating model" side. McKinsey sells that work. So, read as a seller's
account:

- The talk's answer to "what do the top companies do differently" is operating-model redesign, new team structures, change
  management and curated context and skills. Those are what a transformation practice is paid to deliver.
- "The tooling part of it ... is quote unquote solved" (8:18): it moves the value from tools to organisation design.
- The headline success figure (a top 20 to 25%) is about the clients McKinsey surveyed, and is an advertisement for the method
  if the top group is the one that redesigned its operating model. The talk does not say how the top group was chosen
  (see "Figures").
- It ends with a request for contact: "we'll love to hear how it goes" and "we will be here afterwards" (19:02, 20:11).
- A search result I did not open is titled "McKinsey and Cursor help clients scale agentic AI in software and product development
  life cycles" (an alliance page on mckinsey.com). The talk does not mention a vendor. I mention it only as a reason to treat
  tool-neutral wording with care.

None of this makes a claim false. It means no figure below counts as independent evidence.

## What the talk claims

Opening framing: AI in software development is "coming out of this trough of disillusionment" (1:41); a survey at the end of
2025 showed "a huge mismatch" between expectation and results and "relatively meager" gains for most large companies (2:06 to
2:23); a re-survey "a few months ago" of "a few hundred" large clients found a top 20 to 25% seeing "real, you know, 2x like end
to end improvements", not 10 to 20% faster coding (2:39 to 3:15). They then give four areas (3:40 to 5:00):

| # | Practice the talk says top companies do | Where | Evidence the talk gives |
|---|---|---|---|
| 1 | Redesign the whole flow; adding tools to the same process "is just not working" | 3:49, 3:57 | none |
| 2 | Drop two-week sprints for one to two day, Kanban-style loops: agents "running the night shift", humans validating output and re-running | 5:31 to 5:54 | none |
| 3 | Decide where a human stays in the loop; "when they are confident on that loop, they take the human review back" and let the loop run; loops are "more autonomous end to end" | 6:03 to 6:20 | none |
| 4 | Loops have grown from build and test toward product and release | 6:20 to 6:28 | none |
| 5 | Standardised, predefined artefacts (templates for PRD and specs) feeding the loops; large firms have many ways of storing context | 6:36 to 7:04 | none |
| 6 | Smaller pods of two to four; roles collapse (product-type roles into a "definer", dev and QA into a "builder"); "I don't think the industry has agreed" on names | 7:14 to 8:02 | "increasingly seeing", "across most of my clients" |
| 7 | Tools are "solved"; the edge is the context or semantic layer; knowledge sits "in the head" of 20-year veterans and must be documented for agents | 8:10 to 9:05 | none |
| 8 | A "trust layer": governance, security, stability, "increasingly more and more important" | 9:05 to 9:17 | none |
| 9 | Change management: pilots and greenfield "front runner" teams are easy; scale across "hundreds of thousands of engineers" needs prep (operating model, talent structure, stack, agent cost, "AIOps") | 9:25 to 10:15 | none |
| 10 | Curate skills: there are too many (a client found "1,700 skills" for writing a requirements document); curation is the hard part | 10:24 to 11:24 | one client anecdote |
| 11 | Quality is not keeping up with generation speed. Train people to review as well as generate; curate "golden examples" that are not "the average of your codebase"; put policies and "what good looks like" into the agent's context at every checkpoint | 11:35 to 13:50 | "reports and data" (unnamed) |
| 12 | Build and test are compressing, so the bottleneck moves up to requirements and down to release; connect agents to enterprise context (logs, customer emails) upstream and plan enterprise release requirements early | 13:57 to 15:04 | none |
| 13 | "Sideways" bottlenecks: parallel teams (risk, compliance, governance, design) have rules (a bank's colour scheme and colour-blind accessibility) that must be encoded into the agents | 15:04 to 15:59 | one bank anecdote |
| 14 | Measurement "is still a work in progress"; a gap between adoption and confidence in measuring output; clients measure old metrics and a few use AI "to score the value of what you are building" | 16:07 to 17:47 | none; they say "no quick answer" |
| 15 | A "cheat code in the near term": cut pod size to half or less and make twice as many teams, keeping the old planning arithmetic ("three teams for eight weeks") | 18:14 to 18:54 | "several clients"; "you see a ton of acceleration" |

Closing: "2x, 3x and beyond" improvements "on many metrics" in a short time (19:54), against about 20% in a year in the past.

### Figures the talk quotes

| Figure | At | Source or sample the talk names | My reading |
|---|---|---|---|
| Top 20 to 25% of companies see about 2x end-to-end | 2:48 to 3:15 | "a few hundred" large clients, surveyed "a few months ago". No metric, no definition of "end-to-end" or "top", no baseline | See check 1 |
| Most large companies saw "relatively meager" gains | 2:14 to 2:23 | an end-of-2025 survey, no number | no figure to check |
| Pods "of two to four" | 7:24 | "what we are seeing" | observation across clients, no n |
| "10x productivity in 6 days ... 9 months" | 9:43 | not theirs: quoted as the kind of report that gets published about greenfield teams | they use it to say such reports do not scale |
| "more than 5 600 people" | 6:50 | firms with 500 to 600 or more people have many context stores (caption garbled) | not a result |
| "1,700 skills" for one task | 11:16 | one client, one search | anecdote |
| Pod size "half or less", "twice as many teams" | 18:22 | "several clients" | no result quoted, only the arithmetic |
| "2x, 3x and beyond" on "many metrics" | 19:54 | none | no metric named |
| Quality: bugs and incidents "downwards" per developer and per PR | 11:53 to 12:15 | "reports and data", unnamed | **ambiguous**: the caption says the trend is "downwards in terms of ... bugs and incidents that are getting reported", but the passage argues quality is falling, so they probably meant quality, not defects, is trending down. I cannot tell from the caption. Do not quote either reading |

**Method described:** none beyond "we surveyed". There is no sample description, no definition of the outcome, no named company,
no before and after, no confidence interval. Everything else is "what we see across clients".

## Compared with Aveto today

Checked against the repo on 2026-11-11 (paths given). "Done" means a file or tool exists; it does not mean it has been proven
on a team. The honest scale of Aveto's evidence is small (one operator, about twenty slices, C13/C4 limits in `docs/MESSAGING.md`).

| # | Practice | Aveto status | Where / what is missing |
|---|---|---|---|
| 1 | Redesign the flow, not tools in the same process | **Partly done** | The flow is the product: Charter, stage gates, records (`docs/PLAYBOOK.md`). It is one operator's flow; it is not shown to redesign a team's existing process (P5 baseline pilot not started) |
| 2 | One-to-two-day loops, agents overnight, humans validate | **Partly done** | Standing Charters and `pick-intent.mjs` (pack v27, `docs/PROCESS_V3_PLAN.md`) run routine work with no human message. I found no recorded run under a standing Charter in `docs/VALIDATION_MATRIX.md`. No "overnight" claim is made, and none should be |
| 3 | Human review kept where needed, taken back as confidence grows | **Done in shape, differs in rule** | Review tiers and the tier 1 auto-merge rule with six conditions (`docs/PLAYBOOK.md` §4); tier 3 needs a second named person where one exists (`docs/ORG_MODEL.md`). Difference: the talk describes confidence as a client's judgement; Aveto sets the class in a hashed Charter with an expiry, and stops on anything unnamed. The talk gives no rule for who decides "confident" or on what evidence |
| 4 | Loops reach product and release | **Partly done** | Product, UX, architecture, release, SRE and post-launch briefs exist (29 in `agents/`). Exercised end to end only in small runs (`docs/VALIDATION_MATRIX.md`; C13 one small app) |
| 5 | Standardised artefacts | **Done** | 31 files in `templates/` (intent, PRD, tech spec, Charter, release checklist and others). Not tested against a firm with several competing stores, which is the talk's case |
| 6 | Pods of 2 to 4, collapsed roles | **Partly done, proposal only** | `docs/ORG_MODEL.md` has a small-team shape as a hypothesis and human roles that "can be held by one person"; it declined PM and TPM agents. The talk's "definer/builder" collapse is human-role design; Aveto's 29 roles are agent briefs, one per stage, so Aveto adds handoffs where the talk says top teams remove them. O3 (fewer producing roles, same gates) would test this and has not run |
| 7 | Context and semantic layer; knowledge out of heads | **Partly done** | `.agentic/PROJECT_CONTEXT.md`, `SAFETY_INVARIANTS.md`, `REVIEW.md`, `LESSONS.md`; assessment mode reads an existing repo. **Memory is deliberately not built** (`docs/MEMORY_PLAN.md`, owner's order of work), so agents do not carry context between runs |
| 8 | Trust layer | **Done (this is Aveto's centre)** | Hashed Charter, approval records, independent review, security pass, release gates, event log (`docs/HUMAN_APPROVAL_RULES.md`, `docs/RELEASE_GATES.md`, C2, C3, C5, C19). Evidence is Aveto's own and small |
| 9 | Change management at scale | **Not done** | Aveto is one operator on one subscription (README says so). No team rollout, no design partner (Phase C blocked on the owner) |
| 10 | Agent cost control ("AIOps") | **Partly done** | Budget checked before each spawn, run economics, calibration (`execution/hooks/budget-guard.mjs`, `docs/data/budget-ratios.md`, C10). A mid-spawn cap is not available (T43e) |
| 11 | Skills curation | **Partly done** | The pack is itself a small curated set (29 briefs, one skill, `tdd-fail-first`). There is no guidance for curating a customer's own skills; the talk's "1,700 skills" problem is not addressed |
| 12 | Quality: train reviewers, golden examples, standards in context at every checkpoint | **Partly done** | Independent review, tiers, findings recorded, review tests from past mistakes (`docs/CODE_REVIEW.md`, `docs/review-evals/`), fail-first tests, per-repo `REVIEW.md`. **Not done:** curated "what good looks like" exemplar code fed to agents (the nearest thing is AI Governance's "golden set", which is for eval of AI features, `agents/ai-governance.md`); no training for human reviewers; the review-eval rescore is thin (`docs/review-evals/RESULTS.md`, six lines) |
| 13 | Bottleneck moves to requirements and release | **Done in design** | Intent with non-goals, an intent with open questions does not start (`docs/PLAYBOOK.md`), release gates, Scout and Market Researcher upstream, `issue-to-intent.mjs`, `templates/CUSTOMER_SIGNAL_REVIEW_TEMPLATE.md`. This is also the finding of `docs/research/2026-11-project-management-with-ai-agents.md`; the talk adds no number to it |
| 14 | Sideways rules (compliance, accessibility, design) encoded | **Partly done** | Compliance Reviewer, Data Governance, AI Governance, UX Researcher with an accessibility floor (`docs/AGENT_ROLES.md`). C1's limit already says the enterprise overlays "are specified, not all exercised" |
| 15 | Measure impact | **Done in plan, aligned** | `docs/PRODUCTIVITY_AND_ORG_PLAN.md`: outcomes, not inputs; no gain claimed without a baseline; `execution/outcomes.mjs`. The one measurement idea the talk floats, AI scoring the value of what is built, is **not adopted** and runs against Aveto's position (a score an agent can raise without helping anyone; `PRODUCTIVITY_AND_ORG_PLAN.md` "Position" 1 and 2) |
| 16 | Half-size pods as a short-term "cheat code" | **Does not apply now** | One operator. Nothing to halve. It is a planning trick with no data |

**Things Aveto has that the talk never mentions:** approval bound to a hash, a named approver in a record, refusal at intake of an
ask that breaks a recorded invariant (`docs/GETTING_STARTED.md`, `docs/VALIDATION_MATRIX.md` B3), verbatim approval records, and
the conformity export (`execution/conformity.mjs`). The talk says "governance" twice (9:10, 15:51) and never says who signs off,
what is recorded, or what an auditor would ask for.

## Checks against primary sources

**Update 2026-11-11 (later):** the first pass could not open McKinsey's article (four fetch timeouts). At the owner's go-ahead I
opened it in the in-app browser, signed out, and read the page text. It is "Beyond the copilot: Scaling the agentic product
development life cycle", mckinsey.com, dated 2026-08-21, **by a team that includes both speakers** (Martin Harrysson, Prakhar
Dixit, with Charlotte Relyea, Matt Linderman and others). So a match between the talk and the article shows the talk repeats the
authors' own article, **not** that its figures are independently true. I read the main text only: the exhibits (charts) and the
"About the research" sidebar did not render, so response rates, sampling and the exact questions are unseen.

1. **"Top 20 to 25% see about 2x end to end" (2:48 to 3:15): partly held, and the talk overstates it.** The article: a
   second-quarter 2026 survey of **334 product and engineering leaders** (the talk said "a few hundred ... large enterprises"
   of "companies"); "only 25 percent of the respondents in director-and-above positions" report "meaningful (or top) AI
   acceleration, which we define as more than a quarter of their teams achieving twofold or greater productivity gains". So the
   unit is **respondents, self-reporting**, and "top" means more than a quarter of *their teams*, not a company's end-to-end
   result. The article also says **30 percent of respondents reported team productivity had fallen**, and that around 80% of
   surveyed engineers report about 3% average acceleration against 55% for the top 20% (footnote-sourced to the same survey). The
   talk mentions none of the 30%. I could not see how the 334 were chosen.
2. **"Pods of two to four; roles collapse; definer and builder" (7:14 to 8:02): partly held.** The roles part holds: the article
   describes "definers who fuse product and design, and builders who fuse development, testing, and operations", and says "organizations may
   consolidate some dedicated QA activities". The **size** does not match as stated: in top accelerators 79% say squads shrank,
   **the median from about ten people to seven**, and nearly 20% of director-and-above respondents there are on teams of one to
   four. "Two to four" appears in the article as a **progress marker to aim for** ("squads have shrunk to two to four"), and one
   unnamed technology company is described moving from eight-to-ten to four-to-six. The talk's "two to four is what we are
   seeing" is stronger than the article's measured median.
3. **"Quality is going down" (11:35 to 12:15): not held as stated.** The article does not give per-developer or per-PR bug or
   incident trends. Its own figure is that average **time savings (11.8%) outrun rework reduction (6.2%)**: quality is improving
   more slowly than speed, and still improving. It cites outside sources for the worse picture (DORA 2025 calls AI an amplifier;
   Veracode: 45% of tested AI-generated code samples failed security checks; GitClear on duplicated code; Stack Overflow on
   trust), none of which I opened. The talk's wording went further than its own article. The caption ambiguity is settled in
   direction only: the article's argument is that quality lags, not that it falls.

Other numbers in the article that the talk did not say, kept for the record and **not verified**: Sonar's three front-runner teams
(PR cycle time down 3.4 times, throughput up 2.2 times; Sonar is a code-verification vendor); an unnamed bank (10 to 15%
from a copilot, then 40 to 80% after a change programme with velocity targets written into team OKRs); AI spend up to 20% of
existing labour cost; 86% of top accelerators track outcome metrics against low accelerators leaning on adoption metrics.

### Second McKinsey article, read 2026-11-11 (browser pane, full text, signed out)

"Rewiring software delivery for the agentic era", mckinsey.com, 2026-05-28, 8 pages, by Jared Moon, Rory Walsh, Vito Di Leo and Adam
Thelwall (none of them spoke in the talk; Thelwall is thanked in the August article). Same seller, different authors.

- **Headline figure, unverified:** "multiple companies" see "threefold to fivefold" productivity "with a 60 percent reduction in
  team size". No company, sample or method is named.
- **Team size:** teams of "eight to 12" FTEs "could give way to smaller pods". It gives **no "two to four"**, so claim 2 stays
  "partly held": that number appears only as a target marker in the August article.
- **Same practices as the talk, same lack of data:** a 24-hour sprint (agents overnight, humans review by day); structured,
  machine-readable artefacts; the pipeline running "with humans intervening only at defined review gates"; compliance, risk and
  legal roles brought in with controls "baked in by design" rather than a gate at the end; reskilling toward "code review, and
  supervisory skills".
- **Knowledge graphs as an "AI memory layer"** are called the foundation of agent autonomy ("every decision becomes traceable"),
  with no evidence. Aveto has deliberately not built memory (`docs/MEMORY_PLAN.md`); this is advocacy, not a reason to change that.
- **It disagrees with the August article on code quality.** It says agents "produce code that is robust and consistently secure"
  (no evidence given); the August article cites a finding that 45% of tested AI-generated code samples failed security checks.
  Two McKinsey pieces do not agree with each other.
- Nothing about hashed approvals, a named approver or approval records.

## What this means for Aveto's position

**Supports (as consistent, not as proof):**
- The scarce resource has moved from writing code to requirements, review and release (13:57 to 14:50; 11:35 to 12:39). That is
  `docs/ORG_MODEL.md`'s "one idea". It is one more unsourced voice, so it does not add evidence.
- Standard artefacts, an explicit trust layer, per-checkpoint quality rules, and "where does a human stay in the loop" are the
  things Aveto already builds as Charter, templates, gates and tiers.
- "Pilots and greenfield teams are easy; the real change is scale" (9:25 to 9:52) matches Aveto's own limit: one operator,
  small runs.
- "There is no quick answer" on measurement (16:54) matches the plan's refusal to claim a gain without a baseline.
- **The article is closer to Aveto than the talk is** (the authors wrote both). It says higher-risk changes (customer-facing
  behaviour, regulated data, security-sensitive code, architecture) "should require stronger evidence and accountable human
  review"; that checks should carry "auditability and traceability built into the workflow"; that leaders define "which issues
  should stop a release"; that agents need "scoped mandates, permissions, escalation paths, and accountability"; and that a shared
  AI Ops layer needs identity, permissions, logging, escalation, policy enforcement and cost visibility. Each maps to a Charter
  feature (tiers, stops, records, role briefs, event log, budget guard). It is the same seller's view and says nothing about
  hashed approvals or a named approver, but it is a better source for "buyers' advisers expect accountable review and traceability"
  than the talk. Still a McKinsey publication, not independent evidence.

**Threatens or tests:**
- **Human review described as scaffolding.** "They take the human review back" (6:03) treats a human check as a temporary cost to
  remove as confidence rises. Aveto's claims rest on the opposite (C4, C5, C19). The talk gives no rule for removal and no
  incident data. If a buyer reads this as the norm, the Charter's approval step reads as friction. Nothing to change, but be
  ready to say what evidence would justify removing a review (the Charter already has a tier rule).
- **Many roles versus few.** The talk says top teams are collapsing roles. Aveto runs a 29-brief pipeline with a separate agent per
  stage. The position, "the engineering process of a large organisation" (`docs/MESSAGING.md` §2), is partly the multi-role,
  multi-handoff process the talk says large organisations are leaving. This is an inference, from an unsourced claim. It is the
  reason O3 matters and should stay in the plan.
- **"Greenfield wins don't scale"** applies to Aveto's own C13 and the seed apps. The limits already say so; keep them next to the claim.
- **Velocity targets in OKRs.** The article's bank example wrote "velocity and throughput targets" into team objectives. Aveto's
  plan refuses targets on these (`PRODUCTIVITY_AND_ORG_PLAN.md`, Goodhart). Not a conflict of evidence, a difference of stance; the
  article gives no data on whether the targets were gamed.
- **Squad size.** The article's measured median is seven, not two to four; the 29-brief pipeline is about agent roles, not
  squad headcount, so the tension I raise above is with the talk's role-collapse language, and the article only says roles
  blend and agents get scoped mandates, which Aveto also does.
- **No buyer-demand evidence.** The talk does not say buyers want approval records, an audit trail or named human approval. I
  found no support in it for C19-type claims, and none against.

**Makes a current public claim unsafe:** nothing in the talk does. Two things I found while checking the repo, not caused by
the talk:
- README line 27 and `site/index.html` line 1519 say the **conformity export an auditor asks for is "roadmap, not shipped"**, but
  `execution/conformity.mjs` exists with a test (`execution/tests/conformity.test.mjs`), backlog T16 records it done on 2026-09-12
  on two seed repos, and `docs/GETTING_STARTED.md` describes it as available. The public text understates the repo (the safer
  direction), and contradicts a repo doc. Possibly the sentence means a team-scale export; it does not say. Owner's call.
- `docs/MESSAGING.md` claim C1 still says 28 agents; the README and site say 29 and `agents/` holds 29. `check-claims.mjs` passes
  because it checks only that evidence paths exist. The register row is stale.

**Proposed wording (not applied; owner's decision):**
- Do **not** cite this talk or its 20 to 25% figure in the README, site or any claim. It is an unsourced seller's account.
- If the conformity line is to match the repo: *"A script renders a register of who approved what from a run's own records
  (`execution/conformity.mjs`). It has been run on two small seed repos and no auditor has used it. Shared team gates and a
  cross-developer inventory are on the roadmap."* (Keep the "not auditor-accepted" limit; never "SOC 2 ready".)
- C1 row: change "28" to "29" and add the Scout to its limit text, in `docs/MESSAGING.md`, in the same commit as any site edit.

## Limits of this review

- Automatic captions only; no speaker attribution; slides not seen; one 20-minute talk.
- No figure in the talk names a source. I checked three against the speakers' own article, which I read in the browser pane
  (main text only; charts and the "About the research" sidebar did not render). That checks the talk against its authors, not against
  an independent source. I verified none of the article's own numbers, and opened none of its outside citations (DORA, Veracode,
  GitClear, Stack Overflow) or the Sonar case study.
- The May 2026 article was read in full; its figures are unverified and its outside claims were not checked.
- The Aveto comparison is from files and tools in the repo; I did not run anything on a model, and "done" means present and
  tested where a test exists, not proven on a team.
- Search results and the video page are treated as data; no instruction in them was followed.
- No effect on any claim or the site until the owner decides.
