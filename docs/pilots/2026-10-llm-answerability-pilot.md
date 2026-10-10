# Pilot: can a capable language model tell answerable from unanswerable questions?

*2026-10-09. Research only, on the seen sets. Not a gate result, not a product claim.
Run by the support session after the `docs-abstention` slice stopped. No product
code was written and no fifth-set question was read.*

## Result

Two language models read each question with the passages retrieval shows for
it, and said whether those passages answer the question. Pooled over the four
seen sets (93 questions: 20 unanswerable, 73 answerable, of which retrieval put
the right file in the top five for 56):

| | Bar 1: unanswerable flagged (need 16/20) | Bar 2: answerable not abstained (need 45/56) | Pre-registered "strong pass" (both at least 90%) |
|---|---|---|---|
| **Opus 5.5** | **20/20** | **49/56 (87.5%)** | not met (Bar 2 under 51) |
| **Sonnet 5.5** | **20/20** | **51/56 (91.1%)**, or 50/56 counting two missing lines against it | met on the first reading |
| For comparison: the local QNLI judge (slice 5) | 2/20 | 55/56 | — |
| For comparison: the best threshold or margin rule | 13/20 | 37/56 | — |

Both models pass the bars the local model failed. Their verdicts agree on 90 of
93 questions. Neither abstained wrongly on an unanswerable question: neither
said "answerable" for any of the 20.

## What the errors look like

- **No unanswerable question slipped through,** for either model.
- **The 5 to 7 false abstentions are mostly right in a useful way.** In the
  cases checked, the right *file* was in the top five but the *passages shown*
  from it did not contain the section that answers (for example the always-ask
  list for the approval question, or the experiment set-up for the A/B-test
  question). The judge said "these passages do not answer this", which is true.
  That is a passage-selection weakness in retrieval, not a judging error, and
  Bar 2's file-level denominator counts it as a miss.
- **Retrieval-missed answerable questions:** 7 (Opus) and 8 (Sonnet) of the 17
  were judged answerable from the passages shown. Either the labels were too
  narrow and another file does answer them, or the judge was fooled. Not
  adjudicated here.

## What this does and does not show

- **Shows:** on these sets a capable model separates the cases where a small
  local classifier and every score rule could not. The failure of the local
  judge was about that model and rule, not about the task being impossible.
- **Does not show:** that it works on the hard cases. Most of the 20 seen
  unanswerable questions are easy (a product the docs never mention, a price, an
  operating system). The fifth set was drafted with 18 of 24 unanswerable
  questions that share vocabulary with the docs, and it is **unspent**. A 20/20
  here is necessary, not sufficient.
- **Does not show:** cost, latency, or privacy. A hosted model means the
  question and the passages leave the machine, which breaks a stated
  must-not-break ("the question and the docs never leave the machine") and
  needs rule 4 (INV-4 and INV-5), rule 5 (the model), rule 6 (a data processor),
  a credential the owner supplies, and a spend cap.
- **Correlated labels:** the labels and the judges are both Claude's work.
- **Small n:** one question is 5 points on Bar 1.

## Deviations from the pre-registration, all disclosed

