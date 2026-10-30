# Spec Kit compared with Aveto (research note)

> Written 2026-10-29 by the support session at the owner's request ("read the Spec Kit repo and write the comparison").
> **Primary sources:** github/spec-kit, read through `gh api` on 2026-10-29: the README, `docs/reference/workflows.md`,
> `agentic-sdd.md`, `presets.md`, `agentic-assessment.md`, and the integrations index. Repo facts at the time: MIT licence,
> 143,925 stars, latest release v1.2.5 (2026-10-28). **Not read:** `spec-driven.md`, the source under `src/`, the tests, the
> extension and preset catalogues, or any real project using it. Where this note says Spec Kit "has no" something, it means
> "I did not find it in the documents above", not "it does not exist".

## What Spec Kit is

An open-source toolkit that gives a coding agent a structured process. Its centre is spec-driven development: a constitution
(project principles), then specify, clarify, plan, checklist, tasks, analyze, implement and converge, run as slash commands in
the agent's chat, one at a time, with the human reviewing each result. Bug fixing and idea assessment ship as extensions. The
rest is composable: extensions, presets (swap templates and wording, for example "require regulatory traceability in plans"),
workflows (YAML chains of commands, shell steps and human gates, resumable), bundles, catalogues (including private ones) and
integrations with about 45 coding agents, Claude Code, Codex, Copilot, Cursor and Gemini among them.

## Where the two differ

| Question | Spec Kit (as read) | Aveto |
|---|---|---|
| What it is | A toolkit of processes, templates and a CLI (`specify`). The process is yours to adopt, change or replace. | One fixed process (v2) with a pack that enforces it through hooks, a budget guard and a record. |
| Agents | About 45 integrations; agent-agnostic. | Claude Code only for the pack; the rules are readable by others (AGENTS.md). |
| Where the human decides | Review each command's result; workflows can add a `gate` step (approve or reject). | One Charter approved by its sha256 at the start; one review of the result at the end. |
| What an approval is | A prompt in a workflow. I found no record of who approved or what exactly was approved. The docs show a gate can be replaced by an overlay with a non-interactive command. | A hash typed by a named person in the driving session; agents cannot relay it; the record names who decided. |
| Who checks the work | The same agent runs implement, analyze and converge. I found no rule that a different agent or model verifies. | Stage subagents with separate roles; the verifier is not the author; an optional second model (Codex) reviews. |
| Spend | Nothing found about token or cost limits. | A hard cap in the Charter, a budget guard before each step, and spend recorded per run. |
| Record | Artifacts in `.specify/` (specs, plans, reports, run `state.json`). | Charter hash, event log with a chain check, STATE.md, END_REVIEW.md, trace.json, and a public dashboard (/runs). |
| Policy for an organisation | Presets and private catalogues "enforce organizational or regulatory standards" (their words); catalogue listings are not audited. | The Charter's sections (models, data processors, safety controls, end actions) and the hooks that check them. |
| Existing code | A guide for existing projects; bug fixing; "assessment" means deciding whether an *idea* deserves investment. | Assessment mode is planned, not built: a read-only assessment of an existing codebase against Aveto's gates. |
| Reach | 143,925 stars; shipped by GitHub. | One owner, a handful of runs, two small apps and one live service. |

## What this means for Aveto

1. **Aveto is not a competitor to its process layer; it is a stricter version of one slice of it.** Spec Kit lets a team build any process. Aveto is one opinionated process with enforcement and a record. The overlap is the human-checkpoint and gate idea.
2. **The real difference is what an approval is.** Spec Kit's gates are pauses. Aveto's Charter approval is an identity-bound, hash-bound, recorded decision, plus a budget and an independent verifier. That is the part the governance surveys point at (oversight, approval, audit) and the part I could not find in Spec Kit. It is also the part that has to be shown, not asserted, since a Spec Kit user can build a gate and a record on top.
3. **Do not claim "Spec Kit has no X" on the site.** I read documents, not the code. The claim would have to be checked against `src/` and the catalogues first.
4. **Wording collision:** Spec Kit's "assessment" means assessing an idea. Our planned "assessment mode" assesses a codebase. If assessment mode ships, the page should say "assessment of an existing repo" each time.
5. **Reach is where it is weakest.** About 45 agents against one; a catalogue and community against none. Aveto cannot win on breadth.

## Options (for the owner; nothing started)

| Option | What it gives | Cost and risk |
|---|---|---|
| A. Stay separate; sharpen the one claim | Keep the page about approval, independent verification and the record. Add a comparison row after the claim is checked against Spec Kit's code. | Low. Needs a code read first. |
| B. Make the Charter check usable inside Spec Kit | An extension or preset that adds a hash-approved Charter, a budget line and an end review to a Spec Kit workflow. Reaches Spec Kit's users. | Medium; new surface to maintain; Spec Kit's gates may not be able to carry the identity binding. |
| C. Build assessment mode first (T31) | The clearest enterprise entry: point Aveto at an existing repo and get a report. Spec Kit has no equivalent that I found. | Planned, not started; the largest build. |

Recommendation: A now (cheap), C when the owner chooses to build it. B only if a user asks for it.

## What I would check before using any of this publicly

- Read `src/` and the workflow engine to see whether a gate can record who approved, and whether any verification is independent of the implementing agent.
- Read the extension and preset catalogues for anything that adds approval records, budgets or audit trails.
- Do not use the star count or the agent count on the site without re-fetching them that day.
