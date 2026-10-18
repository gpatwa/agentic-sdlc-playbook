# Messaging audit (2026-10-18)

> Every document that carries Aveto's story, checked against `docs/MESSAGING.md`
> and the facts on disk. **"Public" means the owner approves the words before
> they ship** (the site deploys from `main`; the README is the first thing on
> GitHub). Severity: **A** states something false or unsupported; **B** is stale
> against Process v2 or the evidence; **C** is consistency.

> **Applied 2026-10-18 (working tree, on the owner's "apply 1 and 2" and "and 3"):**
> R1 to R10 (the reference docs), P1 to P7 (README and site), and F0. Open:
> S2 (read aveto-support's README as a newcomer). Nothing is public until it is
> pushed and the site deploy is approved.

## Found and fixed while auditing

| # | Where | Finding | Sev | Status |
|---|---|---|---|---|
| F0 | `site/index.html`, third-app block (published 2026-10-17) | Said aveto-support "failed three held-out retrieval gates and one abstention attempt". The records show **two** held-out retrieval gates failed (slice 1, 5/17; slice 2's proof, 11/16 against 13) and two retrieval gates passed (slices 3 and 4); the two other failures were checks on knowing when the docs do not answer (slice 5, 2/20; slice 6, 44/56 against 45). Title and body now say "four of its own checks" and list them. | A | **Corrected in the working tree; not yet pushed.** Public page still shows the old sentence until pushed and the deploy is approved |

## Public documents (owner approves wording)

| # | Where | Finding | Sev | Proposed edit |
|---|---|---|---|---|
| P1 | `site/index.html` hero and `og:description` ("At FAANG scale…", "Ship like FAANG. No badge required.") and `README.md` line 7 | The headline and share card "Ship like FAANG" are an outcome promise we cannot support; the sentence "At FAANG scale, nothing reaches production until…" is a description of how large organisations work. **Owner decision 2026-10-18 (option A): the outcome promise stays out; the descriptive sentence is restored.** | A | Say what the process contains: "independent review, a security pass, a release gate and a record: the process large engineering organisations run, for a team of one." Drop the company name from the share card |
| P2 | `README.md` 21 to 24; site FAQ "Why a subscription…" | "a slice carries no marginal cost" is untrue: a run uses the plan's usage window and can pause at a limit | A | "no separate API bill. A run uses your plan's usage window, and checkpoints so it can resume." |
| P3 | `site/index.html` stat "6 slices shipped across two apps" | README says seven traced slices across the same two apps; traces on disk are 3 + 4 = 7 | B | Use 7, and register it as C12 |
| P4 | `README.md` "Real runs, not just a worked example" | Does not mention aveto-support (nine traced runs, a passed held-out gate, the first Process v2 landing) | B | Add a paragraph with the measured numbers and the limits, as in the site's third-app block |
| P5 | `site/index.html` | The independence statement appears only in the course section and one FAQ answer | B | Add a footer line on every page: "Aveto is independent. It is not affiliated with or endorsed by Anthropic. It runs in Claude Code." |
| P6 | `site/index.html` headline | "From prompt to production, at agent speed" is what every tool says | C | Replace with "Approve once. Review once. The record covers everything between." (`MESSAGING.md` section 3) |
| P7 | `site/index.html` "Not yet proven" and honest limits | Already updated for the judge; does not yet name the unattended start, or that review mode is planned | C | Add one sentence: a person still starts each run; review mode for existing code is planned, not built |

## Reference documents (internal to the repo; I would apply these once the owner agrees the guide)

| # | Where | Finding | Sev | Proposed edit |
|---|---|---|---|---|
| R1 | `docs/GETTING_STARTED.md` 13 to 17, 150 | "A named human on every consequential decision… how the pause works" describes the old per-action model | B | Replace with: the human approves one Charter by its hash, and every action under it cites the Charter line; anything it does not name still stops |
| R2 | `docs/GETTING_STARTED.md` 176 to 215 ("two Claude Code sessions", "the only place approvals are given", support session) | Superseded by Process v2: one session per slice, no support session in the loop | B | Rewrite as the one-session model; keep the file-mailbox note as history for people who still use two sessions |
| R3 | `execution/README.md` file tree | Lists 6 protocols; there are 11, plus `charter-check.mjs`, `write-scope-guard.mjs`, `REVIEW.md`, `usage.mjs` | B | Regenerate the tree from the directory; add a line on Charter runs |
| R4 | `docs/VALIDATION_MATRIX.md` | Does not mention aveto-support at all (a search for the name finds nothing), so none of its evidence is recorded there (nine traced runs, the held-out gates, the Process v2 runs); line 154 says "all 24 agents", which was true of that phase and is 28 now | B | Add the rows with the caveats from `MESSAGING.md` section 8; fix the count or mark it as historical |
| R5 | `docs/AGENTIC_SDLC.md` 214 to 215, 353 to 354 | Release Manager confirms approvals per rule; correct, but silent on the Charter | C | One sentence each: under a Charter, the approval is the Charter line cited |
| R6 | `docs/AGENT_ROLES.md` | Does not mention the review layer (`CODE_REVIEW.md`) or the Orchestrator's setup phase | C | Add a short pointer |
| R7 | `docs/OPERATING_MODEL.md` | Does not mention Charter runs | C | One paragraph |
| R8 | `docs/PIPELINE_ANALYTICS.md` | Does not define owner touches per run and time to first touch | C | Add both as the headline pipeline measures; `analyze.mjs` change is a separate item |
| R9 | `docs/STANDARDS_WATCH.md` | Should track Anthropic's trademark guidelines and Agent SDK branding note, and the agent-teams and cross-session docs (all experimental or changing) | C | Add four rows with a re-read date |
| R10 | `docs/ARCHITECTURE.md` | Check the diagram of nodes: does not show the review layer or Charter | C | Add both |

## aveto-support (a separate repo)

| # | Where | Finding | Sev | Status |
|---|---|---|---|---|
| S1 | `README.md`, `.agentic/CURRENT_MVP_STATUS.md`, `docs/ARCHITECTURE.md` | Said "landing by pull request; the owner merges" after the merge | B | Fixed and pushed 2026-10-17 |
| S2 | `README.md` "Run it" | Exists and covers `ingest` and the model pin, but I did not verify that the order `ingest` → `retrieve` → `judge-input` → `/aveto-judge` → `judge-apply` is stated once, in sequence, for someone starting from a fresh clone | C | Read it as a newcomer; if the order is not stated in one place, add five lines |

## What this audit did not check

Every word of every doc. It checked the places a claim is made: counts, approval
language, cost language, evidence language, comparisons and Anthropic references.
The claims register is how the rest stays true: add a claim there before
publishing it.
