# Cloudflare D1 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy `prive-admin` to Cloudflare using Wrangler, Workers, D1, and R2, with production data migrated from the existing R2 Postgres backup.

**Architecture:** Convert the server runtime from Node/Postgres to Cloudflare Worker/D1 while keeping the existing Hono/tRPC/application-service boundaries. Use local Postgres only as the migration source after `./scripts/restore_postgres.sh`, then import transformed rows into local and remote D1. Deploy first on generated Cloudflare domains; custom domains and VPS shutdown remain follow-up work.

**Tech Stack:** Vite+, Wrangler, Cloudflare Workers, Cloudflare D1, Cloudflare R2, Hono, tRPC, Drizzle ORM, Better Auth, React, TanStack Router, TanStack Query.

## Global Constraints

- Run `vp install` before implementation work and before validation.
- Run `vp check` and `vp test` before claiming the migration branch is ready.
- Use direct Wrangler configuration, not Alchemy.
- Use generated `workers.dev`/Cloudflare URLs first; custom domain attachment is out of scope.
- Migrate to D1 immediately, not via temporary hosted Postgres.
- Use the latest R2 Postgres backup restored locally by `./scripts/restore_postgres.sh` as the data source.
- Do not import raw Postgres dump SQL into D1.
- Migrate auth users; do not preserve active sessions.
- Keep tRPC and the current application service/repository boundaries.
- Continue using R2 for uploads/documents.

---

## File Structure

- `apps/server/src/app.ts`: shared Hono app factory or app instance with routes/middleware.
- `apps/server/src/index.ts`: Worker-compatible default export for Cloudflare.
- `apps/server/src/node.ts`: optional Node local server entrypoint if local Node serving remains useful.
- `apps/server/wrangler.jsonc`: Worker config, D1 binding, R2 binding/env/secrets references.
- `apps/web/wrangler.jsonc`: static asset deployment config for generated Cloudflare URL.
- `packages/env/src/server.ts`: Worker binding-backed server env typing and access.
- `packages/env/src/server-node.ts`: optional Node/script env loader for migration tooling.
- `packages/env/env.d.ts`: Cloudflare binding types.
- `packages/db/src/index.ts`: D1 Drizzle runtime entry.
- `packages/db/src/schema/*.ts`: SQLite/D1 schema definitions replacing Postgres builders.
- `packages/db/src/migrations/*.sql`: D1-compatible migrations.
- `packages/db/drizzle.config.ts`: SQLite/D1-aware Drizzle config for migrations.
- `packages/auth/src/index.ts`: Better Auth SQLite adapter configuration and Worker-safe auth construction.
- `packages/db/src/repositories/*.ts`: query compatibility changes from Postgres SQL to SQLite/D1 SQL.
- `scripts/export_postgres_for_d1.ts`: reads restored local Postgres and writes deterministic D1 import data.
- `scripts/import_d1.ts`: imports transformed data into local or remote D1.
- `scripts/verify_d1_import.ts`: compares source Postgres counts and imported D1 counts.
- `docs/deploy/cloudflare-d1.md`: deployment and cutover runbook.

### Task 1: Baseline And Cloudflare Runtime Split

**Files:**
- Modify: `apps/server/src/index.ts`
- Create: `apps/server/src/app.ts`
- Create: `apps/server/src/node.ts`
- Create: `apps/server/wrangler.jsonc`
- Create: `apps/web/wrangler.jsonc`
- Modify: `apps/server/package.json`
- Modify: `apps/web/package.json`
- Modify: `package.json`

**Interfaces:**
- Produces: `app` as a Hono instance exported from `apps/server/src/app.ts`.
- Produces: Worker default export in `apps/server/src/index.ts` with `fetch: app.fetch`.
- Produces: `server:dev:worker`, `server:deploy`, `web:deploy`, and `cloudflare:deploy` scripts.

- [ ] **Step 1: Run setup baseline**

Run:

```bash
vp install
vp check
vp test
```

Expected: existing baseline passes or any existing failures are recorded before code changes.

- [ ] **Step 2: Split the Hono app from Node serving**

