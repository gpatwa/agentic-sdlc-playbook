# Plan: reviewing an existing codebase (review mode)

> **Status: proposed 2026-10-17, not started.** Aveto today is built for
> greenfield and for slices on a repo it already governs. This plan adds a
> **review-only run** for a codebase Aveto did not build: it reads, maps,
> reviews and reports, and it changes nothing. It reuses the Charter (Process
> v2), the review layer (`docs/CODE_REVIEW.md`) and the risk tiers; the new work
> is onboarding, a map, a runner that reviews by area, and the evidence that the
> result is worth reading.

## The goal, and how we will know

**Goal:** a repeatable, measured way for **any team with its own codebase**, such
as an enterprise with several, to adopt governed agentic development on code Aveto
did not build. The first step is read-only: approve one Charter, and receive a
report that says where the risk is, what is wrong with evidence, and what to fix
first, without anyone reading the whole tree and without the run changing a line.
Later steps (onboarding the repo, then changing it under Charters) follow only once
this one has measured results.

**What "any codebase" means for the design.** Nothing in review mode may assume
our stack, our size, a test suite, or that the code may leave the owner's
environment. Aveto is not a hosted service: each organisation runs it in its own
Claude Code sessions, under its own plan and terms, so the code goes to that
organisation's own model provider and nowhere else, and Aveto's authors never see
it. Today's evidence is three small apps of ours, so **nothing here is claimed
enterprise-ready**; the plan is how that claim would be earned.

**Success is declared now, before any run, and not moved after:**

