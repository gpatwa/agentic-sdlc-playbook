# Plan: an Aveto web app for runs and decisions

> **Proposal, written 2026-11-12 by the support session at the owner's request ("web app instead"). Nothing is built, nothing is
> hosted, and nothing spends until the owner approves a phase.** It reverses one line of `docs/ROADMAP.md` "Deliberately not
> building" (a hosted service) for a narrow purpose, and touches the approval rules, so each of those is an owner decision below.

## The problem it solves

Today a run's owner works through several surfaces: a desktop session for each run (approvals typed there), chips to start runs,
GitHub's deploy gate, the terminal for reports, and `aveto.dev/runs` (a static snapshot refreshed by hand). Decisions arrive as
text to read and answer by typing. The owner asked for decisions as choices and a better workflow; the reference product shows
runs, reviews and approvals in one app.

## What it is (and is not)

**Is:** a small web app, usable on desktop and phone, that shows each run's live state and lets the owner answer the run's
questions with a tap.

**Is not:** a place where agents run. Runs still execute in the owner's own Claude Code session, on their subscription. The app
never holds code, diffs, secrets or model keys; it holds run metadata and decisions.

| Screen | Shows | The owner can |
|---|---|---|
| Runs | every run: stage, spend against plan and cap, what waits on you | open a run |
| Run | the six steps as a timeline (Charter, spec, build, evidence, review, end review), each step's verdict and a link to its file in the repo | answer a waiting question |
| Question | one stop: what the run wants, the numbers, the options with the recommended one first | pick an option, or decline |
| End review | what changed, spend, findings with outcomes, decisions left to you, the pull request | accept items; open the PR on GitHub (the merge stays on GitHub) |

## How it connects to a running session

1. **State out:** a hook in the installed pack (beside `event-log.mjs`) posts small state updates after each stage: run id, stage,
   verdict, spend, the Charter hash. Fails open, like the event log: a network fault never blocks a run.
2. **Questions out, decisions back:** when the Orchestrator reaches a stop, it posts the question and calls a waiting script
   (`aveto-wait <question-id>`) that polls the app until the owner answers. The session must stay open while it waits; the wait is
   shown in the session too, so the owner can still answer there.
3. **Run token:** the session talks to the app with a token the owner sets once per repo. **That token can post state and read
   decisions; it cannot make one.** Decisions need the owner's own browser sign-in, so an agent holding the token cannot approve.
   (This keeps "agents never handle credentials" true in spirit: the token is not the owner's identity, and it grants no approval.)

## The approval rules: what changes

Today an approval counts only when typed in the driving session (`docs/HUMAN_APPROVAL_RULES.md`, claim C5), and the approver's
identity is whoever is logged in to that session (T46, not authenticated).

A web decision would count only if **all** hold, and the session checks each before acting:

- made by a person signed in to the app (sign-in with GitHub), whose account is the one the Charter names as approver;
- bound to the Charter's sha256 (for a stop: to the question id and the Charter hash);
- returned with a signature from the app that the waiting script verifies with the app's public key (pinned in the repo);
- recorded verbatim in `APPROVAL_RECORD` with the account, time, option text and signature.

This is **stronger** than today on identity (a GitHub account, not "whoever has the session open") and new risk on availability and
hosting. **Charter approval itself stays a typed hash in the session in phases W1 and W2**; moving it to the app is a separate
decision (W3).

## Phases

| Phase | Builds | Needs from the owner |
|---|---|---|
| W0 | This plan's decisions; a one-page threat model (who could forge a decision, what a leaked run token allows) | decisions below |
| W1 | Read-only: live runs list and run timeline from the state hook. Replaces the hand-refreshed `/runs` snapshot for new runs | hosting choice; a new data processor line in each Charter that uses it |
| W2 | Questions and decisions for mid-run stops, signed, verified by the waiting script; approval rules amended | rule wording approval |
| W3 | (optional) Charter approval from the app, with the hash shown and typed or confirmed there | a second rule decision |
| W4 | Notifications to phone or email when a run waits on you | which channel |

Each phase is built **as an Aveto run** under its own Charter (the app is a good test of Aveto on a new service), in a new private
repo, so the playbook itself stays a docs-and-pack repo.

## Cost (estimates, nothing measured)

- Build: comparable aveto-support slices spent about 0.6M to 1.6M tokens each (`aveto.dev/runs`). W1 and W2 are likely one to two
  slices each.
- Hosting: small for one user on either option below; prices not checked.
- Owner time: setting up sign-in and hosting accounts (agents never handle credentials), approving each Charter, testing on a phone.

## Hosting options

| Option | For | Against |
|---|---|---|
| Cloudflare (Workers and a small database), next to the site | the site already deploys there through the gated workflow | new to Aveto's runs; Workers' limits not checked |
| Azure Container Apps, next to the live support service | Aveto has deployed and rolled back there (C16, C17); known setup | a second always-on service to pay for and patch |

## What it changes in public wording

The site says "Not a hosted service" and the roadmap lists a hosted service as not built. Neither changes until a phase ships, and
then only on the owner's approval of new wording with a claims-register row.

## Open decisions

1. Go ahead with W0 and W1, or keep the plan only.
2. Hosting: Cloudflare or Azure.
3. Sign-in: GitHub (recommended; the approver is then a GitHub account, which also answers T46 for app decisions).
4. Repo: a new private repo (recommended) or inside `aveto-support`.
5. Whether a signed app decision may count as an approval for mid-run stops (W2). Charter approval stays typed until W3 is decided.
