# How Anthropic, OpenAI, Google and Meta describe the shape of agent-based software work (research note)

> Written 2026-11-13 by the support session from a research agent's report (pages read 2026-11-13, one search at a time, public
> terms only; no page contained instructions aimed at the reader). **I did not re-open the pages myself.** "Primary" means the
> company's own page or paper; secondhand items are marked. The question: how many agents or roles, how checking is separated from
> producing, where humans stay, and what is said about team structure. Related: `docs/ROLE_PROFILES.md`, `docs/ORG_MODEL.md`,
> `docs/research/2026-11-mckinsey-agentic-pdlc-talk.md`.

## What each says

| Company | Source (primary unless marked) | Shape of agents | Producing and checking | Humans |
|---|---|---|---|---|
| Anthropic | "Building effective agents" (2024-12) | No fixed number; workflows (set paths) versus agents (self-directed); orchestrator with workers is one pattern. Advice: find the simplest solution, add complexity only when needed | An evaluator-optimizer pattern: one model call generates, another evaluates | Pause for human feedback at checkpoints and blockers |
| Anthropic | Multi-agent research system (2025-06) | A lead agent plus parallel subagents, from 1 to over 10, scaled by task. Says multi-agent suits poorly shared-context and many-dependency work, **"most coding tasks"** included; about 15 times the tokens of chat | An LLM judge against a rubric, and a separate agent attributing claims to sources | Human testers caught failures the automated evals missed |
| Anthropic | Long-running agent harness (2025-11) | Two roles, an initializer and a coding agent, differing only in their first prompt. Whether one general agent or several specialists does better is left open; dedicated test, QA and cleanup agents "might" help, untested | The coding agent checked its own work, with end-to-end browser tests prompted | None described |
| Anthropic | Claude Code auto mode (2026-03) | n/a | A separate, reasoning-blind classifier reviews each tool call; it misses 17% of real overeager actions (Anthropic's own "honest number") | Users accept 93% of manual prompts ("approval fatigue"); escalation to a human after repeated denials; not a replacement for human review of high-stakes infrastructure |
| Anthropic | Claude Code docs: subagents, best practices | Focused subagents with their own context and tools; use the main conversation for phases that share much context. Says delegating the same task to a subagent does not by itself improve the answer | Code review in a fresh subagent that never saw the conversation | You approve the plan before a batch of parallel work |
| Anthropic | "Running an AI-native engineering org" (2026-06) | No agent count | Claude handles style, lint, bugs and tests | Humans stay for expertise: legal, security-sensitive code, product sense. Team stays flat, small pods, roles blur |
| OpenAI | "Building an AI-native engineering team" (undated) | A delegate, review, own table over seven phases; no agent count | Generate tests in a separate session from the implementation, new tests fail first; automated review before human review | Engineers keep final ownership of what ships; AI review supplements human review |
| OpenAI | "A practical guide to building agents" (PDF, date unconfirmed) | Maximise a single agent first; split when prompts hold many branches or tools overlap; manager and handoff patterns | n/a | Escalate on failure thresholds and high-risk actions |
| OpenAI | Codex approvals; Agents SDK human-in-the-loop | n/a | An optional separate auto-review agent screens approval requests | A human decides by default; an approval pauses the run |
| Google | Internal code migrations (arXiv, 2025-01) | A shared toolkit with per-migration prompts and validators; no agent count | Automatic build and test validation, then a model repair step | Review and rollout "largely human-driven"; review was the bottleneck, so weekly changes were capped; about 87% of AI code committed unchanged |
| Google | DORA 2025 report and blog | 61% never use AI in agentic mode; today's tools are assistants, not autonomous agents (a 2025 usage fact, not a design view) | Not extracted | Seven team archetypes; AI as a multiplier of the team that exists; platform engineering as a foundation |
| Meta | TestGen-LLM (arXiv, 2024-02) | A filtered pipeline | Candidate tests pass filters that assure measurable improvement before engineers see them; engineers accepted 73% | Engineers review what survives |
| Meta | RADAR (arXiv, 2026-05) and an overnight-testing post (2026-10) | A staged funnel: eligibility, a diff risk score, model review, deterministic validation. Two test workflows with a judge ensemble and a rule-based assessor | Generation and judging are separate stages | "Human-on-the-loop": engineers set criteria and review aggregates; the post gives no counts. RADAR's incident rate (1/50 of other diffs) is observational telemetry |

Not read in full: Meta's mutation-guided test paper (secondhand summary only), a Google review-comments post (summary only), DORA's
code-review chapter. Not found: an Anthropic "AI-native SDLC" course page (the playbook's source for that is third-party).

## What they agree on

1. Start with one agent or a simple pipeline; add structure only when it earns it (Anthropic, OpenAI).
2. **Producing and checking are separate, and the checker does not share the producer's reasoning** (Anthropic's fresh reviewer and
   reasoning-blind classifier, OpenAI's separate test session, Google's validators, Meta's filters and judge).
3. Mechanical checks sit beside model checks (Google, Meta).
4. Humans keep final ownership and handle high-risk or novel cases; human review is the scarce resource, so tooling filters what reaches it.

## Where they differ

- Anthropic and OpenAI describe agent shapes; Google and Meta describe pipelines of models and validators with almost no agent vocabulary.
- Meta moves toward humans on the loop (aggregates and policy); OpenAI and Google still describe a human reviewing the change.
- Anthropic's long-running harness lets the coder test its own work; OpenAI recommends a separate session for tests.

## What none of them says

No org chart, no count of agent roles for software delivery, no number of specialist roles for an SDLC pipeline, no controlled evidence
that more specialisation beats fewer agents on coding work, and no named person accountable when an agent-landed change fails.

## Reading (the research agent's, not the sources')

These sources support **a few roles split by function (produce, independently check, a human decides), where function means different
context and tools rather than a different job title**. They support specialisation where context is separable, work parallelises, or
independence from the producer matters. They do **not** support one specialist per SDLC activity: the coding-specific cautions
(shared context, token cost, dependencies, and "delegating does not by itself improve the answer") point the other way. A 29-role
design has to rest on Aveto's own evidence, not on these sources. The best-supported elements are the independent checker and human
ownership of the ship decision.

## What this means for Aveto

- **Supports:** the checker never being the author, human ownership of the merge, fresh-context review, a mechanical gate beside a
  model review, evals as gates, and the EM shortening the chain per slice.
- **Not supported by these sources, and ours alone:** that 29 specialists beat fewer producing roles. No run of ours has compared them
  either; O3 would. Until then this is a hypothesis, which `docs/ROLE_PROFILES.md` already says.
- **A public-wording risk (the owner's to decide):** the home page's argument for the roles ("one agent asked to build a product
  makes every decision from the same context, with the same blind spots") is an assertion these sources do not back for coding work.
  Anthropic says delegating the same task to a subagent does not by itself improve the answer, and the separation that is backed is
  *checking from producing*, which is what the Verify group on the site already says.
