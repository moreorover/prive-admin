#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_env CLOUDFLARE_API_TOKEN
require_env CORS_ORIGIN
require_env BETTER_AUTH_URL
require_env BETTER_AUTH_SECRET
require_env VITE_SERVER_URL
require_env NODE_ENV

umask 077
SERVER_CONFIG="$(mktemp "${ROOT_DIR}/apps/server/.wrangler-dev.XXXXXX.jsonc")"
SECRETS_FILE="$(mktemp "${TMPDIR:-/tmp}/server-secrets.XXXXXX.json")"

cleanup() {
  rm -f "${SERVER_CONFIG}" "${SECRETS_FILE}"
}
trap cleanup EXIT

SOURCE_CONFIG="${ROOT_DIR}/apps/server/wrangler.jsonc" \
OUTPUT_CONFIG="${SERVER_CONFIG}" \
node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from "node:fs"

const sourcePath = process.env.SOURCE_CONFIG
const outputPath = process.env.OUTPUT_CONFIG

if (!sourcePath || !outputPath) {
  throw new Error("SOURCE_CONFIG and OUTPUT_CONFIG are required")
}

const vars = {
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
}

for (const [key, value] of Object.entries(vars)) {
  if (!value) throw new Error(`missing runtime var: ${key}`)
}

const varsBlock = [
  '      "vars": {',
  `        "CORS_ORIGIN": ${JSON.stringify(vars.CORS_ORIGIN)},`,
  `        "BETTER_AUTH_URL": ${JSON.stringify(vars.BETTER_AUTH_URL)},`,
  `        "NODE_ENV": ${JSON.stringify(vars.NODE_ENV)},`,
  "      },",
].join("\n")

const source = readFileSync(sourcePath, "utf8")
const withoutVars = source.replace(/      "vars": \{[\s\S]*?      \},\n/, "")
const rendered = withoutVars.replace('      "workers_dev": true,\n', `      "workers_dev": true,\n${varsBlock}\n`)

if (rendered === withoutVars) {
  throw new Error('could not find env.dev "workers_dev" marker in server Wrangler config')
}

writeFileSync(outputPath, rendered)
NODE

node --input-type=module <<'NODE' > "${SECRETS_FILE}"
const secret = process.env.BETTER_AUTH_SECRET
if (!secret) throw new Error("BETTER_AUTH_SECRET is required")
process.stdout.write(JSON.stringify({ BETTER_AUTH_SECRET: secret }))
NODE

server_deploy_args=(deploy --config "${SERVER_CONFIG}" --env dev --secrets-file "${SECRETS_FILE}" --keep-vars)
web_deploy_args=(deploy --env dev)

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  server_deploy_args+=(--dry-run)
  web_deploy_args+=(--dry-run)
fi

CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}" \
  pnpm --dir "${ROOT_DIR}/apps/server" exec wrangler "${server_deploy_args[@]}"

VITE_SERVER_URL="${VITE_SERVER_URL}" vp run --filter web build

CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}" \
  pnpm --dir "${ROOT_DIR}/apps/web" exec wrangler "${web_deploy_args[@]}"
