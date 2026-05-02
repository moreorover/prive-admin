#!/usr/bin/env bash
#
# Interactive restore of a Postgres dump from Cloudflare R2 into the local
# database container defined in packages/db/docker-compose.yml.
#
# Usage:
#   scripts/restore_postgres.sh
#
# R2 credentials are loaded from the "prive-admin" 1Password vault via the
# `op` CLI (matching the GitHub Actions workflows). You must be signed in:
#   eval "$(op signin)"
#
# Env overrides (any pre-set R2_* var skips the corresponding `op read`):
#   PG_CONTAINER      Local postgres container name. Default: prive-admin
#   PG_SUPERUSER      Postgres superuser inside the container. Default: postgres
#   PG_PASSWORD       Postgres password. Default: password
#   R2_PREFIX         Limit listing to this key prefix (e.g. "pre-deploy/").
#   KEEP_DOWNLOAD     If set, keep the downloaded dump file after restore.
#
# The script depends on: op, s3cmd, docker, gzip (only when restoring .gz dumps).

set -euo pipefail
umask 077

PG_CONTAINER="${PG_CONTAINER:-prive-admin}"
PG_SUPERUSER="${PG_SUPERUSER:-postgres}"
PG_PASSWORD="${PG_PASSWORD:-password}"

err() { printf 'error: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || err "missing dependency: $1"; }

need op
need s3cmd
need docker

# Verify the op CLI has an active session. `op whoami` exits non-zero when
# not signed in. Surface a clear hint instead of letting `op read` fail later.
if ! op whoami >/dev/null 2>&1; then
  err "1Password CLI not signed in. Run: eval \"\$(op signin)\""
fi

op_read() {
  local ref="$1"
  op read "${ref}" 2>/dev/null || err "failed to read ${ref} from 1Password"
}

: "${R2_ACCOUNT_ID:=$(op_read 'op://prive-admin/Cloudflare R2/account-id')}"
: "${R2_ACCESS_KEY_ID:=$(op_read 'op://prive-admin/Cloudflare R2/access-key-id')}"
: "${R2_SECRET_ACCESS_KEY:=$(op_read 'op://prive-admin/Cloudflare R2/secret-access-key')}"
: "${R2_BUCKET_NAME:=$(op_read 'op://prive-admin/Cloudflare R2/bucket-name')}"
# Production role name — the dump references it as the owner of the
# database/objects, so it must exist locally before restore.
: "${PROD_PG_USER:=$(op_read 'op://prive-admin/prive-admin-prod/postgres/POSTGRES_USER')}"
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

LIST_PREFIX="s3://${R2_BUCKET_NAME}/${R2_PREFIX:-}"
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
  err "postgres container '${PG_CONTAINER}' is not running. Start it with: (cd packages/db && docker compose up -d)"
fi

# Validate the production role name we'll create locally — guards against
# SQL injection through a stray op secret value and rejects empty input.
if ! [[ "${PROD_PG_USER}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  err "PROD_PG_USER '${PROD_PG_USER}' is not a valid Postgres identifier"
fi

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
  source : ${S3_KEY}
  target : container=${PG_CONTAINER} superuser=${PG_SUPERUSER}

The dump was produced with 'pg_dump --clean --create' and will DROP
and recreate the target database inside the local container.

WARN
printf "type 'yes' to proceed: "
read -r confirm
if [[ "${confirm}" != "yes" ]]; then
  printf 'aborted\n'; exit 0
fi

# Connect to the 'postgres' maintenance DB so the dump can DROP/CREATE
# the target database listed inside it.
case "${FILE_NAME}" in
  *.gz)
    need gzip
    gzip -dc "${LOCAL_PATH}" \
      | docker exec -i \
          -e PGPASSWORD="${PG_PASSWORD}" \
          "${PG_CONTAINER}" \
          psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -d postgres
    ;;
  *)
    docker exec -i \
        -e PGPASSWORD="${PG_PASSWORD}" \
        "${PG_CONTAINER}" \
        psql -v ON_ERROR_STOP=1 -U "${PG_SUPERUSER}" -d postgres \
      < "${LOCAL_PATH}"
    ;;
esac

printf '\nrestore complete: %s\n' "${S3_KEY}"
