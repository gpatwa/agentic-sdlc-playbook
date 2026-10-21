# Protocol: Routine runs under a standing Charter (Process v3, pack v27)

A **standing Charter** (`templates/STANDING_CHARTER_TEMPLATE.md` in the playbook)
approves a class of routine run once, by its sha256, in the human's own words, in the
session where it is shown. Under it, a run that fits starts and finishes with **no
human message**. A run that does not fit is not started under it: it becomes a normal
run (a Charter for that run, approved by its hash) and the human gets a notice saying
why.

## Where it lives

`.agentic/STANDING_CHARTER.md` in the product repo, with its approval recorded in
`.agentic/STANDING_CHARTER_APPROVAL.md` (the human's words, the sha256, the time from
`date -u`). Deleting or renaming either file revokes it: every routine run stops at its
next stage boundary.

## The routine run, step by step

1. **Pick.** `node <playbook>/execution/pick-intent.mjs . --standing .agentic/STANDING_CHARTER.md`
   prints the next intent in `intents/ready/`, or exits 3 (a run is open; do nothing) or
   4 (nothing ready; do nothing). Only one run per repo at a time.
2. **Check the Charter still holds.** `node <playbook>/execution/standing-charter.mjs check
   .agentic/STANDING_CHARTER.md`, and its sha256 equals the one in the approval file.
   If either fails, stop and send a notice. Never repair a standing Charter yourself.
3. **Plan.** Write `runs/<slice-id>/00-slice-plan.md` as usual. It must state its
   release tier, its plan total, and a `## Files changed` section listing every path it
   will change.
4. **Fit.** `node <playbook>/execution/standing-charter.mjs fits .agentic/STANDING_CHARTER.md
   runs/<slice-id>/00-slice-plan.md --runs-used <n from step 1>`. Save the output to
   `runs/<slice-id>/STANDING_FIT.md`, **first line: the standing Charter's sha256**.
   On "does NOT fit": stop the routine path, draft a normal Charter for this run, send a
   notice with the reasons, and wait for the human. Never change the plan just to fit.
5. **Run** every stage as under a Charter (`APPROVAL_PROTOCOL.md`), citing the standing
   Charter's lines. The stops are the same as a Charter's section 9, plus: the plan
   changes so it would no longer fit, or the week's budget (S2.2) would be exceeded.
6. **Land.** Open a pull request (S5.1). Auto-merge only under the rule below.
7. **Record.** `END_REVIEW.md` as always, opening with Blocked on me, Changed, Found. For
   a routine run it is a record to read later, not a gate.

## Auto-merge (S5.2 = `tier 1`)

The Release Manager (no shell) decides; the Orchestrator merges with `gh pr merge` only
after the Release Manager has recorded a yes in the release gate artefact. The yes
requires **all** of these, each recorded:

1. the plan and the diff are both release tier 1;
2. the review layer's tier (`CODE_REVIEW.md`, derived from the diff) is Low;
3. every gate passed;
4. `code-review.md` has zero open Important findings;
5. CI on the pull request is green;
6. the diff changes only paths under the standing Charter's S4 prefixes.

Any one missing: leave the pull request open for the human, and say which. Never merge
by bypassing a required check or a branch protection.

## What a routine run never does

Everything in the standing Charter's section 7: send; destroy shared state; deploy;
change a safety control, hook, permission, `.claude/` or CI; add a model or put one in
a deterministic path; add a data processor. The scheduled task that starts routine runs
never approves anything and never uses a credential.
