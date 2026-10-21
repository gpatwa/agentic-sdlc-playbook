# Plan: who can do what, and how we would know (agent access control and observability)

> **Status: proposed 2026-10-21 at the owner's request ("is there observability and
> access control/authorization for all our agents?"); not built.** Section 1 is an audit
> of what exists, read from the code on that date. Sections 3 to 5 are the plan. Nothing
> here is a claim about the product until it is built and tested; the playbook's
> "Security and data" part should carry the limits in section 2 meanwhile.

## 1. What exists today (read from the code, 2026-10-21)

**Access control**

| Control | Where | What it does |
|---|---|---|
| Tools per role | `execution/install.mjs` (`BASH_ROLES`, `tools:` in each generated agent) | Doc-only roles get `Read, Write, Edit, Grep, Glob`. Roles that build or verify also get `Bash`. |
| Write scope for doc-only roles | `execution/hooks/write-scope-guard.mjs`, wired per agent | Allows writes only under `runs/` plus the few files the role owns. Fails closed. The role comes from the agent file's own command line, not from the payload. |
| Judge-style agents | aveto-support agent files | No tools, a deny list ending in `mcp__*`, and a match-all deny hook. |
| Approval by Charter | `execution/charter-check.mjs`, `execution/standing-charter.mjs` | One hash-approved document names models, processors, files, end actions and permission rules. |
| Budget | `execution/hooks/budget-guard.mjs` | Checks spend against the budget before each step. A cost control, not a security control. |
| Approvals bound to GitHub | `execution/verify-approvals.mjs` | Confirms an approval record's pull request against GitHub itself. |
| Credentials | `HUMAN_APPROVAL_RULES.md` | Agents never handle credentials; the Azure run uses a managed identity limited to the roles its Charter lists. |

**Observability**

| Record | Where | What it shows |
|---|---|---|
| Stage trace rows | `runs/<slice>/STATE.md`, `trace.json` (trace@2) | Model, tokens, wall-clock, retries per stage; each field marked with its provenance. |
| Analysis and inventory | `execution/analyze.mjs`, `usage.mjs`, `RUN_INVENTORY.md` | Cost and time across runs. |
| Optional OpenTelemetry | `execution/pack/protocols/TELEMETRY.md` | Metrics, logs and spans from Claude Code, if a collector is attached. |
| Run record | approval records, `code-review.md`, `END_REVIEW.md`, conformity export | Who decided what, findings and their dispositions. |

## 2. The gaps (stated plainly)

| # | Gap | Why it matters |
|---|---|---|
| G1 | **Roles with Bash are not scoped.** The code says so: Bash can write around a Write/Edit hook. | Builders and verifiers can change any file the shell can reach. Their limits are the Charter's permission rules and review, not a technical block. |
| G2 | **No identity per agent.** Every agent acts as the operator's session, git author and cloud login. | Git history and the Azure activity log cannot show which agent did what, or tell an agent's commit from a person's. |
| G3 | **Control is by tool and path, not by data.** Nothing stops an agent reading any file in the repo. | A secrets file in the tree would be readable. Secret-path exclusion exists only as a plan for review mode (M3b). |
| G4 | **The run record is not tamper-evident.** `STATE.md` and the trace are files the same agents can write. | Git history is the only integrity check, and a Bash role can rewrite files before they are committed. |
| G5 | **Per-role attribution is missing from metrics.** `TELEMETRY.md`: user-defined agents collapse to `custom`. The OpenTelemetry path has never been observed live, and figures are self-reported when it is off. | Per-role cost and activity cannot be shown from what we collect today. |
| G6 | **No alerting.** A denied tool call or an out-of-scope action notifies no one. | The first sign would be the end review, if the agent mentions it. |

## 3. Facts about Claude Code this plan relies on (read 2026-10-21 from its documentation)

- **Hooks carry the agent.** Hook inputs include `agent_id` and `agent_type` when the hook
  fires inside a subagent, and the same configured hooks fire for a subagent's tool calls.
  `PostToolUse` fires after a successful call; a failed call goes to `PostToolUseFailure`.
  A `PostToolUse` hook cannot block, because the tool already ran. Managed hooks cannot be
  disabled by user, project or local settings.
- **Read deny rules exist:** `Read(./.env)` or `Read(./secrets/**)` in permissions. They apply
  to the built-in file tools and, on a best-effort basis, to Grep and Glob. **Bash rules match
  command text and are not a security boundary** (the same program invoked in another form
  is not matched).
- **The Bash sandbox is OS-enforced** on macOS, Linux and WSL2 (not native Windows). By default
  it limits writes to the working directory and temp, denies writes to protected paths (the
  `.claude` settings, agents, commands and hooks, `.mcp.json`, shell startup files, git
  hooks and config), and can limit network domains and reads (`filesystem.denyRead`).
  **It covers shell commands only:** the file tools, MCP servers and hooks run outside it.
  By default a failed command can be retried outside the sandbox; `allowUnsandboxedCommands: false`
  turns that off.
