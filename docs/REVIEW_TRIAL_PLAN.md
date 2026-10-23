# Plan: a trial of an external pull request reviewer (Codex)

> **Status: proposed 2026-10-22; revised 2026-10-23 at the owner's request ("can [we] do same from
> codex desktop app, instead of github?"). The main path is now the Codex desktop app (path A); the
> GitHub connector (path B) is optional.** The first review (informed, path A) found one real issue,
> filed as aveto-support#6. The collector, `execution/external-review.mjs`, is built. What the
> accounts showed and what is still open is in `docs/review-trial/README.md`. The owner's section 7
> decisions are still to be answered.

## 1. Why, and why Codex first

Aveto's review layer (`docs/CODE_REVIEW.md`) is the local `/code-review` skill, run by the same
model family that built the change. Its weakness is stated in `REVIEW_MODE_PLAN.md`: builders
and reviewer share blind spots. A reviewer from another model family is the one thing we cannot
supply ourselves.

Options read on 2026-10-22 (vendor pages and third-party summaries; none tested here):

| Option | Why not first |
|---|---|
| Claude Code Review (GitHub app) | Team and Enterprise plans only; same model family as the builders; estimated $15 to $25 a PR (third-party figure) |
| CodeRabbit | A fine zero-setup choice; free tier terms unverified |
| Greptile | Trains on de-identified customer data by default (opt-out), learns from engineers' comments, caches code on its servers; better kept for review mode's repo-wide context |
| PR-Agent (open source, MIT) | Needs a metered model key; "legacy", community-maintained and moving to a foundation; kept as the fallback |
| **Codex review** | **Chosen:** another model family, included in the owner's ChatGPT Plus subscription (no key, no per-review fee), and it only reports findings: it does not approve or block |

## 2. Two ways to run it

| | **Path A: the Codex desktop app (main)** | **Path B: the GitHub connector (optional)** |
|---|---|---|
| How | The owner asks Codex in the desktop app to review a pull request | The owner comments `@codex review` on the pull request page |
| Depth | Works in the owner's local checkout and **runs the tests**; reproduced the retry overshoot with a fake client | Reads the diff; depth not yet seen |
| GitHub permissions | **None needed** | "ChatGPT Codex Connector" has read and write on code, workflows, actions, pull requests and issues (owner, 2026-10-23), on `aveto-support` only |
| Where findings land | In the Codex session; the owner pastes them, or the support session reads that one session with the owner's permission | As a review on the pull request |
| Independence from our notes | **Not blind unless told:** the first review read `code-review.md` and `END_REVIEW.md` first | Probably blind |
| Cost | Counts against Plus usage limits (the pricing page says reviews run outside GitHub count toward general limits) | "Code review usage"; limits not stated |
| Main risk | **It runs commands on the owner's machine**, so only our own branches | A bot with write access to the repository |
| Status | Used twice on pull request 5 (one review, one plugin request that produced none) | **Never tried.** No Codex environment exists, so it may not respond at all |

As OpenAI documents path B (read 2026-10-22): `@codex review` posts a standard GitHub review; on GitHub it
flags only P0 and P1; rules go in a `## Code Review Rules` section of `AGENTS.md`; `@codex fix …` can
push a commit to the branch; `@codex security review` is a separate research preview. Plan membership
(Plus, Pro, Business, Enterprise) is listed on the pricing page, with no stated per-review limit.

## 3. Rules of use (Aveto's, not OpenAI's)

1. **Manual only.** The owner starts every review. An agent never posts a trigger comment on GitHub:
   posting under the owner's name is sending on a user's behalf, which a Charter would have to name.
   Automatic review stays off.
2. **Read-only, and checked.** A review never edits, creates, deletes, commits, pushes or comments.
   After every path A review the support session checks `git status` and HEAD in the checkout it ran in.
   **Never `@codex fix`**; no `@codex security review` unless the owner asks. A reviewer never fixes:
   findings go to the role that owns the code.
3. **Findings, never approvals.** Each finding becomes a row in the pull request's record (section 5)
   with a disposition. An agent's or bot's approval never counts as a human's.
