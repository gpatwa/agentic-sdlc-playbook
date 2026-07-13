# Execution Pack

The playbook's `docs/`, `agents/`, `templates/`, and `prompts/` describe
*how* the Agentic SDLC works. This pack makes it **run**: it turns the
markdown briefs into Claude Code subagents, adds the orchestration commands,
and supplies the protocols that were missing for an autonomous run —
resumable state, the human-approval interrupt, and bounded failure loops.

## What's here

```
execution/
  install.mjs              ← generates .claude/agents/ from briefs, installs the pack
  ADAPTERS.md              ← provider-adapter contract (this pack = the Claude Code adapter)
  pack/
    CLAUDE.md              ← autonomous-run guide (installed to product root)
    commands/              ← /agentic-slice, /agentic-resume, /agentic-status
    protocols/
      SLICE_STATE.md       ← resumable per-slice state + Trace table (pipeline telemetry)
      APPROVAL_PROTOCOL.md ← the human-approval interrupt (pause / wait / record)
      FAILURE_LOOP.md      ← retry budget + wall-clock budget + escalation (anti-runaway)
      MODEL_ROUTING.md     ← per-role model defaults, tier + failure escalation
      PIPELINE_SLOS.md     ← SLOs + DORA metrics for the SDLC itself
  README.md                ← you are here
```

Generated agents carry a static model default per `MODEL_ROUTING.md`
(opus for Architect / Security / Orchestrator, sonnet otherwise); the
Orchestrator escalates at spawn time for Tier-3 slices and final retries.

## Install into a product repo

From the product repo root (which must have a `.agentic/` folder):

```
node <playbook>/execution/install.mjs .
```

This writes, into the product repo:

- `.claude/agents/<role>.md` — one Claude Code subagent per playbook brief
  (the brief inlined, with execution preamble + protocol pointers; tools
  scoped per role).
- `.claude/commands/` — the orchestration slash commands.
- `.claude/protocols/` — the three protocols above.
- `.claude/agentic.config.json` — records the playbook path + generation
  time.
- `CLAUDE.md` — the autonomous-run guide.

Re-run after the playbook changes to refresh the generated agents.

## How a run works

1. `/agentic-slice "<ask>"` — the session becomes the Orchestrator, plans
   the slice, and writes `runs/<slice-id>/STATE.md`.
2. It delegates each lifecycle stage to the matching subagent. Each reads
   its input artefact, writes its output, and updates `STATE.md`.
3. Gates are enforced between stages; failures retry within budget then
   escalate.
4. A gated action (per `docs/HUMAN_APPROVAL_RULES.md`) **pauses** the run
   for an explicit human approval, recorded as an artefact.

## Honest limits

- Claude Code discovers `.claude/agents/` and `.claude/commands/` at
  **session start**. Install the pack, then open a fresh session in the
  product repo for the subagents and commands to be available.
- The pack coordinates handoffs through artefacts and the state file; it
  does not give agents a shared live channel. That is intentional — it's
  what keeps each agent's context small.
- The approval interrupt depends on a human actually answering. By design
  there is no timeout that auto-approves.
