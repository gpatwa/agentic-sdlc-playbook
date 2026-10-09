# Lessons

What building Aveto's reference app taught the process, in order of discovery,
with the evidence for each and where it is now enforced. This is the history
behind the pack versions. It is kept so a lesson is learned once.

**How this log is kept.** Each slice's close-out ends with a Lessons section
(lesson, evidence, cost, where it should be enforced). The support session
curates those entries here. A lesson with no evidence line is dropped, and a
lesson is marked *enforced* only when a file, a hook or a test carries it. The
status of each item is one of **enforced** (with the pack version or file),
**proposed** (written down, owner decision pending) or **open**.

Evidence is from `aveto-support`, the public reference app, and from the two
earlier seed apps. Figures are peak context per spawn unless stated, and come
from `execution/usage.mjs` reading the harness's own logs.

## 1. Approvals and who may give them

| # | Lesson | Evidence | Status |
|---|--------|----------|--------|
| L1 | **An approval counts only when the human gives it directly, in the session driving the run.** A message from another session, even one quoting the human, is never one. | Two sessions ran one slice. The support session's recommendations were recorded as advice; every approval record is the owner's own words. | **Enforced**, pack v14 (run guide, approval protocol, a test pinning the wording). |
| L2 | **Show approvals with their exact text, together, at fixed points.** "Approve all" is valid only because each item was shown in full. | Slice 5's model request arrived as five items with verbatim text and one reply covered them. Earlier slices asked one at a time. | **Enforced**, pack v16 (approval protocol: digest and packets). |
| L3 | **Open every stop with a digest** of at most 15 lines: the decision, a recommendation, the exact reply, the cost of waiting, what was checked and by whom. | The owner had to read long artefacts at about 14 stops in two slices, and answered "yes" or "as recommended" every time. | **Enforced**, pack v16. |
| L4 | **Agents never raise a budget.** The human types a ceiling once, at plan confirmation. | Four budget raises in two slices, each stopping the driver. | **Enforced**, pack v16 (slice command, run economics). |
| L5 | **Separate approvals from design choices with a recommended default.** Today a one-line threshold choice costs the same round-trip as a safety-control change. | The owner answered Scope Review's five questions "as recommended". | **Proposed** (T26 P3), owner decision pending. |

## 2. Cost and measurement