4. **Only our own branches and tests.** Path A runs commands on the owner's machine, so a hostile branch
   could run code there. The review may run the repository's own tests; it makes no live model or network
   call; it reads the pull request only through its GitHub tools. Public repositories only, and only
   aveto-support for now. The processor, OpenAI, is named in the record.
5. **Blind first, informed second.** Every review is recorded with its **mode**: `blind` (told not to read
   `runs/`, `code-review.md`, `END_REVIEW.md` or any security-review file before reviewing), `informed`
   (it read them), or `github` (path B). **At least one of the five reviews must be blind**, because a
   review that has read our notes cannot show independence. **A blind review must be a new chat** whose
   first message is the blind prompt: on 2026-10-23 the pass was run in the chat that had already reviewed
   the pull request, and Codex said it "cannot be fully blind". The transcript decides: a review counts as
   blind only if no earlier message in its session read an off-limits file.
6. **Least privilege, recorded.** Path B's permissions are in the trial record; the owner accepted them
   on 2026-10-23, with branch protection on `main` (checked). While path B is not in use, the connector
   should be suspended or uninstalled (section 7), which removes its write access.
7. **Memory, as it actually stands.** ChatGPT memory is **on** (read from the owner's settings; the owner
   chose to leave it on). This is a deviation from the earlier "no memory" rule, accepted by the owner.
   If any review ever refers to anything outside the repository (the owner's chats, other projects),
   the trial stops and memory is the first suspect.
8. **What I read, and when.** The support session reads a Codex session transcript only with the owner's
   permission each time, only that one session, and never the credentials file; or the owner pastes the
   result. Settings the support session read itself are recorded as read; settings the owner reports are
   recorded as the owner's statements.

## 4. Setup

**Done (details in `docs/review-trial/README.md`):** ChatGPT plan is Plus; "Improve the model for
everyone" is off (read); branch protection on aveto-support `main` is set (read back); the connector's
permissions and its single-repository access are recorded; the owner gave the go-ahead.

**Path A, per review.** The owner starts it in the Codex desktop app, **in a new chat** (never one that has
already reviewed this pull request), in a session whose folder is the repository checkout, with this prompt
(blind pass; edit only the pull request number):

```
Review pull request #<n> in gpatwa/aveto-support for correctness, security and spend-limit bugs. Rules:
read-only. Do not edit, create, delete, commit, push or comment anywhere, and do not post to GitHub.
Do not call any model or network service; you may read the PR through your GitHub tools and run the
repo's existing tests. Do NOT read anything under runs/ or any file named code-review.md, END_REVIEW.md
or 14-security-review.md: this is a blind review. Report only findings you are confident about, each
with a severity P0 to P3, file:line, why it is wrong and how to reproduce it. If there are none, say
"no actionable issues". Finish by listing every command you ran.
```

An **informed pass** (optional, after the blind one) adds: "Now you may read `runs/` and our review notes;
say which of your findings were already documented, and whether the notes change any of them."

The owner pastes the result, or says "read the session"; the support session then runs
`external-review.mjs parse … --mode blind` and checks `git status`.

**Path B, if the owner wants it tried:** comment `@codex review` on the pull request page; a 👀
reaction within about a minute means the connector responded. If nothing appears in about ten
minutes, no Codex environment exists behind it and the next step is to read OpenAI's current setup
steps before changing anything in Codex.

**The `AGENTS.md` question.** The installer writes the repo's root `AGENTS.md` from the pack on every
install (`execution/install.mjs`), so a hand-added `## Code Review Rules` section would be overwritten.
The first review shows Codex does load that file and acted on the pack's guidance. Two ways, if rules
are wanted: (a) add a short `## Code Review Rules` section to the pack's own `AGENTS.md`; or (b) a nested
`AGENTS.md` in a folder the installer does not touch. Either is a small tested pack change, made only
after the owner chooses.

## 5. The record and the bars

**Per pull request and per review,** `docs/review-trial/pr-<repo>-<n>.md` (or `runs/<slice>/external-review.md`
inside a run), written by `external-review.mjs`: the pull request, the **mode** (`blind`, `informed`,
`github`), the **path** (A or B), the date, then one row per finding:
`id | P | file:line | the claim | disposition | also in our local review?`. A review with no findings
gets one line: "0 findings". Dispositions: `fixed <ref>`, `accepted <issue>` (correct, filed to fix later),
`intentional <reason>` (correct, deliberate), `rejected <reason>`.

**Definitions, fixed now:**
- A **real issue** is a finding dispositioned **fixed**, **accepted** or **intentional**; **rejected** is
  not real.
- **Missed by our local review** means the finding is not in that run's `code-review.md` (a person confirms
  the match). For a pull request with no local review, a local `/code-review` at high effort is run on the
  same diff first, and the cost is reported.
