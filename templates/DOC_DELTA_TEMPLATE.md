# Doc Delta — <slice name>

> Owner: Tech Writer Agent
> Status: <draft / ready for Release>
> Verified against: <commit SHA(s) + QA evidence path>

## What changed for the user

One paragraph, plain language: what a user can now do, or what's different.
Written from the shipped behaviour, not the PRD's intent.

## Doc delta

| Artefact | Change | Status |
|----------|--------|--------|
| <help article / page> | <new / update / remove> | <drafted / done> |
| <API reference section> | <new / update> | <drafted / done> |
| <changelog> | <entry> | <drafted / done> |
| <release notes> | <entry> | <drafted / done> |

## Drafted copy

### <Artefact 1>

<the actual copy, in the product's voice>

### <Artefact 2>

<...>

## Breaking changes & migration

If behaviour changed in a way that affects existing users / integrations:

- **What broke:** <description>
- **Migration:** <step-by-step for the user to adapt>

If none: "No breaking changes."

## Release notes (user-facing)

Benefit-oriented, not a raw changelog:

- <one or two lines a user actually cares about>

## Intentionally not documented

Internal-only changes that correctly have no user doc, with a reason:

- <change> — <why it needs no user-facing doc>

## Verification

- [ ] Every claim above matches shipped behaviour (checked against the
      diff / QA, not the PRD).
- [ ] No documented capability is absent from the shipped build.
- [ ] Every breaking change has a migration note.

## Hand off

To the Release Manager (docs are a release-gate item). If an undocumented
breaking change surfaced, flag it back to the engineer as a blocker.
