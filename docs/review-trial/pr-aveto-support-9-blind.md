# External review: gpatwa/aveto-support#9 (Codex app; new chat; blind)

Mode: blind. Path: A.

Source: a pasted review (not posted to GitHub). Collected 2026-10-24. Disposition `open` means nobody has judged it yet: set each to `fixed <ref>`, `accepted <issue>` (the finding is correct and is filed to fix later), `intentional <reason>` (the finding is correct and the behaviour is deliberate), `rejected <reason>`, or `duplicate of <record>` (the same defect already counted). "Also in our local review?" is a heuristic (same file, within 15 lines); a person confirms it.

0 findings.

## How this review ran (read from the Codex session, 2026-10-24, with the owner's permission)

- **Pull request 9** (fix-service-accounting: #6, #7, #8), reviewed at commit `c18893cd23788bca4aed598395df5b954f7abd0f`, which is the
  pull request's head. The code files (`aveto_service`, `infra`, `tests`) are identical to the earlier head `c827bae`; only run records differ.
- **A genuinely new chat; blind by the plan's definition.** Three tool calls, none touching `runs/`, `docs/`, the README,
  `.agentic/CURRENT_MVP_STATUS.md` or any review note; the first line of its answer says the same. The prompt forbade the pull
  request description too, and it did not read it.
- **Result: "no actionable issues."** It was a **static review**: it did not run the tests, although the prompt allowed it, and it read
  one diff and the eight files it touches. Its caveat: provider pricing "remains unconfirmed" (it had no network).
- **What this does and does not show.** On pull request 5 the same kind of blind review, which ran the tests and a reproduction, found three
  things. Here a static pass found none. That does not show the code is correct; it is one data point and a lighter review. Our own
  reviews on this slice left a known list that Codex did not raise: the pause at about 33 questions a day (CR-3), A1 (a connection
  error charged usage only), A2 (a 429 assumed unbilled), and the restart reset (D1). Those are documented decisions, and a blind
  reviewer that never saw the notes would not necessarily find them.

## Two aborted attempts before this one (not reviews, not counted)

Both stopped at Codex's own head check with one command and no off-limits reads. The first (00:16 local) named `c827bae` in my prompt;
the branch had gained one record-only commit (`c18893c`). The second (00:19) re-used that old prompt by mistake. The prompt now carries no
commit id; Codex states the head it reviewed and the support session checks it against the pull request.
