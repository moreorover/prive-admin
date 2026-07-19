#!/usr/bin/env bash
#
# Interactive restore of a Postgres dump from Cloudflare R2 into the local
# database container defined in docker-compose.dev.yml.
#
# Usage:
#   scripts/restore_postgres.sh
#
# R2 credentials are loaded from the "prive-admin" 1Password vault via the
# `op` CLI (matching the GitHub Actions workflows). You must be signed in:
#   eval "$(op signin)"
#
# Env overrides (any pre-set R2_* var skips the corresponding `op read`):
#   PG_CONTAINER      Local postgres container name. Default: postgres
#   PG_SUPERUSER      Postgres superuser inside the container. Default: postgres
#   PG_PASSWORD       Postgres password. Default: password
#   PG_DATABASE       Local database to restore into. Default: prive_admin
#   PG_SCHEMA         Schema whose tables should be dropped. Default: public
#   PG_DROP_SCHEMAS   Extra schemas to drop before restore. Default: drizzle
#   R2_PREFIX         Limit listing to this key prefix. Default: postgres_backup/
#   KEEP_DOWNLOAD     If set, keep the downloaded dump file after restore.
#
# The script depends on: op, s3cmd, docker, gzip (only when restoring .gz dumps).

set -euo pipefail
umask 077

PG_CONTAINER="${PG_CONTAINER:-postgres}"
PG_SUPERUSER="${PG_SUPERUSER:-postgres}"
PG_PASSWORD="${PG_PASSWORD:-password}"
PG_DATABASE="${PG_DATABASE:-prive_admin}"
PG_SCHEMA="${PG_SCHEMA:-public}"
PG_DROP_SCHEMAS="${PG_DROP_SCHEMAS:-drizzle}"

