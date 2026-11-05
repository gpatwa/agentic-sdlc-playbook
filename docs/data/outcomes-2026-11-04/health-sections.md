# Delivery-health section as an assessment report would print it (T42 P4)

Generated 2026-11-04 by renderHealth(outcomes(repo)); read only; no model call. Branch and tip are in each section.

### aveto-support

#### Delivery health from history

Read from the git history of `main` up to `902b959` (2026-10-30); nothing was fetched and no model was asked. **9 merged pull request(s)** over 5 calendar week(s) with at least one merge. This describes how the repo has been changed. It is not a verdict on the code and is not comparable with another repo.

| Measure | Value | Read it with |
|---|---|---|
| Lead time, first commit to merge (hours) | median 36.2 over 8 merge(s) | the revert rate and the review size below; a short lead time with more reverts is not an improvement |
| Reverted within 14 days | 0 of 4 with a closed window (0%); 5 too recent to judge | certain: a revert commit names the merge |
| Fix candidates within the same window | 2 (heuristic, a lower bound) | a Fix-titled commit after the merge that names the pull request or touches a file it changed |
| Changed lines a reader was asked to read, per merge | median 1376 (generated files, lockfiles and `runs/` left out) | whether the unit was small enough to review well |
| Merged with no GitHub review | not read here | needs the GitHub API; run `outcomes.mjs --gh` on the repo |

Not shown because the history cannot show it: time to restore service, defects nobody found, whether a review was careful, and how many people the team has. Figures for one operator merging their own work will show no reviews; that is a fact about the team, not a fault to score.

### streak-seed

#### Delivery health from history

No merged pull requests were found in the assessed history (merge or squash commits naming a pull request), so no delivery figure is given.

### stash-seed

#### Delivery health from history

Read from the git history of `main` up to `2cbaea3` (2026-09-06); nothing was fetched and no model was asked. **8 merged pull request(s)** over 4 calendar week(s) with at least one merge. This describes how the repo has been changed. It is not a verdict on the code and is not comparable with another repo.

| Measure | Value | Read it with |
|---|---|---|
| Lead time, first commit to merge (hours) | median 4.3 over 8 merge(s) | the revert rate and the review size below; a short lead time with more reverts is not an improvement |
| Reverted within 14 days | 0 of 8 with a closed window (0%); 0 too recent to judge | certain: a revert commit names the merge |
| Fix candidates within the same window | 0 (heuristic, a lower bound) | a Fix-titled commit after the merge that names the pull request or touches a file it changed |
| Changed lines a reader was asked to read, per merge | median 212 (generated files, lockfiles and `runs/` left out) | whether the unit was small enough to review well |
| Merged with no GitHub review | not read here | needs the GitHub API; run `outcomes.mjs --gh` on the repo |

Not shown because the history cannot show it: time to restore service, defects nobody found, whether a review was careful, and how many people the team has. Figures for one operator merging their own work will show no reviews; that is a fact about the team, not a fault to score.

### hr-timeoff-agent

#### Delivery health from history

Read from the git history of `origin/main` up to `fd85486` (2026-11-02); nothing was fetched and no model was asked. **39 merged pull request(s)** over 4 calendar week(s) with at least one merge. This describes how the repo has been changed. It is not a verdict on the code and is not comparable with another repo.

| Measure | Value | Read it with |
|---|---|---|
| Lead time, first commit to merge (hours) | median 0.4 over 39 merge(s) | the revert rate and the review size below; a short lead time with more reverts is not an improvement |
| Reverted within 14 days | 0 of 35 with a closed window (0%); 4 too recent to judge | certain: a revert commit names the merge |
| Fix candidates within the same window | 0 (heuristic, a lower bound) | a Fix-titled commit after the merge that names the pull request or touches a file it changed |
| Changed lines a reader was asked to read, per merge | median 535 (generated files, lockfiles and `runs/` left out) | whether the unit was small enough to review well |
| Merged with no GitHub review | not read here | needs the GitHub API; run `outcomes.mjs --gh` on the repo |

Not shown because the history cannot show it: time to restore service, defects nobody found, whether a review was careful, and how many people the team has. Figures for one operator merging their own work will show no reviews; that is a fact about the team, not a fault to score.

