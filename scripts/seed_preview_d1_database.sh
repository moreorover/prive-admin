#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/apps/server"

PREVIEW_D1_DB="${PREVIEW_D1_DB:-}"
SOURCE_D1_DB="${SOURCE_D1_DB:-prive-admin-prod}"
CLOUDFLARE_CREDENTIALS_ENV="${CLOUDFLARE_CREDENTIALS_ENV:-dev}"
MARKER_TABLE="_preview_seed_state"
MARKER_KEY="prod_copy_completed"

usage() {
  cat <<EOF
Usage:
  scripts/seed_preview_d1_database.sh --preview-db <name>

Copies prod D1 data into a preview D1 database once. Later runs for the same
preview database skip the copy when the seed marker is present.

Options:
  --preview-db <name>     Preview D1 database name, for example prive-admin-pr-284
  --source-db <name>      Source D1 database. Default: $SOURCE_D1_DB
  --credentials <prod|dev>
                          Cloudflare 1Password item to read when env vars are missing.
                          Default: dev
  -h, --help              Show this help
EOF
}

set_credentials_env() {
  case "$1" in
    prod | dev)
      CLOUDFLARE_CREDENTIALS_ENV="$1"
      ;;
    *)
      echo "Cloudflare credentials environment must be 'prod' or 'dev'." >&2
      exit 1
      ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --preview-db)
      if [[ $# -lt 2 ]]; then
        echo "--preview-db requires a database name." >&2
        exit 1
      fi
      PREVIEW_D1_DB="$2"
      shift 2
      ;;
    --source-db)
      if [[ $# -lt 2 ]]; then
        echo "--source-db requires a database name." >&2
        exit 1
      fi
      SOURCE_D1_DB="$2"
      shift 2
      ;;
    --credentials)
      if [[ $# -lt 2 ]]; then
        echo "--credentials requires 'prod' or 'dev'." >&2
        exit 1
      fi
      set_credentials_env "$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$PREVIEW_D1_DB" ]]; then
  echo "--preview-db is required." >&2
  echo >&2
  usage >&2
  exit 1
fi

wrangler() {
  (cd "$SERVER_DIR" && vp exec wrangler "$@")
}

load_cloudflare_credentials() {
  if [[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" && -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    return
  fi

  if ! command -v op >/dev/null 2>&1; then
    cat >&2 <<EOF
Wrangler needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.

Set them in your shell, or install/sign in to the 1Password CLI so this script can read:
  op://prive-admin/prive-admin-cloudflare-$CLOUDFLARE_CREDENTIALS_ENV/cloudflare/account-id
  op://prive-admin/prive-admin-cloudflare-$CLOUDFLARE_CREDENTIALS_ENV/cloudflare/api-token
EOF
    exit 1
  fi

  echo "Loading Cloudflare credentials from 1Password item 'prive-admin-cloudflare-$CLOUDFLARE_CREDENTIALS_ENV'..."
  export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-$(op read "op://prive-admin/prive-admin-cloudflare-$CLOUDFLARE_CREDENTIALS_ENV/cloudflare/account-id")}"
  export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-$(op read "op://prive-admin/prive-admin-cloudflare-$CLOUDFLARE_CREDENTIALS_ENV/cloudflare/api-token")}"
}

json_payload() {
  sed '/^\[WARN\]/d'
}

preview_seeded() {
  local payload

  payload="$(wrangler d1 execute "$PREVIEW_D1_DB" \
    --remote \
    --json \
    --command "SELECT value FROM $MARKER_TABLE WHERE key = '$MARKER_KEY' LIMIT 1;" 2>/dev/null | json_payload || true)"

  if [[ -z "$payload" ]]; then
    return 1
  fi

  node --input-type=module - "$payload" <<'NODE'
const [, , rawPayload] = process.argv

try {
  const payload = JSON.parse(rawPayload)
  const value = payload
    .flatMap((statement) => statement.results ?? [])
    .find((row) => row.value === "1")?.value

  process.exit(value === "1" ? 0 : 1)
} catch {
  process.exit(1)
}
NODE
}

write_seed_marker() {
  local copied_at

  copied_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  wrangler d1 execute "$PREVIEW_D1_DB" \
    --remote \
    --yes \
    --command "CREATE TABLE IF NOT EXISTS $MARKER_TABLE (key TEXT PRIMARY KEY, value TEXT NOT NULL, copied_at TEXT NOT NULL); INSERT OR REPLACE INTO $MARKER_TABLE (key, value, copied_at) VALUES ('$MARKER_KEY', '1', '$copied_at');"
}

load_cloudflare_credentials

if preview_seeded; then
  echo "Preview D1 database '$PREVIEW_D1_DB' was already seeded from '$SOURCE_D1_DB'; skipping copy."
  exit 0
fi

echo "Seeding preview D1 database '$PREVIEW_D1_DB' from '$SOURCE_D1_DB'..."
"$ROOT_DIR/scripts/copy_d1_database.sh" \
  --source-db "$SOURCE_D1_DB" \
  --target-db "$PREVIEW_D1_DB" \
  --target-mode remote \
  --yes

write_seed_marker
echo "Preview D1 database '$PREVIEW_D1_DB' seed marker written."
