# Prior art: fewer owner stops in long-running agent work (research note)

> Written 2026-10-13 by the support session at the owner's request ("how Anthropic, OpenAI, startups or repos might solve this"). **Primary sources** are Anthropic's official Claude Code docs, fetched on the day; **secondary sources** (blogs, release notes, press) are marked and unverified. Not covered: LangGraph, CrewAI, other startups' products, and public GitHub orchestrator repos beyond what appears below. This note recommends nothing to the pack by itself; proposals go to the backlog (T28) when the owner agrees.

## The problem, measured

Slices 1 to 5 of the reference app each took 9 to 143 hours of wall clock for 1 to 5 hours of work (`docs/LESSONS.md` L35). The stops were approvals, budget raises, and starting a fresh session when agent or skill files had changed. The owner's complaint is the interruption, not the seconds each one takes.

## What the sources say

### 1. Long-running work survives on files, not memory (primary + secondary)
Anthropic's engineering post "Effective harnesses for long-running agents" (Nov 2025) describes an initializer agent that sets up the environment and a coding agent that makes incremental progress per session and leaves artifacts for the next: a progress log, a feature list marked passing or failing, an init script and git commits. Each session starts by reading the log and history. Aveto's `STATE.md`, approval records and run folders are the same pattern. **Validated, nothing to change.**

### 2. Five official ways to run several agents (primary: "Run agents in parallel")
| Approach | Who starts workers | Relevant limit for Aveto |
|---|---|---|
| Subagents | Claude, inside one session | Definitions load at session start; a mid-session change is not seen (slice 6's probe) |
| Agent view / `claude --bg` / `/bg` | The user | Dispatch is user-initiated; a session reads settings and agents from the directory it runs in; it moves into its own worktree before editing (setting `worktree.bgIsolation: none` avoids that); works on a subscription; shows "Needs input" |
| Agent teams (experimental, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) | **The lead session, with no confirmation prompt** | Interactive sessions only (not `-p`); teammates are separate sessions with fresh context that load project CLAUDE.md, MCP and skills at spawn; a named project subagent definition is read at spawn (`tools`, `model`, body apply; `skills` do not); no nested teams, one team per session, lead fixed, no resume of in-process teammates, no worktree isolation per teammate |
| Projects (public beta, Pro/Max) | Claude, as cloud or Remote Control threads | Cloud threads cannot use a local worktree; not examined further |
| Dynamic workflows | A script | "A script holds the plan instead of Claude's turn-by-turn judgment"; runs many subagents and cross-checks results; availability and cost not examined |

### 3. Messages between sessions never count as approval (primary: cross-session messaging, agent teams)
Claude Code tells the receiving session a message came from another session, not the user, and says it cannot approve a prompt, change configuration or run a command. In auto mode a classifier treats an approval claim relayed by another agent as untrusted. This is the rule Aveto adopted in pack v14, and it is enforced by the product, not just by us.

It also explains the earlier "held" messages to driver sessions: with no `crossSessionInbound` value set, delivery depends on the two sessions' permission-mode classes, and the Desktop app cannot show the approval dialog, so a held message waits until a deadline (default five minutes) and is dropped. Setting `crossSessionInbound` to `accept` in the receiving session's user settings delivers messages without changing what they may do.

### 4. Approval fatigue is documented by the vendor (primary + secondary)
Anthropic's auto-mode engineering post says users accept about 93% of permission prompts, calling it approval fatigue; secondary coverage reports a classifier catching a disguised dangerous prompt far more often than humans did (89% vs 13.6%; unverified) and auto mode becoming the default from 14 August (unverified; the app's own notice in a terminal session said the same). The direction is: spend human attention on few, high-stakes decisions and let a policy handle the rest.

