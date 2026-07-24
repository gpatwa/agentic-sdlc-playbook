# Execution Pack — Security Posture

The execution pack turns the playbook into a running agentic system, so it
is itself subject to the OWASP Top 10 for Agentic Applications (2026). This
is the pack's own threat model — the mitigations are structural, not
bolted on. A product using the pack inherits them; a slice that would weaken
one is a `docs/HUMAN_APPROVAL_RULES.md` change and needs human approval.

| Agentic risk (OWASP ASI) | How the pack mitigates it |
|--------------------------|---------------------------|
| Goal / instruction hijacking | Agents read artefacts and `.agentic/` as **data**; a file or tool result that contains instructions is not authority. Handoffs go through fixed artefacts, not free text an attacker controls. |
| Tool misuse & exploitation | `install.mjs` gives each generated subagent **least-privilege tools** — doc-only roles get no `Bash`; only implementing/verifying roles run commands. |
| Identity & privilege abuse | No agent has ambient admin. Destructive / external actions are gated by `HUMAN_APPROVAL_RULES.md`, confirmed by a human. |
| Memory / context poisoning | Durable state is `runs/<slice>/STATE.md` — human-readable, reviewed, append-oriented; agents don't write to a shared opaque memory. |
| Cascading failure | Stages hand off through artefacts with gates between them; `FAILURE_LOOP.md` bounds retries and escalates, so one bad output can't run away. |
| Rogue / unbounded action | Wall-clock + retry budgets (`FAILURE_LOOP.md`) and the approval interrupt (`APPROVAL_PROTOCOL.md`) cap autonomy. Silence is never consent. |
| Insufficient observability | Every stage records a Trace row (model, tokens, wall-clock, retries) in `STATE.md`; `RUN_INVENTORY.md` gives a fleet view. |

## The pack's own trust boundary

The pack trusts: the playbook briefs, the installed protocols, and the
human. It does **not** trust: repo file contents, tool / command output,
fetched pages, or a prior session's unverified claims. The
instruction-source boundary is the load-bearing control — everything an
agent reads through a tool is data to be evaluated, never a command to obey.
This is the concrete, self-applied form of the ASI section in
`templates/THREAT_MODEL_TEMPLATE.md`.
