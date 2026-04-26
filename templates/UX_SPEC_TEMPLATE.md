# UX Spec — <slice name>

> Owner: UI Designer Agent
> Status: <draft / ready for architecture>
> Source feature spec: <path>

## Layout per screen

Describe layout in prose or reference a design file. Include hierarchy
(what dominates, what's secondary).

### <Screen 1>

- Layout: <description>
- Notable visual treatments: <e.g. "approval CTA uses emerald primary;
  destructive action uses outline only">

### <Screen 2>

...

## States

For each screen, the final treatment of every state from the feature
spec.

### <Screen 1>

- **Empty:** <copy + visual + CTA>
- **Loading:** <treatment>
- **Error:** <copy + recovery CTA>
- **Success:** <treatment>
- **<Product-specific state>:** <treatment>

## Copy

Final copy for every text element. No placeholders.

| Element | Copy |
|---------|------|
| <field/button/heading> | "<final string>" |
| ... | ... |

## Interactions

- Focus order: <description>
- Keyboard: <shortcuts, escape behaviour>
- Animations: <if any — short, purposeful, respects reduced-motion>

## Component reuse map

| Component | Reuse / Extend / New | Notes |
|-----------|----------------------|-------|
| `<existing component>` | reuse | as-is |
| `<existing component>` | extend | add `<prop>` |
| `<new component>` | new | justified by <reason> |

## Hand off

Next agent: Software Architect.
Artefacts to produce: tech spec.