err() { printf 'error: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || err "missing dependency: $1"; }

need op
need s3cmd
need docker

validate_pg_identifier() {
  local name="$1"
  local value="$2"
  if ! [[ "${value}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
    err "${name} '${value}' is not a valid Postgres identifier"
  fi
}

filter_database_commands() {
  local schema="$1"
  awk -v schema="${schema}" '
    BEGIN { quoted_schema = "\"" schema "\"" }
    /^DROP DATABASE / { next }
    /^CREATE DATABASE / { next }
    /^ALTER DATABASE / { next }
    /^\\connect / { next }
    /^DROP / { next }
    $0 == "CREATE SCHEMA " schema ";" { next }
    $0 == "CREATE SCHEMA " quoted_schema ";" { next }
    $0 ~ "^ALTER SCHEMA (" schema "|" quoted_schema ") OWNER TO " { next }
    { print }
  '
}

# Verify the op CLI has an active session. `op whoami` exits non-zero when
# not signed in. Surface a clear hint instead of letting `op read` fail later.
if ! op whoami >/dev/null 2>&1; then
  err "1Password CLI not signed in. Run: eval \"\$(op signin)\""
fi

op_read() {
  local ref="$1"
  local value
  if ! value="$(op read "${ref}" 2>&1)"; then
    err "failed to read ${ref} from 1Password: ${value}"
  fi
  printf '%s' "${value}"
}

load_secret() {
  local var_name="$1"
  local ref="$2"
  local value="${!var_name:-}"

  if [[ -z "${value}" ]]; then
    value="$(op_read "${ref}")"
    printf -v "${var_name}" '%s' "${value}"
  fi
}

load_secret R2_ACCOUNT_ID 'op://prive-admin/Cloudflare R2/account-id'
load_secret R2_ACCESS_KEY_ID 'op://prive-admin/Cloudflare R2/access-key-id'
load_secret R2_SECRET_ACCESS_KEY 'op://prive-admin/Cloudflare R2/secret-access-key'
load_secret R2_BUCKET_NAME 'op://prive-admin/Cloudflare R2/bucket-name'
# Production role name — the dump references it as the owner of the
# database/objects, so it must exist locally before restore.
load_secret PROD_PG_USER 'op://prive-admin/prive-admin-prod/server/POSTGRES_USER'
export R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET_NAME PROD_PG_USER

S3CFG="$(mktemp)"
WORK_DIR="$(mktemp -d)"
cleanup() {
  rm -f "${S3CFG}"
  if [[ -z "${KEEP_DOWNLOAD:-}" ]]; then
    rm -rf "${WORK_DIR}"
  else
    printf 'kept downloaded dump in %s\n' "${WORK_DIR}"
  fi
}
trap cleanup EXIT

cat > "${S3CFG}" <<EOF
[default]
access_key = ${R2_ACCESS_KEY_ID}
secret_key = ${R2_SECRET_ACCESS_KEY}
host_base = ${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
host_bucket = %(bucket)s.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
bucket_location = auto
use_https = True
EOF

LIST_PREFIX="s3://${R2_BUCKET_NAME}/${R2_PREFIX:-postgres_backup/}"
printf 'listing %s\n' "${LIST_PREFIX}"

# s3cmd ls output: "YYYY-MM-DD HH:MM   SIZE   s3://bucket/key"
# Use a plain read loop instead of `mapfile` so the script runs on the
# bash 3.2 that ships with macOS.
ENTRIES=()
while IFS= read -r line; do
  [[ -n "${line}" ]] && ENTRIES+=("${line}")
done < <(
  s3cmd -c "${S3CFG}" ls --recursive "${LIST_PREFIX}" \
    | awk '{ printf "%s %s|%s|%s\n", $1, $2, $3, $4 }' \
    | sort -r
)

if [[ "${#ENTRIES[@]}" -eq 0 ]]; then
  err "no objects under ${LIST_PREFIX}"
fi

printf '\nselect a backup to restore:\n'
i=1
KEYS=()
for entry in "${ENTRIES[@]}"; do
  date_field="${entry%%|*}"
  rest="${entry#*|}"
  size="${rest%%|*}"
  key="${rest#*|}"
  KEYS+=("${key}")
  printf '  [%2d] %s  %10s  %s\n' "${i}" "${date_field}" "${size}" "${key}"
  i=$((i + 1))
done

printf '\nenter number (or q to quit): '
read -r choice
if [[ "${choice}" =~ ^[Qq]$ ]]; then
  printf 'aborted\n'; exit 0
fi
if ! [[ "${choice}" =~ ^[0-9]+$ ]] || (( choice < 1 || choice > ${#KEYS[@]} )); then
  err "invalid selection: ${choice}"
fi

S3_KEY="${KEYS[$((choice - 1))]}"
FILE_NAME="$(basename "${S3_KEY}")"
LOCAL_PATH="${WORK_DIR}/${FILE_NAME}"

printf '\ndownloading %s\n' "${S3_KEY}"
s3cmd -c "${S3CFG}" get "${S3_KEY}" "${LOCAL_PATH}"

if ! docker ps --format '{{.Names}}' | grep -Fxq "${PG_CONTAINER}"; then
  err "postgres container '${PG_CONTAINER}' is not running. Start it with: bun compose:up"
fi

# Validate the production role name we'll create locally — guards against
# SQL injection through a stray op secret value and rejects empty input.
validate_pg_identifier "PROD_PG_USER" "${PROD_PG_USER}"
validate_pg_identifier "PG_DATABASE" "${PG_DATABASE}"
validate_pg_identifier "PG_SCHEMA" "${PG_SCHEMA}"
for schema in ${PG_DROP_SCHEMAS}; do
  validate_pg_identifier "PG_DROP_SCHEMAS item" "${schema}"
done

# Pre-create the prod role inside the local container so the dump's
# `ALTER ... OWNER TO ${PROD_PG_USER}` statements don't fail.
printf 'ensuring local role %s exists\n' "${PROD_PG_USER}"
docker exec -i \
    -e PGPASSWORD="${PG_PASSWORD}" \
    "${PG_CONTAINER}" \
    psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -d postgres <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${PROD_PG_USER}') THEN
    CREATE ROLE "${PROD_PG_USER}" LOGIN;
  END IF;
END
\$\$;
SQL

cat <<WARN

ABOUT TO RESTORE
  source       : ${S3_KEY}
  target       : container=${PG_CONTAINER} database=${PG_DATABASE} schema=${PG_SCHEMA} superuser=${PG_SUPERUSER}
  drop schemas : ${PG_DROP_SCHEMAS:-none}

This will DROP all tables in schema "${PG_SCHEMA}" inside database
"${PG_DATABASE}" and DROP the extra schemas listed above before restoring
the selected dump.

WARN
printf "type 'yes' to proceed: "
read -r confirm
if [[ "${confirm}" != "yes" ]]; then
  printf 'aborted\n'; exit 0
fi

printf 'dropping tables in %s.%s\n' "${PG_DATABASE}" "${PG_SCHEMA}"
docker exec -i \
    -e PGPASSWORD="${PG_PASSWORD}" \
    "${PG_CONTAINER}" \
    psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -d "${PG_DATABASE}" <<SQL
DO \$\$
DECLARE
  drop_sql text;
BEGIN
  SELECT string_agg(format('DROP TABLE IF EXISTS %I.%I CASCADE', schemaname, tablename), '; ')
  INTO drop_sql
  FROM pg_tables
  WHERE schemaname = '${PG_SCHEMA}';

  IF drop_sql IS NOT NULL THEN
    EXECUTE drop_sql;
  END IF;
END
\$\$;
SQL

for schema in ${PG_DROP_SCHEMAS}; do
  printf 'dropping schema %s.%s\n' "${PG_DATABASE}" "${schema}"
  docker exec -i \
      -e PGPASSWORD="${PG_PASSWORD}" \
      "${PG_CONTAINER}" \
      psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -d "${PG_DATABASE}" <<SQL
DROP SCHEMA IF EXISTS "${schema}" CASCADE;
SQL
done

# Restore into the existing local database. Backups are generated with
# pg_dump --clean --create, so skip database-level commands and clean-up
# statements that are redundant after the explicit table drop above.
case "${FILE_NAME}" in
  *.gz)
    need gzip
    gzip -dc "${LOCAL_PATH}" \
      | filter_database_commands "${PG_SCHEMA}" \
      | docker exec -i \
          -e PGPASSWORD="${PG_PASSWORD}" \
          "${PG_CONTAINER}" \
          psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -d "${PG_DATABASE}"
    ;;
  *)
    filter_database_commands "${PG_SCHEMA}" < "${LOCAL_PATH}" \
      | docker exec -i \
          -e PGPASSWORD="${PG_PASSWORD}" \
          "${PG_CONTAINER}" \
          psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -d "${PG_DATABASE}"
    ;;
esac

printf '\nrestore complete: %s\n' "${S3_KEY}"
