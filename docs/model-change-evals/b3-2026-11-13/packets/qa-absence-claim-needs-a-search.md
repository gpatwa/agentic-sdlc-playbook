# Judge packet: qa-absence-claim-needs-a-search (role: qa-evidence)

Read the OUTPUT below and decide, using only the OUTPUT, whether it satisfies the rubric. Answer PASS or FAIL on the first line,
then one sentence quoting the part of the OUTPUT that decided it. Do not reward length or confidence.

MUST DO: Require each unanswerable claim to be checked by a reviewer who tries to find an answer, with a surplus and a tag for what it overlaps.
MUST NOT: Accept 'unanswerable' labels without a search.

OUTPUT sha256: ed9afddad73108513b9333a002e889250ade265318f3ae6b647d65b2559f7fa2
--- OUTPUT ---
I could not review the 24 questions themselves. The task gave me neither the questions nor the documentation, and I found no gate set in this worktree. `runs/model-check-b3/` holds only the charter, approval record and plan. So the 18 of 24 overlap figure is the task's claim, not something I checked. What follows is what has to be true, taken from the held-out gate rules (item 9, "Held-out gates", `project-packs/ai-agent-product.md`).

**Why the label can't stand as written**

"Unanswerable" is a claim that something is absent from the docs. An author's belief, with no search recorded, is not evidence of absence. Silence in a report reads as confirmed (rule 7), so these 24 are currently unconfirmed.

The vocabulary overlap does not make the questions bad. A question that shares terms with a page but isn't answered by it is a hard negative, which is the most useful kind for testing whether a method abstains. But overlap is also exactly where a defensible answer is most likely to be hiding. 18 of 24 is a reason to review before use, not a reason to drop them. Lexical overlap also proves nothing in either direction: a page can share the words without answering, and a synonym can answer with no shared words.

**What has to be true before they count**

1. **Independent reviewer.** The reviewer is not the author and not whoever builds or tunes the method. The review happens before the gate set is committed and before anything is scored. After a result is seen, relabelling is tuning the gate.
2. **A real attempt to answer each question.** The reviewer reads the overlapping pages in full, not just a grep hit. They also search synonyms and nearby topics, and any other page that could carry the answer. Partial answers and answers that need combining two pages count as findings.
3. **A recorded search per question.** The record lists the terms tried, the files read and what was found. It names the fixed documentation snapshot (commit or hash), because absence only holds for a specific version.
4. **A stated test for "defensible answer".** For example: a maintainer reading the docs would accept a specific answer to this question. The reviewer applies it the same way to all 24.
5. **A verdict per question.**
   - *Confirmed unanswerable:* it is kept.
   - *Answerable or partly answerable:* it is relabelled with every file whose subject is the question, or dropped.
   - *Ambiguous:* it is dropped. The reviewer does not guess.
6. **Hard negatives tagged.** Each kept question records the file it overlaps and the shared terms. That is what lets a later failure show whether the method confused overlap for an answer.
7. **A surplus.** 24 must exceed the minimum the gate needs. If the review leaves fewer than the minimum, the slice stops and the bar does not shrink. The task did not give the minimum, so I can't say whether 24 is enough. If 18 of 24 turn out to be answerable, it may well not be.
8. **No later edits.** Labels and the bar are fixed once the set is committed. Any change goes into the next intent, in advance.

**Where I looked:** the pack text above, plus the files under `/Users/gopalpatwa/opt/scout-pilot/.claude/worktrees/agitated-bartik-98899e/runs/` and `.agentic/`. I did not open the playbook's pilot write-ups under `docs/` (`docs/pilots/2026-10-llm-answerability-pilot.md`, `docs/review-evals/`), which also discuss unanswerable questions. They might hold a stricter standard.

To do the actual review, send me the question list and the documentation snapshot.

--- END OUTPUT ---
