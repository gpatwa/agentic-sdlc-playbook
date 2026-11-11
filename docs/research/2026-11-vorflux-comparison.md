# Vorflux compared with Aveto (research note)

> Written 2026-11-11 by the support session at the owner's request. **Read-only, public pages only; nothing was signed up
> for, installed or run.** Docs pages were read through the in-app browser (they render client-side) as the page's own text.
> **Read in full:** docs for plan-mode, pr-reviews, pull-requests, merge-queue, autobots, enterprise/security,
> enterprise/usage-controls, enterprise/audit-log, enterprise/workspace-access, enterprise/deployment, enterprise/byoc,
> session-lifecycle, secrets, subagents; **read in part (first 2,500 to 7,000 characters):** acp, testing, memory,
> harness-configurator, billing-credits; the marketing page /enterprise (including its FAQ), /manifesto, and the privacy policy
> and terms (searched for the terms below, not read end to end). **Not read:** /customers (rendered empty), pricing, the blog
> or changelog, the SOC 2 or ISO reports (under NDA), the subprocessor list, any customer agreement, and the product itself.
> Where this note says Vorflux "does not state" something, it means these pages did not.

## Who they are (sourced, with the disagreements)

| Fact | What the sources say | How firm |
|---|---|---|
| Company | Vorflux, a startup founded 2026 by Prasanna Sankar, who signs the manifesto as "Founder, Vorflux" and who the press describes as a Rippling co-founder who earlier ran 0xPPL | The manifesto is primary for the name and role; the Rippling and 0xPPL history is from the press only, not checked |
| Funding | $15M seed disclosed 2026-07-16 | Press and aggregators only ([Inc42](https://inc42.com/features/former-rippling-cofounder-prasanna-sankar-raises-15-mn-for-vorflux-after-0xppl-shutdown/), [Dealroom](https://dealroom.co/news/139161-vorflux-raises-15m-seed-for-ai-coding-autopilot/), [Venture Intelligence](https://news.ventureintelligence.com/private-equity/enterprise-ai-s%E2%80%99ware-firm-vorflux-raises-%2415-m--led-by-peak-xv)); no primary release found |
| Who led it | **Sources disagree:** Inc42 says Y Combinator led; Venture Intelligence says Peak XV led; Logicity says both | Do not state a lead. Backers named across sources: Y Combinator, Peak XV, Powerset, Alliance, and angels incl. Parker Conrad, Immad Akhund, Balaji Srinivasan |
| Co-founders | **Not corroborated.** An earlier brief named Haritha Elango and Anant Nag as co-founders; a search for them found nothing, and every result names only Sankar | Treat as unverified; remove from anything we write |
| Headcount | About 18 (Dealroom) to 19 (Inc42), "11 to 50" (AI Market Watch), "1 to 10" (FastAIJobs); snapshots undated | Aggregators; roughly 20 people. The privacy policy itself mentions an "India-based team" |
| Headquarters | San Francisco in some sources, Bengaluru in others | Unresolved |
| Customers | The enterprise page shows one story (Supermemory) and names Giga and Trashlab as "building on Vorflux"; /customers rendered empty | One quoted customer; scale unknown |
| Ownership | Venture-backed; no parent or acquirer found | Seed-stage, so pricing, terms and terms-of-data can change; compare the Conductor note |

## What they do

Cloud coding agents, each session on its own isolated machine, that open pull requests; a Slack-resident layer called
**Autobots** (standing agents with a role, a channel and a budget; 14 templates, each defaulting to $100 a day and $1,000 a
week); **Plan Mode**; **Auto Review** of teammates' PRs; an agent **merge queue**; BYOC and Dedicated VPC deployment; SSO,
roles, spend guardrails, an admin audit log; ACP for editors (beta, behind a feature flag). Models are any of Claude, GPT,
Gemini or open-weight (Kimi, Qwen, Llama), chosen per role in a "harness". It also lets a customer connect their own Claude
Code or ChatGPT plan (billing page), which is the same wedge as our brandline, so "built for the subscription you already
pay for" is **not unique to Aveto**. Their manifesto calls the product "almost free"; we must not echo that.

## Re-verification of the seven earlier findings

| # | Earlier finding | Result | What the live pages say, and what changed |
|---|---|---|---|
| 1 | Plan Mode: plan, internal review, comments, approval; "nothing gets built until you approve"; approval card links the exact version | **Held, with one important addition** | Plan versions, inline comments, a diff between versions, and "Plan approved by {name}" in the transcript. **But the same page says the banner can read "Plan approval recorded by agent" when the agent recorded the approval itself.** The page does not say when that happens. Not stated: that an approval is exportable, signed, or mapped to a control framework. It is a toggle (Build or Plan), so optional |
| 2 | Auto Review approves at or below a threshold; skips its own branches; `vorflux/pr-review` check | **Held** | Also: reviews are comment-only; the check is `success` when the review approves or finds nothing, `neutral` when it leaves feedback; threshold and risk prompt are editable (who may edit is not stated). It skips bot-authored PRs and PRs on its own agent branches, so Vorflux-authored PRs are not reviewed by this reviewer. Whether the PR's own risk card is produced by a different model than the author is not stated (the harness lets a customer choose one) |
| 3 | PR author defaults to the user's personal GitHub account via a pasted classic PAT | **Held** | Needs `repo`, `read:user`, `workflow` scopes. Rationale given: "keeps contribution graphs and CODEOWNERS logic honest". Bot account is an option. By default an agent PR therefore looks human-authored on the code host |
| 4 | Audit log is administrative only; marketing says "every session, setting and action" | **Held** | Docs: "an account-wide record of administrative actions", each create/read/update/delete request through the app, with member, category, before/after values, failed attempts. Categories include Session, Pull request, Merge queue, Automation. It says nothing of per-tool-call agent actions or per-approval entries. **The marketing sentence is broader than the docs** |
| 5 | Merge queue; approvals are GitHub reviews | **Partly** | Agents rebase, retest and land agent-created PRs. The only approval setting is for stacked PRs ("each child PR needs its own approving review" by default). What the queue requires of an unstacked PR is not stated; presumably branch protection, but the page does not say. "Native auto-merge stays out of the way" when the queue lands a PR |
| 6 | Permissions are a permission model, not an authorisation record | **Held** | Administrator, Member, custom roles (View or Manage permissions); spend guardrails; the docs say SSO is something to "include in your requirements", while the enterprise page lists "SSO and SCIM". A role grants what someone may do, not a record of what was approved |
| 7 | ACP bridge, beta, feature flag | **Held** | `vorflux-agent`; needs an `IsACPEnabled` flag and an API key; also lists JetBrains, Neovim and Emacs clients |
| 8 | Privacy policy conflicts with the enterprise FAQ on zero data retention | **Partly; narrower than first stated** | See next section |

## The two claims we were asked to check without asserting either

**Zero data retention.** The enterprise FAQ says "zero data retention is in place with the model providers", and the page's
security block says "Model providers retain none of your data". The privacy policy is narrower in four ways: zero data
retention "describes the applicable model provider's handling" and "does not mean that Vorflux stores no data"; it applies to the "managed
OpenAI, Anthropic, and Google Cloud arrangements"; it "is not available for every supported provider"; and a customer's own
keys or plan follow that provider's terms. The same enterprise page advertises open-weight models (Kimi, Qwen, Llama) and Gemini,
and does not say which arrangement they fall under. The policy also says session transcripts are kept "for the life of your
account", backups for 7 days, and that execution traces sent to a tracing provider (Laminar) "may contain agent-session content".
**This shows the marketing wording is wider than the policy wording. It does not show that any customer's data was retained, and it
does not show the claim false for the three managed providers.**

**SOC 2 and ISO 27001.** The enterprise page says "SOC 2 Type I and ISO 27001 in place, SOC 2 Type II in progress; reports under
NDA", and labels the block "SOC 2 / ISO CERTIFIED". The docs security page does not mention either. A Type I report describes
controls at a point in time, not how they operated over a period. I saw no auditor name, report date, certificate number or
certifying body, and the reports are behind an NDA, so **neither the attestation nor the certification is verified here**. This is
a statement about what a public reader can and cannot check.

Other facts a security reader would want, from the privacy policy: Vorflux staff "may access production data" for support, and
"customer approval before each support access is not currently required unless your agreement says otherwise"; the hosted service is multi-tenant with primary storage in AWS us-east-2.
The docs security page, by contrast, says no employee has standing access and break-glass access needs an approval, a reason and an
expiry. These are different statements about different mechanisms and are not a contradiction.

## How they compare with Aveto

| | Vorflux (from its pages) | Aveto |
|---|---|---|
| What it is | A hosted product: agents on cloud machines, with Slack, a merge queue and enterprise deployment | A process and pack that runs in your own Claude Code session; no hosted product |
| Approval | Plan Mode (optional): a person approves a plan version; the transcript names them, **or records "approval recorded by agent"**. Autobots "pull people in only at the approval steps" and "ramp up as work is accepted" (the manifesto) | A named person types the Charter's sha256; the Charter fixes scope, budget, models and data processors; an approval typed in another session does not count (`docs/HUMAN_APPROVAL_RULES.md`) |
| What is approved | A plan (tasks and files). Spend, models and access are set separately by admins | One Charter, bound to its hash, covering scope, budget, models, processors and stops |
| Autonomy over time | Designed to grow: a "trust ramp"; an Autobot edits its own Roles text "without asking for approval" | Fixed at the Charter; a stop for anything it does not name |
| Independence of review | Auto Review of teammates' PRs; skips its own PRs; a review subagent plus an optional "Simplify Review" in a session; the harness can put a different model on review | Roles separate from the builder, no agent approves (C2); limit: same model family, and Codex review is optional and manual |
| Attribution | PRs authored as the user's personal account by default; bot account optional | Agents' commits carry a `Co-Authored-By` trailer in this repo's practice; I did not check that every pack run enforces it |
| Audit and record | Admin audit log (who changed a setting, before/after); transcripts and test reports kept in the vendor app | Records in the repo and GitHub (`APPROVAL_RECORD`, `END_REVIEW`, trace), a hash-chained event log of tool calls (built, not yet used in a run, C15) |
| Run phase | Build, test (video evidence), review, merge queue, on-call and release Autobots | Spec to reviewed pull request; the merge stays the owner's |
| Proof | A shipped product with a customer story and a self-reported "8,000 line PR in 64 minutes" in a manifesto | Measured runs with stated denominators; small (one person, one repo) |
| Distribution | Seed-funded company, Slack, a sales motion (forward-deployed engineers, "White Glove") | Open repo and site; no distribution to speak of |
| Compliance | SOC 2 Type I and ISO 27001 claimed, reports under NDA | A mapping export to SOC 2 criteria (`conformity.mjs`); explicitly not a certification |

## Where Vorflux is ahead

A shipped, hosted product with Slack, an agent merge queue, test-with-video evidence, per-role model harnesses, BYOC and
Dedicated VPC, SSO, spend guardrails with analytics, at least one named customer, a funded team, and certifications it states (unverified
here). Aveto has none of these and says so on its site ("built for one person on one subscription").

## Where Aveto's position is defensible

Each of these rests on a page Vorflux published, so it is a difference in what they state, not in what the product can do:

1. **What the approval binds.** Aveto's approval is a typed hash of a Charter that fixes scope, models, spend and processors before the run. Vorflux's pages describe approval of a plan, with spend and models set elsewhere.
2. **No agent approves.** Vorflux states an approval can be "recorded by agent", and Auto Review "can approve" a PR under a threshold. Aveto's rule is that an agent's approval never counts as a person's (C2, C5).
3. **Scope fixed, not grown.** Vorflux's manifesto describes autonomy that expands as work is accepted. Aveto holds the Charter's edge.
4. **Refusal at intake** against recorded invariants (shown on the site); Vorflux's pages describe no such step.
5. **A record you own.** Records in the repo and on GitHub, not a vendor app, with a SOC 2 criteria mapping export.
6. **Attribution.** An agent PR that visibly says it is an agent, versus a default of the user's personal account.

Honest limits on these: Aveto's "named human" is whoever is logged in to the Claude Code session, and I did not find that Aveto
authenticates identity; Aveto has been run by one person on small repos; and the event log is not yet used in a run.

## What Aveto must NOT claim

- "The only tool with plan approval" (Vorflux, Conductor and Kiro all have a plan step), or "the only audit log" or "the only record".
- That Vorflux has no audit trail: it has an admin audit log, and its transcripts name who approved a plan. The accurate statement is that its docs describe the audit log as administrative, and describe no per-approval export.
- That Vorflux's approvals are not human: only that a plan approval can be recorded by the agent, with the page not saying when.
- That Vorflux is not SOC 2 or ISO 27001 compliant, or that its zero-data-retention claim is false. Neither is verified or refuted here.
- That Vorflux's agent PRs are disguised as human: that is a default the customer can change.
- "Approve once, review once" as a unique idea: Vorflux's manifesto describes "one loop, two approvals". The difference is what is approved (a hashed Charter) and by whom.
- "Built for your subscription" as unique: Vorflux also lets customers connect a Claude Code or ChatGPT plan.

## Limits of this review

Pages only, as they read on 2026-11-11; Vorflux changes its docs often (several pages describe 2.0 features in the present tense). I
did not use the product, so every "does not state" could be a feature that exists and is undocumented. Docs pages were read as the browser's
text of each page, three of them only in part. The privacy policy and terms were searched, not read end to end, and the terms were not
read for output or liability terms beyond the standard "as is" and a $100 or 12-month cap. Company facts come from press and
aggregators that disagree with each other; funders, headcount and headquarters are therefore ranges, not facts. Nothing here is a
security assessment of Vorflux.

## Sources

- https://vorflux.com/docs/plan-mode , /docs/pr-reviews , /docs/pull-requests , /docs/merge-queue , /docs/autobots , /docs/acp , /docs/session-lifecycle , /docs/secrets , /docs/subagents , /docs/testing , /docs/memory , /docs/harness-configurator , /docs/billing-credits
- https://vorflux.com/docs/enterprise/security , /usage-controls , /audit-log , /workspace-access , /deployment , /byoc
- https://vorflux.com/enterprise , /manifesto , /privacy-policy/ , /terms-of-service/
- Press and aggregators: Inc42, Dealroom, Venture Intelligence (links in the table above), AI Market Watch and FastAIJobs for headcount
- Related notes: `2026-11-conductor-comparison.md`, `2026-10-orchestration-prior-art.md`
