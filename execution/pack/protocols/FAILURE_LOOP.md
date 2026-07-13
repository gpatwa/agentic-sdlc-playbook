# Protocol: Failure Loop & Escalation

A gate that fails sends the slice **back**, never forward — but not
forever. This protocol bounds the retries so an autonomous run can't burn
hours (or budget) spinning on the same failure. It is the encoded lesson of
"a stalled run that ran for three hours."

## Definitions

- A **failure** is: a gate fails (typecheck/test/build/qa/security), an
  agent can't produce its artefact, a handoff is rejected as incomplete,
  **or a stage attempt exceeds its wall-clock budget**.
- The **retry budget** is per stage. Default: **2 retries** (3 attempts
  total) for that stage.
- The **slice iteration cap** bounds total back-and-forth across the whole
  slice. Default: **6 stage re-entries**.
- The **stage wall-clock budget** bounds a single attempt in time. Default:
  **20 minutes** (`defaults.stageWallClockMinutes` in
  `.claude/agentic.config.json`). Iterations were bounded from day one;
  time was not — a hung stage is a failure event, not something to wait
  out. Stop it, record it, count it against the retry budget.

## Steps

1. **On failure**, the owning agent records what failed (the command + the
   error tail, or the missing input) in its artefact and in `STATE.md`'s
   Failure budget table. It does **not** silently retry.
2. **Retry within budget.** Re-run the stage with the failure as input
   (e.g., the engineer fixes the failing test and re-runs). Increment the
   counter. **The final retry escalates one model class** (see
   `MODEL_ROUTING.md`) — a same-model identical retry adds little
   information; don't spend the last attempt repeating the experiment.
3. **Budget spent → escalate.** When a stage exhausts its retries, or the
   slice hits its iteration cap:
   - Set `STATE.md` → `Status: blocked-on-failure`.
   - Write `runs/<slice-id>/ESCALATION-<n>.md`: what was attempted, the
     persistent failure, and the smallest decision the human could make to
     unblock (e.g., "relax the perf budget", "the test fixture is wrong",
     "split the slice").
   - **Stop.** Surface to the human. Do not keep trying.

## Hard rules (anti-runaway)

- **Never** retry the same failing action more than the budget allows.
- **Never** "work around" a failing gate by weakening it — that is itself a
  `HUMAN_APPROVAL_RULES.md` rule 4 action and needs approval.
- **Never** proceed to the next stage with a failed gate, even "to make
  progress".
- A loop with no new information after one retry is already a signal:
  escalate early rather than exhaust the budget on identical attempts.

## Distinct from approval

A **failure** block (this protocol) means something is broken and the human
may need to make a call. An **approval** block (`APPROVAL_PROTOCOL.md`)
means nothing is broken but the action is gated. Both stop the run; they are
recorded separately in `STATE.md`.
