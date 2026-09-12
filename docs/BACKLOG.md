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
  - **Bearing on CC3.2.** `claude_code.api_request` records `model` per call,
    which is a real component of the "prove confidential data did not reach a
    third-party model" evidence the strategy doc flags as the one auditor ask
    this system cannot currently answer. It is not the whole answer — nothing
    classifies the payload — but the gap is narrower than it looked.

- **T14 · Emit the approval record as signed in-toto attestations.**
  ◐ *Raised 2026-09-10 — the most load-bearing of the three; spike done
  2026-09-12, **nothing implemented**, blocked on one decision (below).* Every approval,
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