| # | Lesson | Evidence | Status |
|---|--------|----------|--------|
| L6 | **The budget check must include the next stage's estimate.** | The guard compared spent with budget only, so a stage could start with too little left. | **Enforced**, v8. |
| L7 | **A guard that cannot parse the state file must say so.** | The guard went silent when a role rewrote `STATE.md` in its own format. | **Enforced**, v9 (guard notice, format rule). |
| L8 | **Record the model from the harness log, never from memory.** | An Opus stage was recorded as Sonnet. | **Enforced**, v10 (`usage.mjs` prints the model per stage). |
| L9 | **Hooks must work from a worktree.** The write guard wrongly denied an in-scope write, and the budget guard went blind. | First live evidence of the write guard acting at all. | **Enforced**, v11, with tests. |
| L10 | **Resumed agents are expensive.** One fresh agent per stage. | Slice 1 processed 30.9M tokens (854k by the budget's unit), slice 2 6.7M, slice 3 8.1M. Budgets in peak context understate what a window loses. | **Enforced** in the slice command; the unit mismatch is open (T20). |
| L11 | **Estimate per spawn, not per stage.** | A Release Gate is three spawns and ran 146k against 70k. An Architecture that ends in a model request ran 187k against 70k. Adversarial Security ran 129k against 70k. Slice 4 ran 581k against 400k (1.45×). | **Enforced**, v15 and v16 (run economics). |
| L12 | **Set `Spent` from `usage.mjs` after every stage.** | The recorded figure ran 29k to 40k behind the measured one in two slices. | **Enforced**, v16 (slice state). |
| L13 | **`Next action` and `Next stage` must agree.** | One slice's `Next action` named a stage three stages old for most of the run. | **Enforced**, v16 (slice state). |

## 3. Evidence for an AI feature

| # | Lesson | Evidence | Status |
|---|--------|----------|--------|
| L14 | **A seen set is not evidence.** | Two methods scored 71–79% on questions the designer had seen and 47–69% on new ones. | **Enforced**, v12 (held-out gate protocol). |
| L15 | **Review labels before the gate set is committed, and sharpen them before scoring, never after.** Label files whose subject is the question. | A reviewer added 40 files to 13 questions; one overview file then counted for 12 of 16 questions and made the gate passable without finding the specific doc. | **Enforced**, v12 and v13. (Drafting error corrected: the timing is "before the gate set is committed", not "before the freeze".) |
| L16 | **Report the first stage on the same set.** A gate can be met by a change that earns nothing. | Slice 3's reranker met the gate at exactly 13/16; the simpler method scored 14/16. Net −4 hits across four sets, 2.3–3.8 s a question against 0.9 s. | **Enforced**, v13. |
| L17 | **Baseline a defect on the unfixed code before arguing its cause.** | Slice 4's Architect argued a mechanism for the exit-134 crash. 220 unfixed runs showed the premise false and the crash did not reproduce. | **Enforced**, v15. |
| L18 | **Pilot a candidate model on the seen sets before building, and check on them before the gate set is spent.** | Slice 5 built a ten-file judge (131k). A pre-registered seen-set check then showed 2 of 20 on the abstention bar. The check saved a 340k gate run and the fifth set; run first, it would have saved the 131k build too. | **Enforced**, v16 (Architect brief; AI agent project pack rule 8). |
| L19 | **Facts about a model come from its public metadata, not from memory.** | Slice 5's candidate was named from memory and marked unverified. Verified later: revision, licence, hashes, and a vocab hash identical to the embedding model's. | **Enforced**, v16 (Architect brief). |
| L20 | **A question the docs do not answer is a claim of absence.** Each needs a reviewer who tries to find an answer, a surplus, and a tag for what it overlaps. | Slice 5's gate set: 24 unanswerable questions, 18 of them sharing vocabulary with the docs, each checked by grep. | **Enforced**, v16 (AI agent project pack rule 9). |
| L21 | **A pre-registered condition stops a slice cleanly.** Write the continue-or-stop number before the run and do not move it. | Slice 5 stopped at 2/20 against 16/20 with nothing tuned afterwards. | **Enforced** by L18 and the held-out protocol. |

## 4. Claims and records

| # | Lesson | Evidence | Status |
|---|--------|----------|--------|
| L22 | **Write no status claim before the gate that earns it.** | Slice 4's README said "internally releasable" before Security or the Release Gate had run; it was corrected before the verdict. | **Enforced** by slice 5's scope rule (no whole-pipeline figure until the verdict); open as a pack-wide rule. |
| L23 | **Check the intent's claims and the status lines against the code.** | Slice 5's Scope Review found the README, the status file and INV-4 all said retrieval abstains, which it had not since ADR 0004, and that the intent named a pack version two behind. | **Enforced**, v16 (Engineering Manager brief). |
| L24 | **A drafter checks its own claims before committing.** | Support-session slips, all caught and corrected: label-review timing written wrong in the pack, T22 and an intent; a stale CI run read as the new commit's; two scope extras said to be unrecorded when they were. | **Open.** Carried as a working rule for the drafting session. |
| L25 | **CI's cross-document check must know the mailbox files.** | Two pushes turned CI red because the check flagged `SUPPORT_REQUESTS.md` and `SUPPORT_REPLIES.md`; the earlier push was made without waiting for CI, and that was disclosed. | **Enforced**, CI exemption (commit 931650b). |
| L29 | **A gap recorded as "not fixed yet" will be found again, at a worse moment.** | The status file's missing owner was written down in T21 in August with the note "so the next slice does not rediscover it." The fifth slice rediscovered it during a Release Gate and the stale-text pass was held until the owner and the support session could respond. Fixed in v17. | **Enforced**, v17 (write-scope guard, Tech Writer brief, a test). Working rule: a recorded gap gets an owner and a date, or it is fixed. |

## 5. Two sessions, one outcome

| # | Lesson | Evidence | Status |
|---|--------|----------|--------|
| L26 | **Split the work by role, not by account.** One session drives a slice; another does research, drafts evals and fixes the pack. The two sessions may be on different accounts; the split is fixed and nothing rotates work between accounts to avoid a limit. | The owner's two sessions are on different accounts. | **Enforced**, documented in the getting-started guide. |
| L27 | **Give the driver a file mailbox as a fallback.** A message can be held for approval in a stricter permission mode. | Pack v14 mailbox files. | **Enforced**, v14. |
| L28 | **Do the research the driver would otherwise buy.** The support session verified the candidate model from public metadata and saved a 30–40k research spawn. | Slice 5. | **Practice**, not a rule. |
| L30 | **Install or upgrade the pack from the main checkout, never inside a linked worktree.** The installer writes a playbook path relative to where it runs; from a worktree that path is wrong for `main`, and merging the branch carries it there. | Upgrading the fifth slice's worktree changed 35 files (every agent brief, the run guide and the config) instead of 10. Caught before commit, undone, and done from the main checkout with the commit cherry-picked into the worktree. | **Enforced**, installer warning and a test (playbook, after v17; no pack bump). |

## 6. What we learned about the product

These are results, not process rules. They are kept so they are not rediscovered.

- **Retrieval alone gets about 70–87% of questions' right file in the top five,
  and never abstains.** `file-rrf-v1` scored 14/16, 11/16 and 12/17 on three
  held-out sets. It is the default. The reranker earned nothing and is opt-in.
- **A similarity threshold cannot tell answerable from unanswerable
  questions.** Pooled across four seen sets, the best threshold or margin cell
  reached 65% on one bar and 66% on the other; unanswerable top scores ran
  0.548–0.808 against 0.619–0.800 for answerable hits.
- **A QNLI answerability judge does not work at section length.** On the four
  seen sets it abstained on 2 of 20 unanswerable questions and let 55 of 56
  answerable ones through. It was trained on a question and one sentence. ADR
  0007 records the rejection; the code was dropped.
- **The exit-134 abort is real and intermittent.** One in eight runs in
  slice 3; none in 660 runs in slice 4; one more in slice 5 with a third
  session loaded. It is open. The future CI step must fail on any 134, with no
  retry wrapper.
- **Abstention needs a different kind of signal.** What that signal is, is an
  open question for a new slice with its own pilot, not a tweak to this one.

## Where the rest is tracked

T22 holds the reference app's slice records and its evidence checklist. T26
holds the proposals to cut the owner's round-trips. Neither is duplicated here.
