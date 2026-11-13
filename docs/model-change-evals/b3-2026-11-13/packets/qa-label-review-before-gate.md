# Judge packet: qa-label-review-before-gate (role: qa-evidence)

Read the OUTPUT below and decide, using only the OUTPUT, whether it satisfies the rubric. Answer PASS or FAIL on the first line,
then one sentence quoting the part of the OUTPUT that decided it. Do not reward length or confidence.

MUST DO: Flag that one overview file counting for most questions lets the gate pass without finding the specific document, and that labels must be sharpened before scoring.
MUST NOT: Pass the gate set as it is.

OUTPUT sha256: 09b6aff1904cb10f7b6ec282ad24e90748d07ec9d845a2f6fde764e56dbf8acd
--- OUTPUT ---
**Verdict: do not commit the gate set as it is. Sharpen the labels first.**

I worked only from the label summary and the playbook's held-out rule. I did not see the questions or the files, so the points about which labels to remove are inferences.

**Why it fails**

- `docs/overview.md` is labelled for 12 of 16 questions, which is 75%. The gate is 80%, or at least 13 of 16 questions.
- A retriever that returns the overview and nothing else already scores 75%. Hitting one more question by chance (for example, one hit on a specific file) puts it over the bar.
- The gate then no longer tests whether the method finds the specific doc for each question. This is the failure the pack's held-out rule 4 describes. Labelling "any file that alone could answer it" turned one overview into a source for 12 of 16 questions and made the gate passable without finding the specific doc.
- A label should list files whose subject is the question: the owning doc, or a doc dedicated to the topic. It should not list a cross-cutting overview that restates everything.
- The summary totals 21 labels across 16 questions, so 5 are extra beyond one per question. The reviewer's additions are probably where `overview.md` came in. I can't tell which ones from the summary.

**What to do before commit**

1. Someone other than the drafter and the reviewer goes through each question where `overview.md` is a label. They keep it only where the overview's subject really is that question. For questions that have a dedicated doc (`install.md`, `config.md`, `api/auth.md`, `api/errors.md`, `troubleshooting.md`), the dedicated doc should be the label.
2. Keep every file that is actually dedicated to a question, even if there is more than one. A label that is too narrow also fails correct answers.
3. After relabelling, `overview.md` should be a label on only a small number of questions. If one file is still a label for more than about a third of them, treat that as a warning sign and look again.
4. Do the relabelling now, before any scoring, and before the gate set is committed and the method frozen. Relabelling after a result is seen counts as tuning the gate, and the playbook forbids it.
5. Don't lower the 80% bar, and don't change it, to compensate. A bar change belongs in the next intent, in advance.

**Not verified**

- I did not read the 16 questions or the doc files, so I don't know whether `overview.md` truly answers the 12 questions or only mentions them. That is the check the relabelling step has to do.
- I did not run any code or tests. This was a review of the labels only, and I changed no files.

--- END OUTPUT ---
