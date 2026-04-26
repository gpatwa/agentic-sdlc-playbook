# Tech Spec — <slice name>

> Owner: Software Architect Agent
> Status: <draft / ready for implementation>
> Source feature + UX specs: <paths>

## Summary

One paragraph. What's being built and why, in technical terms.

## Data model deltas

| Type | Change | Rationale |
|------|--------|-----------|
| `<Type>` | new / modified / removed | <why> |

For each new type, include a sketch of the schema (TypeScript or Zod
shape, or column list for SQL).

## Service surface

New or modified service functions:

| Function | Signature | Invariant |
|----------|-----------|-----------|
| `<file>:<fn>` | `(input) => Result` | <e.g. "throws if X gate not satisfied"> |

## Adapter boundaries

Where deterministic logic ends and an adapter begins:

| Boundary | Default adapter | Placeholder behaviour |
|----------|-----------------|------------------------|
| `<name>` | `Deterministic<X>Adapter` | `Placeholder<X>Adapter` throws |

## Audit / feedback / usage events

Every state-changing function emits at least one event. List them here.

| Event type | Emitted from | Metadata fields |
|------------|--------------|-----------------|
| `<type>` (audit/feedback/usage) | `<file>:<fn>` | `<key1, key2, ...>` |

## Integration points

Existing services this slice calls:

- `<service>` — for `<reason>`

## Test plan

What proves this works:

- Targeted tests: `<file>` covering <behaviour>
- Eval cases: `<suite>` cases `<id>`, `<id>`
- Manual UI checks: <list of states from UX spec>

## Rollback plan

If we have to undo this slice, here's how:

1. <step>
2. <step>

The rollback should be executable from this spec alone, without the
slice author present.

## Risks / open questions

- <risk> — <mitigation or "accepted because <reason>">

## Hand off

Next agent: Frontend / Backend / AI Engineer (specify).
Artefacts to produce: code + targeted tests + one focused commit.
