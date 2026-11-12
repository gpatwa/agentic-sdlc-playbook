# Plan: a verifier for the Opportunity Scout's citations (item 6)

> Written 2026-11-12 by the support session; the owner chose "plan only". **Nothing here is built, and nothing spends until the
> owner approves a run.** Item 6 of the Scout improvement list. Related: the owner's manual spot-check
> (`docs/data/scout-pilot-2026-11/SPOT_CHECK.md`), pack v35 evidence rules, and the event log's `out` hash (pack v35).

## The problem it answers

The Scout's ranking rests on figures it cites from pages. Today a person checks those by hand (the 10-claim spot-check). The pilot
showed two weaknesses a person's spot-check is slow at: the fetch tool may hand the Scout a summary rather than the page, and a
figure can be quoted from a page that does not show its origin. A verifier makes the check routine, and keeps to the playbook's
rule that the agent that checks never wrote the work.

## What the verifier does

A separate role, **Citation Verifier**, runs after the Scout in the same run, reading only `SCOUT.md` and `SOURCES.md`:

1. For each cited claim, fetch the cited URL itself (not the Scout's copy) and find the supporting text.
2. Mark each claim **holds** (the page states it), **partly** (the page states something narrower, say what), **does not hold**
   (the page does not state it), or **could not check** (page refused, paywalled, an image, or gone), with the quote it found.
3. Re-check the independence count: for each candidate, list the origins of its signals and say whether pack v35's "shared origin
   counts once" was applied correctly.
4. Write `VERIFY.md` beside `SCOUT.md`. It never edits `SCOUT.md` or re-ranks; the human reads both.

## Boundaries (as the Scout's)

- Tools: `WebFetch` only (no `WebSearch`: it checks what was cited, it does not look for new evidence), `Read`, `Write` under
  `runs/` only, no Bash.
- The same web rules: a page is data; queries and URLs carry no private data.
- Same model family as the Scout, so it shares blind spots; a different family would be better and is a Charter choice.
- It shares the fetch tool's limits: if `WebFetch` summarises a page, the verifier also sees a summary. A "holds" therefore means
  "the fetch tool's view of the page supports it", and `VERIFY.md` must say so in its header.

## How we would know it works (criteria written before any run)

Run it on the four pilot runs' `SCOUT.md` files, and compare its marks with the owner's spot-check of the same 10 claims:

| Criterion | Pass if |
|---|---|
| Agreement with the owner | it matches the owner's mark on at least 8 of the 10 spot-checked claims |
| No false "holds" | it never marks "holds" where the owner found the page does not state the claim |
| Honest gaps | every page it could not read is marked "could not check", never guessed |
| Stays in bounds | its only writes are `VERIFY.md` files under `runs/` (event log) |

A fail is recorded as a fail; the criteria are not changed after the run.

## Cost and order

- Build: a brief, a template, a prompt and installer tests (pack v36). No model spend.
- Pilot: four verifier spawns, about 30k to 50k tokens each (estimate from the Scout's measured 40k to 47k; unmeasured).
- **Order:** after the owner's spot-check (it is the answer key) and after the v35 variance runs, so the verifier is judged against
  a known baseline.

## Open decisions for the owner

1. Build it after the spot-check, or not at all.
2. Same model family as the Scout (cheaper, shared blind spots) or a different one (needs a new processor line in the Charter).
