#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/apps/server"

PROD_D1_DB="${PROD_D1_DB:-prive-admin-prod}"
DEV_D1_DB="${DEV_D1_DB:-prive-admin-dev}"
SOURCE_D1_DB="${SOURCE_D1_DB:-$PROD_D1_DB}"
TARGET_D1_DB="${TARGET_D1_DB:-$DEV_D1_DB}"
TARGET_D1_REMOTE="${TARGET_D1_REMOTE:-1}"
CLOUDFLARE_CREDENTIALS_ENV="${CLOUDFLARE_CREDENTIALS_ENV:-}"
CONFIRM_D1_COPY="${CONFIRM_D1_COPY:-${CONFIRM_COPY_PROD_TO_DEV:-}}"
DRY_RUN="${DRY_RUN:-}"
KEEP_D1_COPY_FILES="${KEEP_D1_COPY_FILES:-}"

usage() {
  cat <<EOF
Usage:
  scripts/copy_d1_database.sh --source <prod|dev> --target <dev|local> --yes [options]

Copies a remote D1 database into remote dev D1 or local Wrangler D1.

Options:
  --source <prod|dev>      Source remote D1 database. Default: prod
  --target <dev|local>     Target remote dev D1 or local Wrangler D1. Default: dev
  --credentials <prod|dev> Cloudflare 1Password item to read when env vars are missing.
                           Default: source environment
  --source-db <name>       Explicit source D1 database. Default: $SOURCE_D1_DB
  --target-db <name>       Explicit target D1 database. Default: $TARGET_D1_DB
  --target-mode <remote|local>
                           Explicit target mode. Default: remote
  --dry-run                Export source and generate reset SQL without changing target
  --keep-files             Keep temporary export and reset files
  --yes                    Confirm the overwrite
  -h, --help               Show this help

Examples:
  vp run db:copy:prod-to-dev
  vp run db:copy:dev-to-local
  vp run db:copy:prod-to-local
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
    --)
      shift
      ;;
    --source)
      if [[ $# -lt 2 ]]; then
        echo "--source requires 'prod' or 'dev'." >&2
        exit 1
      fi
      case "$2" in
        prod)
          SOURCE_D1_DB="$PROD_D1_DB"
          if [[ -z "$CLOUDFLARE_CREDENTIALS_ENV" ]]; then
            set_credentials_env prod
          fi
          ;;
        dev)
          SOURCE_D1_DB="$DEV_D1_DB"
          if [[ -z "$CLOUDFLARE_CREDENTIALS_ENV" ]]; then
            set_credentials_env dev
          fi
          ;;
        *)
          echo "--source must be 'prod' or 'dev'." >&2
          exit 1
          ;;
      esac
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
    --target)
      if [[ $# -lt 2 ]]; then
        echo "--target requires 'dev' or 'local'." >&2
        exit 1
      fi
      case "$2" in
        dev)
          TARGET_D1_DB="$DEV_D1_DB"
          TARGET_D1_REMOTE="1"
          ;;
        local)
          TARGET_D1_DB="$DEV_D1_DB"
          TARGET_D1_REMOTE="0"
          ;;
        *)
          echo "--target must be 'dev' or 'local'." >&2
          exit 1
          ;;
      esac
      shift 2
      ;;
    --target-mode)
      if [[ $# -lt 2 ]]; then
        echo "--target-mode requires 'remote' or 'local'." >&2
        exit 1
      fi
      case "$2" in
        remote) TARGET_D1_REMOTE="1" ;;
        local) TARGET_D1_REMOTE="0" ;;
        *)
          echo "--target-mode must be 'remote' or 'local'." >&2
          exit 1
          ;;
      esac
      shift 2
      ;;
    --remote)
      TARGET_D1_REMOTE="1"
      shift
      ;;
    --local)
      TARGET_D1_REMOTE="0"
      shift
      ;;
    --source-db | --prod-db)
      if [[ $# -lt 2 ]]; then
        echo "$1 requires a database name." >&2
        exit 1
      fi
      SOURCE_D1_DB="$2"
      shift 2
      ;;
    --target-db | --dev-db)
      if [[ $# -lt 2 ]]; then
        echo "$1 requires a database name." >&2
        exit 1
      fi
      TARGET_D1_DB="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="1"
      shift
      ;;
    --keep-files)
      KEEP_D1_COPY_FILES="1"
      shift
      ;;
    --yes)
      CONFIRM_D1_COPY="1"
      shift
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

if [[ -z "$CLOUDFLARE_CREDENTIALS_ENV" ]]; then
  set_credentials_env prod
fi

if [[ "$TARGET_D1_REMOTE" != "0" && "$TARGET_D1_REMOTE" != "1" ]]; then
  echo "TARGET_D1_REMOTE must be 0 for local target or 1 for remote target." >&2
  exit 1
fi

TARGET_MODE="remote"
TARGET_FLAG=(--remote)
if [[ "$TARGET_D1_REMOTE" == "0" ]]; then
  TARGET_MODE="local"
  TARGET_FLAG=(--local)
fi

if [[ "$CONFIRM_D1_COPY" != "1" ]]; then
  cat <<EOF
Refusing to copy D1 data without confirmation.

This operation overwrites $TARGET_MODE D1 database '$TARGET_D1_DB' with data exported from remote '$SOURCE_D1_DB'.

Run:
  scripts/copy_d1_database.sh --source prod --target dev --yes

Optional:
  scripts/copy_d1_database.sh --source prod --target dev --dry-run --yes
  scripts/copy_d1_database.sh --source dev --target local --yes
  scripts/copy_d1_database.sh --source prod --target local --yes
EOF
  exit 1
fi

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/prive-admin-d1-copy.XXXXXX")"
EXPORT_SQL="$TMP_DIR/prod-export.sql"
IMPORT_SQL="$TMP_DIR/import.sql"
TARGET_TABLES_JSON="$TMP_DIR/target-tables.json"
RESET_SQL="$TMP_DIR/reset-target.sql"
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

load_cloudflare_credentials

echo "Exporting remote D1 database '$SOURCE_D1_DB'..."
if ! wrangler d1 export "$SOURCE_D1_DB" --remote --skip-confirmation --output "$EXPORT_SQL" >"$EXPORT_LOG" 2>&1; then
  cat "$EXPORT_LOG"
  exit 1
fi
echo "Exported '$SOURCE_D1_DB' to a temporary SQL file."

node --input-type=module - "$EXPORT_SQL" "$IMPORT_SQL" <<'NODE'
import { readFileSync, writeFileSync } from "node:fs"

const [, , exportSqlPath, importSqlPath] = process.argv
const exportSql = readFileSync(exportSqlPath, "utf8")

const splitStatements = (sql) => {
  const statements = []
  let current = []

  for (const line of sql.split("\n")) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue

    current.push(line)
    if (trimmed.endsWith(";")) {
      statements.push(current.join("\n"))
      current = []
    }
  }

  if (current.length > 0) {
    statements.push(current.join("\n"))
  }

  return statements
}

