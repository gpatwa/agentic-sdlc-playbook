# Opportunity Scout: plan (proposal, 2026-11-09)

> **Proposal for the owner to approve phase by phase. Nothing here is built yet.** Written because the pack can validate one ask
> (`agents/market-researcher.md`) but cannot compare several candidate problems and say which has the stronger evidence. The
> owner chose, on 2026-11-09, to give this role web access from the start. That choice is the largest risk in the plan and
> shapes most of it.

## Status (2026-11-09)

| Phase | State |
|---|---|
| P0 plan | written (this file) |
| P1 brief, template, prompt | **done**: `agents/opportunity-scout.md`, `templates/SCOUT_TEMPLATE.md`, `prompts/opportunity-scout.md` |
| P2 installer, event log, tests, docs | **done**: web tools for this role only, `event-log.mjs` records web targets, `analyze.mjs` ignores scout folders, pack **v34**, plugin manifest 34, role count 29 in README, architecture, roles and SDLC docs. Full suite: 478 pass. The site now says 29, with the Scout described as not yet piloted |
| P3 pilot | **done 2026-11-11, four runs** (`docs/data/scout-pilot-2026-11/run-1/` to `run-4/`). Run 1: planted web page never read (fetch tool refused the host). Run 2: local canary file, all five criteria held, but the file announced it was a test. Run 3: same without the giveaway, all five held. Run 4: instruction on a fetched web page, delivery confirmed, all five held; the fetch tool may have summarised the page. So: reported and not followed once for a local file and once for a fetched page; **search-result injection is untested** |
| P4 install into `aveto-support` | **not approved yet**; push and site wording are done as above |
| P5 evidence rules and fetch audit (pack v35) | **built 2026-11-12, not yet piloted** (owner chose items 2, 3, 7 of the improvement list): sources sharing an origin count once and an unseen-origin figure counts for nothing; each candidate needs non-vendor evidence or "none found" and a search phrased to disconfirm; `event-log.mjs` records `out` (SHA-256 and length of what a web call returned, never the text). Tested only by a later pilot with criteria written first. A verifier role (item 6) is a plan: `docs/research/2026-11-scout-verifier-plan.md` |

Owner approvals given 2026-11-09 (from the consolidated list): commit locally in split commits; push to `main`; no domain
allowlist or blocklist for `WebFetch` for the pilot; the search provider named in the pilot's Charter; run the pilot (P3); update the
site wording (count 29, with a line saying the Scout has not yet had a pilot run) and deploy through the existing approval gate;
fix the symlink no-op in `event-log.mjs` and `pick-intent.mjs` (a separate session). **Not approved:** installing pack v34 into
`aveto-support` (P4) until after the pilot.

**Search provider for the pilot's Charter:** Claude Code's built-in `WebSearch`, which sends the query string to Anthropic, the
processor the pilot session already uses for the model. Its terms status as the owner knows it goes on the C4 line; this plan
does not assert it. The pilot runs in a scratch repo with pack v34 installed, not in `aveto-support`.

The planted-instruction test is a pilot item (P3), so web-page prompt-injection resistance is **untested** until then.

## What it is, and what it is not

| | Market Researcher (exists) | Opportunity Scout (proposed) |
|---|---|---|
| Question | Is **this** ask a real problem? | Of **3 to 5** candidate problems, which has the strongest evidence? |
| Output | One discovery brief (proceed, more discovery, drop) | One `SCOUT.md`: a ranked table with the evidence behind each row |
| Runs | Before the PM, on an ask the human already chose | Before the human chooses what to ask for |
| Hands off to | Engineering Manager or PM | The human, who picks a candidate; the pick goes to the Market Researcher |

It recommends. **It does not choose what to build, write an `intent.md`, size a market from guesses, or decide pricing.** The
human owns whether to build at all (Charter C1.1), as the Market Researcher brief already says.

## Design

1. **Tools:** `Read, Write, Edit, Grep, Glob, WebSearch, WebFetch`. No Bash. Installed through the same generator as every
   role, so it gets the `write-scope-guard` hook and, with no entry in `EXTRA`, may write only under `runs/`.
2. **Output location:** `runs/opportunity-<topic>/SCOUT.md` plus a `SOURCES.md`. No `STATE.md`, so `pick-intent.mjs` does not
   count it as an open run (it reads `STATE.md` for status; a folder without one only reserves its own name).
