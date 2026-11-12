# Aveto pilot: two weeks, one repo

> Draft for the owner (roadmap Theme 5), written 2026-11-12. To send after a discovery call, when the person asks for it. Wording here
> follows `docs/MESSAGING.md`; anything the owner changes that makes a new claim needs a row there first.

## What Aveto is

A process your agents follow, installed into your repo, running in your own Claude Code session on the plan you already pay for.
You approve one Charter at the start (scope, models, spend and stops, approved by its hash) and review a pull request at the end.
Independent review, a security pass and a release gate run in between, and every decision is recorded in the repo.

## What we would do together

| Week | What happens | Your time |
|---|---|---|
| Before | 30-minute call to pick one repo and two or three small, real changes from your backlog | 30 min |
| Day 1 | **Before figures:** a read-only script reads the repo's history (merges, reverts, follow-up fixes, CI) for the months before agents. It changes nothing in the repo and makes no model call | none |
| Days 2 to 10 | Install the pack; run the chosen changes through Aveto, one at a time. Each ends in a pull request your team reviews and merges, or rejects | about 1 hour per change (approve, review) |
| Day 10 | **After figures:** the same script on the same repo, plus each run's records (cost, findings, what was caught) | none |
| Day 14 | 45-minute review: the before and after table, with its caveats, and what you would change | 45 min |

## What you get

- Two or three real changes, each with its review, security and gate records.
- A before and after table for your repo, with the number of changes it covers and what it cannot show.
- A register of who approved what during the pilot, read from the run records.

## What it costs and what it needs

- **Fee: none proposed (the owner's decision; confirm before sending).** The runs use your Claude Code plan's usage; a run can use a large share of a five-hour window. We agree a hard cap per run
  in each Charter before it starts.
- A repo with history from before the team used agents, CI, and someone who can approve and merge.
- Claude Code for the person driving the runs. Aveto has been run on one person's subscription plan; other plans, Team included, are untested.

## What we promise, and what we do not

- Nothing merges, deploys or sends without your person approving it.
- Your code stays in your repo and your Claude Code session; we see only what you choose to share.
- **We will not claim a productivity gain** from two or three changes. The table reports what happened, with n.
- Aveto is early: built and proven by one person on small repos. This pilot is how we learn whether it works for a team.

## What we ask of you

Honest feedback, including "this was not worth it", and permission to describe the result without your name unless you agree otherwise.