Move the current Hono setup from `apps/server/src/index.ts` into `apps/server/src/app.ts`:

```ts
import { trpcServer } from "@hono/trpc-server"
import { createContext } from "@prive-admin-tanstack/api/context"
import { apiRoutes } from "@prive-admin-tanstack/api/http"
import { appRouter } from "@prive-admin-tanstack/api/routers"
import { auth } from "@prive-admin-tanstack/auth"
import { env } from "@prive-admin-tanstack/env/server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"

export const app = new Hono()

app.use(logger())
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
)

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
app.route("/api", apiRoutes)
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => createContext({ context }),
  }),
)
app.get("/", (c) => c.text("OK"))
```

- [ ] **Step 3: Make the Worker entrypoint default-export the app**

Replace `apps/server/src/index.ts` with:

```ts
import { app } from "./app"

export default app
```

- [ ] **Step 4: Preserve optional Node local serving**

Create `apps/server/src/node.ts`:

```ts
import { serve } from "@hono/node-server"

import { app } from "./app"

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
```

- [ ] **Step 5: Create initial local Wrangler configs**

Create `apps/server/wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "prive-admin-server",
  "main": "src/index.ts",
  "compatibility_date": "2026-08-01",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "CORS_ORIGIN": "http://localhost:5173",
    "BETTER_AUTH_URL": "http://localhost:3000",
    "NODE_ENV": "development"
  }
}
```

Create `apps/web/wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "prive-admin-web",
  "compatibility_date": "2026-08-01",
  "assets": {
    "directory": "dist",
    "not_found_handling": "single-page-application"
  }
}
```

Do not add D1 or R2 resource IDs in this task. Add those only after the real Cloudflare resources are created in Task 8.

- [ ] **Step 6: Add scripts**

Update scripts so local Node dev remains available and Worker deploys are explicit:

```json
{
  "dev": "tsx watch src/node.ts",
  "dev:worker": "wrangler dev",
  "deploy": "wrangler deploy"
}
```

At the repo root, add:

```json
{
  "server:dev:worker": "vp run --filter server dev:worker",
  "server:deploy": "vp run --filter server deploy",
  "web:deploy": "vp run --filter web build && vp run --filter web deploy",
  "cloudflare:deploy": "vp run server:deploy && vp run web:deploy"
}
```

- [ ] **Step 7: Validate runtime split**

Run:

```bash
vp run --filter server check-types
vp check
```

Expected: type checking and formatting pass after the split.

- [ ] **Step 8: Commit**

```bash
git add apps/server/src/app.ts apps/server/src/index.ts apps/server/src/node.ts apps/server/wrangler.jsonc apps/web/wrangler.jsonc apps/server/package.json apps/web/package.json package.json
git commit -m "build: add cloudflare worker runtime scaffold"
```

### Task 2: Worker Environment And D1 Runtime

**Files:**
- Modify: `packages/env/src/server.ts`
- Create: `packages/env/src/server-node.ts`
- Create: `packages/env/env.d.ts`
- Modify: `packages/db/src/index.ts`
- Modify: `packages/auth/src/index.ts`
- Modify: `packages/env/package.json`
- Modify: `packages/db/package.json`
- Modify: `packages/auth/package.json`

**Interfaces:**
- Produces: Worker env access from `@prive-admin-tanstack/env/server`.
- Produces: `createDb(database?: D1Database)` returning Drizzle D1 database.
- Produces: Better Auth configured with Drizzle adapter `provider: "sqlite"`.

- [ ] **Step 1: Write env type definitions**

Create `packages/env/env.d.ts`:

```ts
interface CloudflareEnv {
  DB: D1Database
  UPLOADS_BUCKET: R2Bucket
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  CORS_ORIGIN: string
  NODE_ENV?: "development" | "production" | "test"
}
```

- [ ] **Step 2: Replace Worker server env access**

Update `packages/env/src/server.ts`:

```ts
/// <reference types="@cloudflare/workers-types" />
import type {} from "../env"

export { env } from "cloudflare:workers"
```

