# Plan: measuring developer productivity, and defining the organisation (T42)

> Raised 2026-11-04 by the support session, from two reviews and the owner's direction that Aveto should "focus on measuring
> developer productivity and defining org-structure". Status: **plan, nothing built or adopted.** Every claim about other
> companies below is as reported in the sources named; where a source was thin, it says so.

## Why now

Two reviews point the same way.

- **Amazon** (GeekWire, 2026-11-03; the revised guidelines themselves were not published, so the article is the only source): agents write almost all implementation code for most of its developers; the new guidelines
  measure **outcomes, not inputs** such as tokens spent or lines committed; an internal leaderboard (KiroRank) was shut down
  after people used the tool just to climb it; some new teams are small (six to eight, a roughly 35-person lab) with one owner per
  piece; the stated worry is engineers losing touch with the customer and the product. Reported as Brooker's views and press reports, not as measured results.
- **Conductor** (`docs/research/2026-11-conductor-comparison.md`): a workbench that runs many agents at once, one
  isolated workspace per shippable unit, with a review loop. It states no rule about who may approve what or what must be true
  before a merge.

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
experiment and not by opinion: *is 28 the right number?* Amazon reports small, high-trust teams; Conductor's unit is one
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
| F2 | **Fit check records "AI did not help here, and why"** as a first-class outcome (Amazon's letter: "a finding, not a failing"). | pack change; ships with F1 in v32 |
| F3 | **Conductor compatibility test**: with a fixture repo and the pack, do hooks, `.claude/settings.json` and the plugin load in a Conductor-started Claude Code session, and do permission prompts reach the human? | needs the Mac app installed; owner's go |
| F4 | **Read what was missing**: "Conductor is joining Meta"; "Claude subscription update for Conductor" (2026-06-15), which bears on the site's "A subscription to build" heading; and the Amazon letter itself if it is public. | reading only |

## Order, cost, touches

F4 (reading) → P1 → O1 → P2 → P3 → F1 and F2 → P4 → O2 → F3 → P5 → O3 → P6. P1 and O1 are documents the owner edits; the
rest is engineering of about 0.6M agent work plus the runs in P5 and O3. **Owner touches:** edit the dictionary (P1), edit the
org model (O1), approve the pack v32 wording (F1, F2), choose the baseline repo (P5), allow the Conductor install (F3). Cost figures are
peak-sum estimates; review stages have run 1.5 to 3 times their estimates before, so plan on the high side.

## Risks, stated now

- **Goodhart.** Any number becomes a target. Mitigation: gaming check per metric, no per-person view, team-level only, metrics reviewed whenever one moves without an outcome moving.
- **Surveillance.** Delivery metrics read as monitoring people. Mitigation: no individual breakdown is built at all; the data source is the repo's own history.
- **Too little data.** About twenty slices cannot support a productivity claim. Mitigation: bars above; the baseline pilot reports n.
- **Confounds.** A team that adopts Aveto also changes habits, repos and models. Mitigation: state them beside every before/after figure.
- **Copying another company's structure.** Mitigation: position 4; O3 tests ours.
- **A metric that rewards less review.** Faster lead time can mean thinner review. Mitigation: lead time is never shown without change failure and review burden beside it.
- **Over-reading a thin source.** The Amazon article is secondhand and the guidelines are unpublished; the Conductor pages were read as summaries. Nothing here depends on either being right.

## What this plan does not do

- It does not rank, score or compare individual engineers.
- It does not set targets such as "50% more PRs". It defines what to measure and how not to fool ourselves.
- It does not change the owner's merge or approval rights.
- It does not build a workbench or a control plane (see the Conductor note); the dashboard stays read-only.
- It does not claim Aveto raises productivity. It builds the instrument that could show it.

## Decisions for the owner

1. Approve the position above (outcomes and teams, never inputs or individuals), or edit it.
2. Which repo is the baseline pilot (P5)? It should be a real team repo with history and CI.
3. Approve F1 and F2 as the next pack version (v32), after reading the wording I would draft.
4. Allow installing Conductor for the compatibility test (F3), or skip it.
