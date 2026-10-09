# Backlog

The prioritised work to fill gaps and improve the framework, synthesised from
six external reviews this session (DoorDash platform, Google's New-SDLC paper,
Monaco, Anthropic's AI-native-org talk, Matt Pocock's engineering skills,
DeepSeek Harness) plus the playbook's own findings.

Ranked by one rule: **does it close a hole we've actually hit, is it cheap, and
does it produce evidence rather than assert?** `VALIDATION_MATRIX.md` records
what is *proven*; this records what is *next*.

## Tier 0 — the one action that unblocks everything

- **T1 · Run the F-1…F-4 security slice on `streak-seed`.** ✅ **Done
  2026-08-22.** `streak-seed/runs/security-hardening/`. Least-privilege bound
  for the first time (Orchestrator rooted in the product repo); first trace@2
  emitted with `operator`/`effort`/`executor` populated; first structured
  `gateCatches` entry (Security caught F-5, a real defect the F-2 fix
  reintroduced); budget overrun recorded honestly (106%, root-caused, not
  authorized). It also found and fixed a real bug in `analyze.mjs` itself
  (per-run totals went `NaN` on the first run mixing traced and untraced
  trace@2 stages). Full writeup: `docs/VALIDATION_MATRIX.md` § "Live-validated
  by streak-seed security-hardening". T2's quality-flag question got a first
  data point (proximity signal on `dom.js`, not a catch) but not a conclusive
  answer — see T2 below.

## Tier 1 — genuine, cheap, close a real hole (after T1)

Most of these need the *data* only a run produces; the **mechanism** for each is
built or buildable now, and populates when T1 runs — the same "field first, data
from the run" pattern as effort / operator / executor / gateCatches.

- **T2 · Decide the quality-metric gate.** `quality.mjs` exists measure-only.
  T1's data point: `dom.js` (the file holding F-5) was flagged "dense" — a
  proximity signal, not a catch. **A second data point (2026-09-06,
  `stash-seed` `saved-item-folders`) contradicts it**: this run's two real
  gate-catches (SEC-1/SEC-2) both lived in `folders.js`, which quality.mjs
  does **not** flag dense (0.229, under the 0.3 threshold); the only file it
  did flag, `src/server.js` (0.309), wasn't touched by the slice and holds no
  known defect. One hit, one miss — density isn't tracking defect location
  consistently across the two runs it's been checked against. **Still
  inconclusive, now with a real disconfirming case, not just an unconfirmed
  one.** Re-evaluate after 2–3 more runs; if the miss rate holds, the honest
  next step is dropping density as a candidate signal, not re-evaluating it
  forever.
- **T3 · Plan-review gate (Monaco).** Gate on the Architecture/plan artefact
  *before* Implementation spends tokens. T1 dropped the Architecture stage
  entirely — no data either way. **Closed the data gap (2026-09-06,
  `stash-seed` `saved-item-folders`)**: Architecture ran in full and found
  real value before Implementation spent a token — a genuine circular-import
  risk in the ownership design, and 2 more `listItems` call sites than the
  Engineering Manager's own count. Both went into the spec, not discovered
  later at higher cost. **But this isn't quite T3's proposal proven**: the
  spec was good, so nothing was actually *rejected* at a gate — Architecture
  ran, Implementation proceeded straight from it, no separate approval
  checkpoint sat between them. What's shown is that running Architecture has
  real value; what's still unshown is that *gating* on it (vs. just running
  it) catches anything a straight handoff wouldn't have. Needs a slice where
  a plan-review step actually sends a spec back before this is fully
  answered.
- **T4 · Branch protection.** ✅ *Done 2026-08-25 for `stash-seed`.* `main`
  now requires a PR + the "Release gates" check passing, enforced for admins
  too (`enforce_admins: true`), force-push and deletion both blocked. Closes
  the literal gap `stash-seed`'s own CI comment named ("a red step blocks the
  merge, once branch protection requires this check"). Verified live via the
  GitHub API, not assumed. Not yet applied to `agentic-sdlc-playbook` itself
  or `streak-seed` (which has no CI workflow yet, so nothing to require).
- **T5 · Capture FDRT.** ✅ *mechanism built 2026-08-25* — `gateCatches[]`
  entries now carry optional `detectedAt`/`resolvedAt` (`SLICE_STATE.md`);
  `analyze.mjs` computes the recovery window per catch, a fleet median, and a
  Recovery column on the Gate catches table, reporting "not captured" rather
  than estimating when a run doesn't have the timestamps. Verified against
  both product repos' real trace data (no regression) and mutation-tested
  (new tests fail without the fix, pass with it). T1's own Security
  re-gate → re-verify window (~22:03Z → ~22:24Z, ~21min) is the first real
  candidate — not yet backfilled into `streak-seed`'s `trace.json`, since
  that repo's run artefacts are left for human review, same as T1.
- **T6 · Gate-catch metric.** ✅ *mechanism built this session, first real
  data 2026-08-22* — `gateCatches` in trace@2 + the analytics "Gate catches"
  section. It is the closest thing to an honest **impact** number (a defect a
  gate stopped before it shipped). T1 populated it structurally for the first
  time (F-5, Security); the three pre-schema runs are still labeled a floor.

## Tier 2 — real, but deferred (bigger, or need run volume)