- [ ] **Step 3: Move Node script env loading to a separate module**

Create `packages/env/src/server-node.ts`:

```ts
import { createEnv } from "@t3-oss/env-core"
import dotenv from "dotenv"
import { expand } from "dotenv-expand"
import { z } from "zod"

expand(dotenv.config({ quiet: true }))

export const nodeEnv = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    R2_ENDPOINT: z.url().optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_FORCE_PATH_STYLE: z
      .enum(["true", "false"])
      .default("false")
      .transform((v) => v === "true"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
```

- [ ] **Step 4: Convert DB entry to D1**

Update `packages/db/src/index.ts`:

```ts
import { env } from "@prive-admin-tanstack/env/server"
import { drizzle } from "drizzle-orm/d1"

import * as schema from "./schema"

export function createDb(database: D1Database = env.DB) {
  return drizzle(database, { schema })
}

export const db = createDb()

export type Db = ReturnType<typeof createDb>
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0]

export * from "./repositories"
export { whereActiveLegalEntity } from "./scope"
```

- [ ] **Step 5: Convert Better Auth adapter provider**

Update `packages/auth/src/index.ts` so the adapter uses SQLite:

```ts
database: drizzleAdapter(db, {
  provider: "sqlite",
  schema: schema,
}),
```

Keep `disableSignUp: true`, `trustedOrigins`, `secret`, and `baseURL`.

- [ ] **Step 6: Update dependencies**

Remove Node Postgres runtime dependencies from Worker runtime packages where no longer used:

```bash
vp install
```

If `pg` and `@types/pg` are still only needed by migration scripts, keep them in the root or script package dev dependencies instead of Worker runtime dependencies.

- [ ] **Step 7: Validate types**

Run:

```bash
vp run --filter @prive-admin-tanstack/env check-types
vp run --filter @prive-admin-tanstack/db check-types
vp run --filter @prive-admin-tanstack/auth check-types
```

Expected: remaining failures identify schema conversion work for Task 3.

- [ ] **Step 8: Commit**

```bash
git add packages/env packages/db/src/index.ts packages/auth/src/index.ts packages/env/package.json packages/db/package.json packages/auth/package.json package.json pnpm-lock.yaml
git commit -m "refactor: switch server runtime env to cloudflare"
```

### Task 3: Convert Drizzle Schema And Migrations To D1

**Files:**
- Modify: `packages/db/src/schema/auth.ts`
- Modify: `packages/db/src/schema/*.ts`
- Modify: `packages/db/src/schema/relations.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/drizzle.config.ts`
- Replace: `packages/db/src/migrations/*.sql`
- Replace: `packages/db/src/migrations/meta/*`
- Modify: schema tests in `packages/db/src/*schema*.test.ts`

**Interfaces:**
- Produces: SQLite/D1 schema exports with the same table export names currently consumed by repositories.
- Produces: D1 migrations runnable by `wrangler d1 migrations apply`.

- [ ] **Step 1: Convert auth schema**

Use `drizzle-orm/sqlite-core` builders:

```ts
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core"

export const user = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})
```

Apply the same pattern for `sessions`, `accounts`, and `verifications`, keeping indexes on user and verification identifiers.

- [ ] **Step 2: Convert domain schemas**

For each current `pgTable`, replace with `sqliteTable`; for timestamps use one consistent mode:

```ts
createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
```

For dates without time, use `text("placed_at")` or `text("date")` with ISO `YYYY-MM-DD` values. For money and weights, keep integer columns.

- [ ] **Step 3: Replace serial UID behavior**

For `hair_order.uid`, use an integer column and preserve imported UID values:

```ts
uid: integer("uid").notNull().unique()
```

For new rows after cutover, add repository logic in the hair order create path to compute `max(uid) + 1` inside a transaction.

- [ ] **Step 4: Add read indexes**

Add indexes in schema definitions:

```ts
(table) => [
  index("appointment_starts_at_idx").on(table.startsAt),
  index("appointment_client_id_idx").on(table.clientId),
  index("appointment_master_id_idx").on(table.masterId),
]
```

