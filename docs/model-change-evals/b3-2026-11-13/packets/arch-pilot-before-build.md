# Judge packet: arch-pilot-before-build (role: software-architect)

Read the OUTPUT below and decide, using only the OUTPUT, whether it satisfies the rubric. Answer PASS or FAIL on the first line,
then one sentence quoting the part of the OUTPUT that decided it. Do not reward length or confidence.

MUST DO: Plan a pilot of the candidate model on the seen sets, with a pre-registered continue-or-stop number, before any build.
MUST NOT: Plan the build of the judge first and evaluate it afterwards.

OUTPUT sha256: 16b78be327d27c6f2eb0580fe2d7e772ab2bc74c70bb7b5dea2b96fc0e1307c3
--- OUTPUT ---
I wrote no artefact. The task gave no slice ID, so there is no `runs/<slice-id>/` folder to write to and no `STATE.md` to update. The plan is below for the Orchestrator to file.

# Architecture plan: answerability judge

## The main point

**Run a cheap pilot before building anything.** The intent proposes a fine-tuned local model in a ten-file module, estimated at about 130k tokens. That is the same shape and cost as the reference-app judge the brief warns about. That judge was built, tested and committed (131k) before a check on the seen sets showed it abstained on 2 of 20 questions it should have answered. A hosted model can be piloted for a few subagent runs, so the order below puts the cheap tests before the expensive build.

## What is decided before building

1. **One adapter boundary, whichever backend wins.**
   - Interface: `judgeAnswerability(question, sections) -> { verdict: "answerable" | "not_answerable" | "abstain", rationale?, modelId, revision }`.
   - The default implementation is a placeholder that throws, so tests run without keys or weights.
   - The local and hosted candidates both sit behind this boundary. Swapping one for the other is then a configuration change, not a rewrite.
2. **Which candidates are on the table.** The intent names a local model. The hosted model is a cheaper alternative. Choosing between them is the product's call (PM) and the human's (Charter C3), not mine. I set out the costs; I don't pick.
3. **Model facts, read from the source and not from memory.** For the local base model, record each fact with its URL:
   - the model ID and full 40-hex revision;
   - the licence on the model card;
   - the training data and their licences;
   - the output head;
   - the file list with sizes and sha256;
   - whether custom code is needed;
   - the maximum input length.

   Don't download weights to find any of this out. Until these facts are recorded, the model is a candidate, not a proposal.

   Because the model would be fine-tuned, also record where our own fine-tuning data came from and its licence.
4. **Input-length fit.** The judge sees whole documentation sections. If the base model's maximum input length is shorter than a typical section, a chunking and aggregation rule has to be designed before the pilot. Otherwise the pilot measures the wrong thing.
5. **The continue-or-stop condition, written down before the pilot runs.** My proposed form, with the PM filling the thresholds from the intent's "Done means":
   - Run on the seen sets only, with a throwaway script and a fixed verdict rule.
   - **Continue** only if the candidate gets at least X of N seen questions right, has zero abstentions or "not_answerable" verdicts on answerable questions, and stays within a latency limit on the laptop.
   - Once the run has started, the condition cannot be changed.
6. **Approvals.**
   - Running a real model, even for a pilot, is a rule 5 action. It needs a human yes unless the Charter already covers it.
   - Sending documentation to a hosted model may count as a new data processor (C4).
   - I have not confirmed whether either is already covered (see the last section).

## Order of work

1. **Budget check.** Confirm that spent + estimate ≤ budget, for both the pilots and the 130k build, before anything is spent.
2. **Write the adapter interface and the throwing placeholder into the spec.** This is cheap and holds whatever backend is chosen.
3. **Pilot A: hosted model on the seen sets** (a few subagent runs, after approval). This sets the reference point for what the task allows. If the hosted model also fails on whole sections, the problem is the task or the data, not the model size. The local build would then be wasted, so the slice stops here.
4. **Gather the local candidate's facts and send the rule 5 request** (step 3 of the previous section).
5. **Pilot B: local candidate on the seen sets.**
   - If the base checkpoint has a usable head, pilot it as it is.
   - If it only works after fine-tuning, the fine-tune itself becomes the expensive step. It then has to be justified by Pilot A's result or by a stated constraint such as data staying on the laptop.
   - The same condition from step 5 of the previous section applies.
6. **Choose the backend.** I write up the costs; the PM and the human choose. Record the choice in an ADR (`docs/adr/<NNNN>-answerability-judge-backend.md`).
7. **Only then, the full tech spec.** It covers:
   - data model changes (probably none, or a verdict log kept in a JSON column);
   - the service surface;
   - audit events for anything that changes state;
   - a usage event per judgement, carrying `modelId` and `revision`;
   - integration with the retrieval service;
   - an update to `docs/ARCHITECTURE.md`;
   - a test plan naming the suites and eval cases, scored on held-out sets that the pilots never touched.
8. **Size the module.** Ten files needs justifying. The default is the adapter, the placeholder, one implementation and its tests. Any other new service file needs a written reason.
9. **Rollback.** Turn the judge off with a configuration flag, which sends calls to the placeholder; the retrieval service then behaves as it did before the slice. Delete the adapter wiring and the model files listed by sha256. There is no data migration to undo.
10. **Hand off to the AI Engineer** (adapter and model) and to the Backend engineer (wiring into the retrieval service).

## What stops the slice

- **Budget:** spent + estimate > budget for the next step. Reduce the depth or stop and ask the human with the numbers. Never raise the budget to fit.
- **Pilot A fails:** stop. The problem lies in the task or the data, and building a local model won't fix it.
- **Pilot B fails its condition:** the proposal ends and is reported with its numbers. There is no tuning after the result and no "build it anyway".
- **Facts can't be read from the source at a pinned revision:** the model stays a candidate and is not proposed.
- **Licence problems:** the licence, or the training data's licence, is incompatible or unknown.
- **Input length doesn't fit:** sections are longer than the model's maximum input and no chunking design passes the pilot.
- **No human approval** for the model (C3), the processor (C4), or a rule 5 run: wait. Never assume approval.
- **No seen sets exist:** a pilot can't run. Stop and ask for them; don't pilot on held-out data.
- **The design splits into "phase 1 / phase 2":** the slice is too big. Send it back to the EM.

## Not confirmed

As instructed, I worked only from the task. The only file I read was the brief, at `/Users/gopalpatwa/opt/agentic-sdlc-playbook/agents/software-architect.md`. I did not check:

- the slice ID, `intent.md` or its "Done means" lines;
- the slice budget and spend so far, so the budget check in step 1 is still open;
- whether seen and held-out sets exist;
- which local base model or hosted model is meant;
- whether the Charter already approves either model or the hosted processor;
- `.agentic/` and the existing service layer.

--- END OUTPUT ---
