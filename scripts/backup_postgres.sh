#!/bin/bash
set -euo pipefail
umask 077

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="${HOME}/db_backups"
COMPOSE_DIR="${COMPOSE_DIR:-${HOME}/prive-admin}"

# Optional label embedded in the filename (e.g. "pre-deploy_<sha>") so the
# operator can distinguish scheduled backups from one-off ones at a glance,
# both on the VPS and in object storage. Restricted to a safe charset.
BACKUP_LABEL="${BACKUP_LABEL:-}"
if [[ -n "${BACKUP_LABEL}" ]] && [[ ! "${BACKUP_LABEL}" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "BACKUP_LABEL '${BACKUP_LABEL}' contains unsupported characters" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

# Prune backups older than 14 days
find "${BACKUP_DIR}" -name "postgres_backup_*.sql" -type f -mtime +14 -delete

if [[ -n "${BACKUP_LABEL}" ]]; then
  # Timestamp first so directory/object listings sort chronologically
  # regardless of label.
  OUT="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}_${BACKUP_LABEL}.sql"
else
  OUT="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql"
fi
TMP="${OUT}.partial"
trap 'rm -f "${TMP}"' ERR

# Run pg_dump inside the postgres container — avoids exposing 5432 on the host.
# PG_USER / PG_DATABASE come from the workflow env. Password is read from the
# container's own POSTGRES_PASSWORD via `printenv` to avoid leaking into the
# host process table.
docker compose --project-directory "${COMPOSE_DIR}" exec -T postgres \
  bash -c 'PGPASSWORD="$(printenv POSTGRES_PASSWORD)" pg_dump \
            -U "'"${PG_USER}"'" --clean --create "'"${PG_DATABASE}"'"' \
  > "${TMP}"

mv "${TMP}" "${OUT}"
echo "Backup written: ${OUT}"
