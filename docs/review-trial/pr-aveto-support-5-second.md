# External review: gpatwa/aveto-support#5 (Codex app; second review; not fully blind)

Mode: informed. Path: A.

Source: a pasted review (not posted to GitHub). Collected 2026-10-23. Disposition `open` means nobody has judged it yet: set each to `fixed <ref>`, `accepted <issue>` (the finding is correct and is filed to fix later), `intentional <reason>` (the finding is correct and the behaviour is deliberate), `rejected <reason>`, or `duplicate of <record>` (the same defect already counted). "Also in our local review?" is a heuristic (same file, within 15 lines); a person confirms it.

| id | P | file:line | claim | disposition | also in our local review? |
|---|---|---|---|---|---|
| c01 | P1 | aveto_service/pipeline.py:181 | Restarting bypasses both spend and visitor limits. , with scale-to-zero configured at infra/main.bicep:220. Each process creates fresh rate limiters and a spend counter. Consequently, normal scale-to-zero/restart cycles restore the entire allowance before the | intentional CR-3 (owner decision D1 still open) | yes (CR-3) |
| c02 | P2 | aveto_service/pipeline.py:254 | Retries spend beyond the admitted reservation. , aveto_service/anthropic_judge.py:136. Admission reserves one attempt, while the adapter can issue two without another budget check. Settlement charges both afterward. With a $0.030000 daily cap and a fake two-at | duplicate of pr-aveto-support-5.md c01 (aveto-support#6) | no |

## How this review ran, and why it is recorded as informed (read from the Codex session, 2026-10-23, with the owner's permission)

- **It was run as the "blind pass" prompt, in the same chat as the first review, so it was not blind.** Codex said so
  itself on its first line: "I read the excluded review records earlier in this chat, so this cannot be fully blind."
  The plan did not say to use a fresh chat; it does now. **The independence bar stays unmet.**
- **It stayed within the rules it was given.** Read-only commands only (`git`, `nl`, `cat`, `rg`, and the repository's own
  tests, run with bytecode and cache writing switched off); a Python reproduction with the network switched off in code;
  no GitHub post, no model call. It did not open the off-limits files again (the one command that matched "runs/" was a
  search for that text inside test files). The checkout was checked afterwards: **clean, same HEAD, no new cache folders.**
- **c01 (P1, restart bypasses the spend and visitor limits)** is a real observation and **is already known**: it is our
  CR-3 (`code-review.md`, "intentional") and the owner decision **D1** in the end review. Codex had read both earlier in the
  chat, so this is a repeat of what it was told, not a new find. It rates it **P1**; our review left it as an owner decision.
  The owner has **not** yet decided D1 (accept, add a counter store, or run one replica always on). Disposition
  `intentional CR-3` is the code review's, not the owner's; two reviews now treating it as high-severity is a reason to
  decide D1.
- **c02 (P2, retries are not reserved)** is the same defect as the first review's c01 (aveto-support#6), with the same
  reproduction figures. Marked `duplicate`: counted once. It cannot count as evidence that Codex finds it repeatably,
  because Codex had the first finding earlier in the same chat.
