# Plan: a trial of an external pull request reviewer (Codex)

> **Status: proposed 2026-10-22 at the owner's request ("plan the review trial, I have ChatGPT
> subscription"); not started.** Nothing here is installed, connected or enabled. It adds a
> new data processor and a new actor on the repo, so the owner decides section 7 first.

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
| **Codex code review** | **Chosen:** another model family, included in the owner's ChatGPT subscription (no key, no per-review fee), a comment-only review that does not approve or block |

## 2. What it is, as OpenAI documents it (read 2026-10-22)

- The owner connects a repository to Codex. Reviews run on a pull request when someone comments
  `@codex review` (optionally with a focus), or automatically if switched on.
- On GitHub it flags **only P0 and P1** issues, and posts a standard GitHub review.
- Rules go in a `## Code Review Rules` section of `AGENTS.md`; nested files refine them.
  OpenAI says these guide the review and do not replace tests, branch protections or approvals.
- `@codex security review` is a separate research preview. `@codex fix …` starts a cloud chat that
  can **push a commit to the branch** if it has permission.
- The pricing page lists code review under Plus, Pro, Business and Enterprise, with no stated
  per-review limit. Its "no training on business data by default" is listed for Business,
  Enterprise and API, not Plus or Pro.
- **Not stated on the pages read:** the GitHub permissions the integration requests, and whether
  Codex keeps a memory of a repository. Both are checked at install (section 4).

## 3. Rules of use (Aveto's, not OpenAI's)

1. **Manual only.** The owner types `@codex review` on a pull request; automatic review stays off
   for the whole trial. An agent never posts that comment: posting to GitHub under the owner's
   name is sending on a user's behalf, which a Charter would have to name.
2. **Never `@codex fix`, and no `@codex security review` unless the owner asks.** A reviewer
   never fixes: findings go to the role that owns the code. A push from the cloud would come
   from a new actor under the owner's identity, and the event log (`AGENT_SECURITY_PLAN.md`)
   would not see it.
3. **Comments are findings, never approvals.** Each Codex comment becomes a row in the PR's
   `external-review.md` (format below) with a disposition; an agent's or bot's approval never
   counts as a human's.
4. **Public repositories only,** and only aveto-support for now. The processor, OpenAI, is named
   in that file. A private repository needs its own Charter line (rule 6) and, on a personal
   plan, a decision about training data first.
5. **Least privilege, recorded.** The permissions the GitHub integration asks for are copied into
   the trial record at install. If it asks for more than reading the pull request and commenting
   (for example write access to contents), the owner decides whether to proceed, and branch
   protection on `main` (a pull request and the `qa` check required) must be on first.
6. **No memory features.** If Codex or ChatGPT has a repository memory or "learning" setting,
   it is off for the trial, and the owner says so in writing (`MEMORY_PLAN.md` section 3b).
7. **The owner's own settings are the owner's statements.** "Model improvement is off" and
   "memory is off" are recorded as the owner's words, not as checked facts, like the console
   limit in the ask-the-docs run (C6.6).

## 4. Setup (owner's actions, then mine)

**The owner:**
1. Confirms the ChatGPT plan and, in data controls, turns off using conversations to improve
   models (a personal-plan setting). Tells me in chat; I record it as the owner's statement.
2. Connects `gpatwa/aveto-support` to Codex. At the permissions screen, copies what it asks for.
3. Turns **off** automatic review for the repository.
4. In GitHub, turns on branch protection for `main` in aveto-support (pull request required, the
   `qa` check once CI exists; aveto-support has no CI yet, so "pull request required" alone).

**Me, once those are done:**
1. Write `docs/review-trial/README.md` with the date, the plan, the permissions as shown, and the
   owner's statements.
2. Check how the installer treats `AGENTS.md` (below) and propose the smallest change.
3. After each reviewed pull request, read the review with `gh`, write `external-review.md` and
   update the tally. I never comment on the pull request.

**The `AGENTS.md` problem.** The installer writes the repo's root `AGENTS.md` from the pack on
every install (`execution/install.mjs`), so a hand-added `## Code Review Rules` section would be
overwritten. Two ways: (a) add a short `## Code Review Rules` section to the pack's own
`AGENTS.md`, restating the three durable rules and pointing at `REVIEW.md`; or (b) a nested
`AGENTS.md` in a folder the installer does not touch. Whether Codex follows a pointer to
`REVIEW.md` is **unverified**; the trial's first review shows what it did with the rules (section 5).
Either way is a small tested pack change, made only after the owner chooses.

## 5. The record and the bars

**Per pull request,** `runs/<slice>/external-review.md` (or `docs/review-trial/pr-<n>.md` outside
a run): the pull request, the model's date, then one row per Codex comment:
`id | P0 or P1 | file:line | the claim | disposition (fixed <commit>, rejected <reason>, intentional <reason>) | also in our local review? yes or no`.
A pull request with no comments gets one line: "0 findings".

**Definitions, fixed now:**
- A **real issue** is a comment the owner or the owning role dispositions as **fixed**, or marks
  "correct, intentional".
- **Missed by our local review** means the finding is not in that run's `code-review.md`. For a
  pull request with no local review, a local `/code-review` at high effort is run on the same diff
  first, and the cost is reported.
- A **wrong must-fix** is a P0 or P1 comment that the owner rejects as incorrect.

**Bars, declared before the first review and not moved,** over the first five pull requests
reviewed (or until 2026-12-31, whichever is first; fewer than five is reported as such):

| Bar | Pass |
|---|---|
| New value | at least **1** real issue our local review missed |
| Precision | at least **70%** of Codex's comments are real issues |
| Safety | **0** wrong must-fix comments |
| Discipline | **0** times the integration pushed a commit, commented on its own, or acted outside manual mode |

**Stop early** if the integration ever pushes a commit, asks for permissions the owner did not
accept, or after three reviewed pull requests more than half its comments are wrong.

**First test:** pull request 5 in aveto-support (the ask-the-docs service, about 13,000 added
lines). It has had the local review and an adversarial security review, so anything Codex adds
is new. It is also one pull request, so it counts as one of the five, no more.

## 6. After the trial

`docs/review-trial/RESULTS.md` reports every figure, including a miss, the cost in usage, and what
the model did with the review rules. If the bars pass, `docs/CODE_REVIEW.md` gains an optional,
manual, public-repository step with the rules above, and nothing else changes. If they fail, the
integration is disconnected and the finding is recorded. Nothing goes in the README or on the
site until there are results.

## 7. What the owner decides

1. **Run the trial** on aveto-support, manual mode, public repo only? (Recommended: yes.)
2. **Turn on branch protection for `main` in aveto-support** first? (Recommended: yes; it is the
   backstop if the integration holds write access.)
3. **Which `AGENTS.md` route** (section 4, a or b)? (Recommended: a, after the first review shows
   whether Codex reads the rules.)
4. **Give the trial more material:** during the trial, route pack and code changes in the
   playbook through pull requests instead of direct commits to `main`? It adds a merge click per
   change but gives the trial five reviews in weeks, not months. (Recommended: yes, for pack
   changes only.)