const tableFromCreate = (statement) =>
  statement.match(/^CREATE TABLE(?: IF NOT EXISTS)?\s+[`"]?([^`"\s(]+)[`"]?/i)?.[1]
const tableFromInsert = (statement) => statement.match(/^INSERT INTO\s+[`"]?([^`"\s(]+)[`"]?/i)?.[1]
const tableFromIndex = (statement) => statement.match(/^CREATE (?:UNIQUE )?INDEX\s+[`"]?[^`"]+[`"]?\s+ON\s+[`"]?([^`"\s(]+)[`"]?/i)?.[1]
const referencePattern = /REFERENCES\s+[`"[]?([^`"\]\s(]+)[`"\]]?/gi

const statements = splitStatements(exportSql)
const creates = new Map()
const inserts = new Map()
const indexes = []
const sequenceStatements = []
const otherStatements = []

for (const statement of statements) {
  const createTable = tableFromCreate(statement)
  if (createTable) {
    creates.set(createTable, statement)
    continue
  }

  const insertTable = tableFromInsert(statement)
  if (insertTable) {
    if (insertTable === "sqlite_sequence") {
      sequenceStatements.push(statement)
    } else {
      const tableInserts = inserts.get(insertTable) ?? []
      tableInserts.push(statement)
      inserts.set(insertTable, tableInserts)
    }
    continue
  }

  if (tableFromIndex(statement)) {
    indexes.push(statement)
    continue
  }

  if (/^(?:DELETE FROM|UPDATE)\s+"?sqlite_sequence"?/i.test(statement)) {
    sequenceStatements.push(statement)
    continue
  }

  if (!/^PRAGMA\b/i.test(statement)) {
    otherStatements.push(statement)
  }
}

const tableNames = [...creates.keys()]
const tableNameSet = new Set(tableNames)
const referencesByTable = new Map(
  tableNames.map((tableName) => {
    const references = new Set()
    for (const match of creates.get(tableName).matchAll(referencePattern)) {
      if (tableNameSet.has(match[1])) {
        references.add(match[1])
      }
    }
    return [tableName, references]
  }),
)

const depthByTable = new Map()
const visiting = new Set()
const depth = (tableName) => {
  if (depthByTable.has(tableName)) return depthByTable.get(tableName)
  if (visiting.has(tableName)) return 0
  visiting.add(tableName)
  const tableDepth = Math.max(0, ...[...(referencesByTable.get(tableName) ?? [])].map((reference) => depth(reference) + 1))
  visiting.delete(tableName)
  depthByTable.set(tableName, tableDepth)
  return tableDepth
}

