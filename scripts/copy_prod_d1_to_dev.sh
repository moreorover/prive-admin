#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/apps/server"

PROD_D1_DB="${PROD_D1_DB:-prive-admin-prod}"
DEV_D1_DB="${DEV_D1_DB:-prive-admin-dev}"
CONFIRM_COPY_PROD_TO_DEV="${CONFIRM_COPY_PROD_TO_DEV:-}"
DRY_RUN="${DRY_RUN:-}"
KEEP_D1_COPY_FILES="${KEEP_D1_COPY_FILES:-}"

if [[ "$CONFIRM_COPY_PROD_TO_DEV" != "1" ]]; then
  cat <<EOF
Refusing to copy D1 production data into dev without confirmation.

This operation overwrites remote D1 database '$DEV_D1_DB' with data exported from '$PROD_D1_DB'.

Run:
  CONFIRM_COPY_PROD_TO_DEV=1 vp run db:copy:prod-to-dev

Optional:
  DRY_RUN=1 CONFIRM_COPY_PROD_TO_DEV=1 vp run db:copy:prod-to-dev
  PROD_D1_DB=<prod-db-name> DEV_D1_DB=<dev-db-name> CONFIRM_COPY_PROD_TO_DEV=1 vp run db:copy:prod-to-dev
EOF
  exit 1
fi

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/prive-admin-d1-copy.XXXXXX")"
EXPORT_SQL="$TMP_DIR/prod-export.sql"
DEV_TABLES_JSON="$TMP_DIR/dev-tables.json"
RESET_SQL="$TMP_DIR/reset-dev.sql"
EXPORT_LOG="$TMP_DIR/export.log"

cleanup() {
  if [[ "$KEEP_D1_COPY_FILES" == "1" ]]; then
    echo "Keeping temporary files in $TMP_DIR"
    return
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

wrangler() {
  pnpm --dir "$SERVER_DIR" exec wrangler "$@"
}

echo "Exporting remote D1 database '$PROD_D1_DB'..."
if ! wrangler d1 export "$PROD_D1_DB" --remote --skip-confirmation --output "$EXPORT_SQL" >"$EXPORT_LOG" 2>&1; then
  cat "$EXPORT_LOG"
  exit 1
fi
echo "Exported '$PROD_D1_DB' to a temporary SQL file."

echo "Reading current table list from remote D1 database '$DEV_D1_DB'..."
wrangler d1 execute "$DEV_D1_DB" \
  --remote \
  --json \
  --command "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name;" \
  >"$DEV_TABLES_JSON"

node --input-type=module - "$DEV_TABLES_JSON" "$RESET_SQL" <<'NODE'
import { readFileSync, writeFileSync } from "node:fs"

const [, , tablesJsonPath, resetSqlPath] = process.argv
const rawPayload = readFileSync(tablesJsonPath, "utf8")
const jsonPayload = rawPayload
  .split("\n")
  .filter((line) => !line.startsWith("[WARN]"))
  .join("\n")
  .trim()
const payload = JSON.parse(jsonPayload)
const tableNames = payload
  .flatMap((statement) => statement.results ?? [])
  .map((row) => row.name)
  .filter((name) => typeof name === "string")
  .filter((name) => !name.startsWith("sqlite_") && !name.startsWith("_cf_"))

if (tableNames.length === 0) {
  throw new Error("No dev tables found to reset")
}

const quoteIdentifier = (name) => `"${name.replaceAll('"', '""')}"`
const sql = [
  "PRAGMA foreign_keys = OFF;",
  ...tableNames.map((name) => `DROP TABLE IF EXISTS ${quoteIdentifier(name)};`),
  "PRAGMA foreign_keys = ON;",
  "",
].join("\n")

writeFileSync(resetSqlPath, sql)
console.log(`Generated reset SQL for ${tableNames.length} dev tables.`)
NODE

if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY_RUN=1 set; export and reset SQL were generated, but '$DEV_D1_DB' was not modified."
  if [[ "$KEEP_D1_COPY_FILES" == "1" ]]; then
    echo "Temporary files: $TMP_DIR"
  fi
  exit 0
fi

echo "Resetting remote D1 database '$DEV_D1_DB'..."
wrangler d1 execute "$DEV_D1_DB" --remote --yes --file "$RESET_SQL"

echo "Importing production export into remote D1 database '$DEV_D1_DB'..."
wrangler d1 execute "$DEV_D1_DB" --remote --yes --file "$EXPORT_SQL"

echo "Copied '$PROD_D1_DB' into '$DEV_D1_DB'."
