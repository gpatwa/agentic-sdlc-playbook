# Review of the T42 proposals: PRODUCTIVITY_METRICS.md and ORG_MODEL.md

Date: 2026-11-05
Reviewer: Engineering Manager role, independent of the author

Scope: `docs/PRODUCTIVITY_METRICS.md` (the dictionary, rows D1-D3, Q1-Q4, C1-C3, H1-H5) and `docs/ORG_MODEL.md`. Stance taken from
`agents/engineering-manager.md`: defend the team from oversized slices, missing context and skipped gates; protect the owner's
attention and review capacity. This is read-only: no existing file was edited, nothing committed.

How to read the evidence marks. **[V]** means I opened the file or ran a read-only command and saw it. **[I]** means I infer it.
Line numbers are the line numbers of the file as I read it.

Short version: the position is sound and the documents are unusually honest about "not recorded". But (1) the headline Q2 figure
on aveto-support is an artifact of a slice's name, (2) the dictionary and `outcomes.mjs` disagree in fourteen places, several
material, (3) the org model contradicts `CODE_REVIEW.md` and `standing-charter.mjs`, cites a tier that does not exist, and asks
for an `END_REVIEW.md` line that no protocol defines, and (4) the "review capacity" measure cannot produce a number for a
one-operator repo, which is every repo measured.

---

## A. Metrics

### A1. Row by row

"Decision real" asks whether a named person would act differently on the figure. "Gaming check adequate" asks whether the check
would stop the drift it names. "Matches code" compares the dictionary row with `execution/outcomes.mjs` and
`execution/tests/outcomes.test.mjs`.

| Row | Decision real? | Gaming check adequate? | Matches code? | Verdict |
|---|---|---|---|---|
| D1 lead time | Half. "Is it getting shorter" yes. "Where does it wait" (line 32) no: one number cannot say where. | Partly. Lists trivial slices and late approval. Misses rebasing or amending, which resets the committer date the code uses (`outcomes.mjs:89`, `%cI`). | No, see M1, M2. | Keep, git-only variant as the one D1 |
| D2 slices per week | Weak. With 1-3 merges a week (aveto-support.md:17) "bunching" cannot be told from noise. | Adequate (read beside size). | No, see M3: counts any merged PR, not "slice PRs". | Merge into the review-load row |
| D3 time to restore | Real, and unmeasured. | Weak ("not reporting incidents" is not a check). | Matches: always "not recorded" (`outcomes.mjs:230`). | Keep as "not recorded", with an owner decision to record or drop |
| Q1 catches vs escapes | Real in principle. | **No.** Catches are written by the same agents whose cost the metric justifies (`SLICE_STATE.md:150-153`; `TELEMETRY.md:63` says "a gate verdict is a judgement"). "Findings keep their recorded severity" does not stop an agent recording one. | No, see M4: no ratio, no join to Q2, counts advisories. | Keep, redefine as a count by severity, drop "against escapes" |
| Q2 post-merge fix or revert | **Yes, the best row.** | Adequate in wording. The code's text matching is the weak part. | No, see M5. Headline figure is wrong on one repo. | Keep; reverts as the headline, fix candidates as a list |
| Q3 review findings | Real. | The pairing is wrong: "pair with P6's judge rejection rate" (line 42) points at the assessment-mode judge. The code-review counterweight is `CODE_REVIEW.md` §5 (share of findings rejected or intentional). | No: line 42 says "prose today, not structured"; `CODE_REVIEW.md` §3 defines a structured table with severity and disposition per finding. | Merge into Q1 and compute from `code-review.md` |
| Q4 CI failures per merge | Marginal. Real use: a red first run means the local regression command differs from CI. That is a pack decision, not a person decision. | Adequate. | No, see M6: dictionary says "needs gh"; code never computes it, even with `--gh` (`outcomes.mjs:238`). | Keep as "not recorded", low priority |
| C1 cost per merged slice | Real, but "affordable at this level of review" mixes cost with review. | Weak: "always show slice size" (line 49) but the code prints no size. | No, see M7. | Keep, fix the denominator and the average |
| C2 plan against actual | Real and already served by `docs/data/budget-ratios.md` (PM2). | Weak: "plan is frozen at the Charter hash" is not verified by the code. | Partly, see M7. | Merge with C1 into one cost block |
| C3 spread, not rank | Duplicates D1's slowest tenth and C1's list. | n/a | Not computed anywhere. | **Cut** |
| H1 owner touches | Real, and the most useful number for a one-operator process. | Weak: batching into long messages is the whole game. | Not computed (needs T30). | Keep as "not recorded"; see A3 on the rule-1 conflict |
| H2 time to first touch | **No.** "Are runs stalling for a person?" is the owner's own idle time. | **Fails the dictionary's own rule 2**: gaming check is "None obvious" (line 58). | Not computed. | **Cut** |
| H3 questions after the Charter | **Yes.** A question after approval is a Charter defect; the EM can act (tighten Charter drafting). Process measure, not a person measure. | Adequate (hard stops stay on). | Not computed. Could be derived from stop reasons. | **Keep**, fold H1 under it |
| H4 review burden | Real. | Partly: names padding with generated files, not the reverse (moving human-read code under an excluded path such as `build/` or `vendor/`). | No, see M10. | Keep, fix the definition |
| H5 reviews waiting | Only for a team. With one operator the owner can see their own PR list. | Adequate. | No, see M11. | **Cut** until a second person exists |

