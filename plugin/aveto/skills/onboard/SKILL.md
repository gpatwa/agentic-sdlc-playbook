---
name: onboard
description: Propose the .agentic/ project files (context, local commands, safety invariants) for an existing repository, derived from the repository itself. Every line is marked "(proposed, not confirmed)" and nothing existing is overwritten.
disable-model-invocation: true
argument-hint: <git-repo-path>
---

# /aveto:onboard

Writes three proposal files into `<repo>/.agentic/` so an owner can adopt an existing repository under Aveto's gates:

```bash
node "${CLAUDE_PLUGIN_ROOT}/execution/onboard.mjs" <repo>
```

Pass the path as its own argument; never paste user text inside a quoted shell string.

- It **creates files in the user's repository**, so tell the user that first and get a yes. It never overwrites a file that already exists (it says "left alone").
- Every derived line is marked "(proposed, not confirmed)". Tell the user none of it is binding until they confirm it and a Charter names it, and that the invariants only the owner knows (what must never happen to a user, to money, to data) still have to be written by them.
- This skill does **not** install the pack (agents, hooks, protocols, Charters). That step, `install.mjs`, works from a playbook checkout because the installed documents refer to its location; it is not part of this plugin yet.
- To assess the repository without changing it, use `/aveto:assess`, which works on a read-only copy.

Report which files were proposed and which were left alone.
