# Plan: run memory (what agents remember between runs, and who controls it)

> **Status: proposed 2026-10-21 at the owner's request ("should we plan this?" after
> Kiro's memory release); not built.** It adds something to what an agent may read
> and write, so the owner decides section 6 before any of it is built.

## 1. Why

Under Process v3 a routine run has no human to re-teach it. Today nothing carries
conventions, corrections or ruled-out approaches from one run to the next in a product
repo, except the Post-Launch Learning stage's carry-forward note and `REVIEW.md`. Kiro's
memory (read 2026-10-21: `kiro.dev/blog/memory-in-ide-cli`, `kiro.dev/docs/memory`) names
the same gap: preferences, repo commands and conventions, corrections, debugging insights
and approaches ruled out, stored as distilled records rather than replayed conversations.

## 2. What we take from Kiro, and what we do differently

| Kiro (from its documentation) | Aveto |
|---|---|
| Four modes: Off (default), Use only, Use but don't learn, Use and learn | **Adopt, as a Charter line (C9).** The default is `use only`; `use and learn` needs the owner's approval of that Charter. |
| The setting is user-level; a workspace setting has no effect | **The mode lives in the hash-approved Charter, never in a file an agent can edit.** |
| Untrusted workspace: read, but no add, change or delete | **Writes only under a Charter that says `use and learn`.** A routine run's standing Charter says `use only` unless the owner changes it. |
| Records have a title, description and content; type Preference, Fact or Other; scope Global or one repository | **Repository scope only. No global memory.** Types: Preference, Convention, Fact, Ruled-out. Cross-repo memory leaks one codebase's details into another. |
| Stored locally per user account | **Stored as files in the repo (`.agentic/memory/`), reviewed in the pull request.** Team-shared and versioned by default. (Kiro's documentation does not describe team sharing; this is a design difference, not a claim about a flaw.) |
| Deletion from a Memory view, even in read-only mode | **A memory is removed by deleting its file in a pull request.** |
| Memory activity shown in chat; a Memory row in Context Usage | **`END_REVIEW.md` lists memories added, changed, removed and used, with their token cost.** |
| If a rule must apply consistently, put it in Steering | **If it must hold, it is not a memory:** it goes in `SAFETY_INVARIANTS.md`, `REVIEW.md` or the Charter. |

## 3. Design

**An entry** is one file, `.agentic/memory/<id>.md`, with front matter and a body:

```
id, type (preference | convention | fact | ruled-out)
scope: repo
source: runs/<slice>/ (the run that produced it)
true_at: <commit sha>
last_checked: <date>
confidence: observed | confirmed-by-owner
---
One to five lines. No code blocks over ten lines. No secrets, no personal data.
```

**Rules, each checked by `execution/memory-check.mjs`** (like `charter-check.mjs`):
1. Every field present; `type` in the list; `source` exists; `true_at` is a real commit.
2. A secret scan refuses keys, tokens and credentials; the entry is also refused if it
   matches a secret-path rule.
3. Size caps: an entry at most 600 characters; the folder at most 40 entries or 12,000
   characters (the budget the run loads), reported in `END_REVIEW.md`.
4. **A memory is data, never authority.** `memory-check` refuses an entry that contains
   words granting or lowering anything ("may", "is allowed to", "approved", "skip",
   "lower the depth", "no review"). A memory never stands in for an approval, a Charter
   line, an invariant or a depth.
5. **Verify before use.** A run that uses a `fact` or `convention` checks it against the
   code at the current commit; if it no longer holds, it is not used and is marked stale
   in the end review.

**Who writes:** the Post-Launch Learning stage proposes entries in the run's pull request
(or at the end of a routine run). Nothing writes directly to `main`. Under a standing
Charter with `use only`, the stage proposes nothing; it only lists candidates in
`END_REVIEW.md`.

**Who reads:** each stage loads at most the entries whose `type` and paths match its role
and files, through `memory.mjs list --type convention --path src/` (a small script, not a
database: a filter over the files).

**Why files, not SQL:** the records must be diffable, reviewable in a pull request and
auditable by a reader; they are small (tens of entries); and a database outside the repo
has no history (`docs/AGENT_SECURITY_PLAN.md` and the Silo comparison, 2026-10-21). A SQL
index could later be a derived cache, never the source of truth.

## 4. What it costs and what it risks

- **Context.** Recalled memory uses context (Kiro says so too). The 12,000-character cap and
  the filter bound it; the run reports the figure.
- **Poisoning.** A wrong or hostile entry could steer later runs. Controls: entries arrive by
  pull request, the author is a different agent from the reviewer, rule 4 above, and the
  event log in `docs/AGENT_SECURITY_PLAN.md` shows which role wrote it.
- **Staleness.** A true-at commit and the verify-before-use rule bound it.
- **Privacy.** No personal data and no secrets, checked by script; memory is repository-scoped
  and in the repo, so it follows the repo's own access control.

## 5. Order, bars, and when to stop

| Step | What | Done when | Estimate |
|---|---|---|---|
| M1 | Spec, schema, `memory-check.mjs`, `memory.mjs` | tests: each rule above refuses its bad case; the folder cap holds | 250k |
| M2 | Charter line C9 (memory mode) and `charter-check` support | a Charter with no C9, or `use and learn` in a standing Charter without the owner's own line, is refused | 100k |
| M3 | Post-Launch Learning proposes; stages read through the filter; `END_REVIEW.md` section | a dry run on a fixture repo adds, reads and reports entries | 200k |
| M4 | A measured trial: five routine runs with `use only` and a seeded memory set | bars below | one run each |

**Bars, declared now:** over five runs, repeat owner corrections **fall** against the same
repo's earlier runs (counted from `END_REVIEW.md`), extra context cost per run is reported
(no target; no data yet), **0** memories used after their `true_at` code changed, **0** entries
granting anything. If corrections do not fall in five runs, memory is not worth its context
and the plan stops at M3.

**Order:** after the ask-the-docs run lands, the routine dry run is clean, and
`docs/AGENT_SECURITY_PLAN.md` S1 and S2 are built (memory entries need the event log).

## 6. What the owner decides

1. **Adopt the four modes as Charter line C9**, with `use only` as the default?
2. **Repository scope only,** no global memory? (Recommended: yes.)
3. **Files in `.agentic/memory/`, not a database?** (Recommended: yes.)
4. **Order:** after the security plan's S1 and S2.
