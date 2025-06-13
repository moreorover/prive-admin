#!/bin/bash
set -e

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="$HOME/db_backups"
mkdir -p "$BACKUP_DIR"

export PGPASSWORD="${POSTGRES_PASSWORD}"

pg_dump -h 127.0.0.1 -p 5432 -U "${POSTGRES_USER}" "${POSTGRES_DATABASE}" > "$BACKUP_DIR/postgres_backup_${TIMESTAMP}.sql"

echo "✅ Backup completed and stored at $BACKUP_DIR/postgres_backup_${TIMESTAMP}.sql"
