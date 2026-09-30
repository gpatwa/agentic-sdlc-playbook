# Project Pack — AI Agent Product

Use for: a product where one or more agents (LLM-driven or otherwise)
take action on behalf of the user — research, drafting, planning,
intelligence, recommendations.

---

## Product principles

- **Deterministic-first.** Every capability has a deterministic
  implementation. The LLM is an upgrade path, not the only path.
- **LLM as adapter.** Real model clients sit behind a placeholder
  adapter that throws by default. Tests run without keys.
- **Never invent user-facing claims.** When the source data is missing,
  the system says so. It does not fabricate a value the user might
  rely on (resume bullets, recruiter names, salary numbers, dates,
  credentials).
- **Audit every automated action.** Each agent action that produces a
  user-visible artefact emits an audit event with `generationMode` in
  the metadata.
- **Explicit gates between agent stages.** When an agent's output flows
  to a user-affecting action, there is an approval gate (see
  `docs/HUMAN_APPROVAL_RULES.md`).

## Lifecycle adjustments

- **AI Engineer is a separate role from Backend.** Eval suites, prompt
  versioning, and adapter boundaries are first-class artefacts. See
  `agents/ai-engineer.md`.
- **Eval suites are required.** Every safety invariant the agent
  touches has at least one deterministic eval case in the suite.
- **Tech spec includes prompt version label.** Prompts are checked
  into the repo with `<capability>-v<n>` names.

## Default release tier

- New deterministic capability: **Tier 2**.
- Wiring a real LLM client behind a placeholder for the first time:
  **Tier 3**, plus the rule-5 approval in
  `docs/HUMAN_APPROVAL_RULES.md`.
- New eval suite: **Tier 2**.

## Safety invariants (recommended floor)

- Placeholder LLM adapter throws with the message
  `"<capability> LLM adapter is not configured in this build."`.
- Generated content is never persisted as if it were verified user
  data.
- Audit events include `generationMode: "deterministic" | "llm"`.
- Sensitive inputs (resumes, application answers, demographics) are
  never logged in full.
- The user can always inspect what the agent did and why.

## Adapter pattern (canonical)

```ts
export interface XAdapter {
  name: string;
  generate(input: ...): Promise<...>;
}

class DeterministicXAdapter implements XAdapter { /* always available */ }

export class PlaceholderLlmXAdapter implements XAdapter {
  name = "llm-x-adapter-boundary";
  async generate(): Promise<never> {
    throw new Error("LLM X adapter is not configured in this build.");
  }
}
```

## Eval discipline

- Every capability has a suite (e.g. `match_score`, `recruiter_crm`,
  `autopilot_safety`).
- Every safety invariant the capability touches has a dedicated case
  in that suite.
- Cases are deterministic — no API calls, no random seeds without a
  fixed seed.

### Held-out gates (for retrieval, ranking, classification)

Proven on aveto-support, where it caught two methods that scored 71–79% on
questions the designer had seen and 47–69% on questions it hadn't:

1. **The gate set is written by the owner or QA, never by whoever builds the
   method**, and committed before the method is tuned.
2. **Once a set has been seen, it stops being evidence.** Keep it as a
   development set; it is reported, never gates.
3. **Freeze first.** Record the method's commit; only then is the next gate
   set committed. Git order is the proof. Run it once.
4. **Review the labels before the freeze, by someone other than the drafter.**
   For each question, list *every* file that defensibly answers it — a
   template's owning role, a protocol's command. A too-narrow label fails a
   correct answer, and it cannot be fixed after the run: relabelling a seen
   result is tuning the gate.
5. **Never change the bar, or the labels, after seeing a result.** A bar
   that should move is changed in the next intent, in advance (approval rule 4).
6. **Report the diagnostic that separates causes** — e.g. recall with no
   confidence cutoff — so a failure says whether ranking or abstention broke.

## Anti-patterns specific to AI agent products

- Wiring a real model client because "it's just for testing".
- Letting the placeholder return a fake successful response.
- Using the LLM to fill a field the user must verify.
- Eval suites that only test happy paths.
- Audit events that omit the generation mode.
- Persisting prompt completions as if they were ground truth.

## Worked examples

- Agentic Job Ops:
  - `src/services/recruiterCrmService.ts` — deterministic outreach
    drafts behind an `OutreachAdapter` interface, with a placeholder
    LLM adapter that throws.
  - `src/services/autopilotService.ts` — `autopilotCanSubmit()` returns
    `false` constant; runtime check rejects any attempt to disable
    `requireApprovalBeforeSubmit`.
  - Eval suites at `src/services/evalService.ts` (cases tagged
    `recruiter_crm`, `autopilot_safety`, etc.).
