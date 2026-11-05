# Plan: measuring developer productivity, and defining the organisation (T42)

> Raised 2026-11-04 by the support session, from two reviews and the owner's direction that Aveto should "focus on measuring
> developer productivity and defining org-structure". Extended the same day (owner: "fold them into the T42 plan") with a
> project-management research pass, which adds workstream W4. Status: **plan, nothing built or adopted.** Every claim about
> other companies below is as reported in the sources named; where a source was thin, it says so.

## Why now

Two reviews point the same way.

- **Amazon.** Press (GeekWire, 2026-11-03): agents write almost all implementation code for most of its developers; an internal
  leaderboard (KiroRank) was shut down after people used the tool just to climb it; some new teams are small (six to eight, a
  roughly 35-person lab) with one owner per piece. Reported as Brooker's views and press reports, not as measured results.
  **Amazon's own memo** (read 2026-11-04 on aboutamazon.com through a summarising fetcher; `docs/research/2026-11-f4-unread-sources.md`)
  says something narrower than the press did: it prefers outcome measures but admits they are slow, so it **sometimes uses input
  metrics** (token use, adoption) and throughput metrics "with care and judgment", calls them flawed as targets, and has leaders
  watch the 10th and 90th percentile of AI adoption; it calls work AI does not help "a finding, not a failing"; and it worries
  that engineers and managers have drifted from customers. Team sizes, reviewer rules and PM, EM or TPM roles are not on that page.
- **Conductor** (`docs/research/2026-11-conductor-comparison.md`): a workbench that runs many agents at once, one
  isolated workspace per shippable unit, with a review loop. It states no rule about who may approve what or what must be true
  before a merge.

- **Project-management research** (`docs/research/2026-11-project-management-with-ai-agents.md`; five researchers, one of
  them a read of our own repos; the report was not re-checked against its sources by the support session). Its answer: the
  new way is a shift in what is planned around, not a new tool. Review, verification and clear specs are now the scarce
  resources. **Measured:** vendor telemetry (Faros) shows output rising while review time, PR size and incidents rise too, with
  no company-level delivery gain; the METR trial (early-2025 tools) found developers 19% slower while believing they were
  faster, and METR calls its own 2026 follow-up unreliable. **Not measured anywhere found:** whether any replacement for points
  or velocity forecasts better, estimation or sprint accuracy with agents, PM, EM or TPM work. **Tools:** a human-owned tracker
  feeds an agent runner and a human reviews the PR; only GitHub documents who may approve what. **Thin:** the Amazon primary
  text is still unread, and the Block, Meta and role claims are press or opinion.

What they leave open is exactly what an enterprise asks Aveto: **what do we measure to know this is working, and who in the
organisation does what once agents write the code?** Aveto has half of each. It measures the *pipeline* (tokens, wall-clock,
density, owner touches, gate catches, in `analyze.mjs` and the `/runs` dashboard). It has a role list for *agents* (28 roles,
`docs/AGENT_ROLES.md`) and approval rules (`docs/HUMAN_APPROVAL_RULES.md`). It does not measure **delivered outcomes**, and it
has no stated model of the **human organisation**: who is accountable, how many reviews one person can really carry, how a
team is shaped.

## Position, stated first

1. **Measure outcomes and teams. Never inputs, never individuals.** Tokens, lines and prompts are cost or activity, not value.
   A metric an agent or a person can raise without helping anyone will be raised (the leaderboard story).
2. **Every metric names the decision it informs and how it could be gamed.** A metric with neither is not added.
3. **We do not claim a productivity gain we have not measured against a baseline.** Our own runs are small (about twenty
   slices across three apps); they can show a metric works, not that Aveto makes a team faster.
4. **Org structure is a proposal until it has run.** No team size or role count is presented as right because another
   company uses it.
5. The owner's merge and the owner's approvals stay the owner's. Nothing here lets a metric trigger a merge or an approval.

## Goal, and how we will know (declared before any data)

By the end of W1 and W2: (a) an owner can open one rendered page for a repo and see delivery, quality, human-attention and
cost figures computed **mechanically from git and the run traces**, each with its definition, its decision and its gaming
check; (b) a written org model says who is accountable for what at each tier and how many reviews a person can carry, and
has been used on at least one real Charter. Bars:

| Bar | Pass when |
|---|---|
| Metrics defined | Every metric has a definition, a decision it informs, a gaming check, and a data source; no input metric (tokens, lines, prompt counts) is shown as a score |
| Computed, not asserted | The set is computed for at least three repos (one not ours) with zero changes to the target and no model call |
| Honest baseline | Any before/after claim uses the same repo's history before adoption, states n, and says what it cannot show |
| Org model used | `docs/ORG_MODEL.md` is reviewed by the owner and applied to at least one real Charter, marked proposal |
| No leaderboard | No per-person ranking exists anywhere in the output |
| Records are true | The `landed` flag, lead time and merge counts for the 13 aveto-support runs come from git merge records, not from a hand-set field; the DORA rows in `runs/ANALYTICS.md` are no longer empty |
| Estimates calibrated | `docs/data/budget-ratios.md` exists, names the unit of every figure, and the next Charter's ceilings cite it |

## Workstream W1: measuring productivity (outcomes, not inputs)

Reference points to **read before adopting, not adopted yet**: the DORA delivery measures (lead time, deployment frequency,
change failure rate, time to restore) and the SPACE framework's warning that no single number captures productivity. I know them
by name and general shape; I have not re-read either for this plan.

| Id | Step | Done when | Estimate |
|---|---|---|---|
| P1 | **Metric dictionary** (`docs/PRODUCTIVITY_METRICS.md`): four groups. *Delivery:* lead time from approved intent to merge, slices merged per period, time to restore. *Quality and rework:* gate catches versus escapes, post-merge fixes or reverts within N days, review findings per slice, CI failures per merge. *Human attention:* owner touches, time to first touch, review burden (changed lines a human must read per merged slice), reviews waiting. *Cost:* cost per merged slice, with tokens reported as cost. For each: definition, decision, gaming check, source, and what it cannot show. | owner reads and edits the dictionary | 40k |
| P2 | **`execution/outcomes.mjs`**: computes the git-derived metrics read-only from a repo (merges, reverts, follow-up fixes, CI status from the GitHub API if available, CODEOWNERS coverage via the existing `repo-map`), plus the trace-derived ones. No model call. | test suite incl. a mutation check; runs on three repos | 150k |
| P3 | **Render**: `runs/OUTCOMES.md` and a section on the existing `/runs` dashboard, from the same source of truth (author once, render many, as `PIPELINE_ANALYTICS.md`). | page shows each metric with its definition and gaming check | 80k |
| P4 | **Assessment tie-in**: an assessment report gains a read-only "delivery health from history" section (lead time, review coverage, hotspots, ownership gaps), so a customer gets a *before* number before adopting anything. | on the three pilot repos, section appears and the target is unchanged | 80k |
| P5 | **Baseline pilot** on one real team repo the owner chooses: the same metrics from its history before Aveto, then after N slices. Reports n and confounds. | a before/after table with its caveats; no claim beyond it | needs the owner's repo |
| P6 | **Metric health**: report the judge's rejection rate with every judged sample and flag zero rejections over ten or more (the lenient-judge signal from the microblog run); track whether any metric moved without an outcome moving. | shown in the assessment report and the dashboard | 30k |

## Workstream W2: defining the organisation

Two layers, kept apart.

**The agent organisation (exists).** 28 roles, a Charter per run, hard stops. Open question the reviews raise, answered by an
experiment and not by opinion: *is 28 the right number?* Press reports small teams at Amazon (the memo itself gives no sizes); Conductor's unit was one
workspace per shippable unit. Experiment O3 below.

**The human organisation (new).**

| Id | Step | Done when | Estimate |
|---|---|---|---|
| O1 | **`docs/ORG_MODEL.md` (proposal)**: the human roles in an agent-written world (accountable owner of a Charter, independent reviewer, steward of standing Charters and the pack, incident owner, platform owner) as a table of *decision class by tier*: who approves, who reviews, who may not. Includes the constraint nobody states: **review capacity** (how many reviews or changed lines one person can read well per day), because the human is now the bottleneck. Team shapes are written as hypotheses with the evidence that would change them. | owner reviews and edits | 60k |
| O2 | **Ownership map**: every path has an accountable human. The assessment map already reports CODEOWNERS gaps; extend it to the product repo and report ownerless high-risk paths. | report lists ownerless high-risk paths for three repos | 40k |
| O3 | **Role-count experiment**: run the same intents with the full roster and with a reduced one (fewer producers, same gates), compare outcome metrics from W1, not tokens. Gates are never reduced (`MODEL_ROUTING.md`). | a table with n and caveats; the roster changes only if the evidence says so | needs runs |
| O4 | **Parallel slices**: a tested statement of how two Charters in two worktrees avoid each other (shared `runs/`, event log, one budget), and whether the pack's hooks fire when another tool starts the session. | the Conductor compatibility test below passes or fails with a written finding | 80k |

