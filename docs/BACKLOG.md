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
- **T12 · Restate the adapter invariants as outcomes, then target ACP.**
  *Raised 2026-09-09 from competitive research — this overturns the parked
  "second harness adapter" bullet below; read them together.*
  `ADAPTERS.md` claims provider-neutrality but two of its four invariants are
  written as **mechanism** requirements, not outcomes: least-privilege tool
  scoping (`tools:` frontmatter) and a pre-spawn abort hook
  (`hooks/budget-guard.mjs`). Both are Claude-Code-shaped. A runtime that
  records an attributable approval by other means currently fails our contract
  for the wrong reason — we are testing *how* it was enforced rather than
  *whether the evidence exists*.
  - **Why now, and not before:** the parked bullet's reasoning was "no mature
    second runtime exists." That expired. **ACP (Agent Client Protocol)** —
    Zed-created, Apache-licensed, JSON-RPC over stdio — is documented as
    adopted by JetBrains, Google, GitHub and 25+ agents, and Devin Desktop
    (June 2026, on Windsurf) drives Claude Code and Codex through it. There is
    now a real, adopted standard to write against instead of inventing one.
  - **Two pieces, in order.** (a) Rewrite invariants 1 and 2 as outcome
    requirements — *the approval exists, is attributable to a named person, and
    is durable* — keeping the current hook and `tools:` frontmatter as the
    Claude Code adapter's *implementation*, not as the contract. (b) Only then
    assess an ACP adapter.
  - **Not assumed — still to check.** Whether ACP exposes any pre-spawn
    interception that can *abort* (the `budget-guard.mjs` equivalent, per
    `RUN_ECONOMICS.md`'s "checked before every spawn, never reconciled after"),
    and whether it carries per-agent tool restriction at all. Both are read
    from ACP's own spec, not from summaries. If neither exists, (a) still
    stands on its own merit and (b) is dropped.
  - **Cost of not doing it:** the provider-neutral claim in `ADAPTERS.md` stays
    aspirational with one adapter and no test, which is the single weakest load-
    bearing claim in the repo.
- **T13 · Put `trace@2` on OpenTelemetry GenAI semantic conventions.**
  *Raised 2026-09-10.* The point is not tidiness — it is the **standing caveat
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
  - **Unverified:** whether Claude Code exposes hooks that can emit OTel spans
    for subagent spawns without agent cooperation. If it cannot, this reduces
    to a schema-shape change and the caveat survives — which is worth knowing
    before starting.

- **T14 · Emit the approval record as signed in-toto attestations.**
  *Raised 2026-09-10 — the most load-bearing of the three.* Every approval,
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
  - **Unverified:** key management for a single operator (sigstore/keyless vs.
    a held key), and whether a predicate type this bespoke is worth publishing
    or stays internal. Neither blocks a spike.

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
  **Superseded 2026-09-09 — see T12.** The park rested on "no mature second
  runtime exists," and that premise expired: ACP is an adopted, Apache-licensed
  interop standard, and a shipped agent-neutral surface (Devin Desktop) already
  drives Claude Code and Codex through it. The *conclusion* still holds for now —
  do not write a second adapter yet — but for a different reason. The blocker is
  no longer the absence of a target; it is that our own contract is written
  against Claude Code's mechanisms rather than against outcomes. Fix that first
  (T12a); a second adapter is only assessable afterwards.
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
