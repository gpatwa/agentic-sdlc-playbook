# Backlog

The prioritised work to fill gaps and improve the framework, synthesised from
six external reviews this session (DoorDash platform, Google's New-SDLC paper,
Monaco, Anthropic's AI-native-org talk, Matt Pocock's engineering skills,
DeepSeek Harness) plus the playbook's own findings.

Ranked by one rule: **does it close a hole we've actually hit, is it cheap, and
does it produce evidence rather than assert?** `VALIDATION_MATRIX.md` records
what is *proven*; this records what is *next*.

## Tier 0 — the one action that unblocks everything

- **T1 · Run the F-1…F-4 security slice on `streak-seed`.** Highest leverage,
  owed regardless of any external doc. It validates the six changes shipped this
  session that are unit-tested but never run in anger (effort routing, trace@2,
  handoff completeness, `--strict`, budget-guard concurrency, drift detection);
  **binds least-privilege for the first time** (never enforced in any run — 0.5–5
  all orchestrated from the playbook); emits the **first trace@2**; re-baselines
  the stale density figures; **measures the ~11% effort saving** (currently an
  estimate); and is the **test-bed** for whether the quality flags (T2) and a
  plan-review gate (T3) catch anything real.
  **Requires a session rooted in `streak-seed`, not the playbook** — otherwise
  least-privilege does not bind and T1's whole point is lost. Everything in
  Tier 1 depends on it.

## Tier 1 — genuine, cheap, close a real hole (after T1)

Most of these need the *data* only a run produces; the **mechanism** for each is
built or buildable now, and populates when T1 runs — the same "field first, data
from the run" pattern as effort / operator / executor / gateCatches.

- **T2 · Decide the quality-metric gate.** `quality.mjs` exists measure-only.
  On the T1 slice, ask: did a flag catch what the reviewers didn't? If yes → a
  "Quality" dimension in `PLATFORM_EVAL.md` + a `--strict`-style gate. If no →
  record it. Evidence decides.
- **T3 · Plan-review gate (Monaco).** Gate on the Architecture/plan artefact
  *before* Implementation spends tokens. Trial on T1; enshrine in
  `HANDOFF_CHECK` only if it catches a real design problem.
- **T4 · Branch protection.** Gates run in CI but are not *blocking*. One
  GitHub setting makes "gates as code" true.
- **T5 · Capture FDRT.** Blocked→unblocked timestamps in `STATE.md` — the one
  "not captured" DORA cell. Schema addition now; data from T1's failure loop.
- **T6 · Gate-catch metric.** ✅ *mechanism built this session* — `gateCatches`
  in trace@2 + the analytics "Gate catches" section. It is the closest thing to
  an honest **impact** number (a defect a gate stopped before it shipped). Today
  it surfaces only the one run with legacy data and labels the rest a floor;
  T1+ populate it structurally.

## Tier 2 — real, but deferred (bigger, or need run volume)

- **T7 · Map the 24 briefs against the ~18 engineering skills** (read-only).
  Decides whether a skills layer adds capability or just repackages craft the
  briefs already carry.
- **T8 · Skills pilot.** If T7 warrants: extract one duplicated craft
  (non-vacuous testing is the candidate) as a shared skill; measure whether it
  improves consistency. Wholesale conversion stays deferred. *Five sources point
  here: Google, Monaco, Claude Code, Matt Pocock's skills, DeepSeek Harness.*
- **T9 · Declare pipeline topology as data.** Nodes/edges/required-per-tier →
  declared-vs-actual completeness checking. Unblocked now that trace@2 records
  executors.
- **T10 · Eval-with-rubrics / trajectory eval (Google).** **Deferred — at 8
  runs it is ceremony, and trajectory data is self-reported.** Revisit at volume.
- **T11 · Cross-slice memory.** Real gap, not urgent at single-operator scale.

## Decided NO / parked — recorded so they don't return

- **A2A / MCP adoption** — wait for the Q3 2026 interop spec; every agent runs
  in one harness, so it buys nothing yet. Watch, not build.
- **A second harness adapter** (DeepSeek `dsh`, etc.) — the adapter *pattern* is
  validated by their existence, but we have one unproven adapter (Claude Code)
  and `dsh` is developer-preview with breaking changes. Revisit only when the
  first adapter is proven and a real need appears.
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
