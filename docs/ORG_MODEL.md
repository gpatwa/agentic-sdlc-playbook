# Organisation model for agent-written software (proposal, T42 step O1)

> **Proposal, written 2026-11-04 by the support session for the owner to edit.** It has not been used on a real Charter yet,
> so by the plan's own rule it stays marked "proposal" until it has (bar "Org model used",
> `docs/PRODUCTIVITY_AND_ORG_PLAN.md`). Nothing here changes a gate, a hook or an approval rule. Where it names a number it says
> whether the number is measured, or is a value to measure. Evidence for the framing:
> `docs/research/2026-11-project-management-with-ai-agents.md` (read its provenance header: parts are secondhand).

## The one idea

When agents write the code, **a human's attention is the scarce resource, not code production.** Aveto already treats it that
way (one typed approval, one end review, no approvals inferred). The org question is therefore not "how many engineers" but:
*who is accountable for each decision, who is allowed to review it, who may not, and how much review can one person carry
before the review stops being real.*

## Human roles

These are **roles, not job titles and not headcount.** One person can hold several at a small team. The test of any assignment
is the "may not" column below.

| Role | Accountable for | Does not do |
|---|---|---|
| **Owner of a Charter** | The intent, the Charter's scope, ceiling and hard stops; approving the Charter by its hash; the merge | Review their own agent-written change alone at tier 3 (see separation below) |
| **Independent reviewer** | Reading the change that the Charter's tier says must be read, and recording a disposition | Be the Owner of the same Charter at tier 3 |
| **Steward of the pack and of standing Charters** | The pack version, standing Charters (their class, expiry, budget), hooks and permission rules | Approve a change to a rule they depend on to approve others (a hook, a deny list) without a second person |
| **Incident owner** | Declaring severity and closure; approving any production mutation or rollback the Charter did not name (pack v32) | Delegate an in-the-moment approval to an agent |
| **Platform owner** | CI, release workflows, secrets handling, model and processor lines | Approve a model or processor line that processes data they do not have authority over |

## Decision class by tier

Tiers are the release tiers in `docs/RELEASE_GATES.md` (0 to 3) and the review tiers in
`execution/pack/protocols/CODE_REVIEW.md` (high, medium, low). "Approves" means a named person's typed approval recorded in
`trace.json` (`approver` is an identity, never a role, `docs/HUMAN_APPROVAL_RULES.md` rule 3).

| Decision | Tier 0–1 / low | Tier 2 / medium | Tier 3 / high |
|---|---|---|---|
| Approve the Charter | Owner | Owner | Owner, and **a second named person** where the team has one |
| Read the change | Owner reads notice or `END_REVIEW.md` (Low can be skipped only if the Charter's C8.4 says so) | Owner reads `END_REVIEW.md` and findings; reads flagged diffs | **A person other than the author's owner reads the change itself**; rollback rehearsed first |
| Merge | Owner | Owner | Owner, after the reader above has recorded a disposition |
| Production mutation not named in the Charter | not applicable | Incident owner, fresh approval in session | Incident owner, fresh approval in session |
| Change a hook, deny list or permission rule | Steward + a second person | Steward + a second person | Steward + a second person |
| Add or widen a standing Charter | Steward, owner approves by hash | not allowed under a standing Charter | not allowed under a standing Charter |
| Accept a finding as "won't fix" | Owner | Owner | Reader and owner both |

**May not, always:** an agent approves anything; a runbook, a green CI check or another agent's output counts as an approval; one
person is both the sole author's owner and the sole reviewer of a tier 3 change when a second person exists. With one
operator (Aveto today) the second-person cells cannot be met: the model then says so in `END_REVIEW.md` ("no second reviewer
available") instead of treating the owner's own read as independent review. That is a recorded limit, not a pass.

## Review capacity: the number nobody states

A reviewer reading more than they can read well approves without reading. The model therefore treats review capacity as a
**limit to measure per team, not a number to assume.**

- **What is known:** the research found vendor telemetry (Faros) reporting review time rising sharply with agent-written code, and
  no study that gives a safe number of reviews or changed lines per person per day. **[Reported, vendor telemetry; not a
  measured result for Aveto.]**
- **What Aveto can measure from its own records:** per merged slice, the changed lines a human must read (metric H4, excluding
  generated files and lockfiles), the share merged with no review, and at a snapshot the open PRs waiting and the oldest age
  (H5). Both are computed from git (steps P2, PM3). Capacity is then read from the owner's *observed* behaviour: the number of
  slices per week that were reviewed with findings or comments, against the number that were merged with none.
- **Rule of use, once measured:** when the share merged with no review rises, or reviews waiting keeps growing, the response is
  **fewer or smaller slices in flight**, never a shorter review. The slice-size signal (six stages or about 600k estimated tokens,
  `RUN_ECONOMICS.md`) is the control for the first.
- **Not a score.** Review capacity is shown for the team's planning. It is never a per-person figure and never a target.

## Ownership

Every path has an accountable human. The assessment map already reports CODEOWNERS gaps; step O2 extends the same report to a
product repo and lists **ownerless high-risk paths** (hooks, permission rules, CI, release workflows, auth, model and processor
lines). An ownerless high-risk path has no one who may approve a change to it, so any Charter that touches one stops at
Charter drafting and asks who the owner is.

## Team shapes: hypotheses, with the evidence that would change them

None of these is presented as right because another company uses it. Each is a hypothesis for an Aveto team to try and check
with the W1 metrics.

| Shape (hypothesis) | Why it might hold | What would change it | How to check |
|---|---|---|---|
| **One owner, many agents, one slice at a time** (what Aveto runs today) | One accountable person, no coordination cost | Reviews waiting grows while the owner is idle on other work; or a second person is needed for tier 3 | H5, H1, D1 over at least ten slices |
| **Small team (2 to 4), each owns a slice, pairwise review** | Gives the second reader tier 3 needs; spreads review capacity | Review time per slice rises (H4) without catches rising (Q1); or merges queue behind one reader | Q1 against Q2, H5 |
| **Platform and steward role separated from product owners** | Hooks and permission rules are the highest-risk files and share a blast radius | The steward becomes the bottleneck for ordinary slices | D1 split by whether the slice touched a steward-owned path |
| **Fewer producing roles, same gates** (step O3) | Fewer handoffs may cost fewer tokens | Gate catches (Q1) or post-merge fixes (Q2) get worse | The experiment itself; gates are never reduced |

No row claims that agents make a team faster. That claim needs a baseline from the same repo's history before adoption (pilot
P5), and none exists yet.

## What this document does not do

- It does not assign people, set team sizes or define career ladders.
- It does not say the Project Manager, Engineering Manager or TPM roles disappear. The research found their duties moving to
  agent-ready specs, acceptance checks and protecting review capacity; that is an inference, not a measured result.
- It does not give any metric authority over a merge or an approval.
- It does not relax the second-person rule for convenience: with one operator, the limit is recorded.

## For the owner to edit

1. Is "a second named person at tier 3 where the team has one" the right bar, or do you want it required even for you alone (which
   would mean tier 3 work waits until someone else exists)?
2. Which of the five roles do you hold today, and which do you want written as "unfilled"?
3. Should the Incident owner be allowed to pre-approve a rollback in the Charter on the agent's behalf, as pack v32 now requires,
   or do you want it asked even when the Charter names it?
