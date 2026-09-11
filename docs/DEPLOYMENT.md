# Deployment — the public site

`aveto.dev` is served from Cloudflare Pages, deployed by
`.github/workflows/deploy-site.yml`. The pipeline is built so an **agent runs
it and a human only approves**, which is the same shape this playbook
prescribes for every other consequential action.

## What runs unattended

| Step | Where |
|------|-------|
| Site gates — structure, theme tokens, dead anchors, external origins | `scripts/check-site.mjs` |
| Deploy to Cloudflare Pages | `cloudflare/wrangler-action` |
| Post-deploy live verification (HTTP 200 + expected content, 5 retries) | workflow `Verify live` step |

The gates run **before** the human is asked. Sending someone a broken build to
approve wastes the one scarce resource in the loop.

## Human steps: one, once, ever

Everything in this pipeline is automated except **one value** and **one
decision**. Neither is caution — both are structural.

### The one value: a Cloudflare API token

Creating a credential requires an already-authenticated caller, so the *first*
credential has to come from a human. That bootstrap exists in every CI system
and cannot be scripted away. It is also the one thing
`docs/HUMAN_APPROVAL_RULES.md` explicitly forbids an agent from handling.

`scripts/setup-deploy.sh` reads it from the environment, pipes it to
`gh secret set` on stdin so it never reaches argv or shell history, and never
prints it.

Create it at **Cloudflare → My Profile → API Tokens → Create Token → Custom
token**, with:

- `Account → Cloudflare Pages → Edit`
- `Zone → DNS → Edit` on the target zone

Everything else the setup previously asked for — account id, zone id, repo,
reviewer — is now discovered from that token or from `gh`. If the token is
wrong or under-scoped the script says exactly which permission is missing
rather than failing halfway through.

### The one decision: approving the deploy

Promoting to a live domain is `HUMAN_APPROVAL_RULES.md` rule 3 — an
external-effect change. The `production` environment is that rule expressed in
CI: the job pauses, a named human approves, and GitHub records **who** and
**when**.

This one is not a limitation to engineer away. It is the requirement — the
same evidence this product exists to produce, applied to itself.

## First-time setup

```bash
export CLOUDFLARE_API_TOKEN=...
./scripts/setup-deploy.sh
```

That verifies the token, discovers the account and zone, creates the Pages
project, attaches `aveto.dev`, sets both GitHub secrets, configures
`production` with a required reviewer, and dispatches a run to prove the whole
path works. Idempotent — safe to re-run.

## Deploying

Push to `main` touching `site/**`. The workflow gates, waits for approval,
deploys, then verifies the live origin actually serves the page — a deploy is
not "done" because the command exited 0.

`workflow_dispatch` also works and takes a `reason` input, recorded in the run
log.

## Rollback

Cloudflare Pages keeps every deployment. Roll back from the Pages dashboard,
or:

```bash
npx wrangler pages deployment list --project-name=aveto
npx wrangler pages deployment tail --project-name=aveto
```

Reverting the commit and letting the pipeline run is preferred — it leaves the
same approval record as any other change, rather than an out-of-band edit.
