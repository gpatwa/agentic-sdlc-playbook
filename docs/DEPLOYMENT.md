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

## The two human steps, and why they stay human

**1. Creating the Cloudflare API token.** This is a credential.
`docs/HUMAN_APPROVAL_RULES.md` lists entering API keys or tokens as something
an agent must never do, and that applies to the agent building this pipeline
as much as to any other. `scripts/setup-deploy.sh` reads the token from the
environment, pipes it to `gh secret set` via stdin so it never reaches argv or
shell history, and never prints it.

Create it at **Cloudflare → My Profile → API Tokens → Create Token**, template
*Edit Cloudflare Workers*, or a custom token with:

- `Account → Cloudflare Pages → Edit`
- `Zone → DNS → Edit` on `aveto.dev` (so Pages can attach the custom domain)

**2. Approving the deploy.** Promoting to a live domain is
`HUMAN_APPROVAL_RULES.md` rule 3 — an external-effect change. The `production`
environment in the workflow is that rule expressed in CI: the job pauses, a
named human approves, and GitHub records **who** and **when**.

That record is not overhead. It is the same artefact this product exists to
produce, applied to itself — "who approved is an identity, not a role."

## First-time setup

```bash
export CLOUDFLARE_API_TOKEN=...     # created by a human, per above
export CLOUDFLARE_ACCOUNT_ID=...    # Cloudflare dashboard → right sidebar
./scripts/setup-deploy.sh           # idempotent; safe to re-run
```

That script creates the Pages project, attaches `aveto.dev`, sets both GitHub
secrets, and configures `production` with a required reviewer. Everything
after it is automatic.

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