- **T7 · Map the 24 briefs against the ~18 engineering skills.** ✅ *Done
  2026-08-27, read-only.* Mapped `aihero.dev/skills`' 18 named skills against
  `agents/*.md` by grepping each skill's core concept across all 24 briefs
  (not assumed — checked). Three buckets, not one verdict:
  - **Already covered, often more rigorously:** `to-prd`/`to-spec`/`to-tickets`
    (PM/Architect/EM own these via templates), `handoff` (`AGENT_HANDOFF_TEMPLATE.md`
    + `OPERATING_MODEL.md`'s enforced artefact-handoff rule — stronger than a
    generic skill, since it's tied to durable `STATE.md`), `research`
    (Market Researcher), `review` (this repo's own `/code-review` +
    QA/Security gates). A skills layer here would be pure duplication.
  - **Real gap, already suspected — now confirmed:** TDD / fail-first
    discipline. Zero brief mentions "TDD", "red-green", or "fail-first" —
    despite this session using exactly that discipline repeatedly and
    successfully (T4/T5/T9's own tests). The practice is proven; it just
    isn't written into `frontend-developer.md` / `backend-architect.md` /
    `ai-engineer.md` / `ml-engineer.md`, so it depends on the operator
    remembering rather than the brief requiring it. Confirms T8's candidate.
  - **Genuinely new, not present anywhere in the 24 briefs:** `triage` (a
    named issue state-machine — `STATE.md` has statuses but no triage flow),
    `resolving-merge-conflicts` (by-intent, hunk-by-hunk — unmentioned),
    `prototype` (disposable throwaway-HTML exploration as a distinct step
    before UI Design commits), `wayfinder` (sequential decision-ticket
    planning for genuinely ambiguous large work — EM's scope review assumes
    the slice is already sizeable, not that the *shape* is unknown).

  **Verdict for T8:** narrow and additive, not wholesale. Best candidates in
  priority order: TDD/fail-first (highest — proven practice, just uncodified),
  then triage and merge-conflict-resolution (real gaps, lower stakes to pilot).
- **T8 · Skills pilot.** ✅ *first skill written 2026-08-27* —
  checked `agentskills.io`: not a third-party format to evaluate, it's
  Anthropic's own **Agent Skills** spec ("originally developed by Anthropic,
  released as an open standard"), already natively supported in this Claude
  Code session (the `Skill` tool). Real reciprocal adoption confirmed, not
  assumed — Cursor (`cursor.com/docs/context/skills`), Gemini CLI, GitHub
  Copilot, VS Code, OpenCode, Goose, OpenHands, and Codex
  (`developers.openai.com/codex/skills/`) each document it from **their own**
  docs, 40+ independently-listed integrations. `skills/tdd-fail-first/SKILL.md`
  is written against the real spec and passes the official `skills-ref`
  validator (`npx skills-ref validate`) — not eyeballed. Candidate unchanged
  from T7: TDD/fail-first first; triage and merge-conflict-resolution remain
  queued if this pilot holds up. **Not yet measured**: nothing has invoked
  this skill in a real run yet, so "does it improve consistency" is still
  open — the pilot's actual point, per its own name, isn't done at "the file
  exists." Wholesale conversion stays deferred — this is one skill, piloted,
  not a rewrite of the 24 role briefs into skills.
- **T9 · Declare pipeline topology as data.** ✅ *mechanism built 2026-08-27* —
  `analyze.mjs` declares the 12-stage lifecycle as `always`/`conditional`
  nodes and checks every run's actual stages (`stages[]` + trace@1's
  `notes.orchestratorExecuted`) against it, alias-matched since real stage
  names vary ("QA" / "Security re-gate" / "PRD" for Discovery). New
  "Pipeline completeness" section in `ANALYTICS.md`. Real finding on first
  run against both product repos: **Scope Review is distinctly traced in only
  1 of 6 historical runs** — not a bug in the checker, the declared-vs-actual
  gap the mechanism exists to surface. Mutation-tested (6 new tests, fail
  without the fix, pass with it).
- **T10 · Eval-with-rubrics / trajectory eval (Google).** **Deferred — at 8
  runs it is ceremony, and trajectory data is self-reported.** Revisit at volume.
- **T11 · Cross-slice memory.** Real gap, not urgent at single-operator scale.
- **T12 · Restate the adapter invariants as outcomes, then target ACP.** ✅
  *Done 2026-09-11* — (a) executed in full; (b) assessed against ACP's own
  spec and **dropped**, per the decision rule this ticket pre-committed to
  before the answer was known.
  - **(a) Invariants rewritten as outcomes** — `ADAPTERS.md` "Invariants no
    adapter may weaken" now states 6 items, each checkable from a run's own
    artefacts rather than from which mechanism produced them:
    - **Approval attribution** made explicit in invariant 1 — a durable
      record must be attributable to a *named person*, matching
      `HUMAN_APPROVAL_RULES.md`'s existing bar. Turned out to already be
      real practice, not a gap: `APPROVAL_PROTOCOL.md` step 5 has recorded
      the approver in every run since it was written. The gap was that
      `ADAPTERS.md` never said so was required.
    - **Pre-spawn cost check** is now its own invariant (3), separated out
      from "failure budgets": spend must be checked against budget *before*
      a stage's cost is incurred, with a spawn that would exceed it never
      silently allowed. `hooks/budget-guard.mjs` is named as the Claude Code
      adapter's mechanism for this, not the requirement itself; an adapter
      without hook-level interception satisfies it via a mandatory
      Orchestrator-side check written to `STATE.md`'s Budget block before
      the spawn it gates.
    - **Least-privilege tool scoping** (4) now names two legitimate
      satisfaction tiers — **Enforced** (runtime restricts tools
      mechanically) and **Declared** (the role's brief states its boundary
      and the run records that enforcement wasn't verified) — promoted from
      an undocumented fallback (`install.mjs`'s own comment: *"honor it
      yourself — the boundary is the role's, not the harness's"*) into a
      named, checkable contract. **Checked, not invented:** three real runs
      across both product repos (`stash-seed` `saved-item-folders`,
      `streak-seed` `browser-client` and `security-hardening`) had already
      recorded this on their own initiative as an ad-hoc
      `notes.leastPrivilegeEnforced` / `notes.leastPrivilegeNote` pair,
      exactly the promotion `gateCatches` got from `notes.gatesThatFired`.
      `leastPrivilegeEnforced` / `leastPrivilegeNote` are now top-level
      `trace@2` fields (`SLICE_STATE.md`), and `STATE.md`'s header template
      carries a matching `Least-privilege:` line.
    - **What's now forbidden is silence, not the gap.** A run at the
      Declared tier is a weaker adapter than one at Enforced but is spec-
      compliant, provided it says which tier it got. A run that says
      neither is what actually fails invariant 4 — previously indistinguishable
      from an Enforced run on paper.
    - Verified before landing: 91/91 unit tests unaffected (no test
      referenced this content), zero dangling `.md` references, `npm test`
      re-run clean.
  - **(b) ACP assessed against its own spec — three URLs fetched directly,
    not summarized from search results:**
    | Question | Source | Finding |
    |---|---|---|
    | Can the client abort a tool call before it executes? | [`protocol/v2/tool-calls.md`](https://agentclientprotocol.com/protocol/v2/tool-calls.md) | **No — cooperative only.** The Agent *"MAY request permission... before proceeding"*; nothing requires it to. An ACP-compliant agent that never calls `session/request_permission` is fully spec-compliant while bypassing all client oversight. Unlike a Claude Code `PreToolUse` hook (fires regardless of the agent's cooperation), this is opt-in by the party being overseen. |
    | Can the client restrict which tools a session may use? | [`protocol/v2/session-config-options.md`](https://agentclientprotocol.com/protocol/v2/session-config-options.md), [`rfds/v2/client-filesystem-terminal-capabilities.md`](https://agentclientprotocol.com/rfds/v2/client-filesystem-terminal-capabilities.md) | **No.** Capability advertisement is declarative — the client states what it supports, *"Agents then use those fields to decide"* whether to use it. Not client-enforced. The v2 RFD trends further away from this (proposes *removing* filesystem/terminal methods from the core spec entirely). |
    | Does ACP model one orchestrator spawning many role-scoped agents? | [`protocol/v2/session-setup.md`](https://agentclientprotocol.com/protocol/v2/session-setup.md) | **No — a structural mismatch beyond the two questions above.** *"A session represents a conversation between one client and one agent."* No native multi-agent orchestration concept exists; MCP servers give an agent *tools*, not sub-agents with distinct roles. ACP's shape matches "an editor talks to one coding agent" — closer to how a human talks to Claude Code than to how Claude Code's own Task tool spawns 24 role-scoped subagents underneath. Adopting ACP would mean inventing a mapping (e.g. the Orchestrator becomes an ACP client opening N sessions, one per role) that is a novel architecture, not an adoption of a standard — and the abort/tool-restriction gaps above would apply to each of those N sessions individually. |
  - **Verdict: neither of the two originally-asked questions holds, and a
    third, more basic mismatch showed up besides. Per the decision rule this
    ticket set for itself before checking — "if neither exists, (a) still
    stands on its own merit and (b) is dropped" — (b) is dropped.** Not
    because ACP is a bad standard (its adoption and licensing terms are real
    and unchanged), but because it solves a different problem — bring-your-
    own-agent inside an editor — than the one this adapter contract needs
    solved, which is one runtime spawning many narrowly-scoped role agents
    with client-enforced boundaries. A future ACP integration is plausible
    on its own separate merits (T08's "ride surfaces you did not build"
    idea from the positioning work) but is not a second Aveto *adapter* and
    is not this ticket's concern.
  - **Cost of not doing (a) before this ticket:** the provider-neutral claim
    in `ADAPTERS.md` stayed aspirational with one adapter and no test. It
    is now a precise, checkable contract with one adapter passing it — a
    smaller but real claim, and an honest one.
- **T13 · Put `trace@2` on OpenTelemetry GenAI semantic conventions.**
  ◐ *Raised 2026-09-10; precondition answered and protocol written 2026-09-12;
  **not verified live**.* The point is not tidiness — it is the **standing caveat
  at the bottom of this file**. Telemetry is self-reported today: agents report
  their own `tokens` / `toolCalls` / `retries`, and a self-report has already
  been observed wrong. That is not fixable inside a bespoke schema, because the
  schema is filled in by the party being measured.
  - **The standard:** OpenTelemetry **GenAI semantic conventions** define agent,
    workflow, tool and model spans plus latency and token-usage metrics
    (v1.41 at time of writing — note the spec is still marked *Development*,
    so pin a version and expect churn). Emission comes from the
    instrumentation layer, not from the agent's own narration.
  - **Three wins from one change:** kills the self-report caveat; makes traces
    portable across harnesses (the same problem as T12); and lets existing
    tools — MLflow, Langfuse, Arize Phoenix, LangSmith, Laminar all accept
    OTLP — render our runs without us building a viewer.
  - **Keep `trace@2` as a projection, not a replacement.** `gateCatches`,
    FDRT and `landed` are governance facts with no OTel equivalent. Emit OTel
    spans for telemetry; keep our own record for the things OTel does not model.
    Do **not** rename the `agentic-sdlc/trace@N` schema id — existing runs in
    `stash-seed` and `streak-seed` depend on it.
  - **Precondition answered 2026-09-12 — and the premise was wrong in our
    favour.** The open question was whether *hooks* could emit spans for
    subagent spawns without agent cooperation. They are not needed: **Claude
    Code emits OpenTelemetry natively** — metrics, events, and spans (beta) —
    enabled by environment variables alone. `claude_code.api_request` carries
    `input_tokens`, `output_tokens`, `cost_usd`, `duration_ms`, `model` and
    `effort` per call; `claude_code.tool_result` carries every tool call; and
    `query_source` (`main` / `subagent` / `auxiliary`) is the same split
    `trace@2`'s `executor` records. No agent narrates any of it. **The
    self-report caveat is retirable for telemetry fields.** Written up as
    `execution/pack/protocols/TELEMETRY.md`, with `telemetrySource`
    (`otel` / `self-reported`) added to `trace@2` per run — the same
    two-tier, never-silent pattern as `leastPrivilegeEnforced`.
  - **Three findings that revise the ticket's own claims:**
    1. **"Portable across harnesses" was overstated.** Claude Code emits
       `claude_code.*` names; the GenAI conventions are a separate vocabulary
       (`gen_ai.operation.name`, `invoke_agent`, `execute_tool`) and only
       `gen_ai.request.attempt` appears in its span tree. What OTel actually
       buys is **transport** portability — any OTLP backend ingests it — not
       **semantic** portability. A second adapter emitting proper `gen_ai.*`
       would still need a translation layer.
    2. **"Pin a version" is not executable.** The GenAI conventions moved to
       `open-telemetry/semantic-conventions-genai`, which has **no releases
       and no tags**, and every `gen_ai.*` attribute is still *Development*.
       The churn this ticket predicted has already happened — the spec moved
       repos in the two days since it was raised. Do not adopt its names as
       the schema; map at the reporting edge if ever needed.
    3. **Per-role attribution is lost on metrics.** `agent.name` reports
       built-in agent types verbatim but collapses **user-defined agents to
       `"custom"`** — and all 24 roles here are user-defined. Per-role cost
       needs spans (`subagent_type`, beta) or the `agent_type` hook field.
       Wiring per-role analysis to metrics alone yields one bucket, silently.
  - **Still open:** none of this has been observed live. The protocol is
    written from Claude Code's and OpenTelemetry's own documentation; the first
    run with a collector attached is the actual test, and should be treated as
    such rather than as confirmation. Until then every run stays
    `telemetrySource: self-reported` and the standing caveat holds in full.
  - **The checker exists — `execution/otlp-probe.mjs` (added 2026-09-12).** A
    dependency-free stand-in OTLP endpoint that records what actually arrives
    and reports which documented signals were present. It decodes nothing:
    protobuf stores string values verbatim, so scanning for printable runs
    answers the only question being asked. It **exits non-zero when nothing
    arrives**, because the likeliest failure here is a session started before
    the environment was set — which would otherwise produce an empty report
    that reads like a pass. Blocked only on a restarted session: Claude Code
    reads its environment at process start, so no amount of in-session config
    enables it. Run: `node execution/otlp-probe.mjs --timeout 120`.
  - **Bearing on CC3.2.** `claude_code.api_request` records `model` per call,
    which is a real component of the "prove confidential data did not reach a
    third-party model" evidence the strategy doc flags as the one auditor ask
    this system cannot currently answer. It is not the whole answer — nothing
    classifies the payload — but the gap is narrower than it looked.

- **T14 · Emit the approval record as signed in-toto attestations.**
  ◐ *Raised 2026-09-10 — the most load-bearing of the three; spike done
  2026-09-12 (decided: bind to GitHub, don't sign); the binding half **built
  and tested 2026-09-14** (below). Signing itself remains not started.* Every approval,
  gate verdict and `approvedBy` in `trace.json` is **plain unsigned JSON**. For
  a system whose entire claim is attributable evidence, an auditor's first
  question — *"how do I know this file wasn't edited afterwards?"* — currently
  has no answer. Self-asserted provenance is exactly the weakness we criticise
  in agent self-reported telemetry (T13), one layer up.
  - **The standard:** the **in-toto Attestation Framework** — a signed
    `Statement` about supply-chain execution (including *whether source was
    reviewed*), carried as typed predicates; **SLSA** uses in-toto as its
    delivery medium, and signing is built in.
  - **Why it fits unusually well:** in-toto's **Layout** records *which actors
    are authorized to perform each step*, cryptographically signed by the
    supply-chain owner. That is `HUMAN_APPROVAL_RULES.md` rule 3 and our
    separation-of-duties claim, expressed in a format third-party tooling can
    already verify — rather than a claim a reader has to take on trust.
  - **Scope, if taken:** a custom predicate type for a slice's gate record;
    `approvedBy` becomes a signed attestation rather than a string. Verifiable
    by existing tooling instead of by reading our docs.
  - **Spike done 2026-09-12 — read from in-toto's and Sigstore's own specs, not
    summaries.** Both unverified items are answered, and three constraints
    surfaced that the ticket did not anticipate. Nothing is implemented.
  - **Both open questions resolved, favourably:**
    - **Key management is solved, and better than "sigstore vs. a held key"
      framed it.** Sigstore's Fulcio issues short-lived (10-minute)
      certificates bound to an **OIDC identity** — a Google/GitHub/Microsoft
      login — with no long-lived key for anyone to manage. The signer's
      identity lands *in the certificate*. That makes
      `HUMAN_APPROVAL_RULES.md`'s *"who approved is an identity"*
      cryptographically true rather than a documented convention. It is the
      single best available answer to an auditor's *"how do you know a person
      approved this?"*
    - **No bespoke predicate is needed.** The **Link** predicate
      (`https://in-toto.io/attestation/link/v0.3`) already models exactly one
      step execution per attestation, and the Layout may require **more than
      one signed link per step, by threshold** — which is separation of duties
      expressed in the format's own primitives. Nothing to invent, nothing to
      publish.
  - **The verified mapping.** in-toto **Layout** — a file signed by the project
    owner naming *who is authorized to carry out each step* — is
    `HUMAN_APPROVAL_RULES.md` plus `RELEASE_GATES.md`. A **functionary** is a
    role or a human approver. A **Link** is a stage's completion record, signed
    by whoever performed it. The ticket's "fits unusually well" claim holds up
    against the spec.
  - **Three constraints that shape any implementation:**
    1. **The crux, and it is in-toto's own words.** The spec's non-goals
       recommend *"separating the mechanisms responsible for in-toto metadata
       generation from those executing the steps themselves."* If the agent
       that ran a stage also signs its record, the result is **tamper-evidence
       over a self-report** — the same trust problem relocated, not fixed. Any
       design where the pipeline holds the signing key fails the thing this
       ticket exists to achieve. The human approver must sign, or the signature
       proves only that the file has not changed since the agent wrote it.
    2. **in-toto does not judge a bad layout.** *"in-toto's role is not to
       judge or block layouts that are insecure."* A Layout authorizing an
       agent to approve its own work is valid in-toto and worthless as
       governance. The cryptography is only ever as good as the layout, which
       is a governance artefact we would still own.
    3. **The public transparency log leaks metadata — verified empirically,
       not assumed.** Decoding a live entry from `rekor.sigstore.dev` (no
       authentication required): the artifact appears only as a sha256 hash,
       but the certificate's SAN exposed a **private** repository's name
       (`chainguard-images/images-private`), its workflow path, branch, commit
       SHA and trigger event. For a *human* signer the SAN is their **email
       address**. Signing approvals to the public instance would publish the
       approver's identity and a timeline of every approval — plainly
       disqualifying for the fintech / health-tech / gov-tech buyers the
       strategy doc names. A **private Rekor instance** is supported and is
       the likely answer, but it is infrastructure, not a flag.
  - **Also out of scope, per the spec:** collusion between two functionaries
    (*"we assume there will not be two colluding developers"*), and replay of
    old-but-unexpired layouts, for which in-toto recommends pairing with TUF.
  - **Decided 2026-09-12 — bind to GitHub, don't sign (yet).** The two options
    first offered (private Rekor vs. a held key) were *both wrong, for the same
    reason*. A private Rekor needs a private **Fulcio** alongside it, and a
    certificate authority you run yourself has no independent trust value: the
    auditor's *"how do you know a human approved?"* is answered with *"because
    I operate the CA that says so."* A held key has the identical flaw. Both
    prove only that a file has not changed since **we** signed it — not that a
    person authorized anything.
    - **What actually carries weight is independence, not cryptography.**
      GitHub PR approvals are accepted CC8.1 evidence because GitHub is a
      **third party** attesting that an authenticated user approved at a
      timestamp — not because they are signed. `saved-item-folders` already
      has this: PR #6, merge commit `3e8ede5`, with branch protection
      confirmed blocking until checks passed.
    - **Scope:** record the PR review, actor and merge commit in `approvals[]`
      (`record`), so the run's own claim *points at* evidence someone else can
      verify. Zero infrastructure, no key management.
    - **Public Sigstore stays off the table** on the metadata-leak finding
      above, regardless of this decision.
    - **What signing is still for, later and smaller:** approvals that happen
      *inside* a run and never surface as a git event. That is exactly the
      seam the strategy doc says GRC platforms cannot reach — they collect
      from systems of record, and an in-run approval never reaches one. A
      much narrower target than "sign everything", and worth revisiting once
      there is a second operator or a buyer who asks.
  - **Built and tested 2026-09-14 — `execution/verify-approvals.mjs`.**
    Binding was only half the design: `conformity.mjs` had been displaying
    whatever GitHub URL a record claimed, unchecked — a self-authored link is
    still a self-report, just a more convincing-looking one. This fetches each
    claimed PR from GitHub's own API and reports whether it holds, rather than
    trusting the string.
    - **Run against real data, not just fixtures.** `saved-item-folders`' PR
      #6 is the only run in either product repo whose record names a GitHub
      PR. Checked directly against the live GitHub API before any test was
      written: merged, merge commit `3e8ede5...` confirmed exact, required
      check `Release gates` present with `conclusion: success` — the claim
      holds.
    - **That same check surfaced a finding the design didn't anticipate:
      `merged_by` equals the PR's own author.** Single-operator repo, no
      distinct reviewer — GitHub's merge event corroborates *that a merge
      happened*, not that anyone besides the author looked at it. Reported
      per claim as **self-merged**, not silently passed as equivalent to a
      reviewed merge. This is the expected shape for this repo's actual
      operating pattern, not a defect — but conflating it with a
      distinct-reviewer approval would have been exactly the overclaim T14
      exists to avoid, one level further in.
    - **What it can and cannot prove, stated in the tool's own output, not
      just here:** can verify a PR exists, who merged it, the real merge
      commit, and whether GitHub's required checks ran and passed before
      merge. Cannot verify a human distinct from the author reviewed it —
      that evidence, where it exists, lives in the driving session's own
      `APPROVAL_RECORD`, not in GitHub's review history.
    - **Honest about its own dependency.** `gh` is the one external binary
      this repo's tools rely on. Checked once per run (`gh auth status`), not
      per claim; unavailable or unauthenticated is reported as a **reason**
      per row (`unverified — gh CLI is not installed` vs. `— gh is not
      authenticated`), not silently skipped or conflated with a PR that
      genuinely doesn't check out.
    - **12 tests**, covering the two ways this could fail silently and matter:
      reporting *verified* when GitHub disagrees (a mismatched merge commit
      must show `**MISMATCH**` and fail `--strict`), and reporting *self-merge*
      as a plain pass instead of a flagged one. One test bug caught along the
      way: simulating "`gh` not installed" by omitting it from a fixture
      directory still inherited the real system `PATH`, so the actual `gh` on
      this machine answered instead of proving absence — Node resolves
      `execFileSync`'s command against the *provided* `env.PATH`, not the
      caller's, so the fix was constructing a `PATH` that could reach `node`
      but nothing else, not just omitting a fixture.
    - **`conformity.mjs`'s own disclaimer updated** to stop implying a shown
      GitHub link is checked evidence — it names this tool for the check it
      does not itself perform. 130 tests pass across the pack.
    - **Still not started:** signing. The narrower target identified above —
      an approval that happens inside a run and never surfaces as a git
      event — has no code yet. `verify-approvals.mjs` closes the binding half
      of this ticket; it is not a substitute for the other half.

- **T15 · Write `AGENTS.md`, keep `CLAUDE.md` as a bridge.** ✅ *Done
  2026-09-11* — `execution/pack/AGENTS.md` is now the source of truth: the
  six non-negotiable rules, project-context read order, and the how-to-run
  section, all tool-agnostic. Tool-specific mechanics that genuinely are not
  portable today (subagent dispatch, the pre-spawn budget hook, `.claude/`
  paths, the `/agentic-*` slash commands) were **not** folded into the
  universal rules — they sit in a clearly labeled "Claude Code specifics"
  section inside `AGENTS.md`, so a reader on Cursor or Codex knows exactly
  which parts apply to them and which don't. `execution/pack/CLAUDE.md` is
  now a one-line `@AGENTS.md` import, verified to work via Claude Code's
  own documented import convention (not assumed).
  - `install.mjs` writes both files into the product repo; verified
    end-to-end against a scratch repo — `AGENTS.md` generated with the
    `{{PLAYBOOK_PATH}}` placeholder correctly resolved, `CLAUDE.md` reduced
    to the import line, and every existing CI assertion (`security-
    privacy.md` exists, `MODEL_ROUTING.md` exists, `effort: high` present)
    still holds. 91/91 unit tests unaffected — none referenced `CLAUDE.md`'s
    content directly.
  - `ADAPTERS.md`'s own adapter contract table updated to name `AGENTS.md`,
    not `pack/CLAUDE.md`, as the required run-guide output — the exact
    contradiction this item existed to fix.
  - **What this does not claim:** existing product repos (`stash-seed`,
    `streak-seed`) don't have `AGENTS.md` until they re-run `install.mjs` —
    normal, since regenerating the pack after a playbook change is already
    the documented practice, not a new burden. And this is portability of
    the *run guide*, not of the *mechanism* — T12's invariants-as-outcomes
    question is untouched by this change and still gates any real second
    adapter.

- **T16 · Ship the conformity export.** ✅ *Done 2026-09-12.*
  `execution/conformity.mjs` renders `runs/CONFORMITY.md` — the register an
  auditor is handed, mapped to the SOC 2 criteria that apply to agent-written
  code (CC8.1, CC6.1, evidence sampling, review records, CC3.2). Sibling to
  `analyze.mjs`: same dependency-free house style, same read-from-`trace.json`
  discipline, different question. `analyze.mjs` answers *what did this cost*;
  this answers *who authorized it*.
  - **It found a real hole while being built.** `approvals` did not exist in
    `trace@2` at all — the named-approver claim, which is the centre of the
    entire positioning, lived only in STATE.md prose where no tool could read
    it. Added to the schema; `conformity.mjs` falls back to parsing STATE.md
    for older runs and labels those rows unstructured.
  - **Built deliberately pessimistic.** Missing evidence prints as missing and
    the offending slices are named. An export that silently drops runs it
    cannot evidence is worse than none, because it reads as complete.
    `--strict` exits non-zero when a landed run has no approval evidence.
  - **Real output, both seed repos.** `stash-seed`: CC8.1 covered 3/3 on 4
    named approvals, CC6.1 not covered (0 enforced / 1 declared / 2
    unrecorded). `streak-seed`: CC8.1 covered 4/4, CC6.1 partial 1/4. CC3.2
    reports as not instrumented in both, which is true.
  - **Three defects the tests now pin**, each hit against real data: the
    STATE.md section parser returned empty (splitting a string that begins
    with the delimiter), `**APPROVED**` did not match `/^approved/i` so real
    approvals went uncounted, and `deferred` rows were counted as approvals
    and then flagged for having no approver — inflating coverage and
    inventing a finding from one conflation. 18 tests, 109 in the pack.


- **T17 · Give the agent a credential that cannot approve its own deploy.**
  *Raised 2026-09-13, from a live observation during a real deploy.* The
  `production` environment gate is the product's own thesis applied to itself:
  a named human authorises an external-effect change and GitHub records who and
  when. During the deploy of that day's site work, the API answered
  `current_user_can_approve: true` for the session driving it. The gate held —
  but it held because the agent declined, not because anything stopped it.
  - **The framing "the deploy token can approve itself" is wrong**, and worth
    correcting before anyone acts on it. Three credentials are in play and only
    one is the problem:

    | Credential | Can approve? | Why |
    |---|---|---|
    | `CLOUDFLARE_API_TOKEN` | No | Cloudflare-only; carries no GitHub authority |
    | Workflow `GITHUB_TOKEN` | No | Not a user, so not on the reviewer list; holds only `contents: read` + `deployments: write` |
    | The agent's session `gh` token | **Yes** | A `gho_` OAuth token with `repo` scope acting **as `gpatwa`** — who *is* the required reviewer |

    Narrowing the deploy token fixes nothing, because the deploy token was
    never able to do this. What can approve is the **human credential the agent
    is driving**, which is also the credential it pushes with.
  - **Do not set `prevent_self_review`.** It is the obvious fix and it would
    recreate the deadlock T-fix of 2026-09-13 just removed. The repo has
    exactly one collaborator and one reviewer (`gpatwa`), who is also the only
    pusher; blocking the triggering actor from approving would leave nobody
    able to approve anything, ever.
  - **The actual fix is a second, narrower credential for the agent** — a
    fine-grained PAT with `Contents: write` (enough to push, which is what
    triggers a deploy) and **no** `Deployments` permission. The approve
    endpoint requires *"read access to the repository contents and
    deployments"*, so a token lacking the latter should be refused. Minting it
    needs an authenticated human, the same reason `setup-deploy.sh` takes one
    human-supplied value: an agent must not create its own credentials.
  - **Unverified, and cheap to verify:** that `Deployments: none` actually
    blocks the approve call, rather than the endpoint falling back to the
    user's underlying repo access. Test by minting the PAT, attempting one
    approval with it, and confirming a 403. Do not adopt it as the agent's
    credential until that call has been seen to fail — an assumed boundary is
    worth less than the honest note that there isn't one.
  - **Until then the gate rests on agent restraint, and the record should say
    so.** This is exactly the distinction `docs/ARCHITECTURE.md` draws between
    permission and authorisation, found in our own pipeline: the token was
    permitted to approve, and no one had authorised it to.
  - **Second occurrence, 2026-09-18.** Two site deploys that day, both parked
    at the gate, both answering `current_user_can_approve: true` to the driving
    session, both approved by the human instead. On the second the human said
    "approve it" directly and the agent still declined, on the grounds that it
    had written the change and approving it would make the verifier the
    implementer. **The gate held twice more, and both times for the same
    reason: restraint, not a boundary.** Recorded because a control that has
    now been observed three times to depend on the good behaviour of the thing
    it constrains is not a control yet — and because the *instruction* to
    approve is the sharper test, being the case where restraint has to hold
    against the principal's own words rather than merely against silence.

- **T18 · Run the falsification test: five conversations with regulated
  buyers.** *Raised 2026-09-13.* The strategy doc names one thing that would
  collapse the whole position and nothing here tracked it, so it stayed
  invisible by being the only item that is not engineering work.
  - **The test.** *If regulated buyers accept platform-level SOC 2 attestation
    as sufficient evidence for AI-built software — rather than demanding
    per-change authorisation records — the wedge collapses into a feature of
    someone else's platform.* Everything in Tier 2 assumes the opposite. None
    of it has been checked against a buyer.
  - **The decision rule, fixed before the answers are known** — the same
    pre-registration T12 used to stop the result being reinterpreted after the
    fact. If **4+ of 5** say platform-level attestation has satisfied their
    auditor for agent-assisted change: the position is wrong, and T13/T14 stop
    being load-bearing. If **3+ of 5** report being asked for per-commit
    attribution or named reviewer identity: it holds, and the conformity export
    becomes the lead artefact. Anything between is inconclusive and buys
    another five, not a reinterpretation of these.
  - **Ask the right person.** The buyer is the CISO or compliance owner, not
    the engineering lead — different people, different budgets. An engineering
    lead's enthusiasm is not evidence about this question and should not be
    recorded as though it were.
  - **Ask about the past, not the product.** *"What did your auditor ask for
    last cycle on change management?"* and *"how do you evidence who approved a
    change an agent wrote?"* — questions about what already happened. "Would
    you buy this" produces agreement, not information.
  - **Now cheap, because there is finally something to show.** T16 produces the
    artefact (`runs/CONFORMITY.md`), including its honest CC3.2 blank. Before
    it existed there was nothing to put in front of anyone.
  - **Record disconfirming answers in full**, per this file's own habit (T2
    keeps its miss, T10 refuses to round trajectory data up). A falsification
    test whose failures go unwritten is not a test.
  - **Priority raised 2026-09-20 — see T21.** Anthropic's own AI-native SDLC
    course targets *"engineering, platform, and security leads at large
    enterprises, especially regulated organizations"*: the ICP this project
    moved away from two days earlier. That is a disconfirming signal about the
    repositioning, and this test is what settles it. The ordering is now wrong
    in the costly direction — the decision has been made and the test that
    should have informed it has still not run.

- **T19 · Correct the cost model against measured data — most of it is
  already wrong.** *Raised 2026-09-18.* `MODEL_ROUTING.md` and
  `RUN_ECONOMICS.md` are built on assumptions that have since expired, and a
  direct measurement contradicts the lever this file would have reached for
  first. Numbers below come from **harness-written usage logs**
  (`~/.claude/projects/**/*.jsonl`, 23,442 requests), not from an agent
  reporting on itself — the first cost figures in this project the standing
  caveat below does not apply to.
  - **The stale premise.** `MODEL_ROUTING.md` opens with *"model price
    differences are roughly an order of magnitude per class."* They are not,
    any more: Opus 5 $5/$25 per MTok, Sonnet 5 $2/$10, Haiku 4.5 $1/$5 — a
    **2.5× step, then 2×**, not 10×. The routing *policy* still holds (route
    by cost of a wrong decision); its stated *justification* is now false and
    should be rewritten rather than quietly left.
  - **Caching is finished, not pending.** Measured hit rate **94.6% overall,
    93.8% for this repo** — above the top of the 81–90% band Anthropic
    measured its 2.5–3.7× reduction across. There is no caching win left to
    collect here, which is the opposite of what the published guidance
    predicts for an untuned agent loop. Anything proposing caching as a cost
    lever for this pipeline should be closed on this measurement.
  - **Where the spend actually sits** (this repo, in input-token-equivalents
    at 0.1× read / 1.25× write / 5× output): cache **reads 49.1%**, cache
    **writes 40.5%**, output 10.4%, uncached input **0.04%**. The 40.5% is the
    anomaly worth chasing — a subagent starts a fresh prefix with **no cache
    shared with its parent**, so every stage pays to re-establish context
    cold. Read-per-write ratios across the fleet make it visible:
    `autonomous-assurance` 34×, `career-ops` 23×, **this repo 15×**,
    `system-design` 11.5×.
  - **Dead levers — measured, do not re-propose.** *Context editing*: every
    clearing pass rewrites the cached conversation and fights the cache; in
    Anthropic's measured run it **cost more than it saved**. It is a
    context-window tool, not a savings lever. *1-hour cache TTL*: writes go
    1.25× → 2.0×, roughly **+24% on the total bill**, to chase a miss rate
    that is already 5.4% — a clear loss at our hit rate, though it would be
    correct advice at a lower one. *Semantic caching*: wrong workload shape
    (no two slices repeat, and serving a cached code change would be a
    defect), and `zilliztech/GPTCache` has had no commit since 2025-07.
    *Router-style model routing for cost*: `lm-sys/RouteLLM` dead since
    2024-08, and the price spread it arbitrages has collapsed.
  - **Live levers, in order of this repo's actual bill.** (1) Cut cache
    writes — fewer, larger stages; resume rather than re-spawn; lean briefs,
    since every byte is re-written per subagent. (2) Lower effort: cost grows
    with roughly the **square of turn count**, so fewer, more-consolidated
    tool calls compound. (3) Prompt-audit the briefs — Anthropic measured
    prompts written for an older model costing **36% more for no accuracy
    gain**, and 14% cheaper *and* more accurate once audited; we have already
    documented our own instance of this (`RUN_ECONOMICS.md` §3, the
    "attack/probe" wording that put every `http-layer` stage at adversarial).
    (4) Ignore output at 10.4%.
  - **Batch is not available to us.** 50% off every token including cache
    reads would be the second-largest lever — but it is an API-key feature.
    On a Claude Code subscription it does not exist. Recorded so it is not
    proposed again from a blog post.
  - **The currency is the usage window, not the dollar.** Anthropic split
    interactive and programmatic billing on 2026-06-15 (Agent SDK, `claude -p`,
    GitHub Actions bill at full API rates), but this product is explicitly for
    people on their own subscription, so a budget overrun is not a surprise
    bill — **it is a run that does not finish**. That makes `RUN_ECONOMICS`
    §4 (incremental artefacts) and §6 (stage resume) the core *reliability*
    mechanism rather than cost hygiene, and it means the budget gate should
    stay denominated in tokens. Do not "fix" it to dollars.
  - **Update 2026-09-25 — every per-stage cost this project quoted was peak
    context, not consumption.** `trace.json` took each stage's tokens from
    the spawn result's `totalTokens`, which is the context size of the
    stage's *last* request. Verified on streak-seed `security-hardening`:
    the trace figures match `totalTokens` to the token, and the subagent logs
    show the Implementation stage recorded as 118k made 55 requests and
    processed **4.4M**. `execution/usage.mjs` now measures both from harness
    logs, across the nine slices that still have subagent logs:

    | Slice | Trace said (peak) | Processed | Cost-weighted |
    |---|---:|---:|---:|
    | streak-seed `greenfield` | 947k | 11.6M | 3.7M |
    | streak-seed `http-layer` | 868k | 16.5M | 4.4M |
    | streak-seed `browser-client` | 538k | 25.4M | 4.2M |
    | streak-seed `security-hardening` | 405k | 13.7M | 2.7M |
    | stash-seed `saved-item-folders` | 947k | 13.1M | 3.0M |

    Consequences, in order of how much they matter. (1) **The public site
    understates cost.** The limits section says a slice runs "roughly
    70k–130k tokens" a stage and "a full greenfield build measured 947k" —
    true as peak context, but the build processed 11.6M (3.7M weighted), so
    the one section whose job is not to understate anything does, by 4–12×.
    Not yet changed: it needs a decision on which number to publish. (2) The
    **"~868k" that triggered RUN_ECONOMICS** is the same kind of figure
    (peak-context sum), so the budget gate has always been a control on
    context pressure, not on window consumption; it is still internally
    consistent, and §1 now says which it is. (3) `usage.mjs` also shows the
    generic-agent problem as data: every stage of the playbook-driven slices
    ran as `claude`/`general-purpose`, so least-privilege did not bind for
    any of them. (4) The Orchestrator's own turns are still unmeasured —
    they sit in the main session log, unattributed.
  - **The architecture will never be the cheap option, and that is the
    point.** Multi-agent runs use ~15× the tokens of a chat turn (Anthropic's
    own production measurement; token usage explained 80% of their
    performance variance), and the orchestrator-with-workers pattern only pays
    when work exceeds a context window — *"when the work is one dependent
    chain… the coordinator's model alone at lower effort came out ahead, in
    every such case measured."* A slice is a dependent chain. So the role
    separation is a **quality purchase, not a cost optimisation**. State the
    premium honestly rather than trying to engineer it away; it is what buys
    the independence the product sells.

- **T20 · Plan a run against capacity it can actually see.** *Raised
  2026-09-18.* Today the budget gate costs each stage against a **declared**
  budget (`RUN_ECONOMICS.md` §2) and checks before spawning. It has no idea
  how much of the subscription window is actually left. That gap is why the
  site's copy says "each stage costed against a budget" and deliberately does
  **not** say the pipeline identifies remaining capacity — claiming that today
  would be exactly the overclaim the limits section exists to prevent.
  - **The feature.** Read remaining capacity before planning, then size the
    plan to fit: fewer stages, lower depth, or an explicit "this will not
    finish in the current window — start now and resume after reset, or cut
    scope" put to the human *before* the first token is spent, rather than
    discovering it at 80%.
  - **The mechanism probably already exists locally.** Claude Code writes
    per-request usage to `~/.claude/projects/**/*.jsonl`; `ccusage` (18.6k
    stars) reads exactly these files across 18 agent CLIs. Consumption within
    the rolling window is therefore derivable on disk without any API. Confirm
    that before designing anything — this is a precondition, not an
    assumption.
  - **Why it is worth more than the cost levers above.** Every agentic tool
    assumes unlimited API access; the actual population lives inside a rolling
    5-hour window and a weekly cap. Nobody builds for it. Combined with §4 and
    §6, this is the difference between "long runs sometimes die" and "long
    runs finish," which is the reliability claim the hero now makes.
  - **Do not confuse this with multi-account rotation.** That was raised and
    rejected the same day — Anthropic introduced these caps specifically to
    stop account sharing and resold access, so rotation is the targeted
    behaviour, not a grey area, and a system of record for accountable
    development cannot ship a circumvention feature. See the parked entry
    below.

- **T21 · Close the gaps Anthropic's own AI-native SDLC course exposes — and
  reconsider two decisions it contradicts.** *Raised 2026-09-20.* Anthropic
  published **"The AI-Native SDLC Playbook"**
  (`academy.claude.com/courses/ai-native-sdlc-playbook`): 14 lessons, ~1 hour,
  six stages (Plan → Design → Build → Test → Deploy → Maintain), covering
  `intent.md`, `CLAUDE.md`, skills, subagents, PR review loops, **hooks as
  approval gates**, continuous evals in CI, and post-launch metrics. Its stated
  problem framing is this project's "why now" almost verbatim — *"why planning,
  review, testing, and deployment become bottlenecks when agents handle code
  writing"* — and one objective is *"governance enforcement through approval
  gates and control feedback loops."*
  - **Provenance, so the next reader can weigh it.** This was read from the
    public course page: module titles, objectives, audience, prerequisites. The
    course itself was **not taken**, so per-lesson depth is unknown. Treat
    "they cover X" as "X is a named lesson", not as a claim about how far it
    goes. Re-check before acting on any comparison below that depends on depth.
  - **The validation is the headline.** The model vendor now teaches this
    category. That retires any lingering question about whether the problem is
    real, and it makes the *practice* layer free — which pushes all defensible
    value to enforcement and evidence, where this project is deep and a
    one-hour course cannot go.
  - **Gap 1 — `intent.md`, and it is the one that matters.** Zero occurrences
    in this repo (checked). They capture requirements and constraints in **one
    file, one session**. Our entry path is ask → discovery brief → scoped work
    item → PRD → feature spec → UX spec → tech spec: **six artefacts before
    code.** For the regulated-enterprise reader that was rigour. For the solo
    builder the site now addresses it is a wall, so this is a contradiction
    with **our own repositioning**, not merely with their course. The work is a
    single canonical entry artefact that the EM can expand into the full chain
    only when the slice's stakes justify it — the depth-tier idea from
    `RUN_ECONOMICS.md` §3 applied to the *design* stages rather than to review.
    ✅ **Built 2026-09-24.** `templates/INTENT_TEMPLATE.md`, stored as
    `runs/<slice-id>/intent.md`; `/agentic-slice` accepts a one-liner or a
    path. The short path skips Market Research, Discovery and UX Research
    when the intent is complete and no Stakes box is ticked beyond "adds a
    UI" — agent-written design artefacts before code go from six to two
    (EM scope, tech spec). **Stakes override completeness**, and **gates
    never compress**. Two things surfaced while building it that were worth
    more than the gap itself: QA's evidence template had **no
    acceptance-criteria section at all** — it checked that a slice worked
    and was safe, never that it was what had been asked — and now verifies
    each "Done means" line verbatim, with not-verifiable never rounded to a
    pass; and a drafted intent marks its guesses **(inferred)**, dropped
    unless the human confirms them. **Not yet shown:** that the short path
    holds on a real slice. It is a rule in the briefs, not an observed run —
    the next seed slice should take it deliberately and record whether QA's
    verbatim check caught anything the full chain would have.
  - **Gap 2 — plan mode.** Zero occurrences (checked). They teach Claude Code's
    native plan mode as the default start of Build. We may be hand-rolling
    planning the harness supplies free. Cheap to check, and the answer is
    either "adopt it" or a recorded reason not to.
    **Checked 2026-09-25 — not adopted, for two verified reasons.** (1) It is
    ignored for our users: *"When the main conversation is in
    `bypassPermissions`, `acceptEdits`, or auto mode, the subagent runs in
    that same mode and Claude Code ignores the `permissionMode` you set"*
    (sub-agents docs, verbatim), and Pro/Max/Team sessions start in auto
    mode — exactly the subscribers this project now targets. Setting
    `permissionMode: plan` on the Architect would be declared, never
    enforced. (2) Where it does apply it denies Write outright, so the
    Architect could not write its own tech spec; plan mode keeps the plan in
    an approval prompt, and this pipeline hands off through files.
    **What checking exposed was worth more than the gap.** Twenty of the 28
    roles — Architect, PM, EM, Release Manager among them — got
    `Read, Write, Edit, Grep, Glob`; withholding Bash was their only
    boundary, so an Architect could edit `src/` with nothing but its brief
    to stop it. ✅ **Built:** `execution/hooks/write-scope-guard.mjs`, a
    PreToolUse hook in each of those 20 agents' frontmatter, scoping writes
    to `runs/` plus the files a role is named as owning. Fails closed; role
    taken from argv, never the payload; symlinks resolved. Mutation-tested —
    and one mutation initially failed no test at all, which is recorded in
    the commit rather than smoothed over. Pack v5.
    **Not yet shown, and the next thing to check:** that the deny holds in a
    *live* session in auto mode. The hooks docs do not say either way, and
    auto mode already overrides one subagent setting. Test: from a product
    repo, `/agentic-slice` with the pack installed, ask the Architect to
    write `src/x.js`, and confirm the edit is blocked. Until then this is the
    T17 situation in a new place — a boundary expected, not watched to hold.
    Plan mode still has a legitimate *optional* role as a human-side way to
    start a session, not as an enforcement mechanism.
    **Two ownership gaps the guard surfaced (2026-09-26), found while
    preparing aveto-support's first slice.** (1) On a greenfield repo taking
    the short path, `.agentic/PROJECT_CONTEXT.md` has no writer: the roles that
    own it (Market Researcher, PM) are exactly the ones the short path skips.
    Resolved there by the owner writing it directly; the pack should say so —
    a greenfield short path needs the human, or a PM stage, to own the project
    context. (2) `.agentic/CURRENT_MVP_STATUS.md` has no named owner at all;
    under the guard only engineers and the unguarded Orchestrator can write it,
    so it stays a stub. Candidate owner: the Release Manager or Post-Launch,
    since the stub says "replace as the slice lands". Not fixed yet — recorded
    so the next slice does not rediscover it.
  - **Not gaps, checked rather than assumed.** *Skills*: **we are ahead** —
    T8 shipped `skills/tdd-fail-first/SKILL.md` on 2026-08-27, validated
    against the official `skills-ref` validator; they teach the concept, we
    have one that passes the spec's own checker. *Eval-gated merge*: exists at
    `RELEASE_GATES.md` §158, though scoped to AI slices where theirs is a
    general stage — worth widening, not building. *Hooks*: we use a
    `PreToolUse` hook for **budget**; they use hooks for **approval**. Ours is
    the enforced one, since our approval gate is the environment + named-human
    record rather than a hook. Different application, not a missing feature.
  - **Where we are ahead, for the comparison table this deserves:** 28 named
    role briefs against generic "subagents"; verifier ≠ implementer as an
    enforced invariant against "layered review"; a recorded, attributable
    approval against a gate mechanism; refusal at intake; standards mapping
    (ISO 42005, NIST AI RMF, OWASP agentic Top 10, DORA 2025); and a Maintain
    stage that is five roles rather than one lesson on metrics. **Their course
    contains nothing on cost or run economics at all** — which T19 has just
    shown is a first-order problem, not a footnote.
  - **It contradicts the repositioning, and T18 is the tiebreak.** Their stated
    audience is *"engineering, platform, and security leads at large
    enterprises, especially regulated organizations"* — precisely the ICP this
    project moved **away from** on 2026-09-18 in favour of "anyone shipping
    without a safety net". Anthropic has vastly more market data than we do and
    bet the course on the regulated enterprise. That is not proof we are wrong;
    it is the strongest disconfirming signal the repositioning has met, and it
    is exactly the question **T18** was written to settle. **Raise T18's
    priority accordingly** — it is now the item gating a decision already made,
    which is the worst order to leave it in.
  - **Reconsider the vocabulary ban.** `aveto-rebrand-positioning` bans *SDLC*
    and *playbook* from customer-facing copy. Anthropic has now named the
    category **"The AI-Native SDLC Playbook"**, using both — and this repo is
    literally `agentic-sdlc-playbook`. The ban was correct when the words were
    generic; they are now the vendor-blessed label the audience will search
    after finishing a free course. A product that never says "SDLC" is
    invisible to the exact people being trained to want it. The revision is
    probably "do not *lead* with it" rather than "never use it" — but it should
    be a decision, not an inherited rule.
  - **The distribution play this opens.** A one-hour course creates demand it
    cannot satisfy: people finish it wanting the thing built. Map the 28 roles
    onto their six stages, name the course, and be the obvious next click —
    *"you took the course; this is the implementation."* That uses Anthropic's
    funnel rather than competing with it, and it is the cheapest distribution
    available to a project with no audience of its own.

- **T22 · Build a credible reference app: an AI agent, built by Aveto, in
  public. PRIORITY — ahead of T23.** *Raised 2026-09-26.* Neither seed app is a
  reference a sceptic would accept. Checked, not assumed: Stash is ~670 lines
  and StreakKeeper ~1,090, both dependency-free Node with in-memory storage, no
  real sign-in, no real model call, nothing deployed live, 0 stars. They are
  honest *test benches* — the pipeline ran end to end, gates caught real
  defects, approvals fired — but they cannot answer the buyer's actual question,
  *would this hold on software like mine?*, and a 700-line in-memory service
  undercuts "Ship like FAANG" faster than having no demo would.
  - **Why an agent first.** It closes the item the site's own limits section
    lists as unproven — *a real model wired into a shipped feature* — and it is
    the first real use of `project-packs/ai-agent-product.md`, the AI Engineer
    and AI Governance roles, and eval-gated merge, all of which exist in the
    briefs and have barely run. It also matches what the market is building now,
    which a bookmarks app does not. This is Aveto *building* an agent product —
    codegen through the normal lifecycle — not a runtime agent that designs
    agents, which T19 records as the pattern that does not pay.
  - **Done means** (the bar for "credible", stated before starting so it cannot
    drift): a normal stack — TypeScript, a real database, real sign-in, a web
    UI; **deployed at a public URL**; at least one **real model call in a
    shipped feature**, behind the pack's adapter, deterministic-first; an eval
    suite as a required merge check, including unhappy paths; **built in
    public** with `runs/` committed so every intent, spec, QA check, security
    finding and approval is readable; and `usage.mjs` numbers published for
    every slice.
  - **Which agent is the human's decision, and the first step.** Candidates that
    exercise what Aveto is for, not just what it can do: (a) a **support-reply
    agent** that answers from a knowledge base and **drafts, never sends** —
    the most common real business agent, and it fires approval rule 1 by
    design; (b) an **issue/PR triage agent** run on this repo — real data,
    visibly useful, and it dogfoods the project; (c) something from a domain a
    T18 interviewee names. Recommended: (a), because a buyer recognises it
    instantly and it forces the grounding and never-invent-claims invariants.
    **Revised 2026-09-26: (a), pointed at Aveto itself.** A generic support
    agent has no real traffic on day one — without real customers or a real
    helpdesk it is a demo — and it lands in the most crowded agent category
    (Intercom Fin, Zendesk AI, Decagon, Sierra), where a small reference app
    reads as thin. So: a support agent that answers questions **about Aveto**,
    grounded in **this repo's own docs**, drafting replies to real **GitHub
    issues and Discussions**, posted only after a human approves. The use case
    stays recognisable; the knowledge base is real from the first slice;
    anyone can check a draft against the docs it cites; and it serves the
    audience the site and T18 are trying to reach. **Honest limit:** the repos
    have 0 stars, so real question *volume* starts near zero and grows only
    with the site's audience. If production-scale traffic from day one matters
    more than serving the business, (b) triage on active public repos is the
    stronger pick.
  - **Decided 2026-09-26 by the human:** build **(a) the Aveto support agent**;
    runtime model calls on **the owner's own API key at low volume**, with a
    hard monthly spend cap and a rate limit set before the key is used; deploy
    to **Azure through the Cloud Deployment role**, which also exercises
    Production Verification for real and closes "real-cloud deploy" on the
    site's limits list. Consequences to carry into the first slices: an Azure
    subscription is required, and its cost is part of the experiment; the API
    key and the Azure credential are supplied by the human and never handled
    by an agent (`HUMAN_APPROVAL_RULES.md`, same reason `setup-deploy.sh` takes
    its one token from a person); and wiring the real model is Tier 3 plus
    approval rule 5, so the deterministic path ships first behind the adapter.
  - **Runtime design: a workflow with two model roles, not a swarm.** Aveto
    builds it with the full multi-agent pipeline; the *shipped* agent should not
    be multi-agent, and the reason is this file's own evidence (T19):
    multi-agent runs cost ~15× a single call, and an orchestrator only pays when
    work exceeds one context window or splits into independent pieces. One
    support answer is one dependent chain in one context — the shape where a
    single model at lower effort won in every case Anthropic measured — and
    every runtime call is metered. The design:
    1. **Classify** the question — deterministic first (rules, labels), a model
       only for what rules cannot place.
    2. **Retrieve** the relevant docs — deterministic.
    3. **Draft** a reply grounded in what was retrieved — **model role 1**.
    4. **Check** the draft against its sources — **model role 2: a separate,
       cheaper model that did not write the draft.** Every claim must trace to a
       retrieved passage; anything unsupported is removed or the question is
       escalated. Never "fixed" by the checker inventing a better answer.
    5. **A human approves** before anything is posted (approval rule 1).
    Step 4 is the point of the whole app: it is *the agent that verifies never
    wrote it* running **inside the product**, not only in how the product was
    built — a stronger demonstration than any number of agents, and cheap if
    the checker is a small model. Audit events record `generationMode` and
    which model drafted and which checked, per the pack's invariants. Adding a
    third model role later requires the same argument this one had to make.
  - **Goal restated by the human, 2026-09-26: a production-ready template
    other people deploy, not only a reference that proves the pipeline.** That
    is a higher bar, and it changed four things:
    1. **Configurable, not Aveto-only.** Adopters point it at *their* docs and
       *their* repos; Aveto is the first deployment, not the only one.
    2. **Genuinely agentic, but bounded.** Step 3 becomes a **tool-using loop**
       — the drafting model decides whether to search the docs again, read the
       full issue thread, or look up related issues — under a hard cap on turns
       and on spend. The independent checker (step 4) and human approval
       (step 5) are unchanged. A model choosing tools inside limits is how
       production agents are built; a swarm is not.
    3. **Stack: Python + FastAPI, calling Anthropic's SDK directly — no agent
       framework.** Chosen over TypeScript because the audience for a template
       is AI-agent developers, most of whom work in Python; Azure's own AI
       samples are mostly Python; and eval tooling (RAGAS and similar) is
       native there, which matters once evals are part of what is being sold.
       No framework because a five-step, deterministic-first workflow is less
       code and easier to audit against the SDK, and frameworks hide the
       adapter boundary the pack requires. Cost accepted: a rich UI would mean
       a second language, so the admin surface stays server-rendered. The
       Architect records this as the first ADR.
    4. **Production-ready is a checklist, not a claim.** In addition to the
       bar above, the repo must contain, and the release gate must check:
       - **One-command deploy** — an `azd` template (`azure.yaml` + `infra/`),
         with separate dev and prod environments.
       - **Secrets in Key Vault**, never in environment files; a **spend cap
         and rate limit** on model use set before the key is first used.
       - **Sign-in** for the admin surface, and a **GitHub App** — not a
         personal token — for reading issues and posting approved replies.
       - **Observability**: logs, traces and cost per request, via the
         existing OpenTelemetry work.
       - **Evals as a required merge check**, with the eval report committed.
       - **A rehearsed rollback** and **runbooks** in `docs/runbooks/`.
       - **A threat model covering prompt injection from issue text** —
         issue bodies are untrusted input to a model that can call tools —
         and a public `SECURITY.md`.
       - **Docs for someone who was not there**: `docs/ARCHITECTURE.md` and
         ADRs (Architect), a 30-minute deploy guide and a configuration guide
         (Tech Writer), a cost guide stating what a month of running it costs,
         `.env.example`, `CHANGELOG.md`, `LICENSE`.
       Pack v6 gives every one of the doc items an owning role, so they are
       produced by the pipeline slice by slice rather than written up after.
  - **Decisions to settle before the first slice.** Runtime model cost: building
    runs on the subscription, but a *shipped* agent calls a model at run time,
    and that is metered — keep demo volume small, or require the visitor's own
    key. Deploy target: the Cloud Deployment role wraps Azure, and using it
    would also close "real-cloud deploy" from the limits section, at the cost
    of an Azure subscription; a cheaper host proves less.
  - **Folds in two open checks.** Its first slice runs the Architect under pack
    v5, so it is the natural place for T21's **live write-scope-guard test**
    (have the Architect try to write `src/`, confirm the deny in auto mode).
    Wiring the real model is Tier 3 and fires **approval rule 5** — the first
    time that gate runs for real.
  - **Honest cost.** Several slices, each a meaningful share of a usage window,
    plus the human's time at every gate. Weeks, not a day.
  - **First slice, `docs-retrieval` (2026-09-27 → 29): gate failed, nothing
    shipped — the eval did its job.** Record: `gpatwa/aveto-support`,
    `runs/docs-retrieval/` (close-out `08-close-out.md`).
    - **Two methods stopped before shipping.** Keyword retrieval (BM25):
      2/24 against a bar of 20, ungated recall@5 14/24. A local embedding model
      (bge-small, ONNX) fused with BM25, frozen before a fresh held-out set was
      written: 5/17 on that set, ungated 8/17 — against 17/24 on the questions
      the design had seen. A reference comparison ruled out an embedding bug.
      Both methods failed the same way: a similarity threshold cannot separate
      answerable from unanswerable questions on this corpus.
    - **What made the result trustworthy** is the part worth showing: an eval
      set written before the code, then — once it had been seen — a held-out set
      committed after the method was frozen and run once. Without the held-out
      set the slice would have reported 71%.
    - **Cost, measured** (`usage.mjs`): 854k by the budget's unit (peak context)
      against **30.9M tokens processed**, 93% cache reads, most of it from
      resuming the same agents. Budgets in peak context understate what a slice
      takes from a usage window — evidence for T20.
    - **Pack defects the run surfaced, all fixed upstream** (v7 → v10): the
      budget guard read `runs/` from cwd and ignored the next stage's estimate;
      it went silent when a role rewrote STATE.md's format; the playbook path
      broke in a worktree; the Trace's model was filled from memory (an Opus
      stage recorded as Sonnet); `usage.mjs` missed worktree logs and resumed
      stages' peak context.
    - **Carried to the next slice, as the owner's decisions:** corpus scope
      (exclude internal docs), file-level ranking, and whether "no confident
      match" belongs in the check step rather than retrieval (a gate change,
      rule 4). Any further method needs a third fresh held-out set.
    - **Still open from this item:** the live write-scope-guard test in auto
      mode (T21) — not yet confirmed from this run's logs.
  - **Second slice, `docs-retrieval-2` + `-proof` (2026-09-29 → 30): gate
    failed again, but the method improved.** File-level hybrid ranking over an
    explicit user-docs corpus (123 files), no confidence cutoff (abstention
    moved to a future check step, a rule 4 decision made in advance):
    **11/16** on a third held-out set against a bar of 13; 12/17 on the second
    set and 19/24 on the seen dev set as diagnostics. About 47% → about 70% on
    unseen questions. Close-out: `runs/docs-retrieval-2-proof/02-close-out.md`.
    - **Labelling lesson.** At least one miss (t13) returned the file that
      owns the labelled template: a defensible answer the drafter's label
      didn't list. Not relabelled — that would be tuning a seen gate. Now in
      the pack: someone other than the drafter reviews labels before the
      gate set is committed (`project-packs/ai-agent-product.md`, "Held-out gates", v12).
    - **Cheaper, by method.** One fresh spawn per stage, not resumed agents:
      6.7M tokens processed across both halves, against slice 1's 30.9M.
    - **Pack defect found live:** in a worktree, hooks could get the main
      checkout as `CLAUDE_PROJECT_DIR`; the write guard falsely denied an
      in-scope write, and the budget guard went blind. Fixed in v11. It is
      also the first live evidence of the write guard acting at all.
    - **Carried forward:** a reranker slice with a fourth held-out set; a
      check-step slice that **owns abstention** (it has no slice today — a
      safety requirement resting on nothing planned); CI still blocked on a
      passing gate. `main` now holds the code (PR #1); its README says the
      gate has not been passed.
  - **Third slice, `docs-retrieval-3` + `-proof` (2026-09-30 → 10-01): the
    gate passed — by exactly the minimum — and the added component earned
    nothing.** A local cross-encoder reranker (`ms-marco-MiniLM-L6-v2`, ONNX,
    approved under rules 4 and 5 with exact revision and hashes) over
    slice 2's method, scored once on a fourth held-out set whose labels a fresh
    QA spawn reviewed: **13/16 against a bar of 13**. Slice 2's method alone
    got 14/16 on the same set. Across four sets the reranker was +2, 0, −1 and
    −5 (net −4 hits), at 2.3–3.8 s a question against 0.9 s, plus 91 MB and an
    open MS MARCO licence question. Closed as "gate met, no demonstrated
    gain; nothing ships". Close-out: `runs/docs-retrieval-3-proof/03-close-out.md`.
    - **What it proves about the process.** A gate can be met without the
      change earning its cost; the comparison to the first stage, reported as
      a diagnostic in the same run, is what exposed it. Passing at the bar is
      "meets", not "solved". Keep that comparison in every eval-gated slice.
    - **Labels, again.** The label review (a fresh spawn, sees only the
      questions and the docs) was worth it — it added 40 files to 13 questions
      — and also showed its own failure mode: under "a file that alone could
      answer it" one overview doc counted for 12 of 16 questions, which would
      have made the gate passable without finding the specific doc. The owner
      sharpened the labels before scoring ("files whose subject is the
      question"); the pack rule should say so (follow-up below).
    - **Cost, measured:** 8.1M tokens processed across both halves (slice 2:
      6.7M; slice 1: 30.9M), one fresh spawn per stage throughout.
    - **Open defect:** the gate run aborted at teardown (exit 134, ONNX
      runtime mutex) after printing its full report. Harmless to the score,
      fatal to any CI step. Fix before `docs-retrieval-ci`.
    - **Carried forward, as the owner's direction:** a small slice 4 — make
      `file-rrf-v1` the default and the reranker optional and off by default,
      fix the teardown crash, then Security and the Release Gate once on that
      smaller change; the check-step slice that owns abstention (nothing that
      writes text ships before it); `docs-retrieval-ci`. Pack follow-up:
      tighten the label rule to "files whose subject is the question".
  - **Fourth slice, `docs-retrieval-4` (2026-10-03 → 10-08): the simple method
    became the default, and the slice's own crash claim did not survive
    measurement.** `file-rrf-v1` is now the default ranking; the reranker is
    opt-in (`ingest --with-reranker`), so the default path fetches and loads
    nothing of it. Security Review failed once on a real over-claim (an ADR
    saying exit codes were "no longer at the mercy of teardown order"), passed
    after the fix; the Release Gate re-ran the default once on the fourth set
    (14/16, same misses as recorded) and gave **"internally releasable, not
    announced"**, tier 2, with no quality claim. Close-out:
    `runs/docs-retrieval-4/07-close-out.md`.
    - **The crash is NOT REPRODUCED, and the intent's "fixed or explained" is
      not met.** 0 exit-134s in 660 runs (220 unfixed, 440 fixed) after one in
      eight in slice 3. The Architect's mechanism was observed false on the
      unfixed code, so the added `close()` discipline is hygiene with no
      demonstrated effect. Recorded that way everywhere; `docs-retrieval-ci`
      still fails any exit 134 with no retry wrapper.
    - **Lesson for the pack:** baseline a defect on the unfixed code before a
      spec argues a cause. The cheap unfixed loop, suggested from this session,
      is what caught it. Related: a status line claimed "releasable" before
      any gate ran and was corrected.
    - **Cost, measured (`usage.mjs`):** 9.7M tokens processed, 581k peak
      context across 10 stages, against a 400k plan. The owner raised the
      budget three times (520k, 560k, 585k). Review-archetype stages ran 3–4×
      their estimates (Security 129k vs 70k, Release Manager 59k vs 15k);
      estimate them at 50–60k or give them a tight read list.
    - **Carried forward:** the check-step slice (abstention and the release
      claim); `docs-retrieval-ci`; advisories A1, A2, A3, A5 (INV-5 names no
      default-path offline test; one test overstates what it proves; a cosmetic
      hash-mismatch message; hard-coded paths in the crash scripts). The MS
      MARCO licence question stays open for anyone who opts in.
  - **Evidence checklist — "Aveto builds production-grade agentic systems".**
    *Added 2026-10-02.* The app checklist above (#4) says what the *app* must
    contain; this one says what must be *shown* before Aveto may claim it can
    build one. Tick an item only with a link to the evidence, and never on the
    strength of a plan. Until the second block is ticked, the claim to make is:
    *"an AI-native SDLC that has caught real defects and failed bad components
    honestly, validated on seed apps; its reference app is mid-build and has not
    released."*
    - **Shown** (evidence in the repos):
      - [x] Gates stop a bad slice: Security blocked a real defect
            (`streak-seed` `runs/http-layer/`); eval gates failed three
            retrieval methods (`aveto-support` `runs/docs-retrieval*/`).
      - [x] Human approvals are enforced and recorded in the owner's own words
            (`APPROVAL_RECORD-*.md`, slices 1–3).
      - [x] A held-out gate catches overfitting: 71–79% on seen questions
            against 47–70% on new ones.
      - [x] Cost is measured from the harness logs, not recalled
            (`usage.mjs`: 30.9M, 6.7M, 8.1M and 9.7M tokens processed).
      - [x] Defects found in live runs are fixed upstream, with tests that
            fail without the fix (pack v7 → v14).
    - **Not yet shown** (each is a slice or a run, not a decision):
      - [ ] A reference-app slice passes its Release Gate *with a release
            claim*. Slice 4 passed one as "internally releasable, not
            announced" (tier 2, no quality claim); none has released.
      - [ ] The check step is built and gated, in two halves. **Abstention**
            ("the docs don't answer this"): intent committed 2026-10-08
            (`aveto-support` `intents/docs-abstention.md`), slice not started.
            **INV-3, the draft checker** (a draft is checked against its
            sources by a different model from the one that wrote it): cannot
            be built or gated with no drafter, so it belongs to the drafting
            slice, which must pass its own gate before anything reaches a
            user. Nothing that writes text for a user ships before both.
      - [ ] A real model in a shipped feature, behind the rule 5 and 6
            approvals, with a spend cap set first.
      - [ ] A drafting step that never sends: a person approves every reply.
            *This proves the assistant half only; the action-taking half is
            the block below.*
      - [ ] CI blocks a bad merge on the reference app (needs the exit-134
            fix first).
      - [ ] A real-cloud deploy through the Cloud Deployment role, with the
            owner's approval, and a rehearsed rollback.
      - [ ] Observability in production: logs, traces and cost per request.
      - [ ] The write-scope guard *denies* a real out-of-scope write in auto
            mode (T21). So far it has only been seen allowing, and once
            wrongly denying.
      - [ ] Real use: several weeks on real GitHub issues, with the T24
            after-launch numbers (drafts sent unedited, edit size, escalation).
      - [ ] A human expert, not Claude, reviews a slice's threat model and
            Security Review. Today every verifier is the same model family as
            the builder, so their blind spots are correlated.
      - [ ] Someone other than the owner builds a slice from the README alone
            (the "anyone can" claim).
    - **Rule.** Update this list when evidence lands; link it, don't restate
      it. An item that stays unticked is not a failure, it is the roadmap.
  - **Not covered by the list above: an agent that takes actions and
    completes a goal.** *Added 2026-10-02 at the owner's prompt.* T22's app
    as designed **drafts and never sends**; its only "agentic" part is a
    bounded loop that decides whether to search the docs again, and every
    outward action waits for a person. Even fully released, it would show a
    governed *assistant*, not an *agent*. A claim that Aveto builds agentic
    systems that act needs its own evidence:
    - **Decision (owner delegated it, 2026-10-02: "decide a vs b"): (b)
      then (a).** The action-taking proof starts in a **sandbox**, and only
      its *auto* tier graduates to the real repo.
      - **Sandbox:** a separate repo, owned by the owner, where the agent may
        label, comment, close and open PRs for real, so side effects are real
        and user risk is zero. It has its **own scoped GitHub App**, never the
        real repo's credentials, and its own spend cap. Credentials are supplied
        by the owner and never handled by an agent; a real model call is rule 5
        as ever.
      - **The action ladder** applies from the first line: *auto* (reversible,
        low risk, e.g. labelling), *needs approval* (anything that sends or
        submits: a reply, a docs PR), *forbidden* (closing issues on the real
        repo, editing `main`). The sandbox relaxes the tiers only because
        nothing there is a user's.
      - **Order:** after slice 4 and the check-step slice; the sandbox slices
        may run alongside the check step, but **nothing reaches the real repo
        before the check step has passed its own gate** (slice 3's rule that
        nothing writing text for a user ships before it still holds).
      - **Graduation (a):** the *auto* tier moves to the real repo only when
        the evidence items below are ticked for the sandbox. *Needs approval*
        stays with a person for good; *forbidden* stays forbidden.
      - Either way the shipped agent stays single-agent (the T19 reason).
    - [ ] **A goal completed end to end:** a seeded issue goes from open to
          resolved or triaged through several tool actions, scored as a
          goal-completion rate on a held-out set of trajectories, frozen first
          like every other gate.
    - [ ] **The action ladder is enforced in code, outside the model.** Every
          tool is tagged auto, needs approval or forbidden; a deterministic
          policy layer decides; tests show the model cannot talk its way past
          it.
    - [ ] **Trajectory evals, not just answers:** right tool, right arguments,
          right order, stops when done. **Unsafe-action rate is zero** on a
          red-team set (issue text that tries to make it close issues, post
          elsewhere or leak a secret).
    - [ ] **Every action is accountable:** logged with what, why, inputs, result
          and approver; safe to retry (idempotent); reversible or compensable
          where possible; a kill switch that has been tested.
    - [ ] **Hard bounds, tested:** step cap, spend cap, timeout, loop
          detection.
    - [ ] **Runtime least privilege:** a scoped GitHub App; secrets never in
          the model's context; nothing reachable outside its scope.
    - [ ] **Failure is a state, not a crash:** a tool error or half-finished
          goal leaves a clear record and escalates to a person with what was
          done.

- **T23 · Build Aveto's own console as the second reference app — with Aveto.**
  *Raised 2026-09-26. After T22.* The console is already the planned paid tier
  (`aveto-rebrand-positioning`: record → console → ACP): the approval queue, run
  history, usage per slice, and the conformity export an auditor asks for.
  Building it *with Aveto* makes the strongest pitch available — *the console
  was built by the pipeline it reports on; here is every decision it made* —
  and produces a product people use rather than a demo.
  - **Most of the back end already exists as CLIs**: `analyze.mjs` (run
    analytics), `conformity.mjs` (T16 export), `verify-approvals.mjs` (T14
    binding), `usage.mjs` (measured tokens). The console is largely a UI and a
    store over artefacts this repo already produces, which keeps its first
    slices small and its claims checkable.
  - **Why second, not first.** It is the *expansion* tier: it serves teams and,
    eventually, the regulated buyer T18 is testing for. Its design should be
    informed by T18's answers and by what T22 teaches about running a real
    stack through the pipeline. Built first, it would be designed on
    assumptions both of those are about to test.
  - **Same "credible" bar as T22**, plus one of its own: it must display this
    repo's own approval records and usage honestly, including the
    `telemetrySource: self-reported` runs and the unmeasured Orchestrator turns
    — a console that rounds those up would fail the product's own test.

- **T24 · Close the product loop: decide what to build from evidence, and
  measure whether it worked.** *Raised 2026-09-28.* Prompted by Geoff Charles
  (CPO, Ramp) describing Ramp's product "factory" (YouTube `ZG8Mf3P9xzI`,
  worked from a Gemini summary of the talk — **check every figure against the
  video before quoting it**). Ramp's agents pull customer signal (sales calls,
  tickets, logs, surveys), rank and de-duplicate it into backlogs, write specs
  from warehouse data *and the codebase*, fix most small UX issues within a day
  without being asked, and leave humans the ambitious work. Aveto has most of
  the roles — the gap is the loop that joins them, at both ends of a slice.
  - **Before: nothing decides what to build next.** Every slice starts from
    the human's ask.
    - **The PM never reads the evidence.** `agents/product-manager.md` lists as
      inputs the scoped item, `.agentic/`, the pack and existing PRDs — not the
      Discovery Brief, the Customer Signal Review or the Data Analyst's readout.
      The role that decides what problem a slice solves is never told to read
      what the research roles found, and a PRD need not cite one ticket or
      interview. Nor does it read the code, which Ramp's definition agent does.
    - **Candidate slices have nowhere to go.** Customer Success and Post-Launch
      both file candidates "for the Orchestrator", which exists only while a
      slice runs; both briefs say what to build next belongs to "Orchestrator +
      human" — in practice, the human, from memory.
    - **No record of where evidence lives.** The research roles use "whatever
      research surface the project uses"; nothing says where a product's
      tickets, analytics or interviews are, or that there are none yet.
  - **After: success is measured on the full path only, and only once.** The
    chain exists — PRD success criteria → Analytics Engineer's event contract
    and metric queries → QA checks the wires are live → Data Analyst readout
    (experiments carry guardrails and a decision rule) → Post-Launch review.
    It breaks where a solo builder actually works:
    - **The short path drops it.** No PM means no PRD, so no outcome criteria
      and no Analytics Engineer. The intent's "Done means" are ship-time checks
      (tests pass, eval ≥ 80%), not outcomes after launch — aveto-support's
      first slice proves retrieval works and says nothing about users getting
      good answers.
    - **No gate enforces it.** Success criteria are checked at Discovery
      review; no release gate fails a slice whose outcome metric isn't
      instrumented.
    - **No baseline, target, date or decision.** Outside experiments, the
      Post-Launch review asks "met? yes / partial / no" with no before-number,
      no target, no check-by date, and no keep / iterate / roll back rule.
    - **It assumes a warehouse** (event pipeline, dbt, semantic layer). A solo
      builder has an app database at best, and traffic too low for
      significance.
    - **It happens once.** Post-Launch runs a week after release and stops.
      `runs/ANALYTICS.md` is *pipeline* analytics (cost, stage time), not
      product; product metrics never reach the next "what to build" decision.
  - **What to build — smallest first:**
    1. **The PM reads the evidence and the code.** Add the Discovery Brief,
       Customer Signal Review and Data Analyst readout to its inputs; its
       quality bar requires every problem statement to cite evidence, or to
       say "no evidence — owner's judgment".
    2. **Evidence sources in `PROJECT_CONTEXT.md`** — where tickets, analytics
       and interviews live, or "none yet". Ramp's "every question is an API",
       at solo scale. Connectors (support desk, issue tracker) are optional
       adapters, never a requirement.
    3. **"How we'll know it worked" in `INTENT_TEMPLATE.md`**, optional: metric,
       baseline, target, check-by date, decision if it misses. On the short
       path it stands in for the PRD's success criteria.
    4. **A release-gate row:** every outcome metric has a working event or
       query, or is marked "not measured, because …".
    5. **A light default for measurement:** an events table in the app's own
       database. The Data Analyst reports small numbers as counts, never
       percentages dressed as findings, and claims no significance it doesn't
       have.
    6. **A product backlog and scorecard in the product repo**
       (`.agentic/PRODUCT_BACKLOG.md`): Customer Success, Post-Launch and
       Support add candidates, each with its evidence quoted raw — Ramp's
       "hate channel", for one person. Post-Launch appends each slice's outcome
       against its target. A short "what's next" step has the PM de-duplicate
       and rank; **the human picks**. The next slice starts from a ranked,
       cited candidate, not a blank ask.
  - **Owner's decision, not a default: an autonomous small-fix loop.** Ramp
    fixes most small UX issues without a human asking. Aveto could run
    low-risk candidates on the short path at release tier 1 unprompted — but
    the merge still stops for the human, because agents never approve their
    own work (`HUMAN_APPROVAL_RULES.md`). That caps how autonomous the loop can
    be, and it should be decided deliberately, not drift in with item 6.
  - **First user: aveto-support's second slice.** The drafter's success
    measures already exist in `agents/customer-support.md` ("edited before
    sent is a real signal"): share of drafts sent unedited, how much is
    edited, escalation and abandonment rate, and "no confident match" cases
    that turn out to be real doc gaps. That is the eval continuing in
    production — the measure T22 needs to call the app production-ready.
  - **Not doing:** requiring a warehouse or connectors; roadmap by loudest
    customer (Customer Success already forbids it); letting agents choose
    what gets built — they rank, the human picks.

- **T25 · Learn from ECC without copying it.** *Raised 2026-10-06.* Prompted
  by a review of [affaan-m/ECC](https://github.com/affaan-m/ECC) (MIT, a
  single maintainer, a multi-harness toolbox of agents, skills, hooks and
  memory). Read from its README and file tree only: nothing was run and its
  hooks were not audited, and its star and component counts are its own
  claims, so **check any figure before quoting it**. It optimises how well
  one agent works; Aveto governs whether a run can be trusted. They sit at
  different layers, so this is not a competitor list item. Three ideas worth
  taking, in this order:
  - [ ] **Scan the generated pack as an attack surface.** ECC's AgentShield
        audits an agent's own hooks, MCP, permission and secret surfaces. The
        equivalent here is a check, run in CI against the output of
        `install.mjs`, over the generated `.claude/`: no hook that reaches the
        network, no broad `allow` rule, no secret-shaped string, no MCP server
        the pack did not write. Today our hooks are tested one by one and
        nothing audits the installed whole. Cheapest of the three.
  - [ ] **Hook strictness profiles and a low-context path.** ECC offers a
        default profile, per-hook disable and a no-hooks install. Aveto's
        hooks are all-or-nothing. Decide deliberately: a profile must never
        let the budget guard, the write-scope guard or the approval rule be
        switched off, because those are the product. A lighter install that
        drops them is a different product and should not carry the name.
  - [ ] **If memory is ever added, mark it unreviewed until a human promotes
        it.** ECC's vault keeps every entry unreviewed and create-only, and
        tells agents never to treat a recalled body as an instruction. That
        matches our rule that nothing an agent writes is an approval. Record
        it now so a future memory design starts from it.
  - **Not doing:** breadth for its own sake (hundreds of skills and command
    shims is the context cost our budget-first design avoids); a multi-harness
    port (Aveto relies on Claude Code's subagents, hooks and subscription);
    continuous "instincts" that rewrite behaviour without a human reading
    them; a paid tier or hosted app.

- **T26 · Cut the owner's round-trips without cutting the owner's authority.**
  *Raised 2026-10-09.* The owner asked for a review of every question a driver
  asks, a recommended action for each, and a search for the gaps behind them.
  Evidence is the two most recent slices of the reference app, read from their
  `STATE.md`, approval records and `usage.mjs` (figures are peak context per
  spawn; nothing below is a claim beyond those two slices).
  - **What the owner was asked (slices 4 and 5 so far), by kind.**
    - *Budget raises: 4.* 400k → 520k → 560k → 585k (slice 4), 650k → 780k
      (slice 5). Each stopped the driver and waited.
    - *Rule 4 / rule 5 approvals: 2 batches* (INV-5 wording in slice 4; the
      model, INV-4 and INV-5 in slice 5).
    - *Plan confirmations: 2.*
    - *Design decisions with a recommended default: about 8* (scope extras;
      Scope Review Q1–Q5; the licence call; the crash-status call).
    - **Every answer I can see was "yes" or "as recommended".** The owner's
      typed authority was needed; the deliberation mostly was not.
  - **Why the budget stops happened.** Estimates were low in the same places
    each time: adversarial Security 129k vs 70k; the Release Gate (three
    spawns, not one) 146k vs 70k; Architecture with a model proposal 187k vs
    70k (two passes); the baseline sweep 82k vs 60k. Whole slice: 581k vs a
    400k plan (1.45×); slice 5 is tracking 1.2–1.3×. Stages that matched their
    estimate: Scope, Implementation, close-out. I also recommended ceilings
    (480k, 520k, 600k) that were too low each time, because I added a margin
    by feel and not from these ratios.
  - **Gaps and proposed fixes (pack v16 candidates; the owner decides P3).**
    - [ ] **P1 · Ask for a ceiling once, at plan confirmation.** The
          Orchestrator proposes the plan total and a ceiling (about 1.5× when
          the plan has an adversarial Security or a model proposal, about 1.3×
          otherwise). The owner types the ceiling once. A stop is then only for
          spend above the ceiling, a failed pre-registered check, or a gate
          that would be compressed. Agents still never raise a budget.
    - [ ] **P2 · Estimate from measured ratios.** `RUN_ECONOMICS.md` gains a
          measured over/under per stage kind; the Release Gate counts as three
          spawns; an Architecture that proposes a model counts as two passes.
    - [ ] **P3 · Name three classes of question** (owner decision). *Class A,
          owner-typed, never delegable:* rules 1–6, credentials, a budget above
          the ceiling, push, merge and deploy. *Class B, a design choice with a
          recommended default* (ordering, thresholds, "as recommended" items):
          the Orchestrator proceeds on the EM or Architect recommendation after
          the support session has checked its facts, records it as "adopted,
          reversible until stage X", and shows it in the owner's digest; the
          owner vetoes by exception. *Class C:* the agent decides. Today the
          pack has no such distinction, so a Class B item costs the same
          round-trip as a safety-control change.
    - [ ] **P4 · A short digest at every stop.** At most 15 lines: the decision
          needed and its class, the recommendation, the exact reply to type,
          what waiting costs, and what was verified against source and by
          whom. The support session writes the independent check
          (`SUPPORT_REPLIES.md`), as it has been doing informally.
    - [ ] **P5 · Batch the Class A items.** Gather pending approvals into one
          packet at fixed points (plan confirmation; end of Architecture; end
          of Security) and not one at a time.
    - [ ] **P6 · Doc-truth check at Scope Review.** Slice 5's Scope Review
          found that the README, `CURRENT_MVP_STATUS.md` and INV-4 all still
          said retrieval returns "no confident match" when it has not since
          ADR 0004, and that the intent said "pack v14". The EM should grep
          the repo for each factual claim in the intent and each status line
          before the plan is confirmed. Drafters (including this session)
          verify an intent's claims against the code before committing it.
  - **Not doing:** an agent that approves or confirms on the owner's behalf
    (declined earlier, and unchanged); letting an agent raise its own budget;
    any change to what counts as an approval.

## Decided NO / parked — recorded so they don't return

- **A2A / MCP adoption** — wait for the Q3 2026 interop spec; every agent runs
  in one harness, so it buys nothing yet. Watch, not build.
- **A second harness adapter** (DeepSeek `dsh`, etc.) — the adapter *pattern* is
  validated by their existence, but we have one unproven adapter (Claude Code)
  and `dsh` is developer-preview with breaking changes. Revisit only when the
  first adapter is proven and a real need appears. *Checked 2026-08-27:* `dsh`
  is still `0.1.0-rc.6`, zero commits since 2026-08-13 — this holds unchanged.
  Also checked whether Anthropic's **Agent Skills** open format (`agentskills.io`,
  see T8) is a shortcut around writing a second adapter — it isn't: Skills load
  instructions into an *existing* agent's context on demand; this adapter's job
  is generating **subagents** (separate context, `tools:` restrictions) plus a
  pre-spawn hook (`budget-guard.mjs`) and durable resumable state. Different
  primitive, not a competing one — the parked reasoning here is unaffected. What
  it *did* sharpen is T8, which is a genuinely separate question.
  **Reopened 2026-09-09, re-closed 2026-09-11 — see T12.** The original park
  rested on "no mature second runtime exists," which had expired: ACP is a
  real, adopted, Apache-licensed standard. That reopened the question, but
  checking ACP's own spec (T12, not summaries) closed it again on firmer,
  more specific ground: ACP's permission model is cooperative, not
  client-enforced (an agent can simply not ask); it has no client-side tool
  restriction; and — the deciding fact, not anticipated when this was
  reopened — it has **no concept of one orchestrator spawning many
  role-scoped sub-agents at all**, describing a one-client-one-agent
  conversation instead. The park holds, now for a reason specific to this
  standard rather than "nothing mature exists yet." T12(a) still stands on
  its own regardless of any second runtime: the adapter contract is now
  outcome-checkable, which is the part of this bullet's old reasoning that
  was actually fixable without one.
- **Graph orchestration engine** (LangGraph) — no; we do not own a runtime.
- **Non-engineer contributors** (Monaco thesis) — not our problem; single
  engineer operator.
- **Phase 5 multi-tenancy** — parked.
- **Pack uninstaller** — decided against; `git checkout` is the revert.
- **Multi-account rotation to extend the usage window** — raised 2026-09-18,
  rejected the same day, on three independent grounds. **Policy:** Anthropic
  introduced the 5-hour and weekly caps *specifically* to stop "account
  sharing and reselling access to Claude Code", so rotation is the behaviour
  the mechanism exists to catch, not a gap around it. **Positioning:** a
  system of record for accountable software development cannot ship a feature
  that circumvents its own vendor's usage terms — the first buyer who asks
  how we handle rate limits ends the conversation, and it would void T18
  before the test is run. **It may not even work:** several reports on
  `anthropics/claude-code` (#54464, #41886, #34888) describe usage on one
  account appearing in another's usage panel when parallel sessions run on
  the same machine; all closed as inactive, none refuted. The clean versions
  of the same wish are one developer with checkpoint → wait for reset →
  auto-resume (**T20**), or a team where each developer runs their own slices
  on their own subscription.

## Standing caveat — a constraint on all of it

**Telemetry is self-reported.** Every cost figure, and every estimate derived
from one, rests on agents reporting their own usage — not fixable from inside
the pack. It is why T1's *measured* numbers matter: they are the first
independently checkable against a real run's outcome.

*Update 2026-09-10:* **T13** is the first proposal that could actually retire
this caveat rather than work around it — by taking telemetry from the
instrumentation layer (OpenTelemetry GenAI conventions) instead of from the
agent being measured. **T14** applies the same reasoning one layer up: the
approval record is currently self-asserted unsigned JSON, which is the same
trust problem wearing different clothes.

*Update 2026-09-12:* T13's precondition is answered and the mechanism exists —
Claude Code emits OTel natively, so telemetry can come from the runtime rather
than the agent (`execution/pack/protocols/TELEMETRY.md`). **The caveat is not
yet retired**, and saying so would be exactly the self-report error it warns
about: nothing has been run against a collector, and every run to date remains
`telemetrySource: self-reported`. What changed is that the caveat is now
*scoped* rather than total — it applies to telemetry fields, and never applied
to `gateCatches`, `landed`, `operator` or the approval record, which are
judgements with no instrumentation equivalent. Those stay under T14.

T14's spike (same day) found its mechanism sound but landed on a sharper
version of this same caveat: signing only helps if the signer is **not** the
agent that did the work — in-toto's own non-goals say so. A pipeline signing
its own approval records would produce tamper-evident self-reports, which is
this caveat with a signature attached rather than this caveat removed.

*Update 2026-09-18:* **T19's figures are the first cost numbers in this
project the caveat does not cover.** They were read from the harness's own
per-request usage logs (`~/.claude/projects/**/*.jsonl`, 23,442 requests) —
written by Claude Code, not reported by the agent being measured. This does
not retire the caveat: it still applies to every `telemetrySource:
self-reported` figure in existing run traces, and T13's collector work is
still what closes it for *run* telemetry. What it shows is that the local
usage logs are a second, already-available instrumentation source that nobody
had thought to read.
