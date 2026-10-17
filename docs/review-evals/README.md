# Review evals

Past mistakes turned into cases for the review step (`execution/pack/protocols/CODE_REVIEW.md`
section 8). Each case has the change, and the finding a good reviewer must raise
(`must_find`). They come from real incidents in the reference app and the playbook.

To rescore: for each case, put the `diff` in a scratch branch of a copy of the
repo, run the local `/code-review` skill at `high` effort, and record in `RESULTS.md`
whether the review raised a finding matching `must_find`, and the date, the model
and the skill version. Rescore whenever the review prompt, skill or model changes.
A case the reviewer misses is a defect in the review layer, not in the case.
