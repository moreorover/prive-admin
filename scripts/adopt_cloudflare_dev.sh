#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OP_ITEM="prive-admin-cloudflare-dev"

usage() {
  cat <<EOF
Usage:
  scripts/adopt_cloudflare_dev.sh

Reads dev Cloudflare and runtime values from 1Password, then runs:
  vp run deploy:alchemy -- --stage dev --adopt

Existing environment variables are reused when already set.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v op >/dev/null 2>&1; then
  cat >&2 <<EOF
1Password CLI 'op' is required.

Install/sign in to the 1Password CLI, or export the required env vars manually:
  CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_API_TOKEN
  CORS_ORIGIN
  BETTER_AUTH_URL
  BETTER_AUTH_SECRET
  VITE_SERVER_URL
  NODE_ENV
EOF
  exit 1
fi

read_secret() {
  local var_name="$1"
  local op_ref="$2"

  if [[ -n "${!var_name:-}" ]]; then
    return
  fi

  printf 'Loading %s from 1Password item %s...\n' "$var_name" "$OP_ITEM"
  export "$var_name=$(op read "$op_ref")"
}

read_secret CLOUDFLARE_ACCOUNT_ID "op://prive-admin/$OP_ITEM/cloudflare/account-id"
read_secret CLOUDFLARE_API_TOKEN "op://prive-admin/$OP_ITEM/cloudflare/api-token"
read_secret CORS_ORIGIN "op://prive-admin/$OP_ITEM/workers/cors-origin"
read_secret BETTER_AUTH_URL "op://prive-admin/$OP_ITEM/better-auth/BETTER_AUTH_URL"
read_secret BETTER_AUTH_SECRET "op://prive-admin/$OP_ITEM/better-auth/BETTER_AUTH_SECRET"
read_secret VITE_SERVER_URL "op://prive-admin/$OP_ITEM/web/VITE_SERVER_URL"
read_secret NODE_ENV "op://prive-admin/$OP_ITEM/workers/node-env"

export NO_TRACK="${NO_TRACK:-1}"

cd "$ROOT_DIR"
vp run deploy:alchemy -- --stage dev --adopt
