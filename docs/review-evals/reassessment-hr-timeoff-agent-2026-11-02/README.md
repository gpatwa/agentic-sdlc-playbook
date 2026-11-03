# Re-assessment of hr-timeoff-agent (M7, first run)

Earlier set: the 12 real findings the first assessment raised that were fixed in hr-timeoff-agent PR 41 (the 6 findings about planted bugs are left out with `--seeds`). Earlier commit `5f3a46b`; new commit `fd85486` (`main`, after PRs 39 to 45). New review: Claude Code, 16 of 16 areas, 75 findings (`after-FINDINGS-claude.md`), through `assess-run.mjs`. Table: `REASSESSMENT.md`, made by `execution/assess-reassess.mjs`.

**Result: 11 closed, 1 NOT FIXED, 74 new.**
- The 11 closed were marked fixed and no reviewer raised them again. That is evidence the fixes hold, not proof; one reviewer family.
- F-01-1 (sign-in fails open when `HR_OIDC_ISSUER` is unset) is raised again as F-03-1. It is a real residual, not a regression: PR 39 refuses demo sign-in on a non-loopback address, but on loopback it is allowed by design and only warns. The earlier "fixed" overstated it.
- A first version of the pairing rule wrongly paired F-05-2 with an unrelated finding about the same file; the rule now needs shared words even when lines are close (test added).
- The 74 new findings are not triaged. They come from a full-repo review that includes compose, CI, Docker and docs, which the first set did not cover, so "new" mostly means "outside the earlier scope" and not "introduced since".
- Codex was also started but hit its usage limit after 9 of 16 areas, so only the complete Claude run is used.
