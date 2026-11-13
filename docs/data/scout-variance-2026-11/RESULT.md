# Scout variance test: result (checked 2026-11-13)

> Read by the support session from the files, against `VARIANCE_TEST.md` (criteria fixed before the run, sha256 `3eb08b26…ffeca`),
> not from the Orchestrator's report. Records copied unchanged from the scratch repo `scout-pilot` (worktree `zen-kirch-757481`,
> commit `6c0835c`) into `records/`.

## Approval and spend

- Charter `records/CHARTER.md`, sha256 `b33348c7…8443d` (recomputed: matches). Approved by the owner's typed words with the full
  64-character hash (`records/APPROVAL_RECORD-1.md`). **C4.1, the web-search terms status, was again not stated** (fifth run without it).
- Spend: 55.8k, 59.3k and 55.9k per spawn, **171.0k in total** (harness figures), under the plan (180k), ceiling (270k) and hard cap
  (330k). The Orchestrator's own turns are not counted.
- Event log: chain intact, 243 lines (recomputed with `events-verify.mjs`); the one warning is the Orchestrator's copy command.
  **All 72 web-call `post` lines carry the new `out` hash (pack v35 item 7).**

## Measures

| Measure | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Top candidate | 2. Count of AI-written PRs a person reviewed | 1. Audit record of agent actions | 3. Agent token spend per team |
| Second | 1. Audit record | 2. PR review count | 2. PR review count |
| Labels | all five "needs more discovery" | all five "needs more discovery" | all five "needs more discovery" |
| Pages fetched | 12 | 14 | 14 |

- **Rank agreement:** the top candidate differs in **every** run. Runs 1 and 2 share the same top-two set in reverse order; run 3's
  does not. Candidate 2 (PR review count) is first or second in all three.
- **Pages read:** only **2 pages were fetched by all three runs**; pairs share 2, 3 and 5. The runs largely read different sources.
- **v35 rules:**
  - *Shared origin counts once:* stated as the counting rule in each run (run 2: "one signal per origin"; S8 and S9 counted as one;
    figures with no visible origin counted for nothing; Gartner-via-a-vendor counted 0 in run 1).
  - *Non-vendor evidence or "none found":* every run looked for and used non-vendor sources (an MSR paper, an IETF draft, regulator
    text, Pragmatic Engineer and LeadDev reporting). Runs 1 and 2 wrote "none found" where they found none; **run 2 did not state a
    non-vendor line for each of its five candidates**, only in its table and "Could not find". A partial miss of the rule's wording.
  - *A search to disconfirm:* every candidate in every run has a "Disconfirming" section, and the runs report the disconfirming
    searches they ran (for example "git history already sufficient", "overhyped / not worth it").
  - *No "ready" on vendor pages alone:* held; no candidate was marked ready in any run.

## Reading (as fixed before the run)

**Unstable.** The top candidate differs in all three runs, so **no single Scout run should be used to choose work**; the pilot's
"use as leads" stands. What **is** stable: every run says no candidate is ready and recommends more discovery, and every run puts
the PR-review-count candidate in its top two.

The most likely cause, from the record: the runs read mostly different pages (2 shared), and each candidate's evidence is one or
two thin signals, so whichever pages a run happens to find decide the order. This is an inference; the test did not isolate it.

## What this means for next steps

1. The Scout's **ranking** is noise at this evidence level; its **gaps and "needs more discovery" verdict** are consistent. Treat its
   output as a reading list and a gap list, not an order.
2. The discovery interviews (`docs/discovery/INTERVIEW_GUIDE.md`) are now the better source of evidence on which candidate matters;
   the PR-review-count candidate is the one to ask about first, since it is the only one in every run's top two.
3. A verifier (`docs/research/2026-11-scout-verifier-plan.md`) would not fix this; more evidence would. Running the Scout again
   without new evidence would only reshuffle the order.

## Limits

Three runs, one model, one day, one question; "unstable" means "flipped in three tries", not a rate. Rule compliance was read from
the files by section and keyword, then by reading the text where it was unclear; it is a reading, not a scored check.