const importOrder = tableNames.sort((left, right) => depth(left) - depth(right) || left.localeCompare(right))
const importSql = [
  "PRAGMA foreign_keys = OFF;",
  ...importOrder.map((tableName) => creates.get(tableName)),
  ...otherStatements,
  ...importOrder.flatMap((tableName) => inserts.get(tableName) ?? []),
  ...sequenceStatements,
  ...indexes,
  "PRAGMA foreign_keys = ON;",
  "",
].join("\n")

writeFileSync(importSqlPath, importSql)
NODE

echo "Reading current table list from $TARGET_MODE D1 database '$TARGET_D1_DB'..."
wrangler d1 execute "$TARGET_D1_DB" \
  "${TARGET_FLAG[@]}" \
  --json \
  --command "SELECT name, sql FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name;" \
  >"$TARGET_TABLES_JSON"

node --input-type=module - "$TARGET_TABLES_JSON" "$RESET_SQL" "$TARGET_MODE" <<'NODE'
import { readFileSync, writeFileSync } from "node:fs"

const [, , tablesJsonPath, resetSqlPath, targetMode] = process.argv
const rawPayload = readFileSync(tablesJsonPath, "utf8")
const jsonPayload = rawPayload
  .split("\n")
  .filter((line) => !line.startsWith("[WARN]"))
  .join("\n")
  .trim()
const payload = JSON.parse(jsonPayload)
const rows = payload
  .flatMap((statement) => statement.results ?? [])
  .filter((row) => typeof row.name === "string")
  .filter((row) => !row.name.startsWith("sqlite_") && !row.name.startsWith("_cf_"))
const tableNames = rows.map((row) => row.name)

if (tableNames.length === 0) {
  const sql = ["PRAGMA foreign_keys = OFF;", "PRAGMA foreign_keys = ON;", ""].join("\n")
  writeFileSync(resetSqlPath, sql)
  console.log(`Generated reset SQL for 0 ${targetMode} target tables.`)
  process.exit(0)
}

const tableNameSet = new Set(tableNames)
const referencePattern = /REFERENCES\s+[`"[]?([^`"\]\s(]+)[`"\]]?/gi
const referencesByTable = new Map(
  rows.map((row) => {
    const references = new Set()
    for (const match of String(row.sql ?? "").matchAll(referencePattern)) {
      if (tableNameSet.has(match[1])) {
        references.add(match[1])
      }
    }
    return [row.name, references]
  }),
)

const depthByTable = new Map()
const visiting = new Set()
const depth = (tableName) => {
  if (depthByTable.has(tableName)) return depthByTable.get(tableName)
  if (visiting.has(tableName)) return 0
  visiting.add(tableName)
  const tableDepth = Math.max(0, ...[...(referencesByTable.get(tableName) ?? [])].map((reference) => depth(reference) + 1))
  visiting.delete(tableName)
  depthByTable.set(tableName, tableDepth)
  return tableDepth
}

const dropOrder = [...tableNames].sort((left, right) => depth(right) - depth(left) || left.localeCompare(right))
const quoteIdentifier = (name) => `"${name.replaceAll('"', '""')}"`
const sql = [
  "PRAGMA foreign_keys = OFF;",
  ...dropOrder.map((name) => `DROP TABLE IF EXISTS ${quoteIdentifier(name)};`),
  "PRAGMA foreign_keys = ON;",
  "",
].join("\n")

writeFileSync(resetSqlPath, sql)
console.log(`Generated reset SQL for ${tableNames.length} ${targetMode} target tables.`)
NODE

if [[ "$DRY_RUN" == "1" ]]; then
  echo "DRY_RUN=1 set; export and reset SQL were generated, but $TARGET_MODE '$TARGET_D1_DB' was not modified."
  if [[ "$KEEP_D1_COPY_FILES" == "1" ]]; then
    echo "Temporary files: $TMP_DIR"
  fi
  exit 0
fi

echo "Resetting $TARGET_MODE D1 database '$TARGET_D1_DB'..."
wrangler d1 execute "$TARGET_D1_DB" "${TARGET_FLAG[@]}" --yes --file "$RESET_SQL"

echo "Importing remote export into $TARGET_MODE D1 database '$TARGET_D1_DB'..."
wrangler d1 execute "$TARGET_D1_DB" "${TARGET_FLAG[@]}" --yes --file "$IMPORT_SQL"

echo "Copied remote '$SOURCE_D1_DB' into $TARGET_MODE '$TARGET_D1_DB'."
