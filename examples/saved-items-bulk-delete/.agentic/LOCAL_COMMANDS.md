# Local Commands — Stash

> Sample `.agentic/` for the worked example. The exact commands an agent
> runs locally to verify a change.

| Purpose | Command |
|---------|---------|
| Typecheck | `npm run typecheck` |
| Targeted test | `npx vitest run <file>` |
| Full test suite | `npm test` |
| Build | `npm run build` |
| Local regression (QA gate) | `npm run qa:mvp` |
| Lint / whitespace | `npm run lint` |
| Preview (UI verification) | `npm run dev` → http://localhost:5173 |

## Notes

- `npm run qa:mvp` runs typecheck + full suite + a headless smoke of the
  core flows (list, add, delete). QA re-runs this independently.
- No command in this project makes a network call to a real LLM or a
  third-party API. If one would, that's a `HUMAN_APPROVAL_RULES.md` rule 5
  conversation first.
- Never bypass hooks (`--no-verify` and friends).
