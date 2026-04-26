# QA Evidence — <slice name>

> Owner: QA Evidence Agent
> Status: <draft / ready for security>
> Source diff: <commit SHA(s)>

## Commands run

In order, using the project's commands from `.agentic/LOCAL_COMMANDS.md`.
Record actual output (tail at minimum).

| # | Step | Project command | Result | Notes |
|---|------|-----------------|--------|-------|
| 1 | Typecheck | `<command>` | pass / fail | <tail> |
| 2 | Targeted tests | `<command>` | pass / fail | <tail> |
| 3 | Full test suite | `<command>` | pass / fail | <tail> |
| 4 | Build | `<command>` | pass / fail | <tail> |
| 5 | Local regression | `<command>` | pass / fail | <tail> |
| 6 | Whitespace / diff check | `git diff --check` | pass / fail | — |

> For TypeScript / Node projects these are typically `npm run typecheck`,
> `npx vitest run <file>`, `npm test`, `npm run build`, `npm run qa:mvp`.

## UI verification

For each state listed in the UX spec, evidence of the state rendering:

| Screen | State | Evidence | Notes |
|--------|-------|----------|-------|
| <screen> | empty | screenshot / snapshot | — |
| <screen> | loading | screenshot / snapshot | — |
| <screen> | error | screenshot / snapshot | — |
| <screen> | success | screenshot / snapshot | — |

Console errors / warnings observed: <none, or list>

## Safety invariant verification

For each invariant the slice touches:

| Invariant | Verification | Result |
|-----------|--------------|--------|
| `<from .agentic/SAFETY_INVARIANTS.md>` | `<test/eval/inspection>` | pass / fail |

## Deferred / skipped

| Item | Why deferred | Owner |
|------|--------------|-------|
| <item> | <reason> | <agent or human> |

## Recommendation

- [ ] Pass to Security & Privacy Agent
- [ ] Block — return to <agent> for <reason>

## Hand off

Next agent: Security & Privacy Agent.
