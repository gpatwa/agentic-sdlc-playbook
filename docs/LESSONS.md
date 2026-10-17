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
| L34 | **Name the model from the harness log, in reports as well as in `STATE.md`.** | The pilot reports called the cheapest judge "Haiku 4.5"; the log said `claude-haiku-5-5`. Found when the driver asked what `model: haiku` resolves to. | **Practice**; `usage.mjs` prints the model per stage. |
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
| L31 | **A depth the intent names binds; lowering it is a recorded owner decision.** | Slice 5's intent asked for adversarial Security. After the model path stopped, the Orchestrator ran it at standard depth and only its own plan recorded the change. The Release Manager listed it as a deviation. The reasoning held (no new code or download path), but a gate was weakened without the owner's word. | **Enforced**, v18 (run guide, run economics, slice command, a test). |
| L32 | **Cite an advisory by its source, not its label.** Labels A1–A5 collide across slices and records. | Slice 4's A1–A5 and slice 5's own advisories used the same labels. | **Open**, working rule. |
| L33 | **Pilot a hosted model as research before designing around a local one, when the task is judgement.** | Slice 5 spent 131k building a small local judge that scored 2/20. A pilot costing a few subagent runs showed two capable models pass on the same questions. | **Practice**; the Architect brief's pilot-first rule (v16) already covers the order. |
| L35 | **A slice's wall-clock time is mostly waiting, not working; measure it before curing it.** | From the commit history of the reference app: slice 1 ~43h wall (about 3h between commits that look like work), slice 2 ~9h (1h), slice 3 ~25h (2h), slice 4 ~143h (2.6h; 140h was the stop for a budget raise after the Security failure), slice 5 ~15h (5h; 7h was a usage-limit pause). Gaps are read from commit times and are an estimate, not a clock: they include the owner being away, usage limits and sessions working without committing. | **Open**. The next step is a timestamp per stage start, stop and restart in `STATE.md`, so the next slice can say what was waiting on whom. |
| L36 | **A tool-less judge gets its payload injected by the harness, never retyped by a model.** | Slice 6's first seen-set run had the driver retype each 4–5k-token payload into the judge call; the third copy was cut off and batch 1 was void. The forked-skill form (`context: fork`, `agent:`, a `` !`command` `` line) hands the judge exactly the program's output (docs, read 2026-10-10); 93 spawns ran with matching payload hashes. The harness adds a 150-character prefix, which had to be registered. | **Practice**; a test pins that the largest payload (20.7k characters) fits under the ~30k inline ceiling. |
| L37 | **Subagent cost is dominated by the tool list it inherits; deny what it must not have.** | The probe judge's first request was 72.7k tokens, about 515 per tool across 141 tools. `mcp__*` in `disallowedTools` (accepted in practice, not documented) cut it to 11.1k with 7 tools. Plan from the measured first request, not from the work. | **Practice**; the plan should name the environment a stage needs (T27). |
| L38 | **Test the output format at integration before the freeze: a strict grammar can fail correct judgements.** | The pilot prompt asks for `<id> <TOKEN> <reason>`. Haiku added a colon after the token in 20 of 93 replies and thought aloud in about 5 (r010, r012, r046, r051, r077), so two re-registrations (optional colon; verdict from the last non-empty line) were needed. The first run had 2 judge errors in 12. | **Practice**; each re-registration is recorded with the owner's typed approval. |
| L39 | **A pre-registered check that fails by one still fails.** | Slice 6's seen-set check scored Bar 1 20/20 and Bar 2 44/56 against 45; one judge error (r093) would have made it a pass. The driver stopped before the fifth set, the scorer did not rescore, and the owner closed the slice as not releasable. | **Practice**; no retune, no second run, no larger model inside the same slice. |
| L40 | **A session request must verify the folder before anything runs.** | Slice 7's stage 5 session was started with the main checkout as its folder, so it could not see the worktree's changed agent and skill files; it then pointed the owner at the terminal CLI. The folder picker also hides `.claude`, where the worktree lives. | **Open** (T28): the request names the folder, asks the session to print its working directory first and stop if it differs, and the Orchestrator creates a visible symlink to the worktree at intake. |
| L41 | **Never route the owner to the terminal `claude` here.** Its only login is the API, which is metered. | The owner followed a session request's CLI line; the header said "API Usage Billing" and the run used about 59k cache-write, 407k cache-read and 5k output tokens before it was stopped. | **Open** (T28): session requests name the desktop app only; a pack test fails a request that contains a `claude "` command line. |
| L42 | **A skill that injects shell output needs its permission rule set and tested at intake, not at the first spawn.** | `/aveto-judge-seen`'s `allowed-tools` pattern did not match the quoted command; the smoke stopped before any spawn and cost two session starts. A wildcard rule in `.claude/settings.local.json` fixed it. | **Open** (T28): the plan lists every permission rule a stage needs (a "Prerequisites" table), the owner approves them once, and a dry run of the injection command checks them before a session request is written. |
| L43 | **When the measured context differs from the approved safety list, decide at the approval, not at the run.** | The smoke found `OS version` and two environment flags not named in INV-5; the packet had flagged exactly this (F8). A decision was then needed mid-stage. | **Practice**: a safety list that is "as measured" should name the stop rule and carry the wording for the likely additions in the same packet, so the owner can approve both at once. |
| L44 | **More sessions means more wrong-session prompts; the owner cannot route between agents.** | Slice 7 ran across about eight sessions (driver, measurement, smoke, two stage-5 attempts, three stage-7 attempts); the owner typed into the wrong one at least three times, and one session started another in the wrong folder. | **Open** (T29): one session per slice in Process v2; stage workers are teammates or subagents, never sessions the owner opens. |
| L45 | **A held-out gate can pass while the product still has a measured limit; report both.** | Slice 7's judge met both bars on the fifth set (24/24 and 16/19), while retrieval's own top-5 recall on the same set was 19/24 (79.2%), under its 80% bar, and only 16/24 answerable questions ended with the right file shown. | **Practice**: the Release Gate carries the end-to-end figure next to the gate result. |
| L46 | **Tier 3 at the end of a run turns into a list of owner items; decide them at the start.** | The tier 3 re-run listed 11 conditions (release approval, change request, DPA, rollback rehearsal, monitoring thresholds, governance waivers, record hygiene) that a Charter could have settled before the run began. | **Open** (T29): the Charter's sections 4, 7 and 8 carry them. |
| L47 | **Process v2 held on real work: one typed approval, then a PR.** | The aveto-support landing run (2026-10-17) closed slice 7's tier 3 items and opened PR #4 after one typed message from the owner (the Charter, approved by hash), with no permission prompt and no question after it. It cost 651k against a 450k plan (ceiling 600k, notice only). | **Practice**; pack v20 to v24. |
| L48 | **The review layer catches the run's own mistakes.** | The first `/code-review` (high effort, tier High) found the Charter's own permission rules (`git commit *`, `git branch *`, `gh pr create *`) committed to the tracked `.claude/settings.json`, which would have shipped to `main`. Fixed in-run; v24 writes them to the gitignored local file and checks it. | **Enforced** in v24 (`charter-check`, Release Manager). |
| L49 | **A Charter can state facts the owner never typed; the owner must read the lines that record positions.** | The drafted Charter wrote "terms status as stated by the owner" (DPA) and an "owner positions" line for eight items the owner had not answered. The owner approved the hash after being told which lines to read. | **Open**: a drafter marks lines that record an owner position as **(drafted, unconfirmed)** until the owner's approval names them. |
| L50 | **Review stages run over their estimates, again.** | Tier 3 Security 94k vs 60k, Release Manager 187k vs 60k, Tech Writer over its line; the third slice with this ratio. | **Practice**: RUN_ECONOMICS carries 150 to 190k for a tier 3 Release Manager (v24). |
| L51 | **Small repeated frictions had one cause: a human is the router between sessions.** | In slice 7 the owner typed into the wrong session at least three times and started five sessions by hand. After v20 the landing run needed one session start and one message. What remains is the first session start. | **Open** (T29/T28): scheduled tasks or Projects, if the owner accepts unattended operation. |
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
- **A QNLI answerability judge did not separate the cases on these sets.** On
  the four seen sets it abstained on 2 of 20 unanswerable questions and let 55
  of 56 answerable ones through. The cause is not established. The spec
  guessed a domain shift (trained on a question and one sentence, used on
  longer passages), and so did the support session in conversation; the index
  contradicts the premise: passages are mostly short (median 291 characters,
  90% under 881), so "whole sections" is not what the judge read. ADR 0007
  records the rejection; the code was dropped.