### A2. Mismatches between the dictionary and the code

M1. **Rule 4 vs code.** Rule 4 (line 15): "Below ten slices no percentile is drawn, only the list". The code prints a median at any n:
aveto-support.md:11 "n 8, median 36.2 h", :15 "n 7, median 24.1 h", :39 "median 1.45 over 5". A median is the 50th percentile.
[V] The slowest-tenth gate tests `n >= 10` where `n` is all merged changes, not the number with a lead time (`outcomes.mjs:175`).
A repo with 10 merges and 3 branch histories would draw a "slowest tenth" from 3 items. [V code]

M2. **D1 construction.** `Math.max(0, …)` (`outcomes.mjs:174`) clamps a negative lead time to zero, so a clock or history error
shows as a fast merge. First commit is the committer date (`:89`). Squash merges are dropped (aveto-support.md:11 "1 squash-merged
change(s) … left out"). Trunk-direct slices are invisible: streak-seed has 4 landed run records and "n = 0 merged changes"
(streak-seed.md:5), although `OPERATING_MODEL.md:133` permits "per direct commit if the project uses trunk-direct". [V]
Also, the Charter-approval variant adds almost nothing: for five of seven slices it equals first-commit-to-merge within about
0.2 h (Charter list 191.19, 24.13, 7.80, 48.32, 10.95 h against git list 191.07, 24.12, 7.77, 48.32, 10.78 h, from my run of
`outcomes.mjs --json` on aveto-support). [V]

M3. **D2 counts non-slices.** Dictionary: "Count of slice PRs … slice identity from the branch or run folder name" (line 33).
Code: every first-parent merge or `(#N)` squash (`outcomes.mjs:51-61`). aveto-support PR #13 has 0 lines to read and 3,796 record
lines (my run; it is the "measured token usage" commit, `902b959`), so n = 9 includes a records-only PR and pulls the H4 median
down. [V]

M4. **Q1.** Dictionary: "`gateCatches` with a required fix" against Q2. Code counts every `gateCatches` entry
(`outcomes.mjs:151`, array length) and computes no ratio and no join to Q2. The 38 in aveto-support.md:29 includes advisories:
the traces carry `severity` values `blocker`, `required-fix` and `advisory`, and e.g. fix-service-accounting has 6 entries of which
3 are advisory. [V] The unit also differs between the two sides: defects on one side, share of slices on the other.

M5. **Q2.** (a) Dictionary: "a fix commit that names the slice" (line 41). Code also accepts any later commit whose subject starts
with `fix` or `hotfix` and touches any file the PR changed (`outcomes.mjs:124-127`), and the regex `^(fix|hotfix)\b` matches
`fix-service-accounting:` because `-` is a word boundary (I ran the regex: true). [V] (b) **The 50% on aveto-support is an
artifact.** aveto-support.md:25 reports "Fix candidates: 2 … revert or fix-candidate rate 50%". I replayed the attribution
read-only: PR #3 is flagged by `2a7c3f2` and `c8f4f44`, PR #4 by `34eac7a`, `2a7c3f2` and `c8f4f44`, all named
"fix-service-accounting: …", all routine slice commits (scope review, docs, production verification) overlapping `README.md`,
`.agentic/CURRENT_MVP_STATUS.md` or `docs/ARCHITECTURE.md`. The repo has 19 commits with that prefix. [V] No defect repair is
among them. The true figure from this evidence is "0 reverted of 4 closed windows", with no recall check on the fix side.
(c) False negatives are likely: `^(fix|hotfix)\b` does not match "Fixed", "Fixes" or "Correct"; hr-timeoff-agent has 60 non-merge
commits, 1 starts with "Fix", and the report prints "0%" over 35 (hr-timeoff-agent.md:25). [V counts; I did not read the commits
to say whether any were defect repairs.] (d) The one visible rework event in aveto-support, an intent "fix the public service's
spend accounting (issues #6, #7, #8)" (commit `144c811`, 2026-10-22), is invisible to Q2 as defined, except by the name collision.
Escapes in this process arrive as issues that become new slices. [V commit; I infer it was a post-merge escape, not verified.]
(e) The dictionary says `analyze.mjs` counts `postLandingFixes` and `reverted` "today" (line 41). None of the 13 aveto-support
traces has either field (my read of the traces: both undefined), and `outcomes.mjs` reads them (`:151`) and then never uses them. [V]

M6. **Q3/Q4.** See table. Dictionary Q4 status "needs `gh`" implies it is computed with `--gh`; it is not.

M7. **C1/C2.**
- `tokensPerMergedSlice` is a **mean** over landed slices only (`outcomes.mjs:213`). aveto-support: 3,099k. The median of the same
  seven is 1,572k (919, 651, 1,572, 2,496, 579 plus 5,792 and 9,684). The two largest, docs-retrieval-3 and -4, have no plan.
- **The denominator drops the spend that did not merge.** Six of 13 runs are unlanded: 8,407 + 2,773 + 854 + 312 + 75 + 2,345 =
  14,766k of 36,459k total, 40.5% (aveto-support.md:43-49). "Cost per merged slice" as built is 3,099k; including that spend it
  is 5,208k. Some of these are proofs or spikes (docs-retrieval-2-proof), and I cannot tell abandoned from superseded from
  intentional. That is the point: the metric hides the question. [V figures; I infer the classification is unknown.]
- Slice size is not printed (`perSlice` has slice, tier, tokens, plan, ratio, landed), but the C1 gaming check depends on it.
- C2 "per stage kind" (line 50) is not computed. The plan figure comes from one regex on `CHARTER.md` (`:146`); a plan written
  as "~600k" or "2,400,000" silently becomes `null` and the slice drops out of the ratio. The five slices that have a plan are all
  tier 3 and all recent, so "median 1.45" describes one regime. "The plan is frozen at the Charter hash" is not checked: the code
  reads the working-tree `CHARTER.md`, never its sha256. [V code]
- Record-based figures read the **working tree**, while git figures read the named ref (`:141`, `:162`). The header says "from
  the git history of `main` … and `runs/<slice>/trace.json`"; the two can come from different commits. The ownership data was made
  on `records/landed-from-git`, `routine-run` and `claude/docs-index`, not `main` (ownership file lines 7, 27, 65). [V]

M8. **C3** not computed. **H1-H3** not computed (honestly marked).

M9. **Dictionary parsing.** `loadDictionary` drops any row with fewer than 8 pipe-split cells or an id not matching `[A-Z]\d`
(`outcomes.mjs:257`). A pipe inside a cell, or a new column, makes a row disappear from the dashboard with no error. The test
asserts only nine ids (D1, D2, D3, Q1, Q2, C1, C2, H4, H5), so Q3, Q4, C3, H1-H3 can vanish unnoticed. [V]

M10. **H4.** (a) Dictionary excludes "generated files and lockfiles" (line 60). Code also excludes everything under `runs/`
(`:33`, `:82`), counted apart as record lines. The dictionary never asked the owner about `runs/`. (b) **`runs/` contains the
documents the tier table tells the owner to read**: `CODE_REVIEW.md:32` says the owner "reads `END_REVIEW.md` and the review
findings". Those are 31-61 lines per END_REVIEW and 55-79 per CHARTER in the five Charter runs. So for a small diff, e.g.
PR #3 (147 lines read, aveto-support.md per my run), the mandatory reading is about as large again as the figure shows. [V]
(c) Record lines are 3,652-9,783 per PR, larger than the read lines in 5 of 9 PRs. Whether anyone reads them is unstated.
(d) "Merged with no GitHub review" is `reviews.length === 0` from `gh pr view` (`:186`): any review object counts, including bots
and, I infer, the author's own comment-reviews. [I] And on a one-author repo it is 100% by construction: 9 of 9, 8 of 8, 39 of 39
(aveto-support.md:65, stash-seed.md:55, hr-timeoff-agent.md:43). A figure that cannot move carries no information; it should print
"not applicable: one author" rather than a share. (e) Median only; the distribution is wide (0 to 6,306 lines in aveto-support).

M11. **H5.** Dictionary: "open PRs awaiting the owner … age counts from first ready-for-review" (line 61). Code: all open,
non-draft, non-bot PRs, age from creation (`:198-200`; the output says so, the dictionary does not). hr-timeoff-agent's "1 open,
oldest 30.3 days" (:47) is a stale PR, not a review queue.

M12. **Figures not in the dictionary.** `reviewLoadPerWeek` (`:245`) and the two Q2 rates (`revertRate`,
`revertOrFixCandidateRate`) are produced and rendered; the file's own header says "a figure not defined there is not produced
here" (`outcomes.mjs:4`; dictionary line 5).

M13. **"Zero changes to the target."** Dictionary rule 6 and the file header say nothing is written to the target; `--write`
writes `runs/OUTCOMES.md` into it (`outcomes.mjs:315-320`). True only without `--write`. [V]

M14. **Test coverage.** `outcomes.test.mjs` builds a git fixture and tests D1, H4 lines, Q2 revert and fix-by-overlap, the
read-only check and `--gh` through an injected reader. **No test builds a `runs/` folder with `trace.json` and `CHARTER.md`**, so
the plan regex, the Charter-lead join, `gateCatches`, and the mean are untested; `runs-dashboard.test.mjs:184` feeds a stub
object. [V grep] The "mutation" test checks that removing the revert removes the count, which would not catch the false positive
in M5(b).

### A3. Cut, merge, keep "not recorded"

- **Cut:** C3 (duplicate, uncomputed, cites a secondhand adoption percentile as its model); H2 (fails rule 2; measures the one
  operator's absence); H5 (until a second person exists; a snapshot with no stored history cannot show a trend).
- **Merge:** D2 into the weekly review-load row (it already carries `merged`); H1 under H3 as "owner touches, from the transcript
  once T30 exists"; Q3 into Q1 (findings by severity and disposition from `code-review.md`); C2 into C1.
- **Keep as "not recorded":** D3, H1, Q4. Say who would record each; an unowned "not recorded" row is decoration.
- **Rule 1 conflict.** Rule 1 (line 10) says "prompt counts … are not scores", and the "Not metrics" table lists them. H1 is a
  count of the human's messages with a target ("the approval alone"). The dictionary's own reasoning at line 68 ("Aveto has one
  operator, so a per-person view would also be a report on that person") applies to H1 and H2 exactly. Either reframe H1 as
  stops initiated by the run (H3), or state why this prompt count is not a score.
- "No ranking anywhere" (line 11) versus C3 and D1's sorted slowest-tenth list: say "no per-person ranking".

### A4. Missing rows an EM would act on

1. **Unlanded run share and its spend.** 6 of 13 runs, 40.5% of tokens (above). Needs a recorded reason (abandoned, proof,
   superseded). I would act on this first.
2. **Scope-rule exceptions.** The EM's rules are more than 10 files, mixed behaviour and refactor, two unrelated suites
   (`engineering-manager.md:65-71`), and `OPERATING_MODEL.md:28` "six stages or about 600k". Three of the five Charters that have
   a plan were planned above 600k (730k, 1,000k, 2,000k; aveto-support.md:51-55) and ran. The 600k line is a "signal", not a rule,
   and nothing counts how often it is crossed or what happened after. Files per PR is not in `outcomes.mjs` at all.
3. **PR opened to merge, split from first commit to PR.** D1 lumps build time and the wait for the owner. docs-retrieval-4 shows
   191 h first commit to merge; the number cannot say whether that was a build or a wait. Needs `gh` (creation time).
4. **Review rounds per slice** (`CODE_REVIEW.md` §4 allows three) and the rejected or intentional share (§5). Structured already.
5. **Hard-stop and budget-guard asks per run**, from the event log. That is H3's data, and unlike H1 it needs no transcript.

---

## B. Org model

### B1. Roles and decision table against HUMAN_APPROVAL_RULES.md, RELEASE_GATES.md and CODE_REVIEW.md

Contradictions, each [V]:

1. **Tier 0 does not exist.** `ORG_MODEL.md:32` says "release tiers in `docs/RELEASE_GATES.md` (0 to 3)" and the column is "Tier
   0-1 / low" (line 35). `RELEASE_GATES.md` defines Tier 1, 2 and 3 only (lines 76-93); the only "Tier 0" in the repo is a
   backlog heading (`BACKLOG.md:12`).
2. **Two classifications treated as one.** The columns pair "Tier 3 / high" as if the release tier (external effect) and the
   review tier (what the diff touches) were the same axis. They are not. `CODE_REVIEW.md:31` makes **High** anything touching
   hooks, permission rules, deny lists, CI or release workflows, a model or processor line, or a Charter C5 line. A hook change can
   be release tier 1 or 2 and review tier High. The table does not say which governs.
3. **Tier 3 reader.** `CODE_REVIEW.md:31`: High means "the owner reads the change itself". `ORG_MODEL.md:38`: "A person other than
   the author's owner reads the change itself". This is a change to the review protocol, presented as a restatement.
4. **"Nothing here changes a gate, a hook or an approval rule"** (line 5) is not true of the table. `HUMAN_APPROVAL_RULES.md`
   "Approval by Charter" has one human approve by hash (rule 3). "Owner, and a second named person" (line 37) is new. The nearest
   existing text is the enterprise-only change request with a "named approver" (`RELEASE_GATES.md:104-106`) and the forward
   reference to "RBAC Tier 3 named approvers" (`HUMAN_APPROVAL_RULES.md:60-63`). Say "this proposes changing", and list the
   changes.
5. **Standing Charters.** Line 42: tier 2 / 3 "not allowed under a standing Charter". `standing-charter.mjs:95` rejects only tier
   3 ("a tier 3 release is never routine") and the template allows `<1 | 1, 2>` (`STANDING_CHARTER_TEMPLATE.md:13`). Tier 2 is
   allowed today.
6. **"as pack v32 now requires"** (line 102). `agents/sre.md:71-76` says the Charter "**may** pre-approve a named step". Permitted,
   not required. The question also says "on the agent's behalf", which misdescribes it: a Charter line is the human's own
   approval by hash, not a delegation.
7. **Required record does not exist.** Lines 46-48 tell the run to write "no second reviewer available" in `END_REVIEW.md`. No
   protocol defines that line. `APPROVAL_PROTOCOL.md` carries the new "AI fit" line only; the phrase appears only in
   assessment-mode reports (`docs/review-evals/*/REPORT.md:9`, "Independent second reviewer: no"). Until a field exists, the
   promise "a recorded limit, not a pass" has nothing to be recorded in.

Gaps:

- The decision table has no row for **HUMAN_APPROVAL_RULES rules 1, 2, 3, 5, 6** as such: send or submit, destructive shared
  state, deploy or flag or RBAC change, a new LLM call, a new processor. "Merge: Owner" is the only deploy-adjacent row.
- **Two approvers for one line.** Platform owner is "model and processor lines" (line 27). Rules 5 and 6 and the Charter make the
  Charter owner approve those same lines. Which one wins is unstated.
- **CI and release workflows** are Platform owner territory (line 27) and High-risk in `CODE_REVIEW.md:31`, but the "second
  person" row (line 41) names only hooks, deny lists and permission rules.
- **The agent independent review is not in the model.** Every tier already has an independent reviewer on a different model
  (`CODE_REVIEW.md` §1.2). The table's "Independent reviewer" is a human. Say so, and say `CODE_REVIEW.md` §7 ("an automated
  approval is not a human's") is why the human one is still missing.
- The five roles do not map to the agents that own the same decisions (Release Manager go/no-go, Compliance Reviewer's "named
  approver"). Not required in a proposal, but the first Charter that uses this will have to.

Coherent: the "may not" column is the right test; "approver is an identity, never a role" matches `HUMAN_APPROVAL_RULES.md:57-63`;
"Incident owner … not delegate an in-the-moment approval to an agent" matches `sre.md`.

### B2. Is the tier-3 "second named person" rule workable and honest for one operator?

Honest in intent: it refuses to count the owner's own read as independent (lines 46-48) and says "a recorded limit, not a pass".
Not yet workable:

- It is conditional on an org fact ("where the team has one"), so the rule is vacuous in the only configuration that exists. The
  sentence on lines 45-47 is also garbled ("sole author's owner").
- It names no record field (B1.7), so nothing differs in a run from today.
- Tier 3 is the common case here, not the exception: **6 of 13 aveto-support runs are tier 3, and 5 of the 7 that landed**
  (aveto-support.md:44, 51-55). Making the second person mandatory would stop most of the product's delivered work.
- The "Steward + a second person" row (line 41) is applied at every tier. Hooks and pack versions are changed constantly by one
  operator plus an agent (pack v32, v33 in the last week, per recent commits). With one person this row is unmeetable at all tiers,
  but the "cannot be met" caveat is written only for the tier 3 cells.

What would make it honest: a field (for example `independentHumanReview: none, one operator`) in `END_REVIEW.md` and
`trace.json` for any tier 3 or High run, so the gap is counted in the dictionary (one more "not recorded" turned into a record).

### B3. Is review capacity treated as a measured limit, not an invented number?

**Intent: yes.** The document states that no study gives a safe number (lines 55-58), labels the Faros figure as vendor telemetry,
and forbids using capacity as a target (line 65). It invents no capacity number. The 600k and six-stage signal (line 63) is a
token figure the owner chose on 2026-11-04 (`OPERATING_MODEL.md:30`), not a review limit.

**Execution: no number can be produced.**
- The capacity reading is "slices per week reviewed with findings or comments, against merged with none" (lines 60-61). On every
  repo measured the second term is everything: 9 of 9, 8 of 8, 39 of 39. The "rule of use" (lines 62-64) triggers when the
  no-review share "rises"; it cannot rise from 100%.
- Treating comments as evidence of reading rewards leaving comments.
- Slice size in tokens is called "the control" for review load (line 64). No data connects tokens to lines read. In
  aveto-support, result-page-clarity (579k tokens) appears to be PR #12 with 890 lines; polished-chat-experience (1,572k) PR #11
  with 3,911; PR #1 has 6,306. [Line counts V; the slice-to-PR matching is my inference from dates and commit messages; **n of
  about 9, no inference drawn**.]
- What the data do show: aveto-support medians 1,376 lines per merge, 6,498 lines in one week of 2 merges
  (aveto-support.md:71); hr-timeoff-agent **92,095 lines in the week of 2026-09-28 across 21 merges** (hr-timeoff-agent.md:49).
  Nothing in the records says any of it was read. The document's honest conclusion is "capacity is unmeasured, and the load
  figures are far above any plausible reading rate", which it does not say.
- Better observable proxies, none requiring a second person: time from PR opened (or END_REVIEW written) to merge; whether the
  owner changed or rejected anything at end review; findings the owner overrode. These are owner-behaviour figures, so they need
  the same "never per person, never a target" treatment.

### B4. Team-shape hypotheses: does each name evidence that would change it?

Each row names a direction ("rises", "gets worse", "grows") but none gives a size, a minimum n, or a time window except row 1
("at least ten slices").

| Row | Problem [V] |
|---|---|
| One owner, many agents | "A second person is needed for tier 3" (line 81) is already true by the table's own rule, so the row is circular. "Reviews waiting grows while the owner is idle" needs H5 and H2, both of which I recommend cutting. |
| Small team, pairwise review | "Review time per slice rises (H4)": H4 is changed lines, not time (line 82). No review-time metric exists. "Catches rising (Q1)": Q1 counts agent gate catches, not human catches. Cannot be tested on any current repo (no second person). |
| Platform and steward separated | The check ("D1 split by whether the slice touched a steward-owned path") needs CODEOWNERS, and 3 of 4 repos have none; with 8-9 merges per repo a split has no power. |
| Fewer producing roles (O3) | "Gate catches (Q1) or post-merge fixes (Q2) get worse": at 0 to 4 events per repo a change cannot be seen. State the smallest difference you would believe, and the n needed. |

Rows 2 and 3 have no route to evidence from Aveto's own data. They depend on the P5 pilot repo, which is not chosen. Say so.

### B5. Ownership section

- `ownerless-high-risk-paths.md:3` says "None of the four repos has a CODEOWNERS file". **False for hr-timeoff-agent**:
  `.github/CODEOWNERS` exists on `origin/main` and `HEAD` (I listed the tree; `git ls-tree`), with every path owned by
  `@gpatwa` and the comment "One maintainer today; the paths are the package boundaries … so a second owner can take a boundary
  without a reshuffle". The file's own last section (:67) says "0 of 21 high-risk file(s) have no owner in CODEOWNERS" and omits
  the "(the repo has no CODEOWNERS file)" clause the other three carry. `PRODUCTIVITY_AND_ORG_PLAN.md:25` repeats the false
  statement. [V]
- `ORG_MODEL.md:70-72` says a Charter touching an ownerless high-risk path "stops at Charter drafting". The data: 60 of 60
  (aveto-support), 54 of 54 (streak-seed), 44 of 44 (stash-seed) high-risk files are ownerless, including the pack's own
  `.claude/agents`, `.claude/hooks` and `.claude/protocols`. Adopted literally, every Charter that touches the pack in those three
  repos stops. And **nothing enforces it**: `charter-check.mjs` and the hooks never read CODEOWNERS (grep); the sentence exists
  only in `repo-map.mjs:355` output text. [V]
- A CODEOWNERS file naming one person for everything (the hr-timeoff-agent model) satisfies "every path has an accountable human"
  and gives no independent approval. The section should say these are different properties.

---

## C. Claims the documents or data do not support

**PRODUCTIVITY_METRICS.md**
1. Line 68: "A leaderboard was shut down at Amazon after people used the tool to climb it." Stated as fact. The research file reaches it
   only through a search summary (`2026-11-project-management-with-ai-agents.md`, "Build four small things", `(GeekWire … search
   summary)`); the plan lists it as press. Label it [reported, secondhand].
2. Line 67: "Amazon's own memo calls them flawed as targets"; line 51: "Amazon's memo watches the 10th and 90th percentile of adoption".
   The plan (line 40) says the memo was read "through a summarising fetcher" on an undated page. And the figure watched is an
   **adoption** (input) metric, offered as the model for C3. Label, or drop.
3. Line 41: "*computed today* where those fields are filled" for change failure and rework rate. None of the 13 aveto-support traces
   fills `postLandingFixes` or `reverted` [V], so it is computed for zero runs.
4. Lines 3-4, 32, 49 and the status words (lines 22-26): "Nothing here is computed yet", "contract `outcomes.mjs` (P2) will be
   built to", "needs PM1". P2 is built and PM1a is done on one repo. The header is stale and misleads a new reader.
5. Line 15 (rule 4) "no percentile below ten": contradicted by the code (M1).
6. Line 14-ish rule 6 "zero changes to the target repo": true only without `--write` (M13).
7. Line 60: "The research names review capacity as the common constraint". The research labels this "a reasoned reading, not a result".
8. Line 41: the figure "50%" in the rendered output (aveto-support.md:25) is the Q2 definition's output on four merges, and
   it is wrong (M5b). It is presented beside "n" but as a rate. At n of 4, state the count, not a percentage.

**ORG_MODEL.md**
9. Line 5: "Nothing here changes a gate, a hook or an approval rule" (B1.4).
10. Line 32: "release tiers (0 to 3)" (B1.1).
11. Line 42: tier 2 not allowed under a standing Charter (B1.5).
12. Line 64: the 600k slice signal "is the control" for the no-review share. No data; the share is 100% regardless of slice size.
13. Line 70: a Charter on an ownerless path "stops at Charter drafting" in present tense, with no enforcement (B5).
14. Line 102: "as pack v32 now requires" (B1.6).
15. Lines 79-84, "what would change it": not falsifiable as written (B4).
16. Line 63 (sentence "the response is fewer or smaller slices in flight, never a shorter review"): a prescription presented
    as following from the measure. It is a policy choice and should say so.

**Plan and data**
17. `PRODUCTIVITY_AND_ORG_PLAN.md:25` and `ownerless-high-risk-paths.md:3`: "none of the four repos has a CODEOWNERS file" (B5).
18. Plan bar "computed for at least three repos (one not ours)" (line 86): all four repos are the owner's (stash-seed, streak-seed,
    aveto-support are Aveto-built; hr-timeoff-agent has `@gpatwa` as sole owner). The bar is unmet and the status table should
    not read as met.
19. Every n here is 4 to 13 slices (Q2 closed windows: 4, 8, 35; C2 plan ratios: 5). Nothing in the two documents makes a causal
    claim from them, which is to their credit; the *rendered* figures (50%, "median 1.45") invite one and need "n, descriptive
    only" beside them.

Credit where due: Faros and METR are labelled as vendor or dated; "not recorded" is never filled; the "Not metrics" list and
rule 7 are sound; ORG_MODEL line 86 ("No row claims that agents make a team faster") is correct.

---

## D. "For the owner to edit" questions: recommendations (the decision is the owner's)

**Metrics dictionary**

1. *14 days for Q2?* Keep 14 as the default and keep it a parameter. At today's volume it changes nothing: 5 of 9 aveto-support
   merges are too recent to score at 14 days and a longer window shrinks that further. The real problem is detection, not the
   window (M5): escapes here become issues and then slices (`144c811`). If the owner wants to spend effort, record "issue opened
   that references PR #N" from `gh`. A window the owner chooses should be written next to the figure.
2. *Record the time from the first idea?* Yes for the intent-confirmed commit time, because it already exists in git (for example
   `61a94b6`, "intents: polished chat experience (confirmed by the owner …)"), costs nothing, and the Charter-to-merge variant
   hides everything before approval. But do not display it until someone names the decision; the candidate decision is "is Charter
   drafting or re-scoping where time goes".
3. *Extra paths for H4?* The better question is what the owner *must* read. Add `runs/*/END_REVIEW.md`, `code-review.md` and
   `CHARTER.md` to the lines read (they are read by design, 86-140 lines per Charter run) and keep the rest of `runs/` excluded
   and counted apart. Test snapshot directories are fine to exclude. Be wary of `build/`, `vendor/` and `dist/` when they hold
   hand-written code, and print the matched paths per repo.
4. *Never show, or missing?* Never show H1 or H2 as a per-slice series on a page other people see; the series is a record of one
   person's behaviour. Missing rows I would add: unlanded run share and spend; scope-rule exceptions; PR opened to merge (A4).

**Org model**

1. *Second named person at tier 3: "where the team has one", or required?* My recommendation is "where the team has one" plus a
   mandatory recorded field for the one-operator case (B2). Making it required means 6 of 13 runs and 5 of 7 landed slices wait
   for someone who does not exist. If the owner wants a stronger stance without a second person, the nearest existing control is
   the independent agent review on a different model plus a short written cooling-off before merge; neither is an independent
   human, and the field should say so.
2. *Which roles do you hold?* Evidence suggests: Owner, Steward and Platform owner (CODEOWNERS `@gpatwa` on every hr-timeoff-agent
   path; `operator` in the traces), and Incident owner by default (the sole human approver of production mutation, for example
   the live deploy in `fix-service-accounting`). Independent reviewer: **write "unfilled"**. That makes the doc say that four of
   five roles collapse onto one person, and that two "may not" cells are unmeetable today. I cannot confirm the personal facts;
   this is the owner's to state.
3. *May the Charter pre-approve a rollback?* Recommend yes, with limits. A Charter line is the owner's typed approval by hash,
   made with time to think rather than mid-incident. Require the line to name the exact step, the trigger condition and the target,
   and expire with the run (`HUMAN_APPROVAL_RULES.md` "Approval by Charter", point 4: a line authorises exactly what it names).
   An unnamed step still asks. Change the wording from "on the agent's behalf" and from "pack v32 now requires".

---

## E. Ranked edits (not made)

1. **`execution/outcomes.mjs` and `PRODUCTIVITY_METRICS.md`, row Q2.** Stop treating a later `fix…` commit that overlaps a file as a
   fix. Show reverts (certain) as the headline; list fix-candidate subjects for the owner to classify; drop
   `revertOrFixCandidateRate`; exclude subjects of the form `fix-<slice>:` and add "Fixed/Fixes"; test with a fixture that has a
   slice named `fix-…`. Why: the one dashboard figure that says "50%" on aveto-support is false (M5b); a counterweight metric that
   cries wolf teaches the owner to ignore it.
2. **`ORG_MODEL.md`, "Decision class by tier" and header.** Remove "Tier 0"; state whether release tier or review tier governs the
   columns and handle High-review/low-release changes (hooks); correct the standing-Charter cell (tier 2 is allowed); replace "Nothing
   here changes a gate" with an explicit list of the proposed changes to `CODE_REVIEW.md:31` and the Charter approval rule. Why:
   B1.1-B1.5.
3. **`ORG_MODEL.md` and the `END_REVIEW`/`trace.json` protocols.** Define the one-operator record as an actual field, count the 6-of-13
   tier-3 runs, and apply the "cannot be met" caveat to the Steward row at all tiers. Say that the agent review is not an independent
   human. Why: B2; the promise currently has no home.
4. **`PRODUCTIVITY_METRICS.md`, group H.** Cut H2 and H5; fold H1 under H3; make the H4 text match the code (`runs/`, record lines, no
   percentile below ten); count `END_REVIEW.md`, `code-review.md` and `CHARTER.md` as read lines; print "not applicable: one author"
   for the no-review share. Why: A1, A3, M10, M11.
5. **`PRODUCTIVITY_METRICS.md` and `outcomes.mjs`, group C.** Use the median; include spend on unlanded runs (or print both next
   to each other); print slice size; fix the plan parse and verify the Charter hash or stop claiming it is frozen; drop C3. Why:
   M7; as built, "cost per merged slice" is 3,099k and the all-in figure is 5,208k.
6. **`PRODUCTIVITY_METRICS.md`, new rows.** Add unlanded-run share and reason, scope-rule exceptions (plan above 600k, files above
   10), and PR-opened-to-merge. Why: A4; these are the EM's actual levers, and the first two are computable from records already
   on disk.
7. **`PRODUCTIVITY_METRICS.md`, header, "Not metrics" table, C3 text, and the test.** Rewrite the stale header and status words;
   label the Amazon statements as reported and secondhand or remove them; reconcile `reviewLoadPerWeek` with the dictionary;
   state that `--write` modifies the target; extend `outcomes.test.mjs` to build a `runs/` fixture and to assert every dictionary
   id. Why: C1-C8, M9, M12-M14.
8. **`docs/data/ownership-2026-11-04/ownerless-high-risk-paths.md:3`, `PRODUCTIVITY_AND_ORG_PLAN.md:25`, `ORG_MODEL.md:70-72`.**
   Correct "none of the four has a CODEOWNERS file" (hr-timeoff-agent does); say the "stops at drafting" rule is not enforced and
   would stop every pack-touching Charter in three repos; add the distinction "owned" versus "independently approved". Why: B5.

---

## What I did not check

- I did not run the test suite (`node --test`). I read `outcomes.test.mjs` only, and the test list in `execution/tests/`.
- I did not call `gh` or any network service. All `--gh` figures (H4 no-review share, H5) are taken from the data files; I
  checked the code path that produces them, not the GitHub data.
- I did not verify the Amazon, Faros, METR, Linear, Atlassian or GitHub statements. I only checked how the two documents label
  them against the research file's own labels.
- I did not read `RUN_ECONOMICS.md`, `PIPELINE_ANALYTICS.md`, `docs/CODE_REVIEW.md`, `docs/AGENT_ROLES.md`,
  `runs-dashboard.mjs`, `analyze.mjs` beyond a grep, or the `repo-map.mjs` logic beyond the output text. I did not check how the
  dashboard parses the dictionary beyond `loadDictionary`.
- I did not read commits in hr-timeoff-agent, stash-seed or streak-seed to judge whether Q2 missed real rework there; I counted
  `fix`-prefixed subjects only. I did not explain why streak-seed has no merge commits beyond the git-log pattern in
  `outcomes.mjs:51-61` and the `OPERATING_MODEL.md` trunk-direct text.
- The claim that aveto-support's `docs-retrieval-3-proof` and similar unlanded runs are or are not abandoned is open; I did not
  read their `STATE.md`.
- I did not confirm that GitHub's `reviews` field includes the author's own comment-review objects (B2/M10d is an inference).
- Boundary note: the brief said to work from the repository. To check the data I ran **read-only** commands on two sibling
  repos on this machine: `outcomes.mjs --json` on `/Users/gopalpatwa/opt/aveto-support` (output to the session scratchpad), a short
  probe script in the scratchpad that imports `mergedChanges` and `describeChange` from `outcomes.mjs` to replay the Q2
  attribution, and `git log`, `git ls-tree`, `git diff-tree` and `wc` on aveto-support and hr-timeoff-agent. Nothing was written
  to any repository. The only file created in the playbook is this one.
