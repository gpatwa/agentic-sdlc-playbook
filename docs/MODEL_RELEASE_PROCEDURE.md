# What happens when a new model ships (procedure, proposal)

> **Proposal, written 2026-11-13 by the support session** (owner: "how about self-improving roles, when model release happen?").
> Builds on `docs/MODEL_CHANGE_CHECK_PLAN.md` (B1 to B4) and `execution/model-drift.mjs`. Nothing here is automatic and nothing
> changes a brief, a gate or the installer until the owner approves it. **Roles do not improve by themselves**; this is how
> an improvement is measured, proposed and approved.

## Facts it rests on (Claude Code docs, read 2026-11-13 by a page-reading agent; the model-config page was truncated, so items marked (summary) are not verbatim)

- The aliases `opus`, `sonnet` and `haiku` "resolve to the newest version on the Anthropic API", differ on other providers, and
  "update over time". The page gives no schedule; alias changes are tied to Claude Code releases (summary).
- **A subagent's alias takes the parent's version when the parent is in the same family** (a main conversation on one Opus version,
  a subagent with `model: opus`, runs that version). So the session's own model can decide what a role runs on.
- **Pinning:** a full model ID in an agent's `model` field (for example `claude-opus-5-5`), or the `ANTHROPIC_DEFAULT_*_MODEL`
  variables; `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` overrides the field in definitions.
- A model with a scheduled retirement or automatic remap shows a warning; a saved session resumes on whatever the alias resolves to now.
- **In our own records** (`node execution/model-drift.mjs /Users/gopalpatwa/opt/aveto-support`, 2026-11-13): the Engineering Manager's
  `sonnet` ran on `claude-sonnet-5` on 2026-09-27 and on `claude-sonnet-5-5` on 2026-09-29, with no file changed. Whether the alias moved
  or the session's model did, the model moved without a check. (Security & Privacy also moved from Opus to Sonnet on 2026-10-27, but
  that was the `result-page-clarity` Charter's own line C3.3, approved by hash: not drift.)

## The loop, in order

| Step | What | Who | Cost |
|---|---|---|---|
| 1. Detect | Run `node execution/model-drift.mjs <product-repo>` when a run closes (and when a release is announced). A baselined role on a different model is **stale** | Orchestrator reports it in `END_REVIEW.md`; the owner reads it | none |
| 2. Decide whether to pin | For roles with a baseline (Architect, QA Evidence, the review step) the owner may pin the baselined full model ID in the role's frontmatter, so a release cannot move it before a rescore. A pin is a pack change (a new version) | Owner | none to propose; a pack version to apply |
| 3. Rescore | Run the same cases on the new model (B4), from a clean repo, with the leak check and the lean judge (`docs/model-change-evals/RUN_SETUP.md`), three passes where the budget allows. Compare with the baseline: pass rate per case, cost per case, leaks | A harness session; the Charter and its spend are the owner's | about 0.65M tokens a pass on B3's figures (judges were 73% of it; the lean judge's saving is unmeasured) |
| 4. Compare | Record old against new in `RESULTS.md`: per case, per role, with the model IDs, the date, the pack version and the spend. A model change with a worse pass rate or more leaks is a result, not a failure to hide | Support session reads the files; owner reads the comparison | none |
| 5. Propose | From the evidence, **propose** one of: keep the new model for the role; keep the old (pin); change effort; try a cheaper model where the pass rate held (the `/usage` hint about simple agents). A proposal names the cases that support it | Support session writes it | none |
| 6. Approve and apply | The owner approves each change; routing and brief edits ship as a **pack version** with tests. `baselines.json` is updated only after the rescore run on that model | Owner | a pack version |
| 7. Slim the briefs (separate, optional) | Lines added to work around an old model's mistake may no longer be needed. Remove one only if the cases still pass; one change at a time. A hypothesis, not a measured saving | Owner approves each | cases per removal |

## What is never self-applied

- An agent editing its own brief, a hook, a gate or `baselines.json`.
- A role, or a judge of the same model family, deciding that its own change is an improvement. B3's judges shared a family with the
  Architect, so that scoring is not independent; use a different family where the Charter allows it.
- A routing change because a score went up on cases the change was tuned on. Cases come from past incidents; add new ones before
  trusting a gain.
- Memory (`docs/MEMORY_PLAN.md`) loosening the safety floor. Memory waits for step 3 to exist, so its effect can be told apart.

## Coverage today, and what is missing

`baselines.json` has two roles (Architect, QA Evidence), from B3's one pass. Every other role shows "no baseline" in the drift
output: a model change there is unmeasured. The review step has its own rescore (Charter C3.R). Next roles to add cases for, by cost
of a wrong output: Security & Privacy, the Release Manager, the Orchestrator. The Scout has the least stable output, so its cases
need more passes (`docs/data/scout-variance-2026-11/RESULT.md`).

## What this cannot show

Pass rates on cases from our own incidents say nothing about roles with no cases or about production outcomes; three passes is a
small sample; the same-family judge is not independent. The loop makes a change visible and reversible. It does not prove a role is good.