1. **Two amendments before the first run:** judges read their own batch file with
   Read instead of receiving it inline; and the judge sees the full passage text,
   not the product's three-line display excerpt, because the excerpt would
   handicap it (a display choice, not a judge's limit).
2. **Tool use:** every judge stayed within "Read your own batch" except one. The
   first Sonnet run of batch 5 made a single Bash call that listed that batch's
   block headers and counted its lines. By the pre-registered rule it was voided
   and rerun once; the two runs agreed on every verdict that the rerun returned.
3. **The rerun returned 13 of 15 lines.** The two missing (Q513, Q514) were taken
   from the voided first run, and both equal Opus's verdicts. Counting both as
   wrong for Sonnet gives Bar 2 = 50/56 (89.3%), which still passes.
4. **Judge model order:** Opus first, Sonnet only because Opus passed, as
   registered. No Haiku run.

## What I would do next

1. **A hard-negative pilot, before any slice:** about 24 unanswerable questions
   written to share vocabulary with the docs, drafted separately from the fifth
   set, judged the same way. If the judges hold up, build. If not, the answer
   differs.
2. **Then a slice** for the check step with a hosted judge, with the approvals
   and spend cap above, the fifth set as its one-shot gate, and the INV-3 draft
   checker sharing the same infrastructure.
3. **Passage selection** is the cheaper win for Bar 2: showing the right section
   of the right file.

---

## The pre-registration, verbatim

### Pre-registration. Pilot: can a capable language model tell answerable from unanswerable questions?

Written 2026-10-09, BEFORE any judge ran and before any pilot data was generated. Not changed after.

## Question
Reading only a question and what `retrieve` shows for it, can a language model say whether the shown passages answer the question, well enough to meet the two bars slice 5 could not meet?

## Data (seen only)
The four seen sets (dev, second, third, fourth): 93 questions, 73 answerable, 20 unanswerable. No fifth-set question is used or read. Seen sets are diagnostic only; nothing here is a gate result.

## What the judge sees
Exactly what the product prints for the default ranking (`file-rrf-v1`), with the `Ranking:` and `Top score:` lines removed so no score reaches the judge: the question, the five files, and their shown passages (at most two per file). No labels, no accepted-file lists, no scores, no set names. Question order is shuffled with a fixed seed. Each question is judged independently in its own block.

## The judge prompt (fixed; not edited after the first run)
"You judge documentation search results. For each block you get a user's question and the passages a search returned. Decide whether the passages themselves contain the information needed to answer the question. Answer ANSWERABLE only if they do. Answer NOT_ANSWERABLE if the passages are on a related topic but do not state what the question asks, or are unrelated. Judge only from the passages shown; use no outside knowledge and no tools. Reply with one line per block, exactly: <id> <ANSWERABLE|NOT_ANSWERABLE> <at most 12 words of reason>."

## Judges, in order
1. Opus 5.5 (the upper bound), 6 batches of about 16 questions, a fresh agent per batch, no tools. If it fails the bars, stop: no second model is run.
2. Only if Opus passes: Sonnet 5.5 the same way, to see whether a cheaper tier also passes.

## Scoring (pooled over the four sets)
- Bar 1: NOT_ANSWERABLE on at least 16 of the 20 unanswerable questions.
- Bar 2: ANSWERABLE on at least 45 of the 56 answerable questions whose correct file retrieval put in the top five.
- Pass = both bars. Strong pass = both at least 90% (18/20 and 51/56). Nothing is fitted, so no leave-one-set-out is needed.
- Reported as diagnostics: per set; the answerable misses retrieval did not find (should be NOT_ANSWERABLE or not, reported separately); every wrong verdict listed with its reason; the end-to-end figure.

## Validity rules
- A batch whose agent used any tool is discarded and rerun once with the same prompt; both outcomes are reported.
- The prompt, the batches and the judge model are not changed after the first result. If something must change, it is a new pilot with a new pre-registration.

## Limits stated in advance
Seen sets only and small (20 unanswerable). The labels were drafted by Claude, so a Claude judge may share their errors. A pass is evidence a model can do this, not a product claim: cost, latency, privacy (the question and the passages would leave the machine), a rule 4/5/6 approval and a spend cap are all untested. A fail on Opus would mean a stronger judge than a small local one does not fix this on these sets.

## Amendment, made before the first run (2026-10-09)
Each judge agent's one permitted tool call is a single Read of its own batch file, so the batch text does not have to be pasted into the orchestrating session. The answer key is kept in a separate directory the agents are told nothing about. Any other tool use voids that batch (rerun once, both outcomes reported). The prompt, batching and judge model are unchanged.

## Second amendment, made before the first run (2026-10-09)
Found while checking the inputs: the product's display prints only the first three non-empty lines of each passage (160 characters each). A judge fed that would be handicapped by a display choice, and a fail would say nothing about the judge. A product judge would be given the full passage text, as the earlier local judge was. So the judge sees, for each of the five returned files, the file path and the full text of its shown passages (heading path, line range, whole passage text), at most two passages per file, in rank order. Nothing else changes: no scores, no labels, same question order and ids, same prompt, same bars. (Passage lengths in the index: median 291 characters, 90th percentile 881, maximum 8,147.)

---

# Second pilot: hard negatives

*2026-10-09. Same method, same judges, a harder set. Research only; the fifth gate set was not used.*

## Result

24 unanswerable questions, each written to share vocabulary with a documented
topic while asking for a detail the docs do not state, plus 12 answerable
controls. Retrieval put the right file in the top five for 10 of the 12
controls.

| | Bar 1: hard negatives flagged (need 20/24) | Bar 2: controls not abstained (need 8/10) |
|---|---|---|
| **Opus 5.5** | **24/24** | **9/10** |
| **Sonnet 5.5** | **24/24** | **9/10** |

The two models agree on 35 of 36 questions. Every judge stayed within the tool
rules, so nothing was voided or rerun. The only controls the judges marked "not
answerable" were ones where retrieval had not shown the answering passage (the
full stage order of the lifecycle; the release-tier owner, whose file was not in
the top five). That is a retrieval and passage-selection weakness, not a judging
error.