- **The exit-134 abort is real and intermittent.** One in eight runs in
  slice 3; none in 660 runs in slice 4; one more in slice 5 with a third
  session loaded. It is open. The future CI step must fail on any 134, with no
  retry wrapper.
- **A capable language model separates the cases where the small local ones
  could not (a pilot on the seen sets, not a gate result).** Opus 5.5 scored
  20/20 and 49/56, Sonnet 5.5 20/20 and 51/56, against bars of 16 and 45; the
  local QNLI judge scored 2/20. The hard cases are untested and the question and
  passages would leave the machine, so it is evidence a hosted judge is worth a
  slice with approvals and a spend cap, not a result to ship on. A second pilot on 24 hard negatives (unanswerable questions that sit next to
  documented topics) gave 24/24 for both models and 9/10 on the controls; the
  cheaper Sonnet matched Opus, and a third pilot found Haiku, the cheapest tier,
  does too (seen sets 20/20 and 47/56; hard negatives 24/24 and 9/10). A fourth,
  on 24 false-premise questions, passed for all three on the strict reading (20,
  22 and 22 of 24) with no decoy answers; every miss was a premise-correcting
  answer, which a support product may want. See
  `docs/pilots/2026-10-llm-answerability-pilot.md`.

- **The attended judge step (slice 6) nearly met its bars and did not.** Run on the operator's own subscription, in a forked skill, with Haiku 5.5: Bar 1 20/20 met; Bar 2 44/56 against a threshold of 45; hard negatives 5/5; one judge error. The pilots had Haiku at 47/56 on the same sets, so a single-question fork is slightly worse than batches. The judge over-abstains on answerable questions (11 misses), which the product rule "abstaining is never worse than showing a wrong file" treats as the safer direction. The judge also sees the session's `CLAUDE.md`, the user's email and recent git status, so what leaves the machine is more than the question and passages; INV-5's wording was not changed and Security did not review it because the slice closed first. The fifth gate set is still unspent. Cost: about 2.5M tokens against a 950k plan (peak-sum), mostly the seen-set check and two re-registrations.

