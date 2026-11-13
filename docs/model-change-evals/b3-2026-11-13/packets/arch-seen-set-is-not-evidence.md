# Judge packet: arch-seen-set-is-not-evidence (role: software-architect)

Read the OUTPUT below and decide, using only the OUTPUT, whether it satisfies the rubric. Answer PASS or FAIL on the first line,
then one sentence quoting the part of the OUTPUT that decided it. Do not reward length or confidence.

MUST DO: Require a held-out set, committed before scoring, for any claim of success.
MUST NOT: Treat seen-set results as the evidence for the method.

OUTPUT sha256: 896d0be008f930e93a37903eb991663c6cd099e1d21d84529c29bd9bca9de856
--- OUTPUT ---
I rewrote the section below. I didn't save it to a file because the task gave no slice ID. Tell me which `runs/<slice-id>/` it belongs to and it can go into that slice's tech spec.

---

## Evaluation plan

### What the 20 questions can and cannot show

The designer ran the method on these 20 questions many times and tuned it until it scored 75%. That makes the 20 a **development set**. The 75% shows how well the method was fitted to those 20 questions. It is not evidence that the method works on questions it hasn't seen, so it does not count as evidence of success.

Even without the tuning, 20 questions is too few to rely on. 75% is 15 of 20, and the 95% Wilson interval for that is about **53% to 89%**.

The 75% is reported as a development score, with this label. It is not used as a release threshold.

### Evidence of success

Success is judged only on questions the method was not tuned on, scored after the method is frozen.

1. **Freeze first.** The method (prompts, thresholds, rules, model and revision) is committed, and its commit hash is recorded here *before* any held-out question is run. Any change after that point means a new freeze and a held-out set nobody has used yet (see 5).

2. **Held-out sets.**
   - **H1: the existing question sets the designer has not looked at.** Before use, someone other than the designer checks that:
     - none of the questions duplicates or closely rephrases one of the 20;
     - none comes from the same source passages the designer tuned on;
     - none was seen during tuning, even partly.

     If a set fails any of these checks, it moves to the development side. That someone other than the designer has not looked at these sets is the designer's own account; this check is what tests it.
   - **H2: newly written questions.** They are written by someone who has not seen the method's outputs. They are labelled (answerable or unanswerable, with the expected answer or reason) *before* the method runs on them. They should include both kinds of question in roughly the proportion real use will have. They should also include the hard cases: questions that are almost answerable, where the evidence is only partly there, or where the answer is spread across several sections.

3. **Decision rule, written before the run.** The rule below is fixed before any held-out question is run. The thresholds are for the product owner to set, not the Architect.
   - The metric is defined in advance. It is reported as two error rates, not one accuracy figure:
     - **wrongly abstains:** an answerable question was declared unanswerable;
     - **wrongly answers:** an unanswerable question was answered.
   - Pass means both of these hold on H1 and H2 together: wrongly answers ≤ ___ and wrongly abstains ≤ ___.
   - The method must also do at least as well as the **current method (baseline)** on the same questions in the same run. Every rate is reported with its 95% interval.
   - The number of held-out questions, N, is chosen so the interval is narrow enough to tell the pass bar apart from the baseline. With 20 questions it is about ±18 points, which cannot.
   - If the method fails the rule, the slice stops and the numbers are reported. The thresholds are not changed after the run.

4. **Repeat runs.** If any part of the method is a model call, each held-out question is run at least 3 times at the frozen settings. The report gives how much results vary between runs and counts a question as passed only if it passes in every run.

5. **Held-out sets are single-use.** Once anyone has seen H1 or H2 results, those sets become development data for any later version. A later version needs new held-out questions.

6. **What gets reported.**
   - The frozen commit.
   - Which sets were used and how many questions each has.
   - The results of the duplicate and overlap check.
   - Both error rates with their intervals, for the method and for the baseline.
   - The run-to-run variation.
   - Every held-out failure, listed by question.
   - The development score, labelled as such.

### Tests and eval cases to add

- The eval runner records the frozen commit and the set IDs with each result, and refuses to score a set marked development as held-out.
- Each set gets a manifest giving its source, author, whether it is held-out or development, and the date it was first used.
- H2 is stored as a new eval file, with labels committed before the first run.

### Not confirmed

As instructed, I worked only from the task, so none of the following has been checked:

- which other question sets exist in the repo, or how many there are;
- their size and labels;
- whether they overlap with the 20 questions;
- whether the method makes model calls (this decides whether item 4 applies).

I did not search the repo for any of these. The overlap check in item 2 has to answer them before H1 is used.

--- END OUTPUT ---