- A **wrong must-fix** is a P0 or P1 finding that the owner rejects as incorrect.

**Bars, declared before the first review and not moved,** over the first five pull requests reviewed (or
until 2026-12-31, whichever is first; fewer than five is reported as such). A second review of the same
pull request adds findings but not a pull request:

| Bar | Pass |
|---|---|
| New value | at least **1** real issue our local review missed |
| Precision | at least **70%** of findings are real issues |
| Safety | **0** wrong must-fix findings |
| Discipline | **0** times a review modified the checkout, pushed, posted, or acted outside manual mode |
| Independence | at least **1** of the five reviews is **blind** |

**Stop early** if a review ever modifies the checkout, pushes a commit, or refers to anything outside the
repository; or if after three reviewed pull requests more than half the findings are wrong.

**Where it stands (2026-10-23):** pull request 5 has two informed path A reviews. The first found one P2,
accepted and filed as aveto-support#6 (new relative to our local review). The second, meant to be blind,
was not (same chat); it re-found that P2 (counted once, as a duplicate) and raised our own known CR-3 /
decision D1 as a P1 (not new). Bars so far: new value met, precision 2 of 2, safety met, discipline met,
**independence not met** at that point. A third review, in a genuinely new chat, was blind by the plan's
definition: it **found the retry issue again without our notes** (the same defect as aveto-support#6; no
mention of it in the files it read), raised the known restart finding (visible to it in the product's own status
file and the PR description), and added one **new** accounting inconsistency (c03, disposition open; Codex says
P1, my reading P3). **All five bars read met, provisionally: one finding is still open, and all three reviews are of
one pull request, so this is one pull request of the five.**

## 6. After the trial

`docs/review-trial/RESULTS.md` reports every figure split by mode and path, including a miss, the cost in
usage, and what Codex did with the repository's guidance. If the bars pass, `docs/CODE_REVIEW.md` gains an
optional, manual, public-repository step (path A first) with the rules above, and nothing else changes. If
they fail, the finding is recorded and the connector is uninstalled. Nothing goes in the README or on the
site until there are results.

## 7. What the owner decides

1. **Make path A (the desktop app) the main path,** with the connector optional? (Recommended: yes.)
2. **Suspend or uninstall the GitHub connector while path B is not in use?** It removes the broadest
   permission in the setup (write to code, workflows and actions). In GitHub: Settings, Applications,
   Installed GitHub Apps, the connector, Configure, then Suspend or Uninstall. It can be reinstalled to try
   path B. (Recommended: yes.) **Decided 2026-10-23, the owner: skip.** The connector stays installed with
   the permissions in the README; the protections that remain are branch protection on `main`, the rule never
   to use `@codex fix`, and manual-only use.
3. **Run the blind pass on pull request 5?** Done once on 2026-10-23, **not blind** (same chat). To do:
   again, in a new chat. (Recommended: yes.)
4. **Which `AGENTS.md` route,** if review rules are wanted (section 4, a or b)? (Recommended: a, after the
   blind pass shows what Codex does with the repository's guidance.)
5. **Give the trial more material:** route pack and code changes in the playbook through pull requests
   instead of direct commits to `main` while the trial runs? It adds a merge click per change but gives the
   trial five reviews in weeks, not months. (Recommended: yes, for pack changes only.)
