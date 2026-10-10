# Design: session requests and budget bands (T27)

> **Status: proposed, not enforced.** Drafted 2026-10-10 by the support session
> at the owner's request. Nothing here changes the pack until the owner confirms
> the open choices at the bottom and a pack version records it. A running slice
> does not adopt it mid-run.

## Why

Slice 6 stopped twice for reasons that were not about risk.

1. The seen-set check needs a judge helper that carries few tools. A helper gets
   the tools of the session that starts it, so a cheap run needs a session
   started with fewer tools. An agent cannot start one without `claude -p`, which
   the owner has ruled out. The plan did not say this, so the need surfaced
   mid-slice, with no ready-made command.
2. The check's cost was about five times the ceiling on the pack's counting
   method, so the driver stopped and waited for the owner's word, although the
   owner's job there was to read a number and say "measure first" or "go".

Part A removes surprise from the first. Part B changes who has to say yes for
the second.

## Part A: session requests

**Rule.** A stage that needs an environment the driver cannot give itself is
named in the plan, and the driver asks for it once, early, with a ready-made
start.

**In the plan.** Each stage has `Environment: default | lean | fresh-load`.
- `lean`: a session started with MCP servers off (`--strict-mcp-config`), so
  helpers it starts carry few tools.
- `fresh-load`: a session started after new agent definitions exist, because
  agents are read at session start (slice 6's first probe failed for this).

**At plan confirmation** the Orchestrator lists the stages that need a session
you start, so the owner starts them once, in a sensible order, not at a stop.

**The file.** `runs/<slice>/SESSION_REQUEST-<n>.md`, written by the
Orchestrator, with:
1. why the stage needs it, in one sentence;
2. one line to run in the Terminal panel, of the form
   `cd <worktree> && claude --strict-mcp-config "<first message>"`
   (an interactive session with an opening prompt, not `claude -p`);
3. the first message, also written out in full;
4. the file the session must write (the record) and what the driver does when
   it exists;
5. a stop rule: what the session must not do (no approvals, nothing outside the
   named spawns, no fifth gate set), and how many spawns it may run.

**The loop.** The driver writes the file, sets `Status: waiting-on-session`
(not "blocked-on-approval", so the digest says plainly nothing is being asked),
and goes idle. The owner runs the line. The session commits its record. The
driver reads the record as data (never as an approval) and goes on. The support
session watches the record file and says when it lands.

**What stays true.** Attended only: a person starts it and can see it. No
`claude -p`, no API, nothing unattended. The worker session approves nothing.

**Open to verify (cheap):** that `claude --strict-mcp-config "<message>"` opens
an interactive session that takes the message, and how many tools its helpers
are then offered. Slice 6's lean measurement is the first test of both, and its
record should say so.

## Part B: budget bands

**Today (pack v16).** The owner types one ceiling at plan confirmation. Above it,
the driver stops and asks.

**Proposal.** The owner types, once, at plan confirmation:
- the **plan** (as today),
- the **ceiling** (as today: spend above it is a notice, not yet a stop),
- a **hard cap** (spend above it stops and asks, always).

Between the ceiling and the hard cap the driver may continue **after writing a
notice** in the digest ("spent X; over the ceiling by Y; reason; hard cap Z"). It
may not raise the hard cap, and it keeps stopping for everything that is not
the token budget.

**What does not move into a band.** Rules 1 to 6, credentials, lowering a depth
the intent names, push, merge and deploy, a change of scope, and the hard cap.
A band covers one thing: tokens for the same agreed scope. If the scope changes,
the budget is not a budget question.

**Learn the ranges, don't guess them.** Record every slice's plan versus
actual, per stage kind, from `usage.mjs` in one file
(`docs/data/budget-ratios.md`, to be created). So far: slice 4 ran 1.45× its
plan, slice 5 ran 1.2 to 1.3×, and slice 6 is tracking about 1.05× before its
seen-set check, which is the one stage that blew its estimate (by a factor
set by the environment, not the work). Proposal: after three more slices, set
the ceiling at the 75th percentile and the hard cap at the 95th of what was
measured. Until then, the owner types both, using the ratios as a guide.

**Count the right thing.** Fix the unit before setting a band. The pack's gate
counts peak context per spawn; what drains a usage window is cache-weighted
consumption (`usage.mjs` prints both). A band set in one unit and read in the
other would trip on nothing or on everything. The Orchestrator states the unit
next to every figure in the digest.

**Why this is safe enough.** The owner still decides the amounts, once, and
sees every use of the band. The hard cap bounds a runaway. What is removed is
the stop for a raise the owner would approve anyway: in slices 4 to 6 every
answer to a budget stop was "yes" or "measure first".

## Choices that are the owner's

1. Adopt Part A? (Recommended: yes. It adds a plan field and a file, and never
   weakens an approval.)
2. Adopt Part B? (Recommended: yes, but only after the ratios file has the
   three slices, and with the hard cap kept human.)
3. Is a notice enough above the ceiling, or does the owner want a pause of N
   minutes in which to object? (Recommended: a notice; vetoes by exception, as
   with SI-1.)

If the owner says yes to A, the next pack version adds: the `Environment` field
to the plan template and `agentic-slice.md`; the Orchestrator brief and
`SLICE_STATE.md` gain `waiting-on-session`; a `SESSION_REQUEST` template; a
test that the template names a record file and a spawn cap. If yes to B, it adds
the three-figure ask to the plan confirmation and the digest line.
