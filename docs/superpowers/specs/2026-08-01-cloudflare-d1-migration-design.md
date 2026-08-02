# Cloudflare D1 Migration Design

## Goal

Move `prive-admin` from the VPS-hosted Node/Postgres deployment to Cloudflare using direct Wrangler configuration and D1 immediately. The first deployment will use Cloudflare-generated `workers.dev` URLs; custom domain attachment is intentionally out of scope for the initial cutover.

The migration must preserve the current app architecture: React/Vite web app, Hono/tRPC server, Better Auth, application services, repositories, R2-backed uploads/backups, and route-owned data fetching. The latest production data source remains the Postgres backup stored in R2 and restored locally with `./scripts/restore_postgres.sh`.

## Current State

The app currently runs a Node Hono server with `@hono/node-server`, Drizzle `node-postgres`, Better Auth configured with the Drizzle Postgres adapter, and Postgres migrations in `packages/db/src/migrations`. The web app calls the server through `/trpc` and auth routes.

The local restored production-sized dataset is small enough for D1, but several queries are Postgres-specific or scan whole tables today. Examples include `ilike`, `extract(month from ...)`, `::int` casts, `timestamptz` assumptions, and Postgres Drizzle column builders.

## Architecture

Use direct Wrangler-managed Cloudflare resources:

- A Cloudflare Worker for the API server.
- Cloudflare D1 bound to the Worker as `DB`.
- Cloudflare R2 bound or configured for document uploads and backup-related access.
- A static Vite web deployment on Cloudflare, using generated Cloudflare URLs first.

The server package should expose a Worker-compatible default export while keeping local development practical. Node-only `serve(...)` usage should not be part of the Worker entrypoint. If a Node local server is still useful, it should be split into a separate local entrypoint rather than mixed with the Worker export.

## Database Runtime

Convert the runtime database layer from Postgres to D1:

- Use `drizzle-orm/d1` for Worker runtime.
- Read `DB` from Cloudflare Worker bindings through the env package.
- Configure Better Auth with `provider: "sqlite"`.
- Keep repository exports and application service boundaries stable where possible.

The DB package should avoid importing Node-only modules in Worker paths. Any local import/export tooling that talks to Postgres can live in scripts or dev-only modules.

## Schema And Migrations

Create D1/SQLite-compatible Drizzle schema and migrations for the current domain tables and Better Auth tables.

Schema conversion rules:

- Replace `pg-core` table/column builders with SQLite-compatible builders.
- Store timestamps in a consistent D1-friendly format and adapt date comparisons accordingly.
- Replace Postgres serial/identity behavior with SQLite-compatible values.
- Preserve IDs, customer names, financial integer amounts, currencies, statuses, relationships, and nullable behavior.
- Add indexes needed by existing reads before cutover.

Initial index candidates:

- `appointment.starts_at`
- `appointment.client_id`
- `appointment.master_id`
- `transaction.appointment_id`
- `transaction.customer_id`
- `hair_assigned.sold_at`
- `hair_assigned.client_id`
- `hair_assigned.appointment_id`
- `note.customer_id`
- `bank_statement_attachment.bank_statement_entry_id`
- `bank_statement_entry.bank_account_id`

## Query Compatibility

Replace Postgres-specific SQL with SQLite/D1-compatible expressions:

- `ilike` becomes normalized `LIKE` using `lower(column)` and a lowercased escaped search pattern.
- `extract(month from date)` becomes SQLite date extraction such as `strftime`.
- Postgres casts like `::int` become SQLite-compatible casts or application-side number conversion.
- Date range filters must compare the stored timestamp format consistently.
- SQL snippets that reference Postgres table names or cast syntax must be reviewed.

Dashboard stats, paginated list counts, customer detail queries, document matching, and reports are the highest-risk query areas and should be verified explicitly.

## Data Migration

Use the existing R2 backup workflow as the source:

1. Run `./scripts/restore_postgres.sh` to restore the latest R2 Postgres dump into local Postgres.
2. Run a dedicated export script against local Postgres.
3. Transform rows into D1-compatible types and order them by dependency.
4. Import into local D1 first.
5. Run app smoke tests against local D1.
6. Import into remote D1 only after local verification passes.

The migration should not attempt to import the raw Postgres dump directly into D1. The dump contains Postgres-specific DDL, ownership, schema, and type behavior.

Auth users should be migrated. Existing sessions will not be preserved; logging in again after cutover is acceptable.

## R2 And Files

Document upload storage should continue to use R2. The Worker deployment needs either an R2 binding or equivalent S3-compatible configuration, depending on which approach best fits the current upload code.

If moving from S3-compatible env credentials to native R2 bindings reduces Worker complexity, prefer bindings, but keep the repository/application service contract stable.

## Configuration

Add Wrangler configuration without custom domains:

- Worker name for the API server.
- Compatibility date and Node compatibility only if required by dependencies.
- D1 binding `DB`.
- R2 binding or upload env/secrets.
- Secret bindings for `BETTER_AUTH_SECRET`.
- Plain env bindings for `BETTER_AUTH_URL`, `CORS_ORIGIN`, and any generated deployment URLs.

The generated server URL and generated web URL must be reflected in auth and CORS settings before smoke testing.

## Deployment Flow

The first production deployment should be staged behind generated Cloudflare URLs:

1. Create D1 database.
2. Apply D1 migrations.
3. Import verified data into D1.
4. Deploy Worker server.
5. Deploy web app.
6. Configure generated URLs for `BETTER_AUTH_URL` and `CORS_ORIGIN`.
7. Smoke test login, dashboard, customers, appointments, cash, legal entities, documents, and uploads if used.
8. Keep VPS live until Cloudflare verification passes.

Custom domain, DNS, and final VPS shutdown are separate follow-up work.

## Observability

Use Cloudflare D1 analytics and Worker logs to monitor:

- D1 rows read/written.
- Query count.
- Worker errors.
- Auth failures.
- Slow tRPC procedures.

Add lightweight procedure-level timing logs if Cloudflare-level D1 metrics are not specific enough to locate high-read pages.

## Testing

Required verification before cutover:

- `vp check`
- `vp test`
- D1 migration against local D1
- Postgres-to-D1 import from the restored local backup
- Worker local dev smoke test
- Remote Worker/web smoke test after deployment

Focused manual smoke paths:

- Login and logout.
- Dashboard stats.
- Customers list, search, create, update.
- Customer detail tabs.
- Calendar and appointments.
- Cash transactions.
- Legal entities, bank accounts, reports.
- Documents and R2 upload/download if production uses them.

## Risks

The largest risks are SQL compatibility differences, timestamp behavior, Better Auth schema/session differences, and incomplete data import ordering. These should be addressed by converting schema and queries first, then importing into local D1 and comparing row counts plus key page outputs against local Postgres.

D1 read volume is not a blocker for the current single-user dataset, but dashboard and count queries should still receive indexes during migration so the app does not inherit avoidable full-table scans.

## Out Of Scope

- Custom domain attachment.
- VPS shutdown.
- Changing app UX.
- Replacing tRPC.
- Replacing R2.
- Preserving active sessions.
- Direct raw Postgres dump import into D1.