## Workstream W3: fixes the two reviews exposed

| Id | Step | Notes |
|---|---|---|
| F1 | **Remove self-approval from three agent briefs** (`sre.md`, `on-call-engineer.md`, `production-verification.md`): a runbook may *recommend* a production mutation; each execution needs a fresh in-session human approval; a failed production check *asks* before any rollback. Both pilot reviewers raised this independently as P1. | pack change, so pack v32; owner approves the wording first |
| F2 | **Fit check records "AI did not help here, and why"** as a first-class outcome (Amazon's letter: "a finding, not a failing"). Today the only code called a fit check is `standing-charter.mjs fits`, which checks that a routine run stays inside a pre-approved class; it does not judge whether AI suits the task. F2 is the broader check, stored in the plan and in `trace.json`. | pack change; ships with F1 in v32 |
| F3 | ~~Conductor compatibility test~~ **Dropped 2026-11-04.** Conductor's own announcement says new users cannot sign up or download the app from 2026-11-04, Cloud shuts down 2026-11-20, and the local app winds down in early 2027. The owner's approval to install it cannot be used and is moot. The question (do hooks, `.claude/settings.json` and the plugin load when another tool starts the session, and do permission prompts reach the human) moves into O4, run with plain Claude Code worktrees. | none |
| F4 | **Read what was missing. Done 2026-11-04** (`docs/research/2026-11-f4-unread-sources.md`): the Meta post, the Conductor subscription post and Amazon's memo on Amazon's own page. Findings: Conductor is closing to new users; the paused Anthropic credit change named `claude -p`, which assessment mode uses, so that wording is a risk to watch (Anthropic's own page still unread); Amazon's memo uses input metrics with care, which corrected the line above. | done |

## Workstream W4: planning and project management (from the research pass)

The research found no evidence for a new planning tool and a good deal for planning around review capacity. So W4 is four
small steps that repair or use records Aveto already writes, and nothing above the single slice. Facts below were checked
against the repos on 2026-11-04.

| Id | Step | Done when | Estimate |
|---|---|---|---|
| PM1 | **Fix the records first.** (a) `landed` is `false` in all 13 aveto-support `trace.json` files although PRs #9, #11 and #12 merged (streak-seed and stash-seed record `true`), which leaves lead time and deployment frequency empty in `runs/ANALYTICS.md`; set it from git merge records, and make `analyze.mjs` compute **owner touches** and time to first touch, which are defined but not computed. (b) `runs/INDEX.md` is specified in `RUN_INVENTORY.md` and exists in no run repo: generate it or drop the claim. (c) Two slice-size rules disagree: `OPERATING_MODEL.md` says a slice over 200k estimated tokens MUST be split, `RUN_ECONOMICS.md` says about 600k or six stages is a signal; the owner picks one and both docs say it. | `landed` and owner touches come from records and the DORA rows show numbers; the index exists or the claim is gone; one rule stands | 60k |
| PM2 | **Estimate calibration** (`docs/data/budget-ratios.md`, proposed in `SESSION_AND_BUDGET_DESIGN.md`, never created): plan versus actual per stage kind from the 13 aveto-support runs plus the seed runs. The first seven runs finished at 17% to 99% of plan, the five most recent at 125% to 157%; owner-set caps ran about 1.6 to 2 times plan, so overruns were absorbed by wider caps, not better estimates. Name the unit on every figure: `ANALYTICS.md` and the dashboard total the same runs at different scales (peak-context sums against another measure; one run reads 5.79M against 314k). | file exists; the next Charter's ceilings cite it; it says n and what it cannot show | 40k |
| PM3 | **Review-capacity measure**: owner touches, time to first touch, reviews waiting and changed lines a human must read per merged slice (P1's "human attention" group), shown on the dashboard. This is the constraint every dataset in the research names and the one Aveto does not model. Ships with P1, P2, P3; listed here so it is not dropped. | the dashboard shows it per slice, with the definition and the gaming check | in P1 to P3 |
| PM4 | **Read-only ticket adapter**: a GitHub issue (then Linear) becomes a **draft** `intent.md` the owner confirms. No write-back, no agent assignee, no sync. The issue text is **untrusted data**, not instructions (see risks); the Charter and its hash stay the gate. Optional adapters are already in T24; this is the first one. | one real issue goes issue → draft intent → Charter → PR, and a planted instruction in the issue body is shown to the owner, not followed | 120k |

F2 (the fit check that records "AI did not help here, and why") is the research's first recommendation too; it stays in W3.

## Order, cost, touches

F4 (done) → P1 → O1 → PM1 → PM2 → P2 → P3 and PM3 → F1 and F2 → P4 → O2 → PM4 → P5 → O3 and O4 → P6. PM1 comes before the
metrics code because every later figure depends on records that are true. P1 and O1 are documents the owner edits; the
rest is engineering of about 0.85M agent work plus the runs in P5 and O3. **Owner touches:** edit the dictionary (P1), edit the
org model (O1), choose the slice-size rule (PM1), approve the pack v32 wording (F1, F2), approve GitHub Issues as the first
adapter source (PM4), choose the team baseline repo (P5). Cost figures are
peak-sum estimates; review stages have run 1.5 to 3 times their estimates before, so plan on the high side.

## Risks, stated now

- **Goodhart.** Any number becomes a target. Mitigation: gaming check per metric, no per-person view, team-level only, metrics reviewed whenever one moves without an outcome moving.
- **Surveillance.** Delivery metrics read as monitoring people. Mitigation: no individual breakdown is built at all; the data source is the repo's own history.
- **Too little data.** About twenty slices cannot support a productivity claim. Mitigation: bars above; the baseline pilot reports n.
- **Confounds.** A team that adopts Aveto also changes habits, repos and models. Mitigation: state them beside every before/after figure.
- **Copying another company's structure.** Mitigation: position 4; O3 tests ours.
- **A metric that rewards less review.** Faster lead time can mean thinner review. Mitigation: lead time is never shown without change failure and review burden beside it.
- **Calibrating on too little.** Thirteen runs from one operator, plus seven seed runs, make a table, not a model. PM2 states n and treats the ratios as starting ceilings to revise, not forecasts.
- **A ticket is an injection path.** Issue text can contain instructions aimed at an agent (three vendor pages read in the research did exactly that). PM4 treats it as data, produces a draft only, runs nothing from it, and the owner approves the Charter by hash as before.
- **Reading a vendor study as a result.** The measured figures in the research are mostly vendor telemetry and a dated trial; they carry direction more reliably than size. Nothing in this plan quotes them as Aveto results.
- **Over-reading a thin source.** The Amazon memo was read through a summarising fetcher and its page is undated; press claims about team sizes and reviewer rules have no primary source; the Anthropic credit-change terms are known only from secondary coverage. Nothing here depends on any of them being right.

## What this plan does not do

- It does not rank, score or compare individual engineers.
- It does not set targets such as "50% more PRs". It defines what to measure and how not to fool ourselves.
- It does not change the owner's merge or approval rights.
- It does not build a workbench or a control plane (see the Conductor note); the dashboard stays read-only.
- It does not claim Aveto raises productivity. It builds the instrument that could show it.
- It does not build a tracker, a roadmap or portfolio view, or a story-point or velocity replacement: the research found no
  evidence for any replacement, the one standalone agent-kanban company shut down (April 2026, one source), and Aveto has one
  owner to align. Token budgets stay a cost guardrail, not a capacity plan.
- It does not generate AI-written stakeholder digests. The dashboard shows recorded facts or "not recorded", and stays that way.
- Parallel slices stay at "one slice per repo at a time" in public wording until O4 runs.

## Decisions (owner, 2026-11-04)

1. **Position: approved.** Outcomes and teams, never inputs or individuals.
2. **Baseline (P5):** `hr-timeoff-agent` is the **test bed** for proving `outcomes.mjs` works (89 commits from 2026-09-21, 35 merged PRs, CI and an eval gate, one author). It supports no productivity claim: one author, no known pre-Aveto period. A real team repo with history before adoption is still needed for P5, and is **not yet chosen**.
3. **Pack v32 (F1, F2): wording approved in principle.** The support session drafts the exact wording and shows it before any pack file changes.
4. **Conductor install: approved, then moot** (F3 dropped, above).
5. **Slice-size rule (PM1c): about 600k estimated tokens or six stages is the signal to split**, as `RUN_ECONOMICS.md` says. `OPERATING_MODEL.md` (200k "MUST split") is to be brought into line; that edit is part of PM1 and not yet made.
6. **Ticket adapter (PM4): GitHub Issues is the first source.**

Still open: the team repo for P5; the wording of F1 and F2 (a draft to review); whether to read Anthropic's page on the paused credit change before touching site or README wording.