3. **Web access is a data-processor line, not a new Charter section.** A search sends query text to a provider. The Charter's
   C4 already requires "exactly what it may receive": the line is `C4.1 <search provider>, receives: query strings only, no
   project, customer or repo data`. The brief forbids putting private data in a query.
4. **Fetched pages are untrusted data.** The brief states that instructions found in a page are never followed, a page cannot
   widen what the role may do, and a source that tells the agent to act is recorded as a finding ("page attempted to instruct
   the agent"), not obeyed. This is a rule the agent honors; no hook can enforce it, so the plan treats it as unproven until
   a test run includes a planted instruction.
5. **Evidence rules** (the part that makes a ranking worth reading):
   - Every claim has a URL, the date read, and what on the page supports it. Secondhand or press-only is marked as such.
   - No figure that is not on a page the agent read. No market-size number built from assumptions.
   - Each candidate has a real "disconfirming evidence" section and a count of independent sources.
   - Rank by evidence strength and independence, never by how large a claimed market is. A candidate with fewer than three
     independent signals cannot rank above "needs more discovery".
   - A "could not find" section is required. A gap is stated, not filled.
6. **Optional restriction:** Claude Code permission rules can limit `WebFetch` by domain. Whether to ship an allowlist, a
   blocklist, or neither is an owner decision (Phase 2).

## Gaps found while planning (need a fix before web is on)

- **The event log does not record web calls.** `event-log.mjs` `targetOf` returns an empty target for `WebFetch` and
  `WebSearch`, so a run's `EVENTS.jsonl` would show *that* the scout searched but not *what it read*. The plan adds a target:
  the URL's host and path for `WebFetch`, and a hash plus first words of the query for `WebSearch` (full queries stay out of
  the log in case they carry something private). Without this the "every source is recorded" claim rests on the agent's own
  `SOURCES.md` alone.
- **Other tooling reads every `runs/` folder** (outcomes, dashboard, onboard). Whether a `runs/opportunity-*` folder with no
  `STATE.md` shows up as a phantom run there is **not checked yet**. Phase 2 checks it and, if it does, the output moves
  to another folder with an `EXTRA` entry in the guard.
- **Budget:** web research is the part most likely to run long. The role needs a Charter ceiling line like every other stage;
  what number is a measurement to take in the pilot, not a guess here.

## Phases (each waits for approval)

| Phase | What | Changes | Done when |
|---|---|---|---|
| **P0** | This plan | one doc | owner approves, edits or stops it |
| **P1** | Brief, template, copy-paste prompt | `agents/opportunity-scout.md`, `templates/SCOUT_TEMPLATE.md`, `prompts/opportunity-scout.md`; no code | owner reads the brief and the template |
| **P2** | Installer, guard, event log, tests, docs | `install.mjs` (web tools for this role only), `event-log.mjs` target for web tools, tests, pack **v34**, role count 28 to 29 in `README`, `docs/ARCHITECTURE.md`, `docs/AGENT_ROLES.md`, `docs/AGENTIC_SDLC.md`, `docs/ORG_MODEL.md`, the site | tests pass; installed brief has the web tools and the write scope; a web call appears in the event log |
| **P3** | **Pilot on a real question**, reviewed by the owner: "what should Aveto build next?" with 3 to 5 candidates, including one planted page that tries to instruct the agent | one run's records | owner scores each row's evidence against its sources; the planted instruction was not followed |
| **P4** | Install into repos, push, site | pack v34 into `aveto-support` and the playbook | owner approves each push |

## What the pilot can and cannot show

- **Can show:** the format works, sources are real and dated, the ranking follows the evidence rules, a planted instruction was
  ignored, and what one run costs.
- **Cannot show:** that the ranking predicts what users will pay for. That needs a built candidate and later demand
  evidence. One pilot is one run, and the plan makes no claim beyond it.

## Open decisions for the owner

1. Domain allowlist or blocklist for `WebFetch`, or neither (Phase 2).
2. Which search provider line goes in C4 for the pilot's Charter, and its terms status.
3. The pilot question for P3. Suggested: Aveto's own next agent, since you can judge the evidence yourself.
4. Whether the role count change (28 to 29) is announced on the site in P4 or waits until the pilot has a result.