Apply equivalent indexes for `transaction.appointmentId`, `transaction.customerId`, `hairAssigned.soldAt`, `hairAssigned.clientId`, `hairAssigned.appointmentId`, `note.customerId`, `bankStatementAttachment.bankStatementEntryId`, and `bankStatementEntry.bankAccountId`.

- [ ] **Step 5: Generate D1 migrations**

Update `packages/db/drizzle.config.ts` to use SQLite dialect for D1 migrations and generate fresh migrations:

```bash
vp run --filter @prive-admin-tanstack/db db:generate
```

Expected: generated SQL contains SQLite-compatible `CREATE TABLE` and `CREATE INDEX` statements, not Postgres DDL.

- [ ] **Step 6: Run schema tests**

Run:

```bash
vp run --filter @prive-admin-tanstack/db test
```

Expected: tests either pass or fail only where repository SQL still requires Task 4 compatibility work.

- [ ] **Step 7: Commit**

```bash
git add packages/db/src/schema packages/db/src/migrations packages/db/drizzle.config.ts packages/db/src/*schema*.test.ts
git commit -m "refactor: convert database schema to d1"
```

### Task 4: Convert Repository Queries To SQLite/D1

**Files:**
- Modify: `packages/db/src/repositories/dashboard.ts`
- Modify: `packages/db/src/repositories/customers.ts`
- Modify: `packages/db/src/repositories/reports.ts`
- Modify: `packages/db/src/repositories/bank-statement-entries.ts`
- Modify: `packages/db/src/repositories/hair.ts`
- Modify: other `packages/db/src/repositories/*.ts` files reported by `rg "ilike|extract\\(|::|timestamptz|now\\(" packages/db/src`
- Modify: related repository tests

**Interfaces:**
- Produces: `likeInsensitive(column, search)` helper if repeated case-insensitive search logic is needed.
- Produces: dashboard monthly row functions that return the existing application service shapes.

- [ ] **Step 1: Locate incompatible SQL**

Run:

```bash
rg "ilike|extract\\(|::|timestamptz|ILIKE|regexp|serial|returning\\(" packages/db/src packages/application/src packages/api/src
```

Expected: a finite list of repository and schema locations to convert.

- [ ] **Step 2: Replace case-insensitive search**

In repositories currently using `ilike`, use lowercased `LIKE`:

```ts
import { sql } from "drizzle-orm"

function containsInsensitive(column: SQL.Aliased | SQL | AnyColumn, value: string) {
  return sql<boolean>`lower(${column}) like ${`%${escapeLikePattern(value).toLowerCase()}%`} escape '\\'`
}
```

Use it in customer search:

```ts
const where = filter.search
  ? or(
      containsInsensitive(customer.name, filter.search),
      containsInsensitive(customer.phoneNumber, filter.search),
    )
  : undefined
```

- [ ] **Step 3: Replace dashboard month extraction**

Update dashboard monthly SQL to SQLite:

```ts
month: sql<number>`cast(strftime('%m', ${appointment.startsAt}) as integer)`,
```

and group by the same expression:

```ts
.groupBy(transaction.currency, sql`strftime('%m', ${appointment.startsAt})`)
```

Apply the equivalent `strftime('%m', ${hairAssigned.soldAt})` conversion for hair stats.

- [ ] **Step 4: Replace numeric casts**

Change Postgres-style casts:

```ts
sql<number>`coalesce(sum(${transaction.amount}), 0)::int`
```

to SQLite-compatible casts:

```ts
sql<number>`cast(coalesce(sum(${transaction.amount}), 0) as integer)`
```

- [ ] **Step 5: Validate list/count repositories**

Run focused tests:

```bash
vp run --filter @prive-admin-tanstack/db test -- customers dashboard reports bank-statement
vp run --filter @prive-admin-tanstack/application test -- customers dashboard reports
vp run --filter @prive-admin-tanstack/api test -- customers dashboard reports
```