- **Not verified:** whether a subagent's Bash calls always run under the parent's sandbox
  settings. A test must prove it before anything depends on it.

## 4. The changes

### A1. A hash-chained event log (closes G4, most of G5)

A hook (`execution/hooks/event-log.mjs`) on `PreToolUse` (denies), `PostToolUse` and
`PostToolUseFailure` appends one line per tool call to `runs/<slice>/EVENTS.jsonl`:
time, `agent_type`, `agent_id`, tool, the path or command **hash** (never file contents or
command output), outcome, and the SHA-256 of the previous line. Agents never write the file;
the hook does. `execution/events-verify.mjs` recomputes the chain and reports a break.
The Release Manager's gate fails on a broken chain, and `END_REVIEW.md` reports counts per
role. Honest limit: a hash chain shows tampering after the fact; it does not prevent it
(A5 narrows who can edit the hook).

### A2. Telling agents from people in git (closes G2 in history)

Routine runs set a distinct git author (`Aveto routine run <noreply@aveto.dev>`) and add an
`Aveto-Run: <slice-id>` trailer. Process v2 runs keep the operator's author and add the
trailer. The Orchestrator's commit step checks both; a test pins them. For cloud actions
the identity comes from the OIDC pipeline in `docs/PROCESS_V3_PLAN.md` V3.5 (its own
identity, scoped to one resource group), so the activity log names the pipeline, not the person.

### A3. Alerts (closes G6)

The existing stage notice also fires on: a deny hook firing, a write outside the Charter's
paths, the event chain breaking, or a stop for the Charter's section 9. One line, the
reason, and the run's slice.

### A4. Read control for secrets (closes the file-tool half of G3)

The installer writes `Read` deny rules for secret paths to the repo's gitignored
`.claude/settings.local.json` (`.env*`, `*.pem`, `*.key`, `credentials*`, `.aws/`, `.ssh/`)
and the Charter template gains a line to extend them. A fixture test plants a secret file
and checks the file tools and Grep and Glob do not return it. **Honest limit:** this does
not stop a Bash `cat`; that is A5's job.

### A5. Scope the Bash roles (closes G1, the Bash half of G3)

Turn on Claude Code's Bash sandbox for runs: writes limited to the working directory (a git
worktree), protected paths untouched (this also protects the write-scope and event-log hooks
from Bash edits), reads of credential locations denied (`denyRead`), network limited to the
domains the Charter lists, and `allowUnsandboxedCommands: false`. The installer writes these
settings; the Charter's prerequisites table gets a row for them with a dry run. **Verify
first** that subagents inherit the sandbox (section 3). Where the sandbox cannot be used
(native Windows), the Charter says "no sandbox" in C6 and the end review repeats it.

### A6. Say it on the page (now, documentation only)

`docs/PLAYBOOK.md` part 8 states the Bash caveat and the gaps above in one short list, and
`docs/MESSAGING.md` registers "per-agent attribution" and "tamper-evident run log" as
planned claims, not published ones.

## 5. Order, bars, and when to stop

| Step | What | Done when | Estimate |
|---|---|---|---|
| S1 | A6: playbook and messaging wording | owner approves the wording; the claims check passes | 30k |
| S2 | A1: event log hook and verifier | tests: every tool call in a fixture run appears with `agent_type`; editing any line is detected; the hook never records file contents | 250k |
| S3 | A2: git identity and trailer | tests pin author and trailer for both run kinds | 100k |
| S4 | A3: alerts | tests: each trigger produces one notice; a clean run produces none | 100k |
| S5 | A4: read deny rules | planted secret is not returned by Read, Grep or Glob | 100k |
| S6 | A5: sandbox settings, **after** the subagent inheritance check | a live run proves a Bash role cannot write outside the worktree or to `.claude/`, nor read a planted credential file | 250k |

**Bars, declared now:** over the next five runs, **100%** of tool calls recorded with a role,
**0** chain breaks that were not a deliberate test, **0** secret-path reads, **0** writes
outside the Charter's paths, and a measured extra cost per run (reported, no target, because
no data exists). If the subagent inheritance check fails, A5 is replaced by running build
roles in a container or virtual machine, and the plan is re-opened.

**Order against other work:** S1 and S2 before the second routine run under any standing
Charter; S6 before any standing Charter is approved for aveto-support or a repo that touches
real data. The ask-the-docs run lands first and is not disturbed.

## 6. What the owner decides

1. **Turn on the Bash sandbox for every run in the installed repos,** accepting that some
   tools may need an allowed domain or an excluded command? (Recommended: yes, after S6's check.)
2. **Disable the unsandboxed retry** (`allowUnsandboxedCommands: false`)? (Recommended: yes.)
3. **A distinct git author for routine runs** (A2)? (Recommended: yes.)
4. **Order:** S1 to S5 now as pack v28, S6 when a session can run the live check.

## 7. What this plan does not do

It does not add per-agent cloud identities beyond the pipeline's, a central log service, an
anomaly-detection system, or protection against a person with the operator's own account. It
makes actions attributable and edits detectable; it does not make a compromised session safe.
