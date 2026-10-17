# Code review in Aveto

> **The aim:** the least human review time that does not raise reverts or
> incidents. That sentence is Anthropic's own stated goal for its internal code
> review ("Solving code review at Anthropic"); it is also what Process v2 is for.
> This document is the reasoning. The rules a run follows are in
> `execution/pack/protocols/CODE_REVIEW.md`.

## What Aveto does and does not build

Aveto does **not** build a review engine. Anthropic ships one (`/code-review`
in Claude Code, and the Code Review GitHub App for Team and Enterprise plans),
and it runs on the subscription an operator already has. What Aveto adds is the
layer around the engine, because that layer decides whether a review means
anything:

- when the review runs, and that it is never the agent that wrote the change;
- how findings are recorded, fixed, and counted;
- which changes need a person, set by the change and not by who made it;
- how we know the review step is any good, and when to rescore it.

## The six rules

1. **Verification before volume.** Report only findings with a file and line,
   what triggers them, and the fix. Drop style-only and cleanup-only findings.
   Anthropic reports that verifying findings made results "two to three times
   better"; the local skill's internal filtering is not something Aveto can see,
   so Aveto adds its own evidence rule.
2. **The reviewer never fixes.** Findings go to the role that wrote the change.
   The verifier is never the implementer (pack rule, since v14).
3. **Risk tier from the diff.** A change to safety text, hooks, permission rules,
   deny lists, auth, a model or processor line, or CI is high risk whoever wrote
   it. Docs and comments are low. Low-risk changes may skip human review only if
   the owner's Charter says so (C8.4); the default is to review.
4. **Bounded rounds.** Three rounds at most; then the approach is reconsidered,
   not patched again. Re-reviews look at the new diff only. A class of bug is
   one finding, with every place it occurs.
5. **Measure noise by what happens to findings.** Fixed, rejected or intentional:
   a repo where most are rejected has a noisy reviewer, and its `REVIEW.md`
   needs tightening.
6. **Past mistakes are the test set.** Real incidents become cases
   (`docs/review-evals/`), and the review step is rescored when its prompt,
   skill or model changes.

## What stays human

Whether to build a thing at all; changes that touch what keeps the system safe;
architecture others will copy; reading the evidence at the end of a run. An
automated approval is never a person's approval, and a review is never the
Release Gate or the Security Review.

## Why this and not more

Anthropic's internal data (their research note on employment, October 2026)
reports that interactive sessions are about 80% idle waiting for a person, and
that they found no difference in revert rates between agent-written and
human-written code. Both are Anthropic's figures from a non-random adoption, so
they support the direction, not a promise for any other team. The measure Aveto
holds itself to is its own: owner touches and time to the first touch per run.
