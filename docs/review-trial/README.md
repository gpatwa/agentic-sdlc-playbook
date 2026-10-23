# Review trial record (Codex), started 2026-10-23

Plan and bars: `docs/REVIEW_TRIAL_PLAN.md` (revised 2026-10-23: the Codex desktop app is the main path, the GitHub connector optional; each record carries a mode, blind or informed, and a path). Collector: `execution/external-review.mjs`
(`parse` for a pasted review, `draft` for a pull request's bot comments, `tally` for the bars).

## Setup, as the owner stated it (not checked by an agent)

- Owner has a ChatGPT subscription. **Data controls: model improvement turned off** (owner, 2026-10-22).
- **Branch protection on aveto-support `main`: set 2026-10-23 by the support session, on the
  owner's word, and read back** (checked, not a statement): a pull request is required with 0
  approvals (the owner is the only collaborator), no force pushes, no branch deletion, no required
  status checks (the repo has no CI), **administrators are not bound** (`enforce_admins` false).
  Because administrators are exempt, this stops an integration with write access that is not an
  administrator from pushing to `main`; it does **not** stop anything using the owner's own `gh`
  login, which includes the support session. The risk it covers is the Codex app, not the agents.
## Read from the owner's ChatGPT and GitHub accounts, 2026-10-23 (read-only, through the owner's Chrome; nothing changed)

| Item | What the pages showed |
|---|---|
| ChatGPT plan | **Plus** |
| "Improve the model for everyone" (Data controls) | **Off** (the toggle reads off) |
| ChatGPT memory (Personalization, "Enable memory") | **ON.** An account-level setting: "personalize your experience based on your chats, files, and connected apps". The plan's rule 6 says no memory features during the trial, so this is the owner's decision; nothing was changed. Whether it touches Codex reviews is not known |
| Codex cloud | **No published environments and no cloud tasks.** No GitHub repository is connected to Codex cloud |
| GitHub: installed apps on `gpatwa` | **"ChatGPT Codex Connector" is installed.** Its repository access and permissions were **not read**: GitHub asked for passkey or password re-authentication (sudo mode), which only the owner may give. Page: `github.com/settings/installations/123192123` |
| Codex "Automatic review" toggle | **Not found.** The code-review settings address redirected to the Codex home page, and with no environment connected it is not known whether the setting exists for this account |

What this means: the first review ran in the Codex **desktop app** (no cloud tasks exist), which is why it did not
appear on GitHub. Whether the GitHub integration can review a pull request for this account is **not established**;
the connector is installed but its repository access is unread and no Codex cloud environment exists.

## The owner's statements, 2026-10-23 (not checked by an agent)

- **ChatGPT memory stays on** ("leave it on, it might not impact code"). This is a **deviation from the plan's rule 6**
  (no memory features), accepted by the owner. Whether ChatGPT memory touches Codex reviews is unknown; if a review
  ever echoes something from the owner's chats, the trial stops and this is the first suspect.
- **The Codex connector's permissions for `aveto-support`**, as the owner read them from GitHub: read access to checks,
  commit statuses and metadata; **read and write access to actions, code, issues, pull requests and workflows**.

## What those permissions allow, and what stops it (the support session's reading)

Plan rule 5 says that anything beyond "read the pull request and comment" is the owner's decision, with branch
protection on `main` first. Branch protection is on (checked, above). The permissions are broader than a reviewer
needs:

| Permission | What it could do | What limits it |
|---|---|---|
| Write to **code** | Push commits to a branch (this is how `@codex fix` works) | `main` needs a pull request, so it cannot push there directly (it is not an administrator). Other branches are **not** protected. Rule 2: never `@codex fix` |
| Write to **pull requests and issues** | Comment, review, open or edit pull requests and issues | Comments are findings, never approvals; `main` needs no approval, so a bot approval opens nothing |
| Write to **workflows** and **actions** | Add or change a workflow, and run one | aveto-support has no CI today, so there is nothing to change yet; any change would arrive as a branch the owner would have to merge |
| Repository access | Not stated | **Not checked:** the owner should confirm it is "only select repositories" and that private repositories are not included |

These cannot be narrowed: a GitHub App's permissions are fixed by its author; only the list of repositories is the
owner's to set.

- **Go-ahead (plan rule 5), 2026-10-23, the owner:** "go-ahead with these permissions".
- **Repository access, as the owner read it from GitHub:** "Only select repositories", selected 1 repository:
  `gpatwa/aveto-support` (the page adds that it also includes public repositories, read-only). No private
  repository is included.

## The owner's decisions, 2026-10-23

- **Skip the routine dry run in streak-seed.** (Process v3's zero-touch dry run; see backlog T33.)
- **Skip suspending or uninstalling the GitHub connector.** It stays installed with the permissions above; the
  trial rules (manual only, never `@codex fix`) and branch protection on `main` are what limit it.

## Still open

0. **A genuinely blind review** (the independence bar): a new Codex chat that begins with the plan's blind prompt.
1. **A first review on the GitHub path:** the owner posts `@codex review` as a **comment on the pull request page** in
   aveto-support (typing it into a Codex chat does not do this; pull request 5 is the suggested one, which also lets us
   compare with the first review). Whether the connector can
   review at all is not established: no Codex cloud environment exists. If nothing appears on the pull request,
   the next step is to connect the repository inside Codex (an environment) and enable code review there.

## How the reviews actually ran (from the Codex session transcript, read on 2026-10-23 with the owner's permission)

Only that one session was read (`~/.codex/sessions/2026/10/22/…`); `auth.json` and every other session were left alone.

- **Both requests were typed into a Codex desktop-app session, not posted as GitHub comments.** The first, at 03:16Z, was the
  text `@codex review on PR <url>`; the second, at 05:39Z, invoked the bundled **Code Review plugin**. That is why GitHub
  shows nothing: the GitHub path (a `@codex review` comment on the pull request) has **still not been tried**.
- **First review (03:16 to 03:18Z), how it worked:** Codex read the repo's `AGENTS.md` (it loaded the pack's run guide) and
  `docs/HUMAN_APPROVAL_RULES.md`; called its GitHub tools to get the pull request's info and diff (the results are not in
  what was read, so it is not known whether they succeeded); worked in the **owner's local worktree** of the branch; **read
  our own `END_REVIEW.md` and `code-review.md` before reviewing**, saying it was checking the documented limitations "so the
  review adds actionable findings"; ran 168 targeted tests and then the full suite (637 passed); and reproduced the retry
  overshoot with a fake client in the repo's own virtual environment. No live model call was made, nothing was posted to GitHub.
  The worktree was checked afterwards: clean, same HEAD, no untracked files.
