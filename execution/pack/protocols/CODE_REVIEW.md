# Protocol: Code Review

The review layer of a Charter run. It exists to spend the **least human review
time that does not raise reverts or incidents**: automated checks and an
independent reviewer clear what they can, a person looks at what a person must,
and nothing a person must see is hidden by volume. The playbook's
`docs/CODE_REVIEW.md` has the reasoning; this file is what the run does.

## 1. Where review sits in a run

1. **Before the review:** the builder runs the repo's checks (`LOCAL_COMMANDS.md`:
   typecheck, tests, build, lint). A red check is fixed first. It is not a finding.
2. **Independent review:** a reviewer that did not write the change reviews the
   diff against its base branch. Use the local `/code-review` skill at `high`
   effort. Never its `--fix`. Never `ultra` (the owner's to start, billed apart).
3. **Findings go to the author role,** never the reviewer. Rounds are bounded (§4).
4. **Security Review** is a separate pass at the Charter's depth (C7.1). Open
   findings from either review block the release.
5. **The Release Manager** reads `code-review.md` (§3) and the tier (§2).
6. **Human review at the end,** scaled by the tier (§2), described in the end
   review.

## 2. Risk tier, set by the change (not by who wrote it)

The Orchestrator derives the tier from the actual diff, writes it with the paths
that decided it in `code-review.md`, and the Release Manager re-derives it. If
the two differ, the higher tier applies.

| Tier | The diff touches | Human review at the end |
|---|---|---|
| **High** | safety invariants, hooks, permission rules or settings, deny lists, auth, a model or processor line, CI or release workflows, anything a Charter line (C5.x) names | the owner reads the change itself; a **rollback is rehearsed** before it is offered |
| **Medium** | product behaviour: source, tests, schemas, scripts | the owner reads `END_REVIEW.md` and the review findings; reads the diff of anything flagged |
| **Low** | only docs, comments, formatting, tests that add coverage without changing behaviour | per the Charter's C8.4: either skipped (the owner sees only the notice) or the same as Medium |

The Charter's **C8.4** states the owner's choice for Low. Default: *review* (the
same as Medium). Skipping a Low change is something the owner turns on, never a
default.

## 3. `code-review.md` (written by the Orchestrator, one per run)

First line: the **count**. "0 findings." is a complete, valid first line. Then:

- the tier and the paths that set it;
- one row per finding: `id | severity | file:line | what and what triggers it |
  how to reproduce | disposition`. The reproduction is the input, command or test
  that shows the failure; for an Important finding without one, say why and mark
  it unconfirmed;
- the round number and what changed since the previous round.

Severity is one of **Important** (a correctness, safety or data bug), **Nit**
(small and real, optional), **Pre-existing** (present before this change; report
it, do not block on it).

Disposition is one of **fixed `<commit>`**, **rejected `<reason>`**, **intentional
`<reason>`**. A finding with no disposition is open. The reviewer's own rules:
a finding without a file and line is dropped; style-only and cleanup-only
findings are dropped; a finding already posted in an earlier round is not
repeated.

## 4. Rounds, bounded

- At most **three** review-and-fix rounds. After the third, do not fix again:
  the Orchestrator has the Architect reconsider the approach (a re-plan, inside
  the run and its budget), then one fresh review.
- After round one, re-review **only the new diff**, plus a check that earlier
  *Important* findings are fixed.
- Flag a **class** of bug once, with every place it occurs, rather than one
  finding per place.
- A finding whose fix would go outside the Charter is a Charter stop.

## 5. Noise is measured by what happens to findings

`code-review.md` is the data. At the end of the run, `END_REVIEW.md` reports,
for the run: findings by severity, and how many were fixed, rejected, or
intentional. A repo whose findings are mostly rejected or intentional has a
noisy reviewer, and its `REVIEW.md` needs tightening.

## 6. The repo's `REVIEW.md`

A short file at the repo root, written by the people who own the code and read
by every review. It says: what failure looks like here, the paths to skip,
that nits are capped, that every finding needs a file and line, and that the
summary starts with a count. The installer writes a starter if none exists.
Keep it short: it is loaded on every review.

## 7. What a review never does

It never approves a change on a person's behalf, never counts as the Release
Manager's gate, and never replaces the Security Review. An automated approval
is not a human's.

## 8. Evals from real incidents

`docs/review-evals/` holds past mistakes as cases (the diff and the finding a
good reviewer must raise). Rescore the review step against them whenever its
prompt, skill, model **or effort level** changes, and record the result in that folder's
`RESULTS.md`. A different model or effort in the Charter's section 3 than at the last
rescore means rescoring before the run, or stating "unscored" on the Charter's C3.R line
and in `END_REVIEW.md`; a lower effort is not assumed to find less, or more.
