# Plan: one approval at the start, then the run finishes on its own (Process v2)

> **Status: proposed by the support session on 2026-10-15 at the owner's request;
> not enforced.** The owner asked for three things: finish slice 7, stop starting
> new slices, and change the process so that the only human approval is agreeing
> the plan at the beginning. This document is the plan for that change. It moves
> what Aveto promises, so the owner confirms it before any of it is built.

## 1. Why the current process costs so much of the owner's time

Measured on the reference app (`docs/LESSONS.md` L35 to L43; slice 7's run folder):

- **Slices take days of wall clock for hours of work.** Slices 1 to 5 took 9 to
  143 hours of elapsed time for 1 to 5 hours of agent work. The rest was waiting
  for a person.
- **Slice 7 so far: 8 approval records, 3 session requests, about 15 pasted
  messages, 5 sessions started by hand (two of them wrong), one metered terminal
  run by mistake**, and a support session relaying and checking every step.
- **The stops have five causes, and only one of them is risk.**
  1. *Approval per action (by design).* Each safety-text change, model, data
     processor, diff to a guarded file and budget raise is its own stop. Almost
     every answer was "yes, as recommended".
  2. *A session cannot start a session.* Agent and skill files load at session
     start, so any stage after such a change needed the owner to open a new
     session in the right folder.
  3. *The method was built and tested inside the gated run.* Permission rules,
     the verdict format and the payload layout were discovered mid-run, and each
     discovery became a stop and a re-registration.
  4. *Two sessions with a person in the middle.* The support session can advise
     but cannot approve or start anything, so every decision went through the
     owner's keyboard twice.
  5. *Budget figures the plan could not know.* Three budget stops in earlier
     slices, two in slice 7.

## 2. The new model: plan-approved autonomy

**One human approval, at the start: the Charter.** The owner reads and approves
one document. After that the run proceeds to a finished result without asking,
and the owner is told what happened. It does not ask permission.

The Charter is a single file, `runs/<slice-id>/CHARTER.md`, that the Orchestrator
drafts and the owner approves in one message. It holds everything that is a stop
today:

| Today's stop | In the Charter instead |
|---|---|
| Intent and plan confirmation | the intent, the stages, success criteria, non-goals |
| Budget and raises | a plan figure, a ceiling, and a hard cap; between ceiling and cap the run continues and notifies |
| Rule 5, a model | the exact model IDs allowed, by role |
| Rule 6, a data processor | the processors allowed and exactly what each may receive |
| Rule 4, safety-control wording | **which** invariants may change and the bounds of the change ("INV-5 may gain a sentence naming what the operator's session sends, as measured"); the final words are checked by an adversarial reviewer of a different model, not by the owner |
| Diffs to guarded files (agent, hooks, settings) | the files the run may change and the direction of change (for example "may only add names to a deny list") |
| Permission rules and prerequisites | the full Prerequisites table, set and dry-run at the start |
| Session starts | none: see section 3 |
| Depth | the depth of each review, which the run may not lower |
| Push, merge, deploy | what the run may do at the end: for example "push the branch and open a PR; never merge, never deploy", or "merge to main if every gate passes" |
| A failed pre-registered check | decided in advance: "close as not releasable and write the close-out" |

**After approval, the run stops only when it would go outside the Charter** (a
new model, processor, file or invariant not named in it; spend above the hard
cap; an irreversible action the Charter does not allow). Everything else,
including a failed gate, has a pre-agreed outcome.

**What the owner gets instead of stops:** a push notification at each stage
boundary with a two-line digest, and the full record in the run folder. The
owner can still interrupt; nothing waits for them.

## 3. Technical changes that remove the manual steps

1. **One session runs the whole slice.** The Orchestrator starts in the slice's
   worktree as an agent-team lead (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).
   Each stage is a teammate: a fresh session whose agent definition is read when
   it spawns. That removes "start a fresh session in the worktree". To be
   tested first (T28); if it fails, the fallback is item 2.
2. **Build the tools before the gated run, not inside it.** A slice that needs a
   new agent, skill, hook or permission has a **setup phase** that writes and
   dry-runs them, and only then does the gated run start. The gated run never
   changes a definition it then has to reload. Slice 7's three re-registrations
   would have been found in setup.
3. **Fixed loops run as scripts.** The 48-question spawn loops move to a script
   (a dynamic workflow, or the existing skill driven by one), so no model
   retypes or forgets a step, and no driver session needs a person.
4. **No support session in the loop.** Its work moves to setup (research, eval
   sets, pack fixes) and to the close-out review. During a run it is not
   needed, so the owner is not a relay between two sessions.
5. **Messages delivered, never held** (`crossSessionInbound: accept`), and a
   push notification at each stage boundary, so the owner sees progress
   without opening anything.

## 4. What the owner gives up, and the safety that replaces it

This removes the per-action human approval that Aveto's site and docs currently
promise ("human approval is a hard stop"). That is a change to the product's
position, and the owner should make it knowingly:

- **The risk moves to the Charter.** A badly written Charter authorises more than
  intended. Mitigation: a Charter template with every field required, a check
  that the Charter names every model, processor, file and invariant the plan
  touches, and a hard cap the run can never raise.
- **Safety text is no longer read by a person before it applies.** Mitigation: a
  different-model adversarial review of every invariant change against the
  Charter's bounds, and the owner reads the changes at the end, before anything
  is merged or announced.
- **Irreversible actions stay off by default.** The Charter template defaults to
  "push the branch, open a PR, never merge, never deploy, never send". The owner
  can widen it, in writing, at the start.
- **The record still shows a human decided.** The Charter approval is recorded
  verbatim, like every approval today, and every action after it cites the
  Charter line that allows it.

The positioning becomes "a human approves a bounded charter; agents act only
within it, and every action is recorded against it." That is close to how
Anthropic's own auto mode treats per-action prompts, which its post says users
accept 93% of the time.

## 5. The order of work

1. **Finish slice 7 under the current rules,** with as few touches as possible
   (SI-3 is in place). Then **pause new slices** on the reference app.
2. **Build Process v2 in the playbook (pack v20):** the Charter template and its
   check; the approval protocol rewritten around the Charter; the setup phase;
   the stage-boundary notice; the slice command and Orchestrator brief changed to
   run as one session; tests for each.
3. **Run the agent-teams test (T28).** If it works, the Orchestrator runs as a
   lead. If not, setup-phase plus scripts still removes most session starts.
4. **Dry-run v20 on a toy repo** (one of the seed repos, not the reference app)
   with a Charter that allows nothing irreversible. Measure: owner touches
   (target: 1), wall clock, and any stop that happened anyway.
5. **Update the site, README and `HUMAN_APPROVAL_RULES.md`** to the new position,
   only after the dry run works.
6. Only then resume slices on the reference app.

## 6. What the owner decides now

1. Adopt this direction (one approval at the start, a Charter, no per-action
   stops)? *Recommended: yes, with irreversible actions off by default.*
2. The default end-of-run action: "push the branch and open a PR" (recommended) or
   "merge to main if every gate passes".
3. Pause new reference-app slices after slice 7 until the v20 dry run works.
   *Recommended: yes.*
