# Conductor compared with Aveto (research note)

> Written 2026-11-04 by the support session at the owner's request ("review Conductor and write the research note").
> **Primary sources, read on 2026-11-04 through a page fetcher that summarises each page (so these are summaries of the
> pages, not the pages verbatim):** conductor.build (home), the docs introduction, the changelog list, and the docs pages for
> workspaces and branches, workflow, agent modes, checks, parallel agents and the API; the blog list. **Not read:** the diff
> viewer, cloud workspaces, setup-script reference, harnesses (billing and limits), any privacy, security or pricing page, the
> post "Conductor is joining Meta" (only its changelog title was visible), the June 2026 post "Claude subscription update
> for Conductor" (only its title), the source, or any real project using it. Where this note says Conductor "does not state" something, it means
> the pages above did not, not that the product lacks it.

## What Conductor is

A **Mac app for running coding agents in parallel**. Each task gets an isolated workspace, which the docs say is built with
**Git worktrees**: its own branch, working tree, running processes (a per-workspace `CONDUCTOR_PORT`), terminal, diff and
review path. It runs **Claude Code, Codex, Cursor and OpenCode** from one window. The flow it documents: break the problem
into independent pieces, create a workspace per shippable unit (from a branch, PR, GitHub issue or Linear issue), run
agents, verify and review, open a PR, merge, archive. Latest release 0.93.0 (2026-11-04), roughly one release every four days since September; the
changelog titles show remote control (0.92.0), an iOS app (0.90.0), sign in with ChatGPT (0.89.0), "share your loadouts"
(0.86.0), routines (0.85.0) and new models within days of release. The same changelog's newest entry is titled
**"Conductor is joining Meta"** (2026-11-04); the blog lists a Series A (2026-03-30) and "cmd joins Conductor" (2026-04-02).

Features the docs describe:
- **Review loop:** an agent `Review` action, a Diff Viewer where the human leaves inline comments that go back to the agent as
  attachments, and a **Checks** tab (git status, CI, deployments, review threads, todos) shown before merging.
- **Modes:** Plan Mode (the agent plans before editing; the human approves), Fast Mode, reasoning controls, and Codex
  **goals** (a standing objective pursued across turns, with a token-budget display and pause/resume).
- **Automation:** a beta REST API for *cloud* workspaces (create workspaces and sessions, send prompts, read transcripts,
  archive), an MCP server, a CLI, and **routines** that run a prompt when a webhook URL receives a POST.
- **Sharing:** repository settings, checked-in `AGENTS.md`/`CLAUDE.md`/skills as durable guidance; "loadouts" shared between users.

## How it compares

| | Conductor | Aveto |
|---|---|---|
| What it is | A workbench: where several agents run, are watched and are merged | A process: what must be approved, by whom, with what evidence, before an agent acts or work merges |
| Unit of work | A workspace (worktree + branch) per task | A slice under a Charter, with stages, roles and a trace |
| Who decides what to build and split | The human, stated explicitly in the workflow | The human approves one Charter by its hash; roles decompose inside it |
| Approvals | **Not stated.** The docs describe no permission model or approval handling; Plan Mode is a plan the human approves | Central: Charter hash, hard stops on destructive or external effects, approvals never inferred |
| Merge gate | Checks tab "prompts to inspect"; the docs do not say it blocks, or whether it follows GitHub branch protection | Release gate by tier, independent QA and security pass, the merge stays the owner's |
| Independent review | An agent `Review` action plus the human's diff review; whether the reviewer is independent of the author is not stated | Separate roles and, in assessment mode, a different model family as reviewer and judge |
| Evidence | Transcripts and the diff; a `.context` folder that is *not* committed | Committed run records, event log, trace, end review |
| Cost control | Token display on Codex goals; limits and billing deferred to a page not read | Budget guard against the Charter's hard cap, per-stage estimates |
| Security stance | "Workspace isolation is for development, not security"; agents run on the Mac with the user's permissions | Read-only review copy for assessment, secret-path denial, hooks that fail closed |
| Reviews code it did not write | Not described | Assessment mode, with a measured recall and precision on small repos |
| Platform | macOS (plus iOS and cloud workspaces) | Any machine with Claude Code; the plugin is skills only |

Read plainly: **they sit at different layers and are not competitors.** Conductor makes running many agents pleasant and
reviewable. It states no rule about when an agent may act or what must be true before a merge. Aveto states those rules and
has no interface for running many agents at once. A team could run Aveto's pack *inside* a Conductor workspace.

## Gaps this exposes in Aveto, and opportunities

