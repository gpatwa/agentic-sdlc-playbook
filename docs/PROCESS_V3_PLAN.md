# Plan: zero owner touches for routine work, two for high-stakes work (Process v3)

> **Status: proposed 2026-10-20 at the owner's request ("how we can make zero manual
> work?"); the owner decided section 6 the same day. V3.1, V3.2 and V3.4 are built in
> pack v27; V3.3 (the scheduled task and the first standing Charter) and V3.5 (the
> OIDC deploy) are not.** Until a standing Charter is approved in a repo, Process v2
> (`docs/PROCESS_V2_PLAN.md`) is the rule there.

## 1. What still costs the owner time under Process v2

Process v2 cut a run to two typed messages (the Charter, the end review). Measured on
the runs since: the dry run on streak-seed and the landing run on aveto-support each
needed **one** message after the start. What remains, per run:

| Owner step | Why it exists today |
|---|---|
| Start a session and type `/agentic-slice` | nothing starts a run without a person |
| Approve a Charter by its hash | every run is approved on its own, even routine ones |
| Credential steps (`az login`, store a key) | deploys use the owner's own sign-in in the session |
| Read the end review and merge | every pull request waits for the owner |

Each is cheap once. Together they mean the owner is still the scheduler of every run.

## 2. The model: approve a class of work once, not each run

**Two kinds of run:**

- **Routine:** fits a **standing Charter** the owner approved once. It starts on a
  schedule, runs, and lands without asking. **Target: 0 owner touches per run.**
- **High-stakes:** anything a standing Charter does not cover. It runs exactly as
  Process v2 does: one Charter by hash, one end review. **Target: 2 owner touches.**

**What can never be routine** (the six approval rules in
`docs/HUMAN_APPROVAL_RULES.md`): sending on a user's behalf; destructive changes to
shared state; a deploy or release with an external effect; a change to safety
controls; a model in a path that was deterministic; a new data processor or data
commitment. A standing Charter that names any of these is refused by `charter-check`.
This is the line that keeps "agentic engineering you can verify" true.

## 3. The four changes

### 3.1 Standing Charters (the core)

`templates/STANDING_CHARTER_TEMPLATE.md`, approved by its sha256 like any Charter,
naming a **class** of run rather than one run:

- **Scope:** which repos, which intent folder, release tiers 1 and 2 only.
- **Budget per run** (plan, ceiling, hard cap) and **per week** (a hard cap across all
  routine runs; above it, routine runs stop until the owner says otherwise).
- **Models and effort** the class may use (no new model, ever, under a standing Charter).
- **Allowed end actions:** pull request; auto-merge only where §3.4 says.
- **Expiry:** a date (default 30 days) and a maximum number of runs. An expired
  standing Charter covers nothing.
- **Revocation:** deleting or renaming the file stops all routine runs at the next
  stage boundary.

`execution/standing-charter.mjs check` refuses a standing Charter that names any of the six rule
categories, a tier 3 release, an open-ended scope, or no expiry. Before each routine
run, `execution/standing-charter.mjs fits <standing charter> <plan>` proves the plan names nothing
outside the class (no model, processor, invariant, file pattern or end action the
class does not list). **A plan that does not fit is not run;** it is turned into a
normal Process v2 run waiting for the owner, with a notice saying why.

### 3.2 A scheduled start

