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
  T1's first data point: `dom.js` (the file holding F-5) was flagged "dense" —
  a proximity signal, not a catch. Density counts decisions, not property
  reads, so it would not have caught F-5 itself; the run's own Post-Launch
  review says only a mechanism-level assertion can. **Inconclusive — one run
  is not enough to decide a gate.** Re-evaluate after 2–3 more runs.
- **T3 · Plan-review gate (Monaco).** Gate on the Architecture/plan artefact
  *before* Implementation spends tokens. T1 dropped the Architecture stage
  entirely (the prior security review already was the design doc) — no data
  either way. Still open; needs a slice where Architecture actually runs.
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
- **T8 · Skills pilot.** ✅ *mechanism identified 2026-08-27, not yet built* —
  checked `agentskills.io`: not a third-party format to evaluate, it's
  Anthropic's own **Agent Skills** spec ("originally developed by Anthropic,
  released as an open standard"), already natively supported in this Claude
  Code session (the `Skill` tool). Real reciprocal adoption confirmed, not
  assumed — Cursor (`cursor.com/docs/context/skills`), Gemini CLI, GitHub
  Copilot, VS Code, OpenCode, Goose, OpenHands, and Codex
  (`developers.openai.com/codex/skills/`) each document it from **their own**
  docs, 40+ independently-listed integrations. T8 no longer means "invent a
  shared-skill mechanism" — it means writing `tdd-fail-first/SKILL.md`
  against the real spec (`agentskills.io/specification`). Candidate unchanged
  from T7: TDD/fail-first first, then triage and merge-conflict-resolution.
  Wholesale conversion stays deferred — this is one skill, piloted, not a
  rewrite of the 24 role briefs into skills.
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