- **What that means for the bars.** The finding was not in the documents Codex had read, which makes it more notable, not
  less. But this review was **not blind to our review notes**, and it ran as an agent inside our repo under our `AGENTS.md`,
  not as a hosted bot reading a diff. A GitHub-path review will behave differently and must be recorded separately.
- **Second request (05:39Z), the plugin:** it opened the plugin's panel for pull request 5 (anchored at `pipeline.py:254`) and
  reported **no CI checks** on the head commit, then stopped: "its review controls aren't accessible in the current panel" and
  asked the owner to open the Code Review panel beside the chat. **No new review was produced.**

## Records

| Pull request | Date | How the review ran | Findings | Disposition |
|---|---|---|---|---|
| aveto-support#5 (**informed**, path A) | 2026-10-22 | **In the Codex app, not through the GitHub integration** (its own text: "review not posted to GitHub"); it also ran the repo's tests (637 passed, 12 deselected) | 1 (P2) | accepted, filed as aveto-support#6: `pr-aveto-support-5.md` |
| aveto-support#5 (again) | 2026-10-23 | Code Review **plugin** in the Codex app: panel not accessible, **no review produced** | 0 (none run) | n/a; not counted |
| aveto-support#5 (**informed**, path A; meant to be blind) | 2026-10-23 | The "blind pass" prompt, run **in the same chat** as the first review, so Codex said it "cannot be fully blind"; read-only, checkout checked clean | 2 (one P1, one P2) | P1 = our known CR-3 / D1 (`intentional`, not new); P2 = duplicate of the first review's finding (aveto-support#6): `pr-aveto-support-5-second.md` |

## Deviations from the plan, stated plainly

- **The first review did not go through the GitHub path the plan describes.** No `@codex review`
  comment, reaction or review exists on the pull request. The plan's bars were written for the
  GitHub integration, which per OpenAI's documentation reports only P0 and P1 issues; this review
  reported a P2. It counts as the trial's first data point, with that difference noted. Whether the
  integration behaves the same way is not yet known, so the GitHub path still needs a first test.
- **The review ran the tests.** That is more than a read-only review, and it means the findings
  rest on an executed repository, not only on reading. No live model call was made.