1. **"A person still starts each run" is a listed limit on our site.** Conductor's **routines** (webhook-triggered prompts) and
   API show how a start can come from outside. The caution in its own docs applies directly: the webhook URL is the only
   credential, revoking an API key does not revoke it, and routines run with the creator's Git and agent credentials. If Aveto ever
   accepts a trigger from outside, that is a Charter-level approval, not a convenience. *Idea only; nothing adopted.*
2. **Parallel slices.** We run one slice at a time per repo. Conductor's answer is a worktree per task. Aveto's budget guard
   already follows the session's own worktree (pack v30), so the pieces exist; what we lack is a tested statement of how two
   Charters in two worktrees stay out of each other's way (shared `runs/`, shared event log, one budget).
3. **Does the pack work inside Conductor?** Unknown and testable: do Claude Code sessions started by Conductor load the
   repo's `.claude/settings.json` hooks (`budget-guard`, `write-scope-guard`), the project's permission rules, and our plugin?
   If hooks do not fire there, the safety claims would not hold for people who use both. This is the most useful single
   question in this note.
4. **Codex goals ↔ Charter budgets.** A standing objective with a token budget and a pause control is close to a Charter's
   budget and stop conditions. Worth reading how it reports usage; no change proposed.
5. **Multi-harness is now normal.** Conductor runs Claude Code, Codex, Cursor and OpenCode side by side. Our assessment mode
   already uses two families (Claude Code and Codex) and found they miss different bugs, which is evidence for the pattern
   rather than a gap.
6. **The review loop it ships is the one our owner review sheet does by hand.** Inline comments returning to the agent as
   attachments is a good shape for the end review; our `OWNER_REVIEW.md` (a table you fill in) is the weaker version. Not
   something to build without a user asking; recorded as a design reference.
7. **"If it does not benefit from AI, that is a finding"** (the Amazon note) and Conductor's Plan Mode both point the same
   way: the human's first act is deciding how to split the work. Our fit check does this at the Charter.

## Risks to note

- **Joining Meta** (changelog title only; the post was not read). A tool our users might standardise on is changing owner;
  its pricing, data handling and support for non-Meta models could change. Do not build on Conductor's API or name it in the
  playbook as a dependency until the post and terms are read.
- **The June 2026 "Claude subscription update for Conductor" post bears on our message.** Aveto's site has a section headed "A subscription to build.
  An API for what you run." A post with that title suggests the terms for using a Claude subscription through third-party
  apps changed. Not read; open question below.
- **Mac-only desktop app** with cloud workspaces behind a beta API: our users on Linux or CI cannot rely on it.
- Its own docs say isolation is not a security boundary. Anyone who relies on it for untrusted code (as assessment mode
  does) needs our read-only copy and guard, not a workspace.

## What not to adopt

- A GUI or a workbench. That is a different product with a funded team; Aveto's value is the rules and the evidence.
- A merge button inside Aveto. The owner's merge is the point.
- Webhook or API-triggered runs, until a Charter can approve the trigger and its credential.

## Open questions (read before acting)

1. Do hooks, `.claude/settings.json` and plugins load in Claude Code sessions that Conductor starts, and do permission prompts surface to the human? (Test with a fixture repo and the pack.)
2. Read "Conductor is joining Meta": what changes for users, pricing, data, and which agents stay supported.
3. Read "Claude subscription update for Conductor" (2026-06-15): what changed in how a Claude subscription can be used there, and whether our site's "a subscription to build" line needs a caveat.
4. Where do Conductor's chats, transcripts and code go (local only, or its servers)? Not on the pages read.
5. Is Conductor open source or closed? Not on the pages read.
6. Does the Checks tab block a merge, and does it respect GitHub branch protection? The docs call it prompts, not enforcement.
7. Pricing and limits (deferred to a harnesses page not read).

## Sources

- https://www.conductor.build/ , /docs , /changelog , /blog
- https://www.conductor.build/docs/concepts/workspaces-and-branches , /workflow , /agent-modes , /parallel-agents
- https://www.conductor.build/docs/reference/checks
- https://www.conductor.build/docs/api
- Related notes: `2026-10-orchestration-prior-art.md` (several agents, approvals as pause and resume), `2026-10-spec-kit-comparison.md`.

## Update 2026-11-04 (later the same day): open questions 2 and 3 are answered

Read in full: "Conductor is joining Meta" and "Claude subscription update for Conductor" (`docs/research/2026-11-f4-unread-sources.md`).
**From 2026-11-04 new users can no longer sign up or download Conductor**, its Cloud shuts down on 2026-11-20, and the local app
receives fixes only until early 2027. So the compatibility test in open question 1 is dropped (plan item F3), and the advice
"do not name Conductor as a dependency" stands more strongly: it is a closing product, not an emerging layer. The subscription
post is about Anthropic's paused change to Agent SDK billing; see the F4 note for what it means for Aveto. Questions 4 to 7 stay open and are unlikely to be worth answering.
