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
