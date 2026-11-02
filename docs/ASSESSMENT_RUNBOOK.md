# Assessment runbook (manual, until the plugin exists)

How to assess a repository Aveto did not build, with what is built today (`docs/REVIEW_MODE_PLAN.md`, M1 to M3). An assessment
**records and reviews; it does not certify.** The report says "assessed against Aveto's gates on <date>", names what was not
examined, and never says the code is secure or compliant.

## One command

`execution/assess-run.mjs` chains everything below that is automated: review copy and guard, map, plan, one read-only reviewer call per area, the read-only check, the report, and (with `--seeds`) the calibration score.

```bash
node execution/assess-run.mjs <repo> --reviewer codex --scratch <dir> [--model <name>] [--seeds seeds.json] [--scope <subdir>]
```

- `--reviewer codex|claude` picks the reviewer CLI. The model is always passed explicitly (defaults in the script, recorded in `reviews/RUN.md` with the tool version) because a tool's own default can be a model your account cannot use; that failed a Codex run before it read any code.
- `--dry-run` plans and stops, so you can see the areas and the token estimate before any model is called.
- It exits 1 if the read-only check fails, an area's reviewer failed (that area is listed as not reviewed), or the report could not be written.
- The `claude` reviewer path is covered by tests with a fake reviewer only; it has not yet been run live.
- You still do the part that is yours: read `reviews/REPORT.md`, disposition each finding in `reviews/FINDINGS.md`.

The manual steps below remain the reference for what each stage does.

What is automated: the review copy and its guard, the map, the plan, the area prompts, the secret exclusion. What is **not**
yet: running the reviews themselves (you open Claude Code in the copy and run each area prompt), the independent second
reviewer, the report writer (M5), calibration (M4), the Charter lines for data classification and processor (rest of M3b).
Do not point this at a private repo until the owner has approved the processor and data classification in writing; the code goes
to your own model provider under your own plan.

## Steps

1. **Make the review copy.** It is a clone of the committed code with no remote, secret paths removed, the repo's own
   `.claude/settings*.json`, hooks and MCP servers moved aside (`.assess-held/`, inert, still readable), and write tools,
   pushes and secret reads denied by permission rules.
   ```bash
   node <playbook>/execution/assess-guard.mjs prepare <repo> <scratch-dir>
   ```
   Only committed files are copied, so a `.env` that git ignores never reaches the copy.
2. **Map and plan** inside the copy, writing to its `reviews/` folder (git ignores it):
   ```bash
   node <playbook>/execution/repo-map.mjs <scratch-dir>/<repo-name> --out <scratch-dir>/<repo-name>/reviews
   node <playbook>/execution/assess-plan.mjs <scratch-dir>/<repo-name> --out <scratch-dir>/<repo-name>/reviews [--cap-tokens N] [--area-tokens N] [--scope <subdir>]
   ```
   `MAP.md` answers "was this governed by Aveto?" from records. `AREAS.md` lists what will be reviewed in order of risk, and
   what will **not** be (past the cap, out of scope, too large for one pass, held back for a possible secret). Read it before you
   start; the owner decides whether the cap is right.
3. **Review each planned area.** Open Claude Code in `<scratch-dir>/<repo-name>` and give it `reviews/areas/01-….md`, then the next.
   Findings go to `reviews/FINDINGS.md` as `open`, with file and line. Use a second model family for at least the high-risk
   areas; one reviewer is a first pass, not an assessment.
4. **Verify nothing changed.** This must pass before the findings are used:
   ```bash
   node <playbook>/execution/assess-guard.mjs verify <scratch-dir>/guard.json
   ```
   It fails if the target's HEAD or working tree moved, if the copy differs from the commit by anything but the recorded
   removals, or if the permission rules were altered.
5. **Report.** Findings from every reviewer go in `reviews/FINDINGS.md` as `open` rows with a file and a line. Then:
   ```bash
   node <playbook>/execution/assess-report.mjs <scratch-dir>/<repo-name>/reviews --reviewers "<name>:<family>,<name>:<family>" --guard <scratch-dir>/guard.json
   ```
   It writes `REPORT.md`: the risk map, findings by severity with evidence, what was not reviewed and why, tests and CI, and a proposed
   backlog where each P0 or P1 is a Charter-ready intent (below P1 is recorded and deferred). It refuses to write if the read-only check
   fails, or if a finding's evidence quotes something shaped like a secret. With one model family it says "first pass". The owner sets
   each disposition.
6. **Before you rely on a reviewer**, score it: `execution/assess-calibrate.mjs` compares its findings with bugs a *different* agent
   planted (recall) and with the owner's dispositions (precision). See `docs/review-evals/`.

The Charter for an assessment run is `templates/REVIEW_CHARTER_TEMPLATE.md` (a filled example is `examples/review-charter-hr-timeoff-agent.md`);
`charter-check` refuses it with a blank data classification (C4.D) or processor.

## Limits worth knowing

- The permission rules stop Claude Code's tools. They do not make a shell a sandbox: run the review under an account that has no
  credentials of its own, and keep network access off if your policy needs it.
- The secret scan is a handful of high-confidence patterns. It misses what they miss.
- Token figures are bytes divided by four: an estimate, not a bill.
- `assess-guard.mjs` removes secret paths from the copy, so the reviewer cannot read them. It cannot stop a secret that is
  committed inside an ordinary source file; the scan holds those files back when it recognises the shape.
