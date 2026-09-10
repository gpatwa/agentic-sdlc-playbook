#!/usr/bin/env bash
# One-time setup for the site deployment pipeline.
#
# Designed to be run by an agent. Every step that CAN be automated is; the one
# that cannot is the credential itself, which this playbook's own rules say an
# agent must never handle (HUMAN_APPROVAL_RULES.md — "Prohibited: entering API
# keys or tokens"). The script therefore reads the token from the environment
# and never prints, logs or stores it.
#
# Usage:
#   export CLOUDFLARE_API_TOKEN=...      # human creates + exports; see docs/DEPLOYMENT.md
#   export CLOUDFLARE_ACCOUNT_ID=...
#   ./scripts/setup-deploy.sh [github-reviewer-login]
#
# Idempotent: safe to re-run.

set -euo pipefail

PROJECT="aveto"
DOMAIN="aveto.dev"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
REVIEWER="${1:-$(gh api user -q .login)}"

need() { command -v "$1" >/dev/null || { echo "missing required tool: $1" >&2; exit 1; }; }
need gh; need curl; need jq

: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN (see docs/DEPLOYMENT.md)}"
: "${CLOUDFLARE_ACCOUNT_ID:?set CLOUDFLARE_ACCOUNT_ID}"

cf() {
  curl -sS -X "$1" \
    "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}${2}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    ${3:+--data "$3"}
}

echo "1/4  Cloudflare Pages project '${PROJECT}'"
if cf GET "/pages/projects/${PROJECT}" | jq -e '.success' >/dev/null 2>&1; then
  echo "     already exists — leaving as is"
else
  cf POST "/pages/projects" \
    "$(jq -nc --arg n "$PROJECT" '{name:$n, production_branch:"main"}')" \
    | jq -e '.success' >/dev/null && echo "     created"
fi

echo "2/4  Custom domain ${DOMAIN}"
if cf GET "/pages/projects/${PROJECT}/domains" | jq -e --arg d "$DOMAIN" '.result[]?|select(.name==$d)' >/dev/null 2>&1; then
  echo "     already attached"
else
  cf POST "/pages/projects/${PROJECT}/domains" \
    "$(jq -nc --arg n "$DOMAIN" '{name:$n}')" \
    | jq -e '.success' >/dev/null && echo "     attached (Cloudflare provisions the CNAME + TLS)"
fi

echo "3/4  GitHub secrets on ${REPO}"
# gh reads from stdin so the value never appears in argv or shell history.
printf '%s' "$CLOUDFLARE_API_TOKEN"  | gh secret set CLOUDFLARE_API_TOKEN  --repo "$REPO"
printf '%s' "$CLOUDFLARE_ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$REPO"
echo "     set (values not echoed)"

echo "4/4  'production' environment with ${REVIEWER} as required approver"
REVIEWER_ID="$(gh api "users/${REVIEWER}" -q .id)"
gh api -X PUT "repos/${REPO}/environments/production" \
  -F "wait_timer=0" \
  -F "reviewers[][type]=User" \
  -F "reviewers[][id]=${REVIEWER_ID}" \
  --silent
echo "     deploys now pause for ${REVIEWER} and GitHub records who approved"

echo
echo "Done. Push to main touching site/** to trigger a gated deploy."
