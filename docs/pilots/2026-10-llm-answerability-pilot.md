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

---

# Third and fourth pilots: the cheapest tier, and false premises

*2026-10-09. Same method as pilots 1 and 2. Research only; the fifth gate set was not used.*

## Pilot 3: Haiku 4.5 on the two existing sets

| Haiku 4.5 | Bar 1 | Bar 2 |
|---|---|---|
| Seen sets (need 16/20 and 45/56) | **20/20** | **47/56** (83.9%) |
| Hard negatives (need 20/24 and 8/10) | **24/24** | **9/10** |

Nine fresh agents, all within the tool rules. Haiku agrees with Opus on 88 of 93
and 36 of 36 questions, and with Sonnet on 87 of 93 and 35 of 36. Its misses are
the same kind as the others': the answering section was not among the shown
passages. **The cheapest tier is enough for this task on these sets.**

## Pilot 4: false-premise negatives

24 questions that take something for granted the docs deny or never state (16
where a passage contradicts the premise, 8 where the docs are silent), judged
with the same 12 controls. Three of the 30 candidates (p08, p10, p22) were
dropped because the absence reviewer found a passage answering them as asked.

| Strict reading (gold = NOT_ANSWERABLE) | Bar 1 (need 20/24) | Bar 2 (need 8/10) |
|---|---|---|
| Opus 5.5 | **20/24** (the minimum) | 9/10 |
| Sonnet 5.5 | **22/24** | 9/10 |
| Haiku 4.5 | **22/24** | 9/10 |

All three pass. Every "answerable" verdict on a false-premise question was
class (a), **corrects the premise** ("a named human approves deploys; the
Orchestrator does not"). **None was class (b), supplies a decoy.** All eight
questions where the docs are silent were flagged by all three judges. Read
leniently (a premise-correcting answer counted as acceptable) every judge scores
24/24; the strict reading is the pre-registered pass and is conservative.

The stronger model did worst here, because it answers the correction. Whether a
support product should answer "no, a named human approves deploys" or decline is
a product decision, not a judge error, and it is recorded as open.

## Limits

The same model family wrote the questions, reviewed them and judges them. 24 and
10 questions are small. Class (a) versus (b) was assigned by the support session
from each judge's one-line reason; the reasons are in the run record and any
reader can re-classify them. The fifth gate set is still unspent.

## What the four pilots add up to

A capable hosted judge, including the cheapest tier, separates answerable from
unanswerable questions on the seen sets, on negatives that sit next to documented
topics, and on false premises, where a small local classifier and every score
rule could not. What they do not settle is permission, cost, and the fifth set.

---

## The third pre-registration, verbatim

### Pre-registration. Pilots 3 and 4: a cheaper tier, and false-premise questions

Written 2026-10-09, BEFORE any Haiku verdict existed and before any false-premise question was drafted, reviewed or retrieved. Not changed after, except by a dated amendment above the first run of the thing it amends.

## Pilot 3: Haiku on the two existing sets
- **Judge:** Haiku 4.5 (the cheapest tier), the same fixed prompt, the same batches, the same one-Read rule as pilots 1 and 2. Nine fresh agents: the six seen-set batches and the three hard-negative batches, unchanged.
- **Bars, as before:** seen sets: Bar 1 at least 16 of 20, Bar 2 at least 45 of 56. Hard negatives: Bar 1 at least 20 of 24, Bar 2 at least 8 of the 10 controls whose right file was in the top five.
- Reported next to Opus and Sonnet on the same questions: every question where the three judges do not agree.
- **Reading:** Haiku passing means the cheapest tier is enough for this task on these sets; failing says a mid tier is the floor. Neither is a product claim.

## Pilot 4: false-premise negatives
- **What a false-premise negative is.** A question that asserts or presupposes something the documentation contradicts or never states, and asks for more about it. Example shape: "Why does the Security agent fix the vulnerabilities it finds?" where the docs say it reports and does not fix.
- **The gold verdict, fixed now.** Under the unchanged judge prompt the correct verdict for a false-premise negative is **NOT_ANSWERABLE**, because the passages do not contain what the question asks for as stated. A judge that says ANSWERABLE is classified by me from its own one-line reason into (a) **corrects the premise** (the reason says the docs state the opposite, or that the thing does not exist) or (b) **supplies a decoy** (the reason treats a nearby fact as the answer). Every ANSWERABLE verdict and its class is listed in the report.
- **Strict Bar 1:** NOT_ANSWERABLE on at least 80% of the surviving false-premise negatives. **Lenient reading, reported separately and never as the pass:** verdicts of class (a) counted as acceptable. Class (b) is the dangerous failure and is reported on its own.
- **Controls:** the same 12 answerable controls as pilot 2, so a judge that abstains on everything cannot pass. **Bar 2:** at least 80% of the controls whose right file retrieval put in the top five.
- **Set:** 30 candidates drafted by the support session, none repeating a question in the fifth set, its reserves or any earlier pilot. A fresh Opus agent with search access to the corpus snapshot tries to find a passage that answers each question as asked; any it finds is dropped, unedited. The first 24 survivors in drafting order are the set; if fewer than 20 survive, the pilot is reported as underpowered and stops.
- **Judges:** Opus 5.5, Sonnet 5.5 and Haiku 4.5, same prompt, same rules as before: a fresh agent per batch, three batches of 12, shuffled, ids hidden, no scores or labels, full passage text for the five files `retrieve` returns by default.

## Validity rules (unchanged)
Any tool use other than one Read (more only if the tool truncates it) of the agent's own batch file voids that batch; rerun once; both outcomes reported. Prompt, batching and models are not changed after the first result.

## Limits stated in advance
Same model family wrote the questions, reviewed them and judges them. The gold for a false-premise question is debatable, which is why the strict and lenient readings are separate and the reasons are listed. Small n. The fifth gate set stays unspent.
