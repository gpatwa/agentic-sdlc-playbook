I didn't write this to `runs/`. The task gave no slice id and said to work only from what's in it. So I didn't open the existing `runs/model-check-b3/` files or update a `STATE.md`. Here is the section for the tech spec.

---

## Evaluation: how the second stage is judged

### E1. What is wrong with the proposed gate as written

The proposed gate is "the correct file is in the top 5 for at least 13 of 16 held-out questions." It has three gaps.

1. **It has no baseline.** It scores the reranker on its own and never compares it with the first stage. If the first stage already gets 13 of 16, the gate passes with zero gain. The user would then pay 2.3 to 3.8 s per question for nothing. The baseline on the held-out set has not been reported anywhere in the task (**unconfirmed**).
2. **It can be passed or failed by the setup alone.** If the reranker only reorders the first stage's top 5, the set of files in the top 5 doesn't change. Top-5 accuracy is then identical by construction, and the gate measures nothing. The task doesn't say how many candidates the reranker sees (**unconfirmed**). The reranker can only improve top-5 accuracy if it reranks a larger pool (top K, with K > 5). The first stage's top-K accuracy is then a hard ceiling.
3. **16 questions can only show large effects.** 13/16 is 81%, with a 95% interval of roughly 57% to 93% (Wilson). In a paired comparison on the same 16 questions, only questions where the two stages disagree carry information. The reranker needs at least 5 rescues and 0 losses (or 7 and 1) to reach one-sided p < 0.05 on an exact McNemar test. Any smaller gain is within noise. It can still justify a product decision, but not a claim that it generalises.

### E2. Fixed before any held-out run

These are written into this spec and not changed afterwards:

- **Candidate pool K.** How many first-stage results the reranker sees, and the input length the reranker can take. Also what happens to files longer than that limit: truncate, split into chunks, or take the best chunk.
- **What counts as correct.** The correct-file label for each question, set before the run. If a question has more than one acceptable file, list them all.
- **Configurations.** A is the first stage alone, top 5. B is the first stage's top K, then the reranker, then top 5. Same corpus, same index build, same hardware, same question order.
- **Locked settings.** The reranker model ID and full revision, and every setting: K, truncation, batch size, score threshold if any. All tuning happens on the seen sets only.
- **The held-out set's sha256.** Plus a statement that nobody has run either configuration on it during this slice.
- **The decision rule (E4), including its numbers.**

### E3. Pilot on the seen sets first (before Implementation)

Run a throwaway script on the seen sets only, comparing A and B per question. The stop condition is written down before the run: if B's rescues are not more than its losses, or any loss is traced to truncation or input length, the proposal stops. It is then reported with its numbers and doesn't go on to be built.

A real reranker model also needs the rule 5 / Charter C3 human approval before this pilot runs. This section does not grant that approval.

### E4. Decision rule for the held-out run

Both configurations run once on the held-out set. Each question is classed as:

- a **win**: A misses, B hits
- a **loss**: A hits, B misses
- **both hit**
- **both miss**

B passes only if all of these hold:

| # | Condition | Why |
|---|---|---|
| G1 | B has the correct file in the top 5 for at least 13/16 questions | The proposed gate, kept as a floor |
| G2 | wins − losses ≥ **N_net** (proposed: 2) | Gain over the first stage, not a raw score |
| G3 | losses ≤ **N_loss** (proposed: 1), and every loss is explained question by question | A reranker that drops files the first stage found is a regression, even if the net is positive |
| G4 | B's end-to-end p95 latency ≤ **L_max**, measured, not estimated | The cost has to be inside a budget someone set |
| G5 | Per-question results are identical across 3 repeat runs of each configuration. If any question flips, G1 to G3 are judged on the worst run | Rules out a pass that comes from noise between runs |

**N_net, N_loss and L_max are the PM's and the human's to set.** They decide what a rescued question is worth in added seconds. The values above are proposals and must be confirmed before the held-out run, not after it. If A alone already reaches 13/16 and G2 fails, the result is "the reranker does not earn its latency," not a pass.

**One run only.** If the held-out run fails, that set is used up for this proposal. Changing settings and rerunning on the same 16 questions is not allowed. A new attempt needs new held-out questions.

### E5. What the report must contain

1. **Setup.** Model ID and revision, K, the input-length limit and how it is handled, hardware, corpus and index version, the held-out set's sha256, and the date and time of the run.
2. **A per-question table** (16 rows). Columns:
   - the question ID
   - the correct file(s)
   - where the correct file sat in A's ranking (rank, or "not in top K")
   - its rank in B
   - the class (win, loss, both hit, both miss)
   - whether the correct file was truncated for the reranker
3. **Totals for A and B.** Top-5 accuracy, with the Wilson interval. Also top 1 and top 3, and MRR, as secondary numbers only: the gate is top 5.
4. **The paired result.** Wins, losses, and the exact McNemar p-value. Plus one plain sentence on what 16 questions can and cannot show (E1.3). If p ≥ 0.05, the report must not use the words "significant" or "improves retrieval" without qualification.
5. **The ceiling.** A's top-K accuracy on the held-out set. This is the most B could ever reach. Every "both miss" where the file was not in the top K is a first-stage failure, not a reranker failure.
6. **Latency, measured for A and B end to end.** p50, p95 and maximum, plus the reranker stage on its own, warm and cold separately. The task's "2.3 to 3.8 s" doesn't say whether it is the reranker's added time or the total (**unconfirmed**). The report replaces it with measured numbers.
7. **Stability.** The three repeat runs, and any questions that flipped.
8. **Losses and both-misses, one at a time.** What the reranker ranked above the correct file, and whether truncation was involved. Say what was observed. A cause is stated only if the per-question data shows it, otherwise it is marked unconfirmed.
9. **The gate verdict.** Each of G1 to G5 marked pass or fail with its number, then the overall verdict. A failed gate sends the slice back, per `RELEASE_GATES.md`.
10. **The seen-set pilot result (E3)**, with the stop condition as it was written before the pilot ran.

---

Three things in this section rest on facts the task didn't give, so they stay open:

- **The pool size K.** If the reranker only sees 5 candidates, the gate can't detect anything.
- **What the 2.3 to 3.8 s covers.** It isn't clear whether that is the reranker's added time or the total per question.
- **The first stage's score on the held-out set.**

N_net, N_loss and L_max need the PM's and the human's sign-off before the held-out run.