| Measure | Bar |
|---|---|
| **Recall on known incidents** | On aveto-support at the commit *before* the S5 fix (`c150673` on `claude/docs-answerability-2`), the review raises both S5 (quote breakout in the skill's shell line) and S6 (the over-broad permission rule) **without being told they exist** |
| **Precision** | At least 70% of findings are neither rejected nor marked intentional by the owner on a sample of 30 |
| **Owner touches** | Two: the Charter and the end review |
| **Cost** | Spend per 10,000 lines is measured and reported; no target, because no data exists yet |
| **Changes made to the target repo** | Zero (checked by `git status` and a diff of the default branch) |
| **Generality** | Run on **at least three repos of different stacks and sizes** (one small, one mid-size, one large or a monorepo subdirectory), at least one not written by us; every bar above is reported per repo, and a repo where a bar is missed is reported as a miss |
| **Confidentiality** | No file matching the secret-path rules reaches a model (a test proves the exclusion), and the Charter names the data classification and the processor for the repo reviewed |

Recall on two incidents is a small test, and the report must say so. It is
better than no test, and it is a test we can run today because we have the
history.

## What exists, what is new

| Needed | Today | New work |
|---|---|---|
| Install into a repo that has no `.agentic/` | refuses; `--greenfield` writes empty stubs | an `--existing` onboarding that proposes the `.agentic/` files from the code |
| Know the repo | nothing | a deterministic **repo map**: tree, languages, size, churn, entry points, manifests, risk tier per path |
| Review a whole tree | `/code-review` reviews a diff | run it per **area** as a diff against the empty tree, tier by tier |
| Record findings | `code-review.md` per run | `reviews/FINDINGS.md` with ids, severity, `file:line`, disposition `open` |
| Deliver | PR with an end review | a PR that adds only a `reviews/` folder |
| Trust the reviewer | five incident cases | cases from the target repo and the S5/S6 recall test |

## Milestones

Each milestone ends in something checked, committed on the owner's word, and
recorded. **M1 to M3 and M5 are playbook engineering** (built and tested here,
like Process v2). **M4 and M6 are runs under a Charter.**

### M0 — Decide (the owner, one message)
Choose the pilot target and approve the bars above. Recommended pilot:
**aveto-support at `c150673`**, because the known incidents make recall
measurable and the repo is small enough to afford. Then a second pilot on a repo
the owner cares about.
*Done when:* the bars and the pilot are recorded in this file's header.

### M1 — Onboarding an existing repo
`install.mjs --existing` and a `/agentic-onboard` command. It writes
`.agentic/PROJECT_CONTEXT.md`, `LOCAL_COMMANDS.md` (from the package manifests
and CI files), a first `REVIEW.md`, and **proposed** invariants in
`SAFETY_INVARIANTS.md`, each line marked **(proposed, not confirmed)**. Writing
safety text is a rule 4 change, so nothing becomes binding until the Charter
names it.
*Done when:* a test installs into a fixture repo with no `.agentic/` and the
files exist, every invariant line is marked proposed, and the repo is unchanged
otherwise. *Estimate:* 300k.

### M2 — The map (a script, no model)
`execution/repo-map.mjs`: file tree, languages, sizes, churn from `git log`,
authors per path (and `CODEOWNERS` if present), entry points, dependency manifests
and a risk tier per path from `.agentic/RISK_PATHS` (default rules from
`CODE_REVIEW.md` section 2, which an organisation overrides with its own: payments,
PII, auth, infrastructure-as-code, CI). **Language-agnostic by construction:** it
reads git and file names, not our stack; build, test and lint commands are detected
from the common manifests (Node, Python, Java, Go, .NET, Rust, Ruby) and the CI
files, and a repo with none is reported as "no tests found", not an error.
Output `reviews/MAP.md`. Deterministic and cheap, so it can be tested and rerun.
*Done when:* tests on fixture repos pin the tier of known paths and the churn
counts; it runs on aveto-support in under a minute. *Estimate:* 150k.

### M3 — The area runner
A protocol and command that splits the map into areas (a directory, up to a size
cap, in tier order), reviews each as a diff against the empty tree with
`/code-review` at `high`, runs the Security Review over High areas, and records
every finding in `reviews/FINDINGS.md` (disposition `open`). Round and budget
rules from `CODE_REVIEW.md` apply; the run reviews areas in order of risk and
stops at the hard cap with the rest listed as **not reviewed**. It never fixes.
*Done when:* a dry run on a small fixture repo produces the folder, changes
nothing else, and the "not reviewed" list is correct when the cap is hit.
*Estimate:* 500k.

### M3b — Confidentiality and scale controls (before any private repo)
Review mode must be safe to point at code that matters. Built and tested here:
- **Secret and sensitive paths never reach a model:** a deny list (`.env*`, key and
  certificate files, credentials folders, and an organisation's own patterns) applied
  by the area runner and enforced by a hook, plus a secret scan of what is shown, with
  a test that a planted secret in an excluded path is never in a review prompt.
- **Data classification and processor are Charter lines** (C4) and the template
  refuses a review-mode Charter that leaves them blank.
- **Scoping:** a monorepo or a very large tree is reviewed by named subdirectory with
  a size cap per area; everything outside is listed as "not in scope", not skipped
  silently.
- **Where the records live:** `reviews/` in the repo by default; an organisation that
  must not commit findings to the repo can point it elsewhere in the Charter.
*Done when:* the exclusion test, the blank-Charter refusal and a scoped run on a
fixture monorepo pass. *Estimate:* 300k.

### M4 — Calibration (a Charter run)
Measure the reviewer on the target: the S5/S6 recall test, plus bugs seeded by a
**different** agent than the one that reviews, so the reviewer does not grade its
own work. Record recall, precision on the owner's sample, cost per 10,000 lines.
Rescore whenever the prompt, skill or model changes (`docs/review-evals/`).
*Done when:* the bars in the table above are measured and reported, including
any miss. *Estimate:* 400k.

### M5 — The report
`reviews/REPORT.md` and a Charter template for review mode. The report has the
risk map, findings by severity with evidence, what was not reviewed and why, test
and CI observations, and a **proposed backlog**: each fix is a Charter-ready
intent, so the next step is the owner's choice and nothing is fixed silently.
The review-mode Charter fixes: no model beyond the owner's session, no safety
text changed, no irreversible action except a pull request that adds only
`reviews/`, and a hard cap that ends the run with the unreviewed list.
*Done when:* the template passes `charter-check` and the report from M4's run
reads cleanly to someone who was not there. *Estimate:* 150k.

### M6 — Pilots and publish
Run review mode on aveto-support at `c150673` (recall), then on **two or more
repos of other stacks and sizes, at least one not ours** (an open-source project
with a known history of fixed bugs gives a recall test the way ours does). Write up
what was found, what it cost, what it missed, per repo. Only then update the README
and site, with the measured numbers, the limits, and the words "pilot results", not
"enterprise-ready".
*Done when:* the owner has reviewed a report for each pilot and the evidence is in
the playbook. *Estimate:* 600k for the first, and about 400k to 1M for each further
repo, by size.

## Order, cost, touches

M0 → M1 → M2 → M3 → M3b → M5 → M4 → M6. M2 can be built before M1 is finished. The
playbook engineering (M1, M2, M3, M3b, M5) is about 1.4M of agent work and needs
the owner only to confirm commits. M4 and M6 are Charter runs: **two touches
each** (the Charter, the end review). Cost figures are peak-sum estimates, and
review stages have run 1.5 to 3 times their estimates three times, so plan on the
high side.

## Risks, stated now

- **Whole-codebase review quality is unknown.** `/code-review` is designed for a
  diff. M4 exists to find out, and the plan stops after M4 if recall or precision
  misses its bar.
- **False positives can flood a report.** The evidence rule (file and line or
  dropped), `REVIEW.md`, the severity sort and the precision bar are the controls.
- **Cost grows with size.** Tier order and a hard cap bound the run, and the report
  lists what it did not review.
- **Same model family as the builders.** Blind spots overlap. The report claims to
  find issues, never to certify their absence.
- **A target repo's code goes to Anthropic** through the owner's session. A
  private repo needs its own Charter line for rule 6, and an organisation's own
  plan and terms decide whether that is allowed at all; the pilots are public or the
  owner's own. Aveto does not host, store or see anyone's code.
- **Enterprises have constraints we have not met:** data residency, an approved
  vendor list, change-management systems, audit export formats, repos far larger than
  our pilots. Review mode does not claim to satisfy them; each pilot adds to a list
  of what is missing.

## What this plan does not do

It does not fix anything, merge anything, deploy anything or replace a human
reading the riskiest code. Fixes are separate Charter runs, chosen from the
proposed backlog.