- **Slice 7: the attended Sonnet judge passed its held-out gate (first time in seven slices).** Seen-set sample 20/20 and 24/28; fifth set 24/24 and 16/19 (84.2%, one question of margin at both); 0 judge errors; 96 audited spawns with zero tools offered (deny list covering every built-in, the seven harness tools and `mcp__*`). Security at adversarial depth found nothing blocking (S5, a quote breakout in the eval-only skill, and S6, an over-broad local permission rule, since removed). Release Gate at tier 3: an internal candidate, not cleared to land (T1 to T11 deferred to the next Charter). End to end on the fifth set, 16 of 24 answerable questions show the right file after judging. Cost 2.77M peak-sum against a 2.6M plan.

- **Landing the judge step (2026-10-17): the first real Process v2 run.** Charter approved by hash in one message; S5 fixed (the eval skill's shell line carries no caller text; 21 hostile values by 3 tests); rollback rehearsed (clean revert of a merge commit, 168 tests on the reverted tree); monitoring, runbook, vendor-risk (DPA waived by the owner's Charter, not met), AI Governance (standard, provisional on EU AI Act Art. 50) and the known retrieval limit all recorded; final tree 425 tests; tier 3 verdict GO WITH CONDITIONS for opening a pull request. PR #4 merged by a merge commit (`a6ffbcc`) after the owner chose to merge; the gate result, the limits and the open compliance boxes are unchanged by the merge.

## Where the rest is tracked

T22 holds the reference app's slice records and its evidence checklist. T26
holds the proposals to cut the owner's round-trips. Neither is duplicated here.
