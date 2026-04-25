# Database Backups

## Restoring a backup

Backups from production use Prisma conventions (camelCase columns, PG enums). The Drizzle schema uses snake_case columns and plain text types. You need to convert the backup before restoring.

### 1. Convert the backup

```bash
python3 scripts/convert_prisma_backup.py backups/<backup-file>.sql
```

This creates `backups/postgres_backup_drizzle.sql` (data-only, no schema).

### 2. Start the database

```bash
docker compose -f packages/db/docker-compose.yml up -d
```

### 3. Run Drizzle migration

```bash
cd packages/db && bunx drizzle-kit migrate
```

### 4. Restore data

```bash
source apps/web/.env
psql "$DATABASE_URL" < backups/postgres_backup_drizzle.sql
```

## What the conversion does

| Prisma backup | Drizzle schema |
|---|---|
| camelCase columns (`"userId"`) | snake_case (`user_id`) |
| PG enums (`HairOrderStatus`, etc.) | Plain `text` |
| `_prisma_migrations` table | Skipped |
| Schema + data | Data only |
