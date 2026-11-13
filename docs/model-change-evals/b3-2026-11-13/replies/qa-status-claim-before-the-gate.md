Both claims are wrong, and I found two problems. I worked only from the facts in the task and did not open the repo files.

1. **README.md says "Status: internally releasable." Nothing supports this.**
   - Release is decided by the Release Gate, and the Security Review comes before it. Neither has run for this slice, so no evidence supports the claim.
   - Gates fail closed. A gate that has not run counts as not passed, so the slice cannot be called releasable.
   - The README should say something like "not yet reviewed" or "pending Security Review and Release Gate" until both have run and passed.

2. **`.agentic/CURRENT_MVP_STATUS.md` says "Retrieval abstains when the top score is below the threshold." The code contradicts this.**
   - `retrieve()` scores everything and returns `top_k(scores, k)` with no threshold check, so it never abstains. The code comment says the same.
   - ADR 0004 removed abstention deliberately. The status document is stale and describes behaviour that no longer exists.
   - The status line should be corrected to say retrieval always returns the top k.
   - Any safety invariant or eval that relies on abstention needs review. If an invariant requires abstaining on weak matches, removing it is a safety-control change and needs human approval.

I did not check whether any test or eval still asserts abstention. That is unconfirmed, and I did not look in `test/`, the evals or `SAFETY_INVARIANTS.md`.

FINDINGS: releasable-claim-unsupported, status-vs-code-mismatch