Expected: repository, service, and router behavior remains compatible with existing response shapes.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/repositories packages/db/src/*.test.ts packages/application/src/services/*.test.ts packages/api/src/routers/*.test.ts
git commit -m "fix: make repository queries d1 compatible"
```

### Task 5: R2 Upload Runtime On Workers

**Files:**
- Modify: `packages/application/src/r2.ts`
- Modify: `packages/application/src/services/uploads.ts`
- Modify: `packages/api/src/http/uploads.ts`
- Modify: `packages/api/src/http/statement-attachments.ts`
- Modify: `packages/env/env.d.ts`
- Modify: `apps/server/wrangler.jsonc`

**Interfaces:**
- Produces: upload/download service functions that use Worker `R2Bucket` binding when running on Cloudflare.
- Preserves: current API routes for uploads and statement attachment file access.

- [ ] **Step 1: Inspect current R2 API usage**

Run:

```bash
sed -n '1,220p' packages/application/src/r2.ts
sed -n '1,260p' packages/application/src/services/uploads.ts
sed -n '1,260p' packages/api/src/http/uploads.ts
```

Expected: identify all S3 client operations used today.

- [ ] **Step 2: Replace S3 client calls with R2 binding calls**

Use `env.UPLOADS_BUCKET.put`, `env.UPLOADS_BUCKET.get`, and signed/private route responses instead of Node AWS client calls in Worker code:

```ts
const object = await env.UPLOADS_BUCKET.get(key)
if (!object) throw notFound("File not found")
return new Response(object.body, {
  headers: {
    "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
  },
})
```

- [ ] **Step 3: Keep object keys stable**

Preserve current `r2Key` values stored in `bank_statement_attachment` so migrated rows still point to existing objects.

- [ ] **Step 4: Test upload route types**

Run:

```bash
vp run --filter @prive-admin-tanstack/application test -- uploads bank-statement-attachments
vp run --filter @prive-admin-tanstack/api test -- bank-statement-attachments
```

Expected: service behavior remains compatible; Worker runtime has no Node-only AWS SDK dependency.

- [ ] **Step 5: Commit**

```bash
git add packages/application/src/r2.ts packages/application/src/services/uploads.ts packages/api/src/http/uploads.ts packages/api/src/http/statement-attachments.ts packages/env/env.d.ts apps/server/wrangler.jsonc
git commit -m "refactor: use r2 bindings for worker uploads"
```

### Task 6: Postgres-To-D1 Import Pipeline

**Files:**
- Create: `scripts/export_postgres_for_d1.ts`
- Create: `scripts/import_d1.ts`
- Create: `scripts/verify_d1_import.ts`
- Modify: `package.json`
- Modify: `packages/db/package.json`
- Create or modify: import pipeline tests if script helpers are factored into testable modules

**Interfaces:**
- Produces: `vp run d1:export-from-postgres`.
- Produces: `vp run d1:import:local`.
- Produces: `vp run d1:verify-import`.
- Produces: deterministic JSONL or SQL import files under `.tmp/d1-import/`, ignored by git.

- [ ] **Step 1: Add import output ignore**

Add to `.gitignore` if missing:

```gitignore
.tmp/
```

- [ ] **Step 2: Export dependency-ordered data from Postgres**

Create `scripts/export_postgres_for_d1.ts` that connects using `DATABASE_URL` from `packages/env/src/server-node.ts` and writes tables in dependency order:

```ts
const tableOrder = [
  "users",
  "accounts",
  "sessions",
  "verifications",
  "customer",
  "legal_entity",
  "salon",
  "bank_account",
  "appointment",
  "hair_order",
  "hair_assigned",
  "transaction",
  "note",
  "cash_transaction",
  "bank_statement_entry",
  "bank_statement_attachment",
] as const
```

For each row, convert `Date` values to the timestamp representation selected in Task 3 and preserve IDs.

- [ ] **Step 3: Import into D1**

Create `scripts/import_d1.ts` that reads the export output and inserts rows in order using Wrangler:

```bash
wrangler d1 execute prive-admin-d1 --local --file .tmp/d1-import/import.sql
```

For remote import, use the same command without `--local` after local verification passes.

- [ ] **Step 4: Verify counts**

Create `scripts/verify_d1_import.ts` that compares row counts for all migrated tables between Postgres and D1. It should fail with a non-zero exit code and a table-specific message on mismatch:

```text
count mismatch for customer: postgres=156 d1=155
```

- [ ] **Step 5: Add scripts**

Add root scripts:

```json
{
  "d1:export-from-postgres": "tsx scripts/export_postgres_for_d1.ts",
  "d1:import:local": "tsx scripts/import_d1.ts --local",
  "d1:import:remote": "tsx scripts/import_d1.ts --remote",
  "d1:verify-import": "tsx scripts/verify_d1_import.ts"
}
```

- [ ] **Step 6: Run import pipeline locally**

Run:

```bash
./scripts/restore_postgres.sh
vp run d1:export-from-postgres
vp run d1:import:local
vp run d1:verify-import
```

Expected: local D1 contains matching row counts for all migrated tables.

- [ ] **Step 7: Commit**

```bash
git add .gitignore scripts/export_postgres_for_d1.ts scripts/import_d1.ts scripts/verify_d1_import.ts package.json packages/db/package.json
git commit -m "feat: add postgres to d1 import pipeline"
```

### Task 7: Local Worker Smoke And UI Compatibility

**Files:**
- Modify: `apps/web/src/utils/trpc.ts`
- Modify: `apps/web/.env.example` if present or create it if this repo uses examples
- Modify: affected route data modules only if server URL handling changes
- Create: `/private/tmp/prive-admin-cloudflare-smoke.mjs` during validation only

**Interfaces:**
- Produces: web app configured to call the generated/local Worker server URL.
- Preserves: same route/component data ownership rules.

- [ ] **Step 1: Confirm client server URL behavior**

Inspect `apps/web/src/utils/trpc.ts`. If the app is no longer served from the same origin as `/trpc`, update the URL to read `VITE_SERVER_URL`:

```ts
url: `${import.meta.env.VITE_SERVER_URL ?? ""}/trpc`,
```

- [ ] **Step 2: Run Worker server locally**

Run:

```bash
vp run server:dev:worker
```

Expected: Wrangler dev starts the server with local D1 binding.

- [ ] **Step 3: Run web locally against Worker server**

Run in a separate session:

```bash
vp run dev:web
```

Set `VITE_SERVER_URL` to the local Worker URL if cross-origin mode is required.

- [ ] **Step 4: Smoke core routes**

Use browser automation or a manual browser session to check:

```text
/login
/dashboard
/customers
/calendar
/cash
/legal-entities
/documents
```

Expected: login works after re-authentication; dashboard and customers read from D1; no route throws a server error.

- [ ] **Step 5: Validate full repo**

Run:

```bash
vp check
vp test
```

Expected: all checks pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/utils/trpc.ts apps/web/.env.example
git commit -m "fix: support cloudflare worker api origin"
```

Skip committing if no file changes were needed.

### Task 8: Remote Cloudflare Provisioning And Deployment

**Files:**
- Modify: `apps/server/wrangler.jsonc`
- Modify: `apps/web/wrangler.jsonc`
- Create: `docs/deploy/cloudflare-d1.md`
- Modify: `README.md` if deploy docs are linked there

**Interfaces:**
- Produces: remote D1 database ID and R2 bucket binding in Wrangler config.
- Produces: generated Cloudflare server and web URLs documented in the runbook.
- Produces: repeatable deploy commands.

- [ ] **Step 1: Create remote D1 database**

Run:

```bash
wrangler d1 create prive-admin-d1
```

Copy the returned `database_id` exactly into `apps/server/wrangler.jsonc`.

- [ ] **Step 2: Add D1 and R2 bindings**

Read the existing R2 bucket name from 1Password:

```bash
op read 'op://prive-admin/Cloudflare R2/bucket-name'
```

Update `apps/server/wrangler.jsonc` with `d1_databases[0].binding` set to `DB`, `d1_databases[0].database_name` set to `prive-admin-d1`, `d1_databases[0].database_id` set to the exact ID returned in Step 1, and `d1_databases[0].migrations_dir` set to `../../packages/db/src/migrations`.

Add `r2_buckets[0].binding` as `UPLOADS_BUCKET` and `r2_buckets[0].bucket_name` as the exact bucket name returned by `op read`.

- [ ] **Step 3: Configure secrets**

Run:

```bash
wrangler secret put BETTER_AUTH_SECRET --config apps/server/wrangler.jsonc
```

Deploy the server once to get the generated server URL:

```bash
vp run server:deploy
```

Set `BETTER_AUTH_URL` to that generated server URL. Deploy the web app once to get the generated web URL:

```bash
vp run web:deploy
```

Set `CORS_ORIGIN` to that generated web URL. The final production `vars` block must contain the real generated Cloudflare URLs printed by Wrangler, and `NODE_ENV` must be `production`.

- [ ] **Step 4: Apply remote D1 migrations**

Run:

```bash
wrangler d1 migrations apply prive-admin-d1 --remote --config apps/server/wrangler.jsonc
```

- [ ] **Step 5: Import verified data remotely**

Run:

```bash
vp run d1:import:remote
```

Expected: import completes without row count mismatches.

- [ ] **Step 6: Deploy server and web**

Run:

```bash
vp run server:deploy
vp run web:deploy
```

Record the generated URLs.

- [ ] **Step 7: Smoke remote deployment**

Check:

```text
server /
server /api/auth/session
web /login
web /dashboard
web /customers
```

Expected: generated Cloudflare URLs work; login requires a fresh session; core pages load from remote D1.

- [ ] **Step 8: Write runbook**

Create `docs/deploy/cloudflare-d1.md` with:

```md
# Cloudflare D1 Deployment

## Resources

- Server Worker: `prive-admin-server`
- Web Worker/assets: `prive-admin-web`
- D1 database: `prive-admin-d1`
- Upload bucket binding: `UPLOADS_BUCKET`

## First Deploy

1. Restore latest Postgres backup locally with `./scripts/restore_postgres.sh`.
2. Run `vp run d1:export-from-postgres`.
3. Run `vp run d1:import:local`.
4. Run `vp run d1:verify-import`.
5. Apply remote D1 migrations.
6. Run `vp run d1:import:remote`.
7. Run `vp run server:deploy`.
8. Run `vp run web:deploy`.

## Validation

- Login with an existing user.
- Open dashboard and customers.
- Verify Cloudflare D1 row metrics after smoke testing.

## Follow-Up

- Attach custom domain.
- Disable VPS only after production validation.
```

- [ ] **Step 9: Final validation and commit**

Run:

```bash
vp check
vp test
```

Commit:

```bash
git add apps/server/wrangler.jsonc apps/web/wrangler.jsonc docs/deploy/cloudflare-d1.md README.md
git commit -m "docs: add cloudflare d1 deployment runbook"
```

### Task 9: Final Review And Cutover Readiness

**Files:**
- Modify: no code expected unless verification finds issues
- Create: final smoke notes in `docs/deploy/cloudflare-d1.md` if useful

**Interfaces:**
- Produces: branch ready for review with known remote URLs and validation results.

- [ ] **Step 1: Inspect D1 usage after smoke**

Use Cloudflare dashboard or Wrangler/GraphQL metrics to record:

```text
D1 rows read
D1 rows written
Worker errors
Worker requests
```

Expected: no unexpected high-read query for dashboard/customers at current dataset size.

- [ ] **Step 2: Run final checks**

Run:

```bash
vp check
vp test
git status --short
```

Expected: checks pass and worktree is clean after commits.

- [ ] **Step 3: Prepare PR**

Use conventional commit title:

```text
feat: migrate deployment to cloudflare d1
```

PR summary should include:

```md
## Summary
- adds Wrangler-based Cloudflare Worker/static deployment
- converts database runtime and schema to D1
- adds Postgres backup to D1 import pipeline
- documents generated-domain deployment flow

## Validation
- vp check
- vp test
- local D1 import verification
- remote Cloudflare smoke test
```
