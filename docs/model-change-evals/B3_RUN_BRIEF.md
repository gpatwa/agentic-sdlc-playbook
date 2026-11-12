# B3 run brief: the model-change cases, one pass on the current model

> Written 2026-11-12 by the support session. Owner's choice the same day: **one pass first, to measure**: each of the 11 cases once,
> plan about 0.7M tokens, hard cap 1.0M. The full plan (three passes) follows only after this measures the real cost. Plan:
> `docs/MODEL_CHANGE_CHECK_PLAN.md` phase B3. The run happens in the scratch repo `/Users/gopalpatwa/opt/scout-pilot` (pack v35
> installed, which has the `software-architect` and `qa-evidence` subagents), in a desktop session started from a chip. The
> Orchestrator there drafts `runs/model-check-b3/CHARTER.md` from this brief; the owner approves it by typing its full sha256 in
> that session. This brief is not an approval.

## What runs

For each case in `docs/model-change-evals/cases.toml` (list: `node <playbook>/execution/role-eval.mjs list`):

1. `node <playbook>/execution/role-eval.mjs prompt <id>` gives the task. Spawn a **fresh** subagent of the case's role
   (`software-architect` or `qa-evidence`) with exactly that text. One spawn per case; no retries to get a better answer.
2. Save the reply verbatim to `runs/model-check-b3/replies/<id>.md`.
3. `node <playbook>/execution/role-eval.mjs score <id> runs/model-check-b3/replies/<id>.md`.
   - **Scripted cases (3)**: the score is final. Save the output to `scores/<id>.txt`.
   - **Judged cases (8)**: `score` prints a judge packet and exits 3. Spawn a **separate** general-purpose subagent as the judge
     with the packet only (not the role's brief, not other cases). Save its verdict to `scores/<id>.txt`. The judge is never the
     role that answered.
4. Record per case: role, model as observed (or "not observed"), effort, spend for the role spawn and the judge spawn, the score.

At the end write `runs/model-check-b3/RESULT.md`: the table above, totals, and the per-case token cost for planning three passes.

## Charter lines to carry (the Orchestrator writes the Charter; these are the owner's choices)

- **Scope:** the 11 cases, one pass. No change to any case, fixture, rubric or brief. No merge, push, deploy or send.
- **Budget (unit as the harness reports it):** plan 700k, ceiling 850k (notice), hard cap 1,000k (stop). The budget guard reads
  `STATE.md`, so this run keeps one.
- **Models:** the session's model for the Orchestrator; each role's frontmatter model; the judge on the session's model. Report what
  is observed.
- **Data processors:** none beyond the model provider the session already uses. No web tools.
- **Outcomes decided now:** a case that scores badly is a result, recorded as is. No rerun, no prompt change, no rubric change.
  A spawn that errors is recorded as "no result" and not retried.
- **Stops:** the standard four (an action not in the Charter, spend over the hard cap, a credential, a Charter change).

## What this run cannot show

One pass per case gives no variance; it measures cost and whether the harness works end to end. A judged score is a model's
judgement with its own error. Same model family answers and judges. The comparison that matters (B4) needs the next model.
