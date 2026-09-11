#!/usr/bin/env bash
# One-time setup for the aveto.dev deployment pipeline.
#
# Human input required: ONE value, once, ever — a Cloudflare API token.
# Everything else is discovered or derived: account id, zone id, repo,
# reviewer, project, domain, secrets, environment protection.
#
# Why that one value cannot be automated away:
#   Creating a credential requires an already-authenticated caller, so the
#   first credential has to come from a human — the same bootstrap every
#   CI system has. It is also the one thing docs/HUMAN_APPROVAL_RULES.md
#   prohibits an agent from handling. The script reads it from the
#   environment, pipes it to `gh secret set` on stdin so it never reaches
#   argv or shell history, and never prints it.
#
# Usage:
#   ./scripts/setup-deploy.sh              # idempotent; safe to re-run
#
# With no token set it prints a pre-configured Cloudflare link — the
# permissions, scope and name are already filled in, so the human clicks
# "Create Token", copies the value, and re-runs. No configuration decisions.
#
# Optional overrides: PROJECT, DOMAIN, REVIEWER

set -euo pipefail

PROJECT="${PROJECT:-aveto}"
DOMAIN="${DOMAIN:-aveto.dev}"

for t in gh curl jq; do command -v "$t" >/dev/null || { echo "missing required tool: $t" >&2; exit 1; }; done
TOKEN_URL="https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=%5B%7B%22key%22%3A%22page%22%2C%22type%22%3A%22edit%22%7D%2C%7B%22key%22%3A%22dns%22%2C%22type%22%3A%22edit%22%7D%5D&accountId=*&zoneId=all&name=Aveto%20deploy"

token_help() {
  cat >&2 <<HELP

  Create the token with this link — permissions, scope and name are already
  filled in. Click "Create Token", copy the value, then re-run this script:

    ${TOKEN_URL}

  It pre-selects exactly:
    Account → Cloudflare Pages → Edit
    Zone    → DNS              → Edit

  Then:
    export CLOUDFLARE_API_TOKEN=<the value you copied>
    ./scripts/setup-deploy.sh

HELP
}

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "No CLOUDFLARE_API_TOKEN set." >&2
  token_help
  exit 1
fi

api() { # api METHOD PATH [BODY]
  curl -sS -X "$1" "https://api.cloudflare.com/client/v4$2" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    ${3:+--data "$3"}
}
ok() { jq -e '.success == true' >/dev/null 2>&1; }
step() { printf '\n\033[1m%s\033[0m\n' "$*"; }

step "1/6  Verify the token"
if ! api GET /user/tokens/verify | ok; then
  echo "  The token was rejected by Cloudflare." >&2
  token_help
  exit 1
fi
echo "      token valid"

step "2/6  Discover account and zone"
ACCOUNT_ID="$(api GET /accounts | jq -r '.result[0].id // empty')"
if [ -z "$ACCOUNT_ID" ]; then
  echo "  Token is valid but cannot list accounts — it is missing Account scope." >&2
  token_help
  exit 1
fi
ACCOUNT_NAME="$(api GET /accounts | jq -r '.result[0].name // "?"')"
echo "      account: ${ACCOUNT_NAME} (${ACCOUNT_ID:0:8}…)"

ZONE_ID="$(api GET "/zones?name=${DOMAIN}" | jq -r '.result[0].id // empty')"
if [ -n "$ZONE_ID" ]; then
  echo "      zone:    ${DOMAIN} (${ZONE_ID:0:8}…)"
else
  echo "      zone:    ${DOMAIN} not found on this account — custom domain step will be skipped"
fi

step "3/6  Cloudflare Pages project '${PROJECT}'"
if api GET "/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}" | ok; then
  echo "      exists already"
else
  api POST "/accounts/${ACCOUNT_ID}/pages/projects" \
     "$(jq -nc --arg n "$PROJECT" '{name:$n, production_branch:"main"}')" | ok \
     && echo "      created" || { echo "   failed to create project" >&2; exit 1; }
fi

step "4/6  Custom domain ${DOMAIN}"
if [ -z "$ZONE_ID" ]; then
  echo "      skipped (zone not on this account)"
elif api GET "/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains" \
     | jq -e --arg d "$DOMAIN" '.result[]? | select(.name == $d)' >/dev/null 2>&1; then
  echo "      already attached"
else
  api POST "/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT}/domains" \
     "$(jq -nc --arg n "$DOMAIN" '{name:$n}')" | ok \
     && echo "      attached — Cloudflare provisions the CNAME and certificate" \
     || echo "      could not attach (needs Zone → DNS → Edit); DNS can be pointed manually later"
fi

step "5/6  GitHub secrets and the approval gate"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
REVIEWER="${REVIEWER:-$(gh api user -q .login)}"
REVIEWER_ID="$(gh api "users/${REVIEWER}" -q .id)"

printf '%s' "$CLOUDFLARE_API_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN  --repo "$REPO"
printf '%s' "$ACCOUNT_ID"           | gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$REPO"
echo "      secrets set on ${REPO} (values never echoed)"

gh api -X PUT "repos/${REPO}/environments/production" \
  -F "wait_timer=0" \
  -F "reviewers[][type]=User" \
  -F "reviewers[][id]=${REVIEWER_ID}" --silent
echo "      'production' now requires approval from ${REVIEWER}"

step "6/6  Prove it works"
echo "      triggering a run (it will pause for ${REVIEWER} to approve)"
gh workflow run deploy-site.yml --repo "$REPO" -f reason="setup verification" >/dev/null 2>&1 \
  && echo "      dispatched — watch: gh run watch --repo ${REPO}" \
  || echo "      could not dispatch (the workflow must exist on the default branch first)"

cat <<DONE

Setup complete. From here the pipeline is unattended except the approval:

  push to main touching site/**  →  gates  →  ${REVIEWER} approves  →  deploy  →  live check

Nothing above needs repeating. Re-run this script any time; it is idempotent.
DONE