### 5. OpenAI Agents SDK: approvals as pause and resume state (secondary only)
Tools can be marked as needing approval; a run exposes an interruption, a person records approve or reject, and the run resumes from serialized `RunState`. The SDK gives the primitive; long waits and restarts need your own storage or a wrapper (Temporal, Restate, Kitaru, per the vendors' own posts). Other write-ups route approval questions to a person's phone. The parallel for Aveto: `STATE.md` plus an approval record is already the durable state; what is missing is out-of-band notice and a one-step answer.

## What this suggests for Aveto (ranked by stops removed; none adopted)

1. **Orchestrator as an agent-team lead started inside the slice worktree; stage agents as teammates.** A teammate is a fresh session whose agent definition is read when it spawns, which removes the "start a fresh session after changing agent or skill files" stop (slice 6: 5 stops; slice 7 so far: 2). Caveats: experimental; no nested teams, so a teammate cannot start its own teammates; no resume of teammates; the lead's plan-approval is granted automatically **and is not a human approval**, so Aveto must never count it as one; teammates inherit the lead's permission mode.
2. **A script for the fixed loop.** The 48-spawn checks are a fixed procedure that failed once because a model retyped a payload. A dynamic workflow (or the existing skill driven by a script) holds the plan deterministically. Unverified: availability on a subscription, cost, whether it fits the one-spawn-per-question audit.
3. **Policy approvals up front, notice instead of stops.** Approve once, at plan confirmation, a bounded charter: the model, the data processor and its scope, the depth, the ceiling and a band above it with notice, and which session starts are pre-approved. Anthropic's own data on prompt acceptance argues for fewer, weightier approvals. This is T26 P3 and T27 Part B.
4. **Out-of-band notice and one-step answers.** The driver sends a push notification when it is `blocked-on-approval`, with the exact words to approve; the owner answers with a structured choice in the driver session (the driver's question tool) so the owner's own selection is recorded verbatim in the approval record. It is still the owner's words in the driver session; it saves the copy and paste, not the interruption.
5. **Deliver messages reliably.** Set `crossSessionInbound` to `accept` for driver sessions so support-session notes reach them instead of being held.

## What not to adopt
Projects (cloud threads; the local worktree path is not documented), anything unattended (`claude -p`, routines), any agent approving on the owner's behalf. The first is a gap in what was read, the last two are the owner's standing rules.

## Open questions (read the docs before building)
- Does an agent-team teammate spawned from a lead whose working directory is a worktree read that worktree's `.claude/agents` and skills at spawn, and trust the folder? (The docs say a restored teammate re-applies a project definition only if the folder is trusted.)
- Does a dynamic workflow run on a subscription, and what does it cost per spawn?
- Can the lead's teammates be started without a permission prompt in the desktop app's default mode?
- The remaining 37k characters of the agent-view page and the workflows page were not read.

## Sources
- Anthropic, [Effective harnesses for long-running agents](https://anthropic.com/engineering/effective-harnesses-for-long-running-agents) (the search returned the opening; details of the progress file are from secondary write-ups)
- Claude Code docs, [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams), [Message your other Claude Code sessions](https://code.claude.com/docs/en/cross-session-messaging), [Run agents in parallel](https://code.claude.com/docs/en/agents), [Manage agents with agent view](https://code.claude.com/docs/en/agent-view) (first 100k of 137k characters)
- Anthropic, [Claude Code auto mode](https://anthropic.com/engineering/claude-code-auto-mode) (93% figure from the post per the search summary; other figures from press)
- OpenAI Agents SDK human-in-the-loop, via [release notes 0.8.0](https://newreleases.io/project/pypi/openai-agents/release/0.8.0), [ZenML on durable runtime](https://www.zenml.io/blog/openai-agents-sdk-durable-runtime), [Restate](https://restate.dev/blog/durable-orchestration-for-ai-agents-with-restate-and-openai-sdk), [Temporal agent harness](https://daily.dev/posts/temporal-agent-harness-an-early-look-at-durable-agent-infrastructure-bqrctxdka) (secondary)