A **desktop scheduled task** (Claude Code's own feature) wakes on a schedule, picks the
next intent in `intents/ready/` that the owner has confirmed, and runs
`/agentic-slice` under the standing Charter. One run at a time per repo; a run already
in progress means the task exits.

- **Why desktop, not cloud routines:** a desktop task runs on the owner's machine with
  the repo, the pinned models and the owner's own tools, and only while the app is open
  and the machine is awake. Cloud routines run without the machine, but are a research
  preview with daily caps (reported as 5 on Pro, 15 on Max) and would need the repo and
  setup in the cloud. Start with desktop; revisit routines when they leave preview.
- **Terms, read 2026-10-20:** Anthropic's Consumer Terms forbid automated or
  non-human access "except when you are accessing our Services via an Anthropic API
  Key or where we otherwise explicitly permit it". Scheduled tasks and routines are
  Anthropic's own documented features of Claude Code, with usage drawn from the
  subscription like interactive sessions; that reads as explicitly permitted.
  **Unconfirmed:** no Anthropic page found says so in those words. The owner decides
  whether that reading is enough (§6).
- **What the task may not do:** start a high-stakes run, approve anything, or use a
  credential. It only starts runs a standing Charter already covers.

### 3.3 Deploys without a credential step

For a repo that deploys (aveto-support on Azure):

- **One-time owner setup, ever:** an Azure identity for GitHub Actions using OpenID
  Connect federation (no stored password or secret), scoped to one resource group;
  the API key stored once in Azure Key Vault and read by the app's managed identity.
- **After that,** a deploy is a CI job the agent triggers, with no credential in any
  session. **The deploy still needs its own approval line**, because it is rule 3: it
  is never routine. What v3 removes is the credential step, not the approval.

### 3.4 Auto-merge for the lowest risk

Under a standing Charter, a pull request merges itself only when **all** hold: release
tier 1; the review layer's tier is Low; every gate passed; zero open Important
findings; CI green; the standing Charter's C8.4 says `skip`. Anything else waits for
the owner. `END_REVIEW.md` is still written for every run; for a routine run it is a
record to read later, not a gate.

## 4. What the owner gives up, and what replaces it

| Given up | Replaced by |
|---|---|
| Seeing each routine plan before it runs | the class is approved once; `--fits` proves each plan stays inside it; a plan that does not fit waits |
| Approving each routine run | a standing Charter with expiry, run cap, weekly budget and one-file revocation |
| Merging each tier 1 change | auto-merge only under all six conditions in §3.4 |
| Typing credentials per deploy | a one-time OIDC setup; the deploy approval itself stays |

**What does not change:** the six rules; an approval typed in another session never
counts; agents never handle credentials; gates fail closed; every run leaves a record.

## 5. Order of work, bars, and when to stop

| Step | What | Done when | Estimate |
|---|---|---|---|
| V3.1 | Standing Charter template and `standing-charter.mjs check` / `fits` (**built, pack v27**) | tests refuse each forbidden category, a missing expiry and a plan that names anything outside the class | 300k |
| V3.2 | `intents/ready/` convention and the run picker, `pick-intent.mjs` (**built, pack v27**) | a test picks the right intent and refuses a second concurrent run | 150k |
| V3.3 | Desktop scheduled task wiring (setup instructions; the task prompt) | a dry run on streak-seed starts, runs and lands a tier 1 intent with **zero** owner messages | 200k |
| V3.4 | Auto-merge rule in the Release Manager and the protocol (**built, pack v27**; the Orchestrator merges on the Release Manager's recorded yes) | tests: merges only when all six conditions hold | 150k |
| V3.5 | OIDC deploy path for aveto-support (after the current public run lands) | a deploy from CI with no credential in the session, still under its own approval line | 250k |

**Bars, declared now:** over the first **five routine runs**, owner touches = 0 per run,
zero runs outside the standing Charter's class, zero auto-merges that a later owner
review would have rejected. **Over the first two high-stakes runs** after v3, owner
touches stay at 2. If any routine run touches something outside its class, or an
auto-merged change is later reverted for a defect a gate should have caught, routine
runs stop and the cause is fixed before they restart.

## 6. What the owner decided (2026-10-20)

1. **Unattended runs: allowed**, on the reading in §3.2.
2. **First standing Charter: streak-seed, tiers 1 and 2** (30 days, 10 runs recommended).
3. **Auto-merge: tier 1 from the start** (the owner chose this over the recommended
   "wait for five reviewed runs"). The bar in §5 on auto-merges a later review would
   reject is how this choice is watched.
4. **Order: build now; the OIDC deploy after the public ask-the-docs run lands.**

The questions as they were put:

1. **Unattended runs:** accept the reading in §3.2 (scheduled tasks are an
   explicitly permitted use), or wait for a clearer statement from Anthropic.
2. **The first standing Charter:** which repo (recommended: streak-seed first, then
   aveto-support), tiers (recommended: 1 and 2), budget per run and per week, expiry
   (recommended 30 days, 10 runs).
3. **Auto-merge:** on for tier 1 only (recommended), or off until five routine runs
   have been reviewed by hand.
4. **Order:** build V3.1 to V3.4 now (playbook engineering, no run needed) and V3.5
   after the public ask-the-docs run lands.