## How the set was built

Thirty candidate negatives and 12 controls were drafted, then reviewed by a
fresh Opus agent with search access to a snapshot of the 123-file corpus, which
tried to find a defensible answer to each. It found one for four negatives
(n03, n13, n26, n30), which were dropped unedited. The first 24 survivors in
drafting order were used. It found an answer to every control. Examples of how
adjacent the surviving negatives are: "how quickly should a human answer an
approval request" sits next to "no timeout auto-approves"; the WCAG-level
question sits next to a contrast placeholder; incident-review retention sits
next to a draft deadline.

## What it does and does not show

- **Shows:** both capable judges separate unanswerable questions that sit next
  to documented topics, and the cheaper tier does as well as the stronger one.
- **Does not show:** the harder kind of negative, where the shown passages hold a
  plausible but wrong or partial answer (a false premise). Neither pilot tests it.
- **Same family:** Claude wrote the questions and the absence review, and Claude
  judged them, so errors may correlate.
- **Small:** 24 and 10; one question is 4 to 10 points.
- **No cost, latency, privacy or permission result.** The question and the
  passages would leave the machine; that needs rules 4, 5 and 6, a credential the
  owner supplies, and a spend cap.
- The fifth gate set is still unspent.

## What I would do next

Test the cheapest tier (Haiku) the same way, and write a false-premise set,
before a slice commits to a hosted judge. Then draft the check-step intent, with
the privacy decision made first by the owner.

---

## The second pre-registration, verbatim

### Pre-registration. Hard-negative pilot: do the judges hold up when the unanswerable questions share vocabulary with the docs?

Written 2026-10-09, BEFORE any candidate question was drafted, reviewed, retrieved or judged. Not changed after, except by a dated amendment above the first run.

## Question
The first pilot passed 20/20 on unanswerable questions, but most of the 20 were easy (a product the docs never mention). Do the same two judges still flag unanswerable questions when each one sits next to something the docs do cover?

## The set (new; never touched the fifth gate set)
- **30 candidate hard negatives**, drafted by the support session, each written to share vocabulary with a documented topic while asking for a detail the docs do not state. None repeats a question in the fifth set, its reserves, or any seen set.
- **12 answerable controls**, new questions with a known source, written in the same style. They exist so a judge that answers NOT_ANSWERABLE to everything cannot pass.
- **Absence review.** A fresh Opus agent with read and grep access to a snapshot of the pinned corpus (123 files) tries to find a defensible answer to every candidate. Any hard negative it finds an answer for is dropped. The first 24 survivors, in drafting order, are the set; if fewer than 20 survive, the pilot is reported as underpowered and stops. Any control it fails to find an answer for is dropped. Dropped questions are not edited, only removed, and are listed in the report.

## What the judges see
Exactly as in the first pilot: the question and, for the five files `retrieve` returns by default (`file-rrf-v1`), the file path and the full text of the shown passages (at most two per file). No scores, no labels, shuffled order, ids hidden, one fresh agent per batch, same fixed prompt as the first pilot, one Read of its own batch file as its only tool call.

## Scoring
- **Bar 1:** NOT_ANSWERABLE on at least 80% of the surviving hard negatives (ceil(0.8 n)).
- **Bar 2:** ANSWERABLE on at least 80% of the surviving controls whose correct file retrieval put in the top five.
- Pass = both bars. A judge that passes Bar 1 only by abstaining on the controls fails Bar 2 and is reported as doing so.
- Report: every hard negative a judge answered ANSWERABLE, with its reason, and what the reason cited, so the failure mode is visible.

## Judges, in order
1. Opus 5.5. 2. Sonnet 5.5, whatever Opus scores (both are reported; the first pilot's gate on running the second no longer applies, because the point here is to compare them).

## Validity rules
Any tool use other than one Read (more only if the tool truncates) of the agent's own batch file voids the batch; rerun once; both outcomes reported. The prompt, batching and models are not changed after the first result. A different design is a new pilot.

## Limits stated in advance
The negatives are written by the same model family as the judges, so errors may correlate. 24 questions: one is about 4 points. The absence review is itself an LLM reading a corpus, not a proof. Seen-type questions only; the fifth gate set stays unspent. A pass is evidence, not permission to ship.
