# Model-change evals

Case specifications (`cases.toml`), fixtures (`fixtures/<case-id>/`) and a scorer (`execution/role-eval.mjs`) for the check in
`docs/MODEL_CHANGE_CHECK_PLAN.md`. **Nothing here has been run on a model. No result is recorded.** Eleven cases: five for the
Software Architect, six for QA Evidence, each from a recorded lesson in `docs/LESSONS.md`.

- `node execution/role-eval.mjs list | check | prompt <id> | score <id> <output-file>`.
- A harness session gives `prompt <id>` to a fresh subagent of the role and saves the reply; `score` then judges it. Three cases are
  **scripted** (the role ends with `KEY: value` footer lines the scorer compares with the rubric); eight are **judged**: `score`
  prints a packet for a separate judge session or a person and exits 3.
- Scripted cases test whether the role reaches and states the right decision in a fixed format, not how well it reasons. The judged
  cases test reasoning, and a judge's verdict is itself a measurement with its own error.
- Per the plan: run each case at least three times per model, record model ID, effort, date, pack version and spend, and compare old
  against new. A run costs model spend and needs the owner's Charter approval (plan phase B3).

**Before any later pass:** `RUN_SETUP.md` (clean eval repo, `role-eval.mjs leaks` to measure what each spawn read, a lean `eval-judge`
agent). B3's one pass (`b3-2026-11-13/`) found the cases not isolated and the judges 73% of the spend.
