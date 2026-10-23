# Review trial record (Codex), started 2026-10-23

Plan and bars: `docs/REVIEW_TRIAL_PLAN.md`. Collector: `execution/external-review.mjs`
(`parse` for a pasted review, `draft` for a pull request's bot comments, `tally` for the bars).

## Setup, as the owner stated it (not checked by an agent)

- Owner has a ChatGPT subscription. **Data controls: model improvement turned off** (owner, 2026-10-22).
- Not yet recorded: the plan name, the exact GitHub permissions the Codex integration asked for,
  that automatic review is off, whether Codex has a repository memory setting and that it is off,
  and branch protection on aveto-support `main`. These are in the plan's section 4 and are still open.

## Records

| Pull request | Date | How the review ran | Findings | Disposition |
|---|---|---|---|---|
| aveto-support#5 | 2026-10-22 | **In the Codex app, not through the GitHub integration** (its own text: "review not posted to GitHub"); it also ran the repo's tests (637 passed, 12 deselected) | 1 (P2) | open: `pr-aveto-support-5.md` |

## Deviations from the plan, stated plainly

- **The first review did not go through the GitHub path the plan describes.** No `@codex review`
  comment, reaction or review exists on the pull request. The plan's bars were written for the
  GitHub integration, which per OpenAI's documentation reports only P0 and P1 issues; this review
  reported a P2. It counts as the trial's first data point, with that difference noted. Whether the
  integration behaves the same way is not yet known, so the GitHub path still needs a first test.
- **The review ran the tests.** That is more than a read-only review, and it means the findings
  rest on an executed repository, not only on reading. No live model call was made.
