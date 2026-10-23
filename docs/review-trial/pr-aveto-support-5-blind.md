# External review: gpatwa/aveto-support#5 (Codex app; third review; new chat)

Mode: blind. Path: A.

Source: a pasted review (not posted to GitHub). Collected 2026-10-23. Disposition `open` means nobody has judged it yet: set each to `fixed <ref>`, `accepted <issue>` (the finding is correct and is filed to fix later), `intentional <reason>` (the finding is correct and the behaviour is deliberate), `rejected <reason>`, or `duplicate of <record>` (the same defect already counted). "Also in our local review?" is a heuristic (same file, within 15 lines); a person confirms it.

| id | P | file:line | claim | disposition | also in our local review? |
|---|---|---|---|---|---|
| c01 | P1 | pipeline.py:181 | Restarting resets exhausted spend and rate limits. . Every service instance creates fresh in-memory counters and a new visitor salt. With minReplicas: 0, normal scale-down and restart replenish the allowance within the same day, so the configured monthly cap i | intentional CR-3 (owner decision D1 still open) | yes (CR-3) |
| c02 | P1 | pipeline.py:254 | Retries spend beyond the admitted reservation. , anthropic_judge.py:136. Admission reserves one attempt, but the adapter retries without another budget check. Additional attempt charges are added only afterward, violating the counter’s cap. Reproduce: leave ex | duplicate of pr-aveto-support-5.md c01 (aveto-support#6) | no |
| c03 | P1 | pipeline.py:275 | Final unbilled error erases earlier uncertain charges. . The adapter reports only the final error category. If a 503 is followed by a 400, unbilled becomes true and zeroes the entire charge, including the reservation that should remain for the potentially bill | accepted https://github.com/gpatwa/aveto-support/issues/7 | no |

## How this review ran (read from the Codex session, 2026-10-23, with the owner's permission)

- **It was a genuinely new chat:** a new thread created at 23:23:31, whose only user messages were the two automatic
  context items and the blind prompt as the first real message. Folder: the aveto-support checkout.
- **It stayed blind by the plan's definition.** No command mentioned `runs/`, `code-review.md`, `END_REVIEW.md` or any
  security-review file (checked in all 8 tool calls). Its first line said so itself: "I did not read any file under
  `runs/` or any review note in this chat; I saw filenames and references in diff statistics and the PR description."
- **What it could still see.** (1) It read `.agentic/` guidance files, including `CURRENT_MVP_STATUS.md`, which says
  "counters live in memory and restart with the replica"; (2) the pull request description it fetched mentions D1,
  "reset" and "scales to zero". So **c01 was visible to it in the product's own documents** and is not an independent
  find. Neither `.agentic/` file nor the description mentions retries or reservation, so **c02 and c03 were not.**
- **Read-only, and checked:** read and test commands only, bytecode and cache writing switched off, a reproduction using
  the repository's own fakes, no model call, no GitHub post. The checkout was checked afterwards: clean, same HEAD
  `dbc8b81`, no new cache folders. 212 selected tests passed.

## Triage (the support session's reading; dispositions that are not marked are the owner's to set)

- **c01 (P1), restart resets the limits:** a real observation, and **already known**: our CR-3 and the owner's decision D1,
  which is still open. It was also written in the product's own status file and the PR description. This is the third
  time it has been raised as high severity (twice by Codex). It is not new.
- **c02 (P1 here, P2 in the first review), retries are not reserved:** **the same defect as aveto-support#6.** This time
  it was found in a clean chat with no review notes and no mention in the documents it read. **That is the first honest
  evidence that Codex finds it without being told.** Counted once, as a duplicate. Codex rates it P1 now and P2 before;
  our own reading is P2 (the overshoot is bounded by one reservation per retried request).
- **c03 (P1), a later 4xx or connection error erases the cost of an earlier uncertain attempt: new.** Checked against the
  code: in `_judged`, `unbilled = True` when the final error's category is in `_NEVER_BILLED` (`status_4xx`,
  `connection`), and `if unbilled: charge = 0` then overrides the retry charge, so a 503 followed by a 400 settles at zero
  although the run's own ruling (QA-2) charges a 5xx attempt in full. It is an inconsistency in the accounting, not a
  safety hole; a 503 then 400 is rare, and the amount is at most about one reservation. **Codex's P1 is overstated; my
  reading is P3.** **Accepted and filed as [aveto-support#7](https://github.com/gpatwa/aveto-support/issues/7), labelled `bug` and `P3`,** on the owner's instruction ("file c03 as P3 issue", 2026-10-23). Not fixed; it touches the same lines as #6, so one change would probably fix both.
