# Multi Legal Entity + Salon Tenancy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `legal_entity` (UK Ltd, LT IV, LT MB) and `salon` as first-class entities, scope `appointment` / `transaction` / `hair_order` to a legal entity, add a topbar legal-entity switcher driving filtered list views, and migrate existing data into UK Ltd + Prive UK salon.

**Architecture:** Drizzle/Postgres schema additions (two new tables + nullable columns on existing tables → backfill → NOT NULL + CHECK + indexes inside one migration file). New shared scope helper applied in every list/aggregate server function for the three scoped tables. New server function modules for `legal-entities` and `salons`. UI: Mantine `Select` switcher in `_authenticated` layout, persisted via `user_settings`; create/edit forms gain salon and/or legal entity pickers; new `/legal-entities` and `/salons` routes for CRUD.

**Tech Stack:** TanStack Start (server functions), Drizzle ORM, Postgres, Mantine UI, Zod, better-auth, Bun, Turborepo. Add Vitest to `packages/db` for the scope helper unit test (the project currently has no test framework; this plan introduces one only for the package that needs it).

**Spec:** [`docs/superpowers/specs/2026-05-03-multi-legal-entity-design.md`](../specs/2026-05-03-multi-legal-entity-design.md).

**Branch:** Implementation work happens on a new branch `feat/multi-legal-entity` (not the spec branch). Each commit is per-task.

---

## File Map

**New files:**
- `packages/db/src/schema/legal-entity.ts` — `legalEntity` table.
- `packages/db/src/schema/salon.ts` — `salon` table.
- `packages/db/src/scope.ts` — `whereActiveLegalEntity` query helper.
- `packages/db/src/scope.test.ts` — unit test for the scope helper.
- `packages/db/vitest.config.ts` — Vitest config.
- `packages/db/src/migrations/0002_multi_legal_entity.sql` — combined DDL + seed + backfill + tighten migration.
- `apps/web/src/functions/legal-entities.ts` — list/get/update server functions.
- `apps/web/src/functions/salons.ts` — list/get/create/update server functions.
- `apps/web/src/functions/get-active-legal-entity.ts` — resolve active LE for the current user.
- `apps/web/src/components/legal-entity-switcher.tsx` — topbar `Select` component + filter banner.
- `apps/web/src/routes/_authenticated/legal-entities/index.tsx` — list + edit page.
- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId.tsx` — detail/edit form.
- `apps/web/src/routes/_authenticated/legal-entities/route.tsx` — sub-route layout (or omit if not needed).
- `apps/web/src/routes/_authenticated/salons/index.tsx` — list + create page.
- `apps/web/src/routes/_authenticated/salons/$salonId.tsx` — detail/edit form.
- `apps/web/src/routes/_authenticated/salons/route.tsx` — sub-route layout (or omit).

**Modified files:**
- `packages/db/src/schema/appointment.ts` — add `salonId`, `legalEntityId`.
- `packages/db/src/schema/transaction.ts` — add `legalEntityId`.
- `packages/db/src/schema/hair.ts` — add `legalEntityId` to `hairOrder`.
- `packages/db/src/schema/user-settings.ts` — add `activeLegalEntityId`.
- `packages/db/src/schema/relations.ts` — add `legalEntity` / `salon` relations.
- `packages/db/src/schema/index.ts` — re-export new schema modules.
- `packages/db/package.json` — add `test` script + `vitest` devDep.
- `apps/web/src/lib/schemas.ts` — extend Zod schemas for appointment/hair-order; add legal-entity + salon schemas.
- `apps/web/src/lib/legal-entity.ts` — country/type/currency constants used by UI + server.
- `apps/web/src/functions/appointments.ts` — country validation, LE scoping in list, salon+LE on create/update.
- `apps/web/src/functions/transactions.ts` — LE scoping in list/get-by-appointment, LE on create/update.
- `apps/web/src/functions/hair-orders.ts` — LE scoping in list/get, LE on create/update.
- `apps/web/src/functions/dashboard.ts` — LE filter on stats queries.
- `apps/web/src/functions/user-settings.ts` — add `setActiveLegalEntity` mutation; extend `getUserSettings` to return `activeLegalEntityId`.
- `apps/web/src/routes/_authenticated/route.tsx` — mount the legal-entity switcher in the topbar.
- `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx` — salon + LE picker on edit.
- `apps/web/src/routes/_authenticated/appointments/index.tsx` — column/badge for LE; banner for active filter.
- `apps/web/src/routes/_authenticated/hair-orders/$hairOrderId.tsx` — LE picker on edit.
- `apps/web/src/routes/_authenticated/hair-orders/index.tsx` — column/badge for LE; banner.
- `apps/web/src/components/transactions/...` — LE picker in transaction form (exact path discovered in Task 13).

---

## Conventions used by this plan

- **Currency:** integers in minor units (cents/pence). Already established in this codebase.
- **IDs:** `text` primary keys via `createId()` from `@paralleldrive/cuid2`.
- **Country codes:** ISO-3166-1 alpha-2 — `'GB'`, `'LT'`.
- **Legal entity types:** `'LTD' | 'IV' | 'MB'`.
- **Default currencies:** `LTD` → `'GBP'`, `IV` / `MB` → `'EUR'`.
- **"All" mode:** `user_settings.active_legal_entity_id IS NULL`.
- **Commit style:** Conventional Commits, scoped (`db`, `web`, `infra`). Never commit to `main`. Commit after every task.

---

## Pre-flight

- [ ] **Step 0.1: Create the implementation branch from the spec branch**

```bash
cd /Users/mselvenis/dev/prive-admin
git fetch origin
git checkout main
git pull --ff-only
git checkout -b feat/multi-legal-entity
```

Expected: `Switched to a new branch 'feat/multi-legal-entity'`.

- [ ] **Step 0.2: Make sure dev DB is running and migrations are clean**

```bash
bun install
bun run db:start
bun run db:migrate
```

Expected: `[db] Migrations complete.`

---

## Task 1: Add Vitest to `packages/db`

**Files:**
- Modify: `packages/db/package.json`
- Create: `packages/db/vitest.config.ts`
- Modify: `turbo.json`

The scope helper is the only piece small and pure enough to deserve a unit test. Add Vitest only here.

- [ ] **Step 1.1: Add Vitest as a dev dependency**

```bash
cd packages/db
bun add -d vitest@^3.2.4
```

- [ ] **Step 1.2: Create `packages/db/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
})
```

- [ ] **Step 1.3: Add a `test` script to `packages/db/package.json`**

In the `scripts` object, add `"test": "vitest run"` and `"test:watch": "vitest"`.

- [ ] **Step 1.4: Add a `test` task to `turbo.json`**

In the `tasks` object of `turbo.json`, add (or extend if it already exists):

```json
"test": {
  "dependsOn": ["^build"],
  "outputs": []
}
```

- [ ] **Step 1.5: Verify the test runner runs (with no tests yet)**

```bash
cd /Users/mselvenis/dev/prive-admin
bun run --filter @prive-admin-tanstack/db test
```

Expected: `No test files found, exiting with code 0` or similar (Vitest's empty-suite output). Non-zero exit fails the task.

- [ ] **Step 1.6: Commit**

```bash
git add packages/db/package.json packages/db/vitest.config.ts packages/db/bun.lock turbo.json bun.lock
git commit -m "chore(db): add vitest"
```

---

## Task 2: Add the `legal_entity` schema

**Files:**
- Create: `packages/db/src/schema/legal-entity.ts`
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 2.1: Create `packages/db/src/schema/legal-entity.ts`**

```ts
import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const legalEntity = pgTable("legal_entity", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'LTD' | 'IV' | 'MB'
  country: text("country").notNull(), // 'GB' | 'LT'
  defaultCurrency: text("default_currency").notNull(), // 'GBP' | 'EUR'
  registrationNumber: text("registration_number"),
  vatNumber: text("vat_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})
```

- [ ] **Step 2.2: Re-export from `packages/db/src/schema/index.ts`**

Add (in alphabetical position):

```ts
export * from "./legal-entity"
```

- [ ] **Step 2.3: Type-check**

```bash
cd /Users/mselvenis/dev/prive-admin
bun run check-types
```

Expected: no errors.

- [ ] **Step 2.4: Commit**

```bash
git add packages/db/src/schema/legal-entity.ts packages/db/src/schema/index.ts
git commit -m "feat(db): add legal_entity schema"
```

---

## Task 3: Add the `salon` schema

**Files:**
- Create: `packages/db/src/schema/salon.ts`
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 3.1: Create `packages/db/src/schema/salon.ts`**

```ts
import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { legalEntity } from "./legal-entity"

export const salon = pgTable("salon", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  country: text("country").notNull(), // 'GB' | 'LT'
  defaultLegalEntityId: text("default_legal_entity_id")
    .notNull()
    .references(() => legalEntity.id, { onDelete: "restrict" }),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})
```

- [ ] **Step 3.2: Re-export from `packages/db/src/schema/index.ts`**

Add `export * from "./salon"` (alphabetical).

- [ ] **Step 3.3: Type-check**

```bash
bun run check-types
```

Expected: no errors.

- [ ] **Step 3.4: Commit**

```bash
git add packages/db/src/schema/salon.ts packages/db/src/schema/index.ts
git commit -m "feat(db): add salon schema"
```

---

## Task 4: Add nullable LE/salon columns to existing tables

We add the columns nullable in the schema. Step 5 generates the migration, Step 6 hand-edits it to seed + backfill + flip NOT NULL within the same migration.

**Files:**
- Modify: `packages/db/src/schema/appointment.ts`
- Modify: `packages/db/src/schema/transaction.ts`
- Modify: `packages/db/src/schema/hair.ts`
- Modify: `packages/db/src/schema/user-settings.ts`

- [ ] **Step 4.1: `appointment.ts` — add `salonId` and `legalEntityId` (nullable for now)**

Replace the body of the `appointment` table with the snippet below. The nullable-on-purpose state lasts only across one migration; the migration we'll write in Task 5 flips them to `NOT NULL` after backfill.

```ts
import { createId } from "@paralleldrive/cuid2"
import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

import { customer } from "./customer"
import { legalEntity } from "./legal-entity"
import { salon } from "./salon"

export const appointment = pgTable("appointment", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  salonId: text("salon_id").references(() => salon.id, { onDelete: "restrict" }),
  legalEntityId: text("legal_entity_id").references(() => legalEntity.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})

export const personnelOnAppointments = pgTable(
  "appointment_personnel",
  {
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointment.id, { onDelete: "cascade" }),
    personnelId: text("personnel_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.personnelId, table.appointmentId] })],
)
```

- [ ] **Step 4.2: `transaction.ts` — add `legalEntityId` (nullable for now)**

Replace the body with:

```ts
import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp, date } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { customer } from "./customer"
import { legalEntity } from "./legal-entity"
import { order } from "./order"

export const transaction = pgTable("transaction", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name"),
  notes: text("notes"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  type: text("type").notNull().default("BANK"),
  status: text("status").notNull().default("PENDING"),
  completedDateBy: date("completed_date_by").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
  appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "set null" }),
  legalEntityId: text("legal_entity_id").references(() => legalEntity.id, { onDelete: "restrict" }),
})
```

- [ ] **Step 4.3: `hair.ts` — add `legalEntityId` to `hairOrder` (nullable for now)**

In the `hairOrder` table only (leave `hairAssigned` unchanged), add `legalEntityId` after `customerId`. Import `legalEntity` from `./legal-entity`. Resulting table:

```ts
export const hairOrder = pgTable("hair_order", {
  id: text("id").primaryKey().$defaultFn(createId),
  uid: serial("uid").notNull().unique(),
  placedAt: date("placed_at"),
  arrivedAt: date("arrived_at"),
  status: text("status").notNull().default("PENDING"),
  weightReceived: integer("weight_received").default(0).notNull(),
  weightUsed: integer("weight_used").default(0).notNull(),
  pricePerGram: integer("price_per_gram").default(0).notNull(),
  total: integer("total").default(0).notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  legalEntityId: text("legal_entity_id").references(() => legalEntity.id, { onDelete: "restrict" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})
```

- [ ] **Step 4.4: `user-settings.ts` — add `activeLegalEntityId` (nullable; "All" mode)**

```ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { legalEntity } from "./legal-entity"
import { user } from "./auth"

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  preferredCurrency: text("preferred_currency").notNull(),
  activeLegalEntityId: text("active_legal_entity_id").references(() => legalEntity.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})
```

- [ ] **Step 4.5: Type-check**

```bash
bun run check-types
```

Expected: no errors.

- [ ] **Step 4.6: Commit**

```bash
git add packages/db/src/schema/appointment.ts packages/db/src/schema/transaction.ts packages/db/src/schema/hair.ts packages/db/src/schema/user-settings.ts
git commit -m "feat(db): add nullable legal_entity_id and salon_id columns"
```

---

## Task 5: Update Drizzle relations

**Files:**
- Modify: `packages/db/src/schema/relations.ts`

- [ ] **Step 5.1: Add `legalEntity` and `salon` relations**

Add the imports and append the new `relations` definitions to `relations.ts`:

```ts
import { legalEntity } from "./legal-entity"
import { salon } from "./salon"
```

Add at the bottom of the file:

```ts
// Legal entity relations
export const legalEntityRelations = relations(legalEntity, ({ many }) => ({
  salons: many(salon),
  appointments: many(appointment),
  transactions: many(transaction),
  hairOrders: many(hairOrder),
}))

// Salon relations
export const salonRelations = relations(salon, ({ one, many }) => ({
  defaultLegalEntity: one(legalEntity, {
    fields: [salon.defaultLegalEntityId],
    references: [legalEntity.id],
  }),
  appointments: many(appointment),
}))
```

Extend the existing `appointmentRelations` to include `salon` and `legalEntity`:

```ts
export const appointmentRelations = relations(appointment, ({ one, many }) => ({
  client: one(customer, { fields: [appointment.clientId], references: [customer.id] }),
  salon: one(salon, { fields: [appointment.salonId], references: [salon.id] }),
  legalEntity: one(legalEntity, { fields: [appointment.legalEntityId], references: [legalEntity.id] }),
  personnel: many(personnelOnAppointments),
  transactions: many(transaction),
  hairAssigned: many(hairAssigned),
  notes: many(note),
}))
```

Extend the existing `transactionRelations` and `hairOrderRelations` to include `legalEntity`:

```ts
export const transactionRelations = relations(transaction, ({ one }) => ({
  customer: one(customer, { fields: [transaction.customerId], references: [customer.id] }),
  order: one(order, { fields: [transaction.orderId], references: [order.id] }),
  appointment: one(appointment, { fields: [transaction.appointmentId], references: [appointment.id] }),
  legalEntity: one(legalEntity, { fields: [transaction.legalEntityId], references: [legalEntity.id] }),
}))

export const hairOrderRelations = relations(hairOrder, ({ one, many }) => ({
  customer: one(customer, { fields: [hairOrder.customerId], references: [customer.id] }),
  legalEntity: one(legalEntity, { fields: [hairOrder.legalEntityId], references: [legalEntity.id] }),
  createdBy: one(user, { fields: [hairOrder.createdById], references: [user.id] }),
  hairAssigned: many(hairAssigned),
  notes: many(note),
}))
```

Extend `userSettingsRelations`:

```ts
export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, { fields: [userSettings.userId], references: [user.id] }),
  activeLegalEntity: one(legalEntity, {
    fields: [userSettings.activeLegalEntityId],
    references: [legalEntity.id],
  }),
}))
```

- [ ] **Step 5.2: Type-check**

```bash
bun run check-types
```

Expected: no errors.

- [ ] **Step 5.3: Commit**

```bash
git add packages/db/src/schema/relations.ts
git commit -m "feat(db): wire legal_entity and salon relations"
```

---

## Task 6: Generate and hand-edit the migration

**Files:**
- Create: `packages/db/src/migrations/0002_multi_legal_entity.sql` (drizzle generates this; we then edit it)
- Create: `packages/db/src/migrations/meta/0002_snapshot.json` (drizzle generates this — leave as-is)
- Modify: `packages/db/src/migrations/meta/_journal.json` (drizzle updates this — leave as-is)

The migration combines DDL + seed + backfill + tighten + indexes + CHECK constraints into a single transactional file. We let drizzle-kit generate the DDL portion, then hand-edit the SQL to insert the seed + backfill + NOT NULL portions.

- [ ] **Step 6.1: Generate the migration**

```bash
cd /Users/mselvenis/dev/prive-admin
bun run db:generate
```

Drizzle creates `packages/db/src/migrations/0002_<random_name>.sql` plus a snapshot under `meta/`. Rename the SQL file to `0002_multi_legal_entity.sql` and update its `tag` in `meta/_journal.json` to match (drizzle reads `_journal.json`, so the rename only matters for clarity).

- [ ] **Step 6.2: Inspect the generated DDL**

It should contain (in some order):
- `CREATE TABLE "legal_entity" (...)`
- `CREATE TABLE "salon" (...)` with FK to `legal_entity`
- `ALTER TABLE "appointment" ADD COLUMN "salon_id" text` + `ALTER TABLE "appointment" ADD COLUMN "legal_entity_id" text` + matching FK constraint statements
- `ALTER TABLE "transaction" ADD COLUMN "legal_entity_id" text` + FK
- `ALTER TABLE "hair_order" ADD COLUMN "legal_entity_id" text` + FK
- `ALTER TABLE "user_settings" ADD COLUMN "active_legal_entity_id" text` + FK

If anything is missing, fix the schema files in earlier tasks and re-generate.

- [ ] **Step 6.3: Append seed + backfill + tighten SQL**

After the last DDL statement (and after `--> statement-breakpoint`), append the following block. Each statement is followed by `--> statement-breakpoint` so drizzle parses them individually.

Use placeholders by-attribute (not by-id) so we don't hard-code ULIDs:

```sql
-- Seed legal entities
INSERT INTO "legal_entity" ("id","name","type","country","default_currency","created_at","updated_at")
VALUES
  (gen_random_uuid()::text, 'Prive UK Ltd', 'LTD', 'GB', 'GBP', now(), now()),
  (gen_random_uuid()::text, 'Prive LT IV',  'IV',  'LT', 'EUR', now(), now()),
  (gen_random_uuid()::text, 'Prive LT MB',  'MB',  'LT', 'EUR', now(), now());
--> statement-breakpoint

-- Seed salons
INSERT INTO "salon" ("id","name","country","default_legal_entity_id","created_at","updated_at")
SELECT gen_random_uuid()::text, 'Prive UK', 'GB', le.id, now(), now()
FROM "legal_entity" le WHERE le.type = 'LTD' AND le.country = 'GB';
--> statement-breakpoint

INSERT INTO "salon" ("id","name","country","default_legal_entity_id","created_at","updated_at")
SELECT gen_random_uuid()::text, 'Prive LT', 'LT', le.id, now(), now()
FROM "legal_entity" le WHERE le.type = 'IV' AND le.country = 'LT';
--> statement-breakpoint

-- Backfill appointment.salon_id and appointment.legal_entity_id
UPDATE "appointment"
SET "salon_id" = (SELECT id FROM "salon" WHERE name = 'Prive UK' AND country = 'GB' LIMIT 1),
    "legal_entity_id" = (SELECT id FROM "legal_entity" WHERE type = 'LTD' AND country = 'GB' LIMIT 1)
WHERE "salon_id" IS NULL OR "legal_entity_id" IS NULL;
--> statement-breakpoint

-- Backfill transaction.legal_entity_id
UPDATE "transaction"
SET "legal_entity_id" = (SELECT id FROM "legal_entity" WHERE type = 'LTD' AND country = 'GB' LIMIT 1)
WHERE "legal_entity_id" IS NULL;
--> statement-breakpoint

-- Backfill hair_order.legal_entity_id
UPDATE "hair_order"
SET "legal_entity_id" = (SELECT id FROM "legal_entity" WHERE type = 'LTD' AND country = 'GB' LIMIT 1)
WHERE "legal_entity_id" IS NULL;
--> statement-breakpoint

-- Verify zero NULL rows in scoped columns (raises if any remain)
DO $$
DECLARE missing INT;
BEGIN
  SELECT count(*) INTO missing FROM "appointment" WHERE "salon_id" IS NULL OR "legal_entity_id" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'appointment backfill incomplete: % rows', missing; END IF;
  SELECT count(*) INTO missing FROM "transaction" WHERE "legal_entity_id" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'transaction backfill incomplete: % rows', missing; END IF;
  SELECT count(*) INTO missing FROM "hair_order" WHERE "legal_entity_id" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'hair_order backfill incomplete: % rows', missing; END IF;
END $$;
--> statement-breakpoint

-- Tighten: NOT NULL on the four backfilled columns
ALTER TABLE "appointment" ALTER COLUMN "salon_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hair_order" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint

-- CHECK constraints
ALTER TABLE "legal_entity" ADD CONSTRAINT "legal_entity_type_chk" CHECK ("type" IN ('LTD','IV','MB'));--> statement-breakpoint
ALTER TABLE "legal_entity" ADD CONSTRAINT "legal_entity_country_chk" CHECK ("country" IN ('GB','LT'));--> statement-breakpoint
ALTER TABLE "salon" ADD CONSTRAINT "salon_country_chk" CHECK ("country" IN ('GB','LT'));--> statement-breakpoint

-- Indexes
CREATE INDEX "appointment_legal_entity_id_starts_at_idx" ON "appointment" ("legal_entity_id","starts_at");--> statement-breakpoint
CREATE INDEX "appointment_salon_id_starts_at_idx" ON "appointment" ("salon_id","starts_at");--> statement-breakpoint
CREATE INDEX "transaction_legal_entity_id_completed_date_by_idx" ON "transaction" ("legal_entity_id","completed_date_by");--> statement-breakpoint
CREATE INDEX "hair_order_legal_entity_id_placed_at_idx" ON "hair_order" ("legal_entity_id","placed_at");
```

> Reflect the indexes back into the schema files in a follow-up commit if you want drizzle's snapshot to know about them. For this plan it's enough that the SQL applies — drizzle will detect the index drift on the next `db:generate` run, and you can either accept or ignore that drift since runtime is fine either way.

- [ ] **Step 6.4: Apply the migration locally**

```bash
bun run db:migrate
```

Expected: `[db] Migrations complete.` Any failure means the SQL is wrong — fix the file, drop+recreate the local DB if needed (`bun run db:down && bun run db:start && bun run db:migrate`), and rerun until it applies cleanly.

- [ ] **Step 6.5: Spot-check the result with a few queries**

```bash
psql "$DATABASE_URL" -c "SELECT type,country,name FROM legal_entity ORDER BY country;"
psql "$DATABASE_URL" -c "SELECT name,country FROM salon ORDER BY country;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM appointment WHERE legal_entity_id IS NULL;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM transaction  WHERE legal_entity_id IS NULL;"
psql "$DATABASE_URL" -c "SELECT count(*) FROM hair_order   WHERE legal_entity_id IS NULL;"
```

Expected:
- 3 legal entities (`Prive UK Ltd / GB`, `Prive LT IV / LT`, `Prive LT MB / LT`).
- 2 salons (`Prive UK / GB`, `Prive LT / LT`).
- 0 NULL rows in the three NULL counts.

- [ ] **Step 6.6: Sanity-check the migration on a copy of the production backup**

```bash
cd /Users/mselvenis/dev/prive-admin
# Spin up a throwaway Postgres on a separate port using the package compose file
DB_PORT=55435 docker compose -f packages/db/docker-compose.yml -p prive-mig-check up -d
# Restore the latest backup
psql "postgres://postgres:postgres@localhost:55435/postgres" < backups/postgres_backup_2026-05-01_02-07-04.sql
# Point migrations at it
DATABASE_URL="postgres://postgres:postgres@localhost:55435/postgres" bun run db:migrate
# Verify counts (same queries as Step 6.5, against this DB)
DATABASE_URL="postgres://postgres:postgres@localhost:55435/postgres" psql "$DATABASE_URL" -c "SELECT count(*) FROM appointment WHERE legal_entity_id IS NULL;"
# Tear down
docker compose -f packages/db/docker-compose.yml -p prive-mig-check down -v
```

If your local docker-compose service or port differs, adapt to whatever is consistent with how the project's compose runs (do not invent new infra). The acceptance criterion: migration applies cleanly to backup and 0 NULL rows remain.

- [ ] **Step 6.7: Commit**

```bash
git add packages/db/src/migrations
git commit -m "feat(db): multi legal entity + salon migration with seed and backfill"
```

---

## Task 7: Scope helper with unit test

**Files:**
- Create: `packages/db/src/scope.ts`
- Create: `packages/db/src/scope.test.ts`
- Modify: `packages/db/src/index.ts` (re-export `whereActiveLegalEntity`)

- [ ] **Step 7.1: Write the failing test**

Create `packages/db/src/scope.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { transaction } from "./schema/transaction"
import { whereActiveLegalEntity } from "./scope"

describe("whereActiveLegalEntity", () => {
  it("returns undefined when activeId is null (All mode)", () => {
    expect(whereActiveLegalEntity(transaction.legalEntityId, null)).toBeUndefined()
  })

  it("returns a drizzle eq() clause when activeId is provided", () => {
    const clause = whereActiveLegalEntity(transaction.legalEntityId, "le_123")
    expect(clause).toBeDefined()
    // SQL helper objects from drizzle expose a `queryChunks` array; the literal id should appear inside.
    const serialized = JSON.stringify(clause)
    expect(serialized).toContain("le_123")
  })
})
```

- [ ] **Step 7.2: Run the test and verify it fails**

```bash
bun run --filter @prive-admin-tanstack/db test
```

Expected: FAIL with `Cannot find module './scope'` (or similar — the import target doesn't exist yet).

- [ ] **Step 7.3: Implement `packages/db/src/scope.ts`**

```ts
import { eq } from "drizzle-orm"
import type { PgColumn } from "drizzle-orm/pg-core"

export function whereActiveLegalEntity(column: PgColumn, activeLegalEntityId: string | null) {
  return activeLegalEntityId ? eq(column, activeLegalEntityId) : undefined
}
```

- [ ] **Step 7.4: Re-export from `packages/db/src/index.ts`**

Add at the bottom of `packages/db/src/index.ts`:

```ts
export { whereActiveLegalEntity } from "./scope"
```

- [ ] **Step 7.5: Run the test and verify it passes**

```bash
bun run --filter @prive-admin-tanstack/db test
```

Expected: PASS, both cases.

- [ ] **Step 7.6: Type-check the whole repo**

```bash
bun run check-types
```

Expected: no errors.

- [ ] **Step 7.7: Commit**

```bash
git add packages/db/src/scope.ts packages/db/src/scope.test.ts packages/db/src/index.ts
git commit -m "feat(db): scope helper for active legal entity"
```

---

## Task 8: Active legal-entity resolution helper

**Files:**
- Create: `apps/web/src/functions/get-active-legal-entity.ts`

- [ ] **Step 8.1: Create the resolver**

```ts
import { db } from "@prive-admin-tanstack/db"
import { userSettings } from "@prive-admin-tanstack/db/schema/user-settings"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"

import { requireAuthMiddleware } from "@/middleware/auth"

export const getActiveLegalEntityId = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id
    const row = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
      columns: { activeLegalEntityId: true },
    })
    return row?.activeLegalEntityId ?? null
  })

/**
 * Server-internal helper for reuse inside other server functions where we
 * already have the session in context. Prefer this over calling the server
 * function endpoint when running on the server.
 */
export async function readActiveLegalEntityId(userId: string): Promise<string | null> {
  const row = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
    columns: { activeLegalEntityId: true },
  })
  return row?.activeLegalEntityId ?? null
}
```

- [ ] **Step 8.2: Type-check**

```bash
bun run check-types
```

Expected: no errors.

- [ ] **Step 8.3: Commit**

```bash
git add apps/web/src/functions/get-active-legal-entity.ts
git commit -m "feat(web): active legal entity resolver"
```

---

## Task 9: Extend `user-settings.ts` with `setActiveLegalEntity`

**Files:**
- Modify: `apps/web/src/functions/user-settings.ts`

- [ ] **Step 9.1: Replace the file with**

```ts
import { db } from "@prive-admin-tanstack/db"
import { legalEntity } from "@prive-admin-tanstack/db/schema/legal-entity"
import { userSettings } from "@prive-admin-tanstack/db/schema/user-settings"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { currencySchema } from "@/lib/currency"
import { requireAuthMiddleware } from "@/middleware/auth"

export const getUserSettings = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id
    const row = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    })
    if (row) {
      return {
        userId: row.userId,
        preferredCurrency: row.preferredCurrency,
        activeLegalEntityId: row.activeLegalEntityId,
      }
    }
    return { userId, preferredCurrency: "GBP" as const, activeLegalEntityId: null }
  })

export const updateUserSettings = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ preferredCurrency: currencySchema }))
  .handler(async ({ context, data }) => {
    const userId = context.session.user.id
    const [row] = await db
      .insert(userSettings)
      .values({ userId, preferredCurrency: data.preferredCurrency })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { preferredCurrency: data.preferredCurrency },
      })
      .returning()
    return {
      userId: row.userId,
      preferredCurrency: row.preferredCurrency,
      activeLegalEntityId: row.activeLegalEntityId,
    }
  })

export const setActiveLegalEntity = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ legalEntityId: z.string().min(1).nullable() }))
  .handler(async ({ context, data }) => {
    const userId = context.session.user.id

    if (data.legalEntityId !== null) {
      const exists = await db.query.legalEntity.findFirst({
        where: eq(legalEntity.id, data.legalEntityId),
        columns: { id: true },
      })
      if (!exists) {
        throw new Error("Legal entity not found")
      }
    }

    const [row] = await db
      .insert(userSettings)
      .values({
        userId,
        preferredCurrency: "GBP",
        activeLegalEntityId: data.legalEntityId,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { activeLegalEntityId: data.legalEntityId },
      })
      .returning()
    return { activeLegalEntityId: row.activeLegalEntityId }
  })
```

- [ ] **Step 9.2: Type-check**

```bash
bun run check-types
```

Expected: no errors.

- [ ] **Step 9.3: Commit**

```bash
git add apps/web/src/functions/user-settings.ts
git commit -m "feat(web): set active legal entity mutation"
```

---

## Task 10: Legal-entity domain constants + Zod schemas

**Files:**
- Create: `apps/web/src/lib/legal-entity.ts`
- Modify: `apps/web/src/lib/schemas.ts`

- [ ] **Step 10.1: Create `apps/web/src/lib/legal-entity.ts`**

```ts
import { z } from "zod"

export const COUNTRIES = ["GB", "LT"] as const
export type Country = (typeof COUNTRIES)[number]
export const countrySchema = z.enum(COUNTRIES)

export const LEGAL_ENTITY_TYPES = ["LTD", "IV", "MB"] as const
export type LegalEntityType = (typeof LEGAL_ENTITY_TYPES)[number]
export const legalEntityTypeSchema = z.enum(LEGAL_ENTITY_TYPES)

export const COUNTRY_LABELS: Record<Country, string> = {
  GB: "United Kingdom",
  LT: "Lithuania",
}

export const COUNTRY_FLAGS: Record<Country, string> = {
  GB: "🇬🇧",
  LT: "🇱🇹",
}
```

- [ ] **Step 10.2: Extend `apps/web/src/lib/schemas.ts`**

Add the following at the bottom of the file:

```ts
import { countrySchema, legalEntityTypeSchema } from "./legal-entity"
import { currencySchema } from "./currency"

export const legalEntityUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(120),
  registrationNumber: z.string().max(40).nullish(),
  vatNumber: z.string().max(40).nullish(),
})
export type LegalEntityUpdateInput = z.infer<typeof legalEntityUpdateSchema>

export const salonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required").max(120),
  country: countrySchema,
  defaultLegalEntityId: z.string().min(1),
  address: z.string().max(255).nullish(),
})
export type SalonInput = z.infer<typeof salonSchema>
```

Replace the existing `appointmentSchema` with one that takes `salonId` + `legalEntityId`:

```ts
export const appointmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  startsAt: z.union([z.string(), z.date()]),
  clientId: z.string().min(1, "Client is required"),
  salonId: z.string().min(1, "Salon is required"),
  legalEntityId: z.string().min(1, "Legal entity is required"),
})
export type AppointmentInput = z.infer<typeof appointmentSchema>
```

Replace `hairOrderSchema` with one that takes `legalEntityId`:

```ts
export const hairOrderSchema = z.object({
  id: z.string().optional(),
  placedAt: z.union([z.string(), z.date(), z.null()]),
  arrivedAt: z.union([z.string(), z.date(), z.null()]),
  customerId: z.string().min(1, "Customer is required"),
  legalEntityId: z.string().min(1, "Legal entity is required"),
  status: z.enum(["PENDING", "COMPLETED"]).default("PENDING"),
  weightReceived: z.number().min(0),
  weightUsed: z.number().min(0),
  total: z.number().min(0),
})
export type HairOrderInput = z.infer<typeof hairOrderSchema>
```

(Re-import `currencySchema` cleanup is not needed since it was not used here previously.)

- [ ] **Step 10.3: Type-check (will surface call sites that need updating)**

```bash
bun run check-types
```

Expected: type errors at call sites of `appointmentSchema` and `hairOrderSchema` (in `appointments.ts`, `hair-orders.ts`, the form pages). This is expected — Tasks 12–14 fix them.

- [ ] **Step 10.4: Commit**

```bash
git add apps/web/src/lib/legal-entity.ts apps/web/src/lib/schemas.ts
git commit -m "feat(web): legal entity domain constants and zod schemas"
```

---

## Task 11: `legal-entities.ts` server functions

**Files:**
- Create: `apps/web/src/functions/legal-entities.ts`

- [ ] **Step 11.1: Create the file**

```ts
import { db } from "@prive-admin-tanstack/db"
import { legalEntity } from "@prive-admin-tanstack/db/schema/legal-entity"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { legalEntityUpdateSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

export const listLegalEntities = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.legalEntity.findMany({
      orderBy: (le, { asc }) => [asc(le.country), asc(le.name)],
    })
  })

export const getLegalEntity = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const row = await db.query.legalEntity.findFirst({ where: eq(legalEntity.id, data.id) })
    if (!row) throw new Error("Legal entity not found")
    return row
  })

export const updateLegalEntity = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(legalEntityUpdateSchema)
  .handler(async ({ data }) => {
    const [row] = await db
      .update(legalEntity)
      .set({
        name: data.name,
        registrationNumber: data.registrationNumber ?? null,
        vatNumber: data.vatNumber ?? null,
      })
      .where(eq(legalEntity.id, data.id))
      .returning()
    if (!row) throw new Error("Legal entity not found")
    return row
  })
```

- [ ] **Step 11.2: Type-check**

```bash
bun run check-types
```

Expected: no errors in this file (errors elsewhere are from Task 10 still pending Tasks 12–14).

- [ ] **Step 11.3: Commit**

```bash
git add apps/web/src/functions/legal-entities.ts
git commit -m "feat(web): legal-entities server functions"
```

---

## Task 12: `salons.ts` server functions

**Files:**
- Create: `apps/web/src/functions/salons.ts`

- [ ] **Step 12.1: Create the file**

```ts
import { db } from "@prive-admin-tanstack/db"
import { legalEntity } from "@prive-admin-tanstack/db/schema/legal-entity"
import { salon } from "@prive-admin-tanstack/db/schema/salon"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { countrySchema } from "@/lib/legal-entity"
import { salonSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

async function assertLegalEntityCountry(legalEntityId: string, country: string) {
  const le = await db.query.legalEntity.findFirst({
    where: eq(legalEntity.id, legalEntityId),
    columns: { id: true, country: true },
  })
  if (!le) throw new Error("Default legal entity not found")
  if (le.country !== country) {
    throw new Error("Salon country must match the default legal entity's country")
  }
}

export const listSalons = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.salon.findMany({
      with: { defaultLegalEntity: true },
      orderBy: (s, { asc }) => [asc(s.country), asc(s.name)],
    })
  })

export const listSalonsByCountry = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ country: countrySchema }))
  .handler(async ({ data }) => {
    return db.query.salon.findMany({
      where: eq(salon.country, data.country),
      orderBy: (s, { asc }) => [asc(s.name)],
    })
  })

export const getSalon = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const row = await db.query.salon.findFirst({
      where: eq(salon.id, data.id),
      with: { defaultLegalEntity: true },
    })
    if (!row) throw new Error("Salon not found")
    return row
  })

export const createSalon = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(salonSchema)
  .handler(async ({ data }) => {
    await assertLegalEntityCountry(data.defaultLegalEntityId, data.country)
    const [row] = await db
      .insert(salon)
      .values({
        name: data.name,
        country: data.country,
        defaultLegalEntityId: data.defaultLegalEntityId,
        address: data.address ?? null,
      })
      .returning()
    return row
  })

export const updateSalon = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(salonSchema.required({ id: true }))
  .handler(async ({ data }) => {
    await assertLegalEntityCountry(data.defaultLegalEntityId, data.country)
    const [row] = await db
      .update(salon)
      .set({
        name: data.name,
        country: data.country,
        defaultLegalEntityId: data.defaultLegalEntityId,
        address: data.address ?? null,
      })
      .where(eq(salon.id, data.id!))
      .returning()
    if (!row) throw new Error("Salon not found")
    return row
  })
```

- [ ] **Step 12.2: Type-check**

```bash
bun run check-types
```

- [ ] **Step 12.3: Commit**

```bash
git add apps/web/src/functions/salons.ts
git commit -m "feat(web): salons server functions"
```

---

## Task 13: Update `appointments.ts` (LE scope, country validation)

**Files:**
- Modify: `apps/web/src/functions/appointments.ts`

- [ ] **Step 13.1: Replace the file with**

```ts
import { db, whereActiveLegalEntity } from "@prive-admin-tanstack/db"
import { appointment, personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { legalEntity } from "@prive-admin-tanstack/db/schema/legal-entity"
import { salon } from "@prive-admin-tanstack/db/schema/salon"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, gte, lte } from "drizzle-orm"
import { z } from "zod"

import { readActiveLegalEntityId } from "@/functions/get-active-legal-entity"
import { appointmentSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

async function assertSameCountry(salonId: string, legalEntityId: string) {
  const [s, le] = await Promise.all([
    db.query.salon.findFirst({ where: eq(salon.id, salonId), columns: { id: true, country: true } }),
    db.query.legalEntity.findFirst({
      where: eq(legalEntity.id, legalEntityId),
      columns: { id: true, country: true },
    }),
  ])
  if (!s) throw new Error("Salon not found")
  if (!le) throw new Error("Legal entity not found")
  if (s.country !== le.country) {
    throw new Error("Legal entity country must match the salon country")
  }
}

export const getAppointments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const activeId = await readActiveLegalEntityId(context.session.user.id)
    const conditions = [whereActiveLegalEntity(appointment.legalEntityId, activeId)].filter(Boolean)
    if (data.startDate) conditions.push(gte(appointment.startsAt, new Date(data.startDate)))
    if (data.endDate) conditions.push(lte(appointment.startsAt, new Date(data.endDate)))

    return db.query.appointment.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { client: true, legalEntity: true, salon: true },
      orderBy: (appointment, { asc }) => [asc(appointment.startsAt)],
    })
  })

export const getAppointment = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.appointment.findFirst({
      where: eq(appointment.id, data.id),
      with: {
        client: true,
        salon: true,
        legalEntity: true,
        personnel: { with: { personnel: true } },
        notes: { with: { createdBy: true } },
      },
    })
    if (!result) {
      throw new Error("Appointment not found")
    }
    return result
  })

export const createAppointment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(appointmentSchema)
  .handler(async ({ data }) => {
    await assertSameCountry(data.salonId, data.legalEntityId)
    const [result] = await db
      .insert(appointment)
      .values({
        name: data.name,
        startsAt: new Date(data.startsAt),
        clientId: data.clientId,
        salonId: data.salonId,
        legalEntityId: data.legalEntityId,
      })
      .returning()
    return result
  })

export const updateAppointment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(appointmentSchema.required({ id: true }))
  .handler(async ({ data }) => {
    await assertSameCountry(data.salonId, data.legalEntityId)
    const [result] = await db
      .update(appointment)
      .set({
        name: data.name,
        startsAt: new Date(data.startsAt),
        salonId: data.salonId,
        legalEntityId: data.legalEntityId,
      })
      .where(eq(appointment.id, data.id!))
      .returning()
    return result
  })

export const linkPersonnel = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ appointmentId: z.string(), personnelIds: z.array(z.string()) }))
  .handler(async ({ data }) => {
    const values = data.personnelIds.map((personnelId) => ({
      appointmentId: data.appointmentId,
      personnelId,
    }))
    await db.insert(personnelOnAppointments).values(values)
  })

export const getAppointmentsByCustomerId = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ customerId: z.string() }))
  .handler(async ({ data }) => {
    return db.query.appointment.findMany({
      where: eq(appointment.clientId, data.customerId),
      with: { legalEntity: true, salon: true },
      orderBy: (appointment, { desc }) => [desc(appointment.startsAt)],
    })
  })
```

- [ ] **Step 13.2: Type-check**

```bash
bun run check-types
```

Expected: errors at the appointment form pages (Task 18 fixes them). The server functions themselves should type-check.

- [ ] **Step 13.3: Commit**

```bash
git add apps/web/src/functions/appointments.ts
git commit -m "feat(web): scope appointments by legal entity, validate country"
```

---

## Task 14: Update `transactions.ts` (LE scope)

**Files:**
- Modify: `apps/web/src/functions/transactions.ts`

- [ ] **Step 14.1: Replace the file with**

```ts
import { db, whereActiveLegalEntity } from "@prive-admin-tanstack/db"
import { personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { transaction } from "@prive-admin-tanstack/db/schema/transaction"
import { createServerFn } from "@tanstack/react-start"
import { and, eq } from "drizzle-orm"
import { z } from "zod"

import { readActiveLegalEntityId } from "@/functions/get-active-legal-entity"
import { currencySchema } from "@/lib/currency"
import { requireAuthMiddleware } from "@/middleware/auth"

const transactionTypeSchema = z.enum(["BANK", "CASH", "PAYPAL"])
const transactionStatusSchema = z.enum(["PENDING", "COMPLETED"])
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")

const transactionFieldsSchema = z.object({
  name: z.string().nullish(),
  notes: z.string().nullish(),
  amount: z.number().int(),
  currency: currencySchema,
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  completedDateBy: dateStringSchema,
  legalEntityId: z.string().min(1, "Legal entity is required"),
})

export const getTransactionsByAppointmentId = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ appointmentId: z.string() }))
  .handler(async ({ context, data }) => {
    const activeId = await readActiveLegalEntityId(context.session.user.id)
    const filters = [
      eq(transaction.appointmentId, data.appointmentId),
      whereActiveLegalEntity(transaction.legalEntityId, activeId),
    ].filter(Boolean)
    return db.query.transaction.findMany({
      where: and(...filters),
      with: {
        customer: { columns: { id: true, name: true } },
        legalEntity: { columns: { id: true, name: true, type: true, country: true } },
      },
      orderBy: (tx, { asc }) => [asc(tx.completedDateBy)],
    })
  })

export const createTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    transactionFieldsSchema.extend({
      appointmentId: z.string().min(1),
      customerId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    return await db.transaction(async (tx) => {
      const allowedCustomerIds = new Set<string>()
      const appointmentRow = await tx.query.appointment.findFirst({
        where: (a, { eq }) => eq(a.id, data.appointmentId),
        columns: { clientId: true },
      })
      if (!appointmentRow) {
        throw new Error("Appointment not found")
      }
      allowedCustomerIds.add(appointmentRow.clientId)
      const personnelRows = await tx
        .select({ personnelId: personnelOnAppointments.personnelId })
        .from(personnelOnAppointments)
        .where(eq(personnelOnAppointments.appointmentId, data.appointmentId))
      for (const row of personnelRows) {
        allowedCustomerIds.add(row.personnelId)
      }
      if (!allowedCustomerIds.has(data.customerId)) {
        throw new Error("Customer is not the appointment client or assigned personnel")
      }

      const [result] = await tx
        .insert(transaction)
        .values({
          appointmentId: data.appointmentId,
          customerId: data.customerId,
          name: data.name ?? null,
          notes: data.notes ?? null,
          amount: data.amount,
          currency: data.currency,
          type: data.type,
          status: data.status,
          completedDateBy: data.completedDateBy,
          legalEntityId: data.legalEntityId,
        })
        .returning()
      return result
    })
  })

export const updateTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(transactionFieldsSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await db.query.transaction.findFirst({
      where: eq(transaction.id, data.id),
      columns: { id: true },
    })
    if (!existing) {
      throw new Error("Transaction not found")
    }
    const [result] = await db
      .update(transaction)
      .set({
        name: data.name ?? null,
        notes: data.notes ?? null,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        status: data.status,
        completedDateBy: data.completedDateBy,
        legalEntityId: data.legalEntityId,
      })
      .where(eq(transaction.id, data.id))
      .returning()
    return result
  })

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await db.query.transaction.findFirst({
      where: eq(transaction.id, data.id),
      columns: { id: true },
    })
    if (!existing) {
      throw new Error("Transaction not found")
    }
    await db.delete(transaction).where(eq(transaction.id, data.id))
  })
```

- [ ] **Step 14.2: Type-check**

```bash
bun run check-types
```

Expected: errors at the transaction form components (Task 19 fixes them).

- [ ] **Step 14.3: Commit**

```bash
git add apps/web/src/functions/transactions.ts
git commit -m "feat(web): scope transactions by legal entity"
```

---

## Task 15: Update `hair-orders.ts` (LE scope)

**Files:**
- Modify: `apps/web/src/functions/hair-orders.ts`

- [ ] **Step 15.1: Replace the file with**

```ts
import { db, whereActiveLegalEntity } from "@prive-admin-tanstack/db"
import { hairAssigned, hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { readActiveLegalEntityId } from "@/functions/get-active-legal-entity"
import { hairOrderSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

export const getHairOrders = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const activeId = await readActiveLegalEntityId(context.session.user.id)
    return db.query.hairOrder.findMany({
      where: whereActiveLegalEntity(hairOrder.legalEntityId, activeId),
      with: { createdBy: true, customer: true, legalEntity: true },
      orderBy: (hairOrder, { asc }) => [asc(hairOrder.uid)],
    })
  })

export const getHairOrder = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.hairOrder.findFirst({
      where: eq(hairOrder.id, data.id),
      with: {
        createdBy: true,
        customer: true,
        legalEntity: true,
        hairAssigned: { with: { client: true } },
        notes: { with: { createdBy: true } },
      },
    })
    if (!result) {
      throw new Error("Hair order not found")
    }
    return result
  })

export const createHairOrder = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(hairOrderSchema)
  .handler(async ({ data, context }) => {
    const [result] = await db
      .insert(hairOrder)
      .values({
        placedAt: data.placedAt ? String(data.placedAt) : null,
        arrivedAt: data.arrivedAt ? String(data.arrivedAt) : null,
        status: data.status,
        customerId: data.customerId,
        legalEntityId: data.legalEntityId,
        weightReceived: data.weightReceived,
        weightUsed: data.weightUsed,
        total: data.total,
        createdById: context.session.user.id,
      })
      .returning()
    return result
  })

export const updateHairOrder = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(hairOrderSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [result] = await db
      .update(hairOrder)
      .set({
        placedAt: data.placedAt ? String(data.placedAt) : null,
        arrivedAt: data.arrivedAt ? String(data.arrivedAt) : null,
        status: data.status,
        weightReceived: data.weightReceived,
        weightUsed: data.weightUsed,
        total: data.total,
        legalEntityId: data.legalEntityId,
      })
      .where(eq(hairOrder.id, data.id!))
      .returning()
    return result
  })

export const recalculateHairOrderPrices = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ hairOrderId: z.string() }))
  .handler(async ({ data }) => {
    const order = await db.query.hairOrder.findFirst({
      where: eq(hairOrder.id, data.hairOrderId),
      with: { hairAssigned: true },
    })
    if (!order) {
      throw new Error("Hair order not found")
    }

    const pricePerGram =
      order.total === 0 || order.weightReceived === 0 ? 0 : Math.abs(Math.round(order.total / order.weightReceived))

    if (order.pricePerGram !== pricePerGram) {
      await db.update(hairOrder).set({ pricePerGram }).where(eq(hairOrder.id, data.hairOrderId))
    }

    for (const ha of order.hairAssigned) {
      const total = pricePerGram === 0 ? 0 : Math.round(pricePerGram * ha.weightInGrams)
      const profit = ha.soldFor - total
      if (ha.profit !== profit) {
        await db.update(hairAssigned).set({ profit }).where(eq(hairAssigned.id, ha.id))
      }
    }

    return { pricePerGram }
  })
```

- [ ] **Step 15.2: Type-check**

```bash
bun run check-types
```

Expected: errors at the hair-order form pages (Task 20 fixes them).

- [ ] **Step 15.3: Commit**

```bash
git add apps/web/src/functions/hair-orders.ts
git commit -m "feat(web): scope hair orders by legal entity"
```

---

## Task 16: Update `dashboard.ts` (LE scope on stats)

**Files:**
- Modify: `apps/web/src/functions/dashboard.ts`

- [ ] **Step 16.1: Add the imports**

At the top of `apps/web/src/functions/dashboard.ts`, add:

```ts
import { whereActiveLegalEntity } from "@prive-admin-tanstack/db"
import { hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { readActiveLegalEntityId } from "@/functions/get-active-legal-entity"
```

- [ ] **Step 16.2: Replace `getTransactionStatsForDate` with**

```ts
export const getTransactionStatsForDate = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ date: z.string() }))
  .handler(async ({ context, data }) => {
    const activeId = await readActiveLegalEntityId(context.session.user.id)
    const { current, previous } = monthlyRanges(data.date)
    const fetch = async (range: Range) =>
      db
        .select({ amount: transaction.amount, currency: transaction.currency })
        .from(transaction)
        .where(
          and(
            gte(transaction.completedDateBy, toDateString(range.start)),
            lt(transaction.completedDateBy, toDateString(range.end)),
            eq(transaction.status, "COMPLETED"),
            isNotNull(transaction.appointmentId),
            whereActiveLegalEntity(transaction.legalEntityId, activeId),
          ),
        )
    const [cur, prev] = await Promise.all([fetch(current), fetch(previous)])
    const result = {} as Record<Currency, StatCategory>
    for (const c of CURRENCIES) {
      const curAmounts = cur.filter((t) => t.currency === c).map((t) => t.amount)
      const prevAmounts = prev.filter((t) => t.currency === c).map((t) => t.amount)
      result[c] = categoryFromMinor(calcAll(curAmounts, prevAmounts), c)
    }
    return result
  })
```

(`drizzle-orm`'s `and(...)` ignores `undefined` arguments, so passing the helper directly works for both "All" and specific LE.)

- [ ] **Step 16.3: Replace `getHairAssignedStatsForDate` with**

```ts
export const getHairAssignedStatsForDate = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ date: z.string() }))
  .handler(async ({ context, data }) => {
    const activeId = await readActiveLegalEntityId(context.session.user.id)
    const { current, previous } = monthlyRanges(data.date)
    const fetch = async (range: Range) =>
      db
        .select({
          weightInGrams: hairAssigned.weightInGrams,
          soldFor: hairAssigned.soldFor,
          profit: hairAssigned.profit,
          pricePerGram: hairAssigned.pricePerGram,
        })
        .from(hairAssigned)
        .innerJoin(appointment, eq(hairAssigned.appointmentId, appointment.id))
        .where(
          and(
            gte(appointment.startsAt, range.start),
            lt(appointment.startsAt, range.end),
            whereActiveLegalEntity(appointment.legalEntityId, activeId),
          ),
        )
    const [cur, prev] = await Promise.all([fetch(current), fetch(previous)])
    return {
      weightInGrams: categoryFromGrams(
        calcAll(
          cur.map((h) => h.weightInGrams),
          prev.map((h) => h.weightInGrams),
        ),
      ),
      soldFor: categoryFromCents(
        calcAll(
          cur.map((h) => h.soldFor),
          prev.map((h) => h.soldFor),
        ),
      ),
      profit: categoryFromCents(
        calcAll(
          cur.map((h) => h.profit),
          prev.map((h) => h.profit),
        ),
      ),
      pricePerGram: categoryFromCents(
        calcAll(
          cur.map((h) => h.pricePerGram),
          prev.map((h) => h.pricePerGram),
        ),
      ),
    }
  })
```

- [ ] **Step 16.4: Replace `getHairAssignedThroughSaleStatsForDate` with**

```ts
export const getHairAssignedThroughSaleStatsForDate = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ date: z.string() }))
  .handler(async ({ context, data }) => {
    const activeId = await readActiveLegalEntityId(context.session.user.id)
    const { current, previous } = monthlyRanges(data.date)
    const fetch = async (range: Range) =>
      db
        .select({
          weightInGrams: hairAssigned.weightInGrams,
          soldFor: hairAssigned.soldFor,
          profit: hairAssigned.profit,
          pricePerGram: hairAssigned.pricePerGram,
        })
        .from(hairAssigned)
        .innerJoin(hairOrder, eq(hairAssigned.hairOrderId, hairOrder.id))
        .where(
          and(
            isNull(hairAssigned.appointmentId),
            gte(hairAssigned.createdAt, range.start),
            lt(hairAssigned.createdAt, range.end),
            whereActiveLegalEntity(hairOrder.legalEntityId, activeId),
          ),
        )
    const [cur, prev] = await Promise.all([fetch(current), fetch(previous)])
    return {
      weightInGrams: categoryFromGrams(
        calcAll(
          cur.map((h) => h.weightInGrams),
          prev.map((h) => h.weightInGrams),
        ),
      ),
      soldFor: categoryFromCents(
        calcAll(
          cur.map((h) => h.soldFor),
          prev.map((h) => h.soldFor),
        ),
      ),
      profit: categoryFromCents(
        calcAll(
          cur.map((h) => h.profit),
          prev.map((h) => h.profit),
        ),
      ),
      pricePerGram: categoryFromCents(
        calcAll(
          cur.map((h) => h.pricePerGram),
          prev.map((h) => h.pricePerGram),
        ),
      ),
    }
  })
```

> The non-appointment hair-assigned path (direct sale) is filtered through the parent `hair_order`'s LE — there's no other LE on this row.

- [ ] **Step 16.5: Type-check**

```bash
bun run check-types
```

- [ ] **Step 16.6: Run the dev server and load the dashboard**

```bash
bun run dev
```

Open `http://localhost:3001/dashboard`. Confirm: stats render without errors. Switching the active LE in the topbar (after Task 17 below) should change the numbers; for now, just confirm the page doesn't crash with `legal_entity_id` undefined.

- [ ] **Step 16.7: Commit**

```bash
git add apps/web/src/functions/dashboard.ts
git commit -m "feat(web): scope dashboard stats by legal entity"
```

---

## Task 17: Topbar legal-entity switcher

**Files:**
- Create: `apps/web/src/components/legal-entity-switcher.tsx`
- Modify: `apps/web/src/routes/_authenticated/route.tsx`

- [ ] **Step 17.1: Create `apps/web/src/components/legal-entity-switcher.tsx`**

```tsx
import { Group, Select, Skeleton, Text } from "@mantine/core"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"

import { getActiveLegalEntityId } from "@/functions/get-active-legal-entity"
import { listLegalEntities } from "@/functions/legal-entities"
import { setActiveLegalEntity } from "@/functions/user-settings"
import { COUNTRY_FLAGS, type Country } from "@/lib/legal-entity"

const ALL_VALUE = "__all__"

export function LegalEntitySwitcher() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const legalEntitiesQuery = useQuery({
    queryKey: ["legal-entities"],
    queryFn: () => listLegalEntities(),
  })
  const activeQuery = useQuery({
    queryKey: ["active-legal-entity"],
    queryFn: () => getActiveLegalEntityId(),
  })

  const setActive = useMutation({
    mutationFn: (legalEntityId: string | null) => setActiveLegalEntity({ data: { legalEntityId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["active-legal-entity"] })
      router.invalidate()
    },
  })

  if (legalEntitiesQuery.isPending || activeQuery.isPending) {
    return <Skeleton height={32} width={200} />
  }
  if (legalEntitiesQuery.isError || activeQuery.isError) {
    return (
      <Text size="sm" c="red">
        LE switcher failed
      </Text>
    )
  }

  const data = [
    { value: ALL_VALUE, label: "All legal entities" },
    ...legalEntitiesQuery.data.map((le) => ({
      value: le.id,
      label: `${COUNTRY_FLAGS[le.country as Country] ?? ""} ${le.name}`,
    })),
  ]

  const value = activeQuery.data ?? ALL_VALUE

  return (
    <Group gap="xs" wrap="nowrap">
      <Select
        size="sm"
        w={220}
        data={data}
        value={value}
        onChange={(next) => {
          if (next === null) return
          setActive.mutate(next === ALL_VALUE ? null : next)
        }}
        allowDeselect={false}
        aria-label="Active legal entity"
      />
    </Group>
  )
}
```

- [ ] **Step 17.2: Mount the switcher in `_authenticated/route.tsx`**

In the `AuthenticatedLayout` component, inside the `<Group gap="xs" visibleFrom="xs" wrap="nowrap">` that holds `<ColorSchemeToggle />` and `<UserSection />`, insert `<LegalEntitySwitcher />` as the first child:

```tsx
<Group gap="xs" visibleFrom="xs" wrap="nowrap">
  <LegalEntitySwitcher />
  <ColorSchemeToggle />
  <UserSection />
</Group>
```

Also add it inside the `Drawer` group (mobile) so it's available there too.

Add the import:
```tsx
import { LegalEntitySwitcher } from "@/components/legal-entity-switcher"
```

- [ ] **Step 17.3: Smoke-test in the browser**

```bash
bun run dev
```

Open `http://localhost:3001/dashboard`. Sign in. Confirm:
- The switcher shows "All legal entities", "🇬🇧 Prive UK Ltd", "🇱🇹 Prive LT IV", "🇱🇹 Prive LT MB".
- Selecting one persists across reload.
- Switching from "All" to "Prive LT MB" causes the appointments / hair-orders / dashboard pages to refetch (lists shrink, since all backfilled rows belong to UK Ltd).

- [ ] **Step 17.4: Commit**

```bash
git add apps/web/src/components/legal-entity-switcher.tsx apps/web/src/routes/_authenticated/route.tsx
git commit -m "feat(web): topbar legal-entity switcher"
```

---

## Task 18: Appointment form — salon + LE pickers + active-LE banner

**Files:**
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`
- Modify: `apps/web/src/routes/_authenticated/appointments/index.tsx` (if a form lives here for create)

The form must:
- Require a salon and a legal entity.
- On salon change, default `legalEntityId` to the salon's `defaultLegalEntityId`.
- Disable the LE picker when the salon is in the UK (only `Prive UK Ltd` is allowed).
- Filter the LE picker options to LEs sharing the salon's country.

- [ ] **Step 18.1: Read the existing form**

Read `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx` first. Identify the Mantine `useForm` hook (or controlled state) used for `name`, `startsAt`, `clientId`. The new fields integrate alongside.

- [ ] **Step 18.2: Add salon + LE state**

Inside the component, add queries:

```tsx
const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })
const salonsQuery = useQuery({ queryKey: ["salons"], queryFn: () => listSalons() })
```

Add fields to the form's initial values: `salonId: appointment.salonId`, `legalEntityId: appointment.legalEntityId` (existing data) or empty strings for the create case.

- [ ] **Step 18.3: Render salon + LE selects**

```tsx
<Select
  label="Salon"
  required
  data={(salonsQuery.data ?? []).map((s) => ({
    value: s.id,
    label: `${COUNTRY_FLAGS[s.country as Country] ?? ""} ${s.name}`,
  }))}
  value={form.values.salonId}
  onChange={(salonId) => {
    form.setFieldValue("salonId", salonId ?? "")
    const selectedSalon = salonsQuery.data?.find((s) => s.id === salonId)
    if (selectedSalon) {
      form.setFieldValue("legalEntityId", selectedSalon.defaultLegalEntityId)
    }
  }}
/>
{(() => {
  const selectedSalon = salonsQuery.data?.find((s) => s.id === form.values.salonId)
  const country = selectedSalon?.country
  const countryLEs = (legalEntitiesQuery.data ?? []).filter((le) => le.country === country)
  const lockedToSingle = countryLEs.length === 1
  return (
    <Select
      label="Legal entity"
      required
      disabled={!country || lockedToSingle}
      data={countryLEs.map((le) => ({
        value: le.id,
        label: `${COUNTRY_FLAGS[le.country as Country] ?? ""} ${le.name}`,
      }))}
      value={form.values.legalEntityId}
      onChange={(v) => form.setFieldValue("legalEntityId", v ?? "")}
    />
  )
})()}
```

The submit handler now sends `salonId` and `legalEntityId` along with the rest.

- [ ] **Step 18.4: Show LE badge on the list page**

In `apps/web/src/routes/_authenticated/appointments/index.tsx`, the list query (`getAppointments`) already returns `legalEntity` (Task 13). Render a small `Badge` next to each row showing `appointment.legalEntity.name`.

Also render the active-LE filter banner above the list:

```tsx
{activeQuery.data ? (
  <Group gap="xs" mb="xs">
    <Text size="sm" c="dimmed">Filtering: {activeName}</Text>
    <Anchor size="sm" onClick={() => setActive.mutate(null)}>clear</Anchor>
  </Group>
) : null}
```

(`activeName` is the LE name resolved from `legalEntitiesQuery.data` and `activeQuery.data`.)

- [ ] **Step 18.5: Type-check + smoke-test**

```bash
bun run check-types
bun run dev
```

Open `/appointments`. Verify:
- List shows an LE badge per row.
- Banner appears when active LE is set; "clear" returns to "All".
- Open an appointment, change the salon to `Prive LT`, the LE picker now shows IV and MB; pick MB and save.
- Try (manually, in dev tools) sending an `updateAppointment` request with mismatched country — server returns the country-mismatch error.

- [ ] **Step 18.6: Commit**

```bash
git add apps/web/src/routes/_authenticated/appointments
git commit -m "feat(web): appointment salon + legal entity pickers and filter banner"
```

---

## Task 19: Transaction form — LE picker

**Files:**
- Find the transaction form file under `apps/web/src/components/transactions/` (use `grep -rn "createTransaction\|updateTransaction" apps/web/src` if needed).
- Modify whichever component(s) build the form.

- [ ] **Step 19.1: Locate the form**

```bash
grep -rn "createTransaction\|updateTransaction" /Users/mselvenis/dev/prive-admin/apps/web/src
```

Identify the file with the Zod-validated form for transactions.

- [ ] **Step 19.2: Add the LE picker**

Add a `legalEntityId` field to the form's initial values. Default it to the active LE if set; otherwise leave empty (the user must pick).

```tsx
const activeQuery = useQuery({ queryKey: ["active-legal-entity"], queryFn: () => getActiveLegalEntityId() })
const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

// In useForm initial values:
legalEntityId: existing?.legalEntityId ?? activeQuery.data ?? "",

// In JSX:
<Select
  label="Legal entity"
  required
  data={(legalEntitiesQuery.data ?? []).map((le) => ({
    value: le.id,
    label: `${COUNTRY_FLAGS[le.country as Country] ?? ""} ${le.name}`,
  }))}
  value={form.values.legalEntityId}
  onChange={(v) => form.setFieldValue("legalEntityId", v ?? "")}
/>
```

The submit handler now passes `legalEntityId` to `createTransaction` / `updateTransaction`.

- [ ] **Step 19.3: Display the LE on the transactions list/section**

`getTransactionsByAppointmentId` now returns `legalEntity`. Render its name as a small badge or column.

- [ ] **Step 19.4: Type-check + smoke-test**

```bash
bun run check-types
bun run dev
```

Create a transaction on an LT appointment with `legalEntityId = MB`. Reload, verify the badge says MB.

- [ ] **Step 19.5: Commit**

```bash
git add apps/web/src/components/transactions
git commit -m "feat(web): transaction legal entity picker"
```

---

## Task 20: Hair-order form — LE picker + banner

**Files:**
- Modify: `apps/web/src/routes/_authenticated/hair-orders/$hairOrderId.tsx`
- Modify: `apps/web/src/routes/_authenticated/hair-orders/index.tsx`

- [ ] **Step 20.1: Add LE picker to the hair-order edit/create form**

```tsx
const activeQuery = useQuery({ queryKey: ["active-legal-entity"], queryFn: () => getActiveLegalEntityId() })
const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

// In form initial values:
legalEntityId: hairOrder?.legalEntityId ?? activeQuery.data ?? "",

// In JSX:
<Select
  label="Legal entity (payer)"
  required
  data={(legalEntitiesQuery.data ?? []).map((le) => ({
    value: le.id,
    label: `${COUNTRY_FLAGS[le.country as Country] ?? ""} ${le.name}`,
  }))}
  value={form.values.legalEntityId}
  onChange={(v) => form.setFieldValue("legalEntityId", v ?? "")}
/>
```

- [ ] **Step 20.2: Add LE badge to the hair-orders list + active-LE banner (mirror Task 18.4)**

- [ ] **Step 20.3: Type-check + smoke-test**

```bash
bun run check-types
bun run dev
```

Create a hair order with LE = `Prive LT IV`. Reload, verify the badge.

- [ ] **Step 20.4: Commit**

```bash
git add apps/web/src/routes/_authenticated/hair-orders
git commit -m "feat(web): hair-order legal entity picker and filter banner"
```

---

## Task 21: `/legal-entities` route — list + edit

**Files:**
- Create: `apps/web/src/routes/_authenticated/legal-entities/route.tsx` (only if you want a sub-layout; otherwise omit and put pages directly under the path)
- Create: `apps/web/src/routes/_authenticated/legal-entities/index.tsx`
- Create: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId.tsx`
- Modify: `apps/web/src/routes/_authenticated/route.tsx` (add `/legal-entities` to the `tabs` array)

- [ ] **Step 21.1: Create `index.tsx` — list view**

```tsx
import { Anchor, Card, Group, Stack, Table, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { listLegalEntities } from "@/functions/legal-entities"
import { COUNTRY_FLAGS, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"

export const Route = createFileRoute("/_authenticated/legal-entities/")({
  component: LegalEntitiesIndex,
})

function LegalEntitiesIndex() {
  const q = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

  return (
    <Stack p="md">
      <Title order={3}>Legal entities</Title>
      <Card withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Country</Table.Th>
              <Table.Th>Default currency</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(q.data ?? []).map((le) => (
              <Table.Tr key={le.id}>
                <Table.Td>{le.name}</Table.Td>
                <Table.Td>{le.type}</Table.Td>
                <Table.Td>
                  {COUNTRY_FLAGS[le.country as Country]} {COUNTRY_LABELS[le.country as Country]}
                </Table.Td>
                <Table.Td>{le.defaultCurrency}</Table.Td>
                <Table.Td>
                  <Anchor component={Link} to="/legal-entities/$legalEntityId" params={{ legalEntityId: le.id }}>
                    Edit
                  </Anchor>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  )
}
```

- [ ] **Step 21.2: Create `$legalEntityId.tsx` — edit form**

```tsx
import { Button, Card, Group, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { zodResolver } from "@mantine/form"

import { getLegalEntity, updateLegalEntity } from "@/functions/legal-entities"
import { legalEntityUpdateSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/legal-entities/$legalEntityId")({
  component: LegalEntityEdit,
})

function LegalEntityEdit() {
  const { legalEntityId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const q = useQuery({
    queryKey: ["legal-entity", legalEntityId],
    queryFn: () => getLegalEntity({ data: { id: legalEntityId } }),
  })

  const form = useForm({
    initialValues: {
      id: legalEntityId,
      name: q.data?.name ?? "",
      registrationNumber: q.data?.registrationNumber ?? "",
      vatNumber: q.data?.vatNumber ?? "",
    },
    validate: zodResolver(legalEntityUpdateSchema),
  })

  // Reset form when data loads
  if (q.data && form.values.name === "" && q.data.name) {
    form.setValues({
      id: legalEntityId,
      name: q.data.name,
      registrationNumber: q.data.registrationNumber ?? "",
      vatNumber: q.data.vatNumber ?? "",
    })
  }

  const save = useMutation({
    mutationFn: (input: typeof form.values) => updateLegalEntity({ data: input }),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: ["legal-entities"] })
      await queryClient.invalidateQueries({ queryKey: ["legal-entity", legalEntityId] })
      navigate({ to: "/legal-entities" })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Stack p="md">
      <Title order={3}>Edit legal entity</Title>
      <Card withBorder>
        <form onSubmit={form.onSubmit((values) => save.mutate(values))}>
          <Stack>
            <TextInput label="Name" required {...form.getInputProps("name")} />
            <TextInput
              label="Registration number"
              placeholder="Companies House / JAR"
              {...form.getInputProps("registrationNumber")}
            />
            <TextInput label="VAT number" {...form.getInputProps("vatNumber")} />
            <Group>
              <Button type="submit" loading={save.isPending}>
                Save
              </Button>
              <Button component={Link} to="/legal-entities" variant="subtle">
                Cancel
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  )
}
```

- [ ] **Step 21.3: Add `/legal-entities` to the topbar tabs**

In `apps/web/src/routes/_authenticated/route.tsx`, add to the `tabs` array (alphabetical placement is fine):

```ts
{ value: "/legal-entities", label: "Legal entities" },
```

- [ ] **Step 21.4: Regenerate the route tree**

```bash
bun run dev
```

TanStack Router watch-mode regenerates `apps/web/src/routeTree.gen.ts`. If running CI, run `bun run build` once to refresh it.

- [ ] **Step 21.5: Smoke-test**

Open `/legal-entities`. Edit `Prive UK Ltd`, set a registration number, save, verify the value persists.

- [ ] **Step 21.6: Commit**

```bash
git add apps/web/src/routes/_authenticated/legal-entities apps/web/src/routes/_authenticated/route.tsx apps/web/src/routeTree.gen.ts
git commit -m "feat(web): legal-entities admin route"
```

---

## Task 22: `/salons` route — list + create + edit

**Files:**
- Create: `apps/web/src/routes/_authenticated/salons/index.tsx`
- Create: `apps/web/src/routes/_authenticated/salons/$salonId.tsx`
- Modify: `apps/web/src/routes/_authenticated/route.tsx` (add `/salons` to tabs)

- [ ] **Step 22.1: List + "New salon" page**

```tsx
import { Anchor, Button, Card, Group, Stack, Table, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { listSalons } from "@/functions/salons"
import { COUNTRY_FLAGS, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"

export const Route = createFileRoute("/_authenticated/salons/")({
  component: SalonsIndex,
})

function SalonsIndex() {
  const q = useQuery({ queryKey: ["salons"], queryFn: () => listSalons() })

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={3}>Salons</Title>
        <Button component={Link} to="/salons/$salonId" params={{ salonId: "new" }}>
          New salon
        </Button>
      </Group>
      <Card withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Country</Table.Th>
              <Table.Th>Default legal entity</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(q.data ?? []).map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td>{s.name}</Table.Td>
                <Table.Td>
                  {COUNTRY_FLAGS[s.country as Country]} {COUNTRY_LABELS[s.country as Country]}
                </Table.Td>
                <Table.Td>{s.defaultLegalEntity?.name}</Table.Td>
                <Table.Td>
                  <Anchor component={Link} to="/salons/$salonId" params={{ salonId: s.id }}>
                    Edit
                  </Anchor>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  )
}
```

- [ ] **Step 22.2: Create/edit page (`$salonId.tsx`) — handles both `new` and an existing id**

```tsx
import { Button, Card, Group, Select, Stack, TextInput, Title } from "@mantine/core"
import { useForm, zodResolver } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"

import { listLegalEntities } from "@/functions/legal-entities"
import { createSalon, getSalon, updateSalon } from "@/functions/salons"
import { COUNTRIES, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"
import { salonSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/salons/$salonId")({
  component: SalonEdit,
})

function SalonEdit() {
  const { salonId } = Route.useParams()
  const isNew = salonId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })
  const salonQuery = useQuery({
    queryKey: ["salon", salonId],
    queryFn: () => getSalon({ data: { id: salonId } }),
    enabled: !isNew,
  })

  const form = useForm({
    initialValues: {
      id: undefined as string | undefined,
      name: "",
      country: "GB" as Country,
      defaultLegalEntityId: "",
      address: "",
    },
    validate: zodResolver(salonSchema),
  })

  if (!isNew && salonQuery.data && form.values.name === "") {
    form.setValues({
      id: salonQuery.data.id,
      name: salonQuery.data.name,
      country: salonQuery.data.country as Country,
      defaultLegalEntityId: salonQuery.data.defaultLegalEntityId,
      address: salonQuery.data.address ?? "",
    })
  }

  const countryLEs = (legalEntitiesQuery.data ?? []).filter((le) => le.country === form.values.country)

  const save = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (isNew) {
        return createSalon({ data: values })
      }
      return updateSalon({ data: { ...values, id: salonId } })
    },
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Saved" })
      await queryClient.invalidateQueries({ queryKey: ["salons"] })
      navigate({ to: "/salons" })
    },
    onError: (err: Error) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Stack p="md">
      <Title order={3}>{isNew ? "New salon" : "Edit salon"}</Title>
      <Card withBorder>
        <form onSubmit={form.onSubmit((values) => save.mutate(values))}>
          <Stack>
            <TextInput label="Name" required {...form.getInputProps("name")} />
            <Select
              label="Country"
              required
              data={COUNTRIES.map((c) => ({ value: c, label: COUNTRY_LABELS[c] }))}
              value={form.values.country}
              onChange={(v) => {
                form.setFieldValue("country", (v as Country) ?? "GB")
                form.setFieldValue("defaultLegalEntityId", "")
              }}
            />
            <Select
              label="Default legal entity"
              required
              data={countryLEs.map((le) => ({ value: le.id, label: le.name }))}
              value={form.values.defaultLegalEntityId}
              onChange={(v) => form.setFieldValue("defaultLegalEntityId", v ?? "")}
            />
            <TextInput label="Address" {...form.getInputProps("address")} />
            <Group>
              <Button type="submit" loading={save.isPending}>
                Save
              </Button>
              <Button component={Link} to="/salons" variant="subtle">
                Cancel
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Stack>
  )
}
```

- [ ] **Step 22.3: Add `/salons` tab**

In `apps/web/src/routes/_authenticated/route.tsx` `tabs` array, add:

```ts
{ value: "/salons", label: "Salons" },
```

- [ ] **Step 22.4: Smoke-test**

Open `/salons`. Click "New salon", fill in `Test Salon` country=`LT`, default LE=`Prive LT IV`, save. Verify it appears in the list. Edit it, save again. Try creating a UK salon with default LE = LT IV — server should reject with the country-mismatch error (we surface it in the notification).

- [ ] **Step 22.5: Commit**

```bash
git add apps/web/src/routes/_authenticated/salons apps/web/src/routes/_authenticated/route.tsx apps/web/src/routeTree.gen.ts
git commit -m "feat(web): salons admin route"
```

---

## Task 23: Final verification

- [ ] **Step 23.1: Type-check**

```bash
bun run check-types
```

Expected: zero errors across the workspace.

- [ ] **Step 23.2: Lint and format**

```bash
bun run check
```

Expected: clean.

- [ ] **Step 23.3: Run all tests**

```bash
bun run --filter @prive-admin-tanstack/db test
```

Expected: 2 tests pass (`whereActiveLegalEntity` cases).

- [ ] **Step 23.4: Acceptance walkthrough in the browser**

```bash
bun run dev
```

Walk through:
1. Sign in as user A. Switcher visible. Default = "All".
2. Switch to "🇱🇹 Prive LT MB". Appointments / hair orders / dashboard refetch — counts drop to zero (since backfill went to UK Ltd).
3. Switch back to "All". Counts return.
4. Open an appointment, change salon to `Prive LT`, LE auto-flips to `Prive LT IV`, change to MB, save. Refresh: persisted.
5. Open a hair order, set LE to `Prive LT MB`, save. Refresh: persisted.
6. `/legal-entities`: edit registration number on UK Ltd, save.
7. `/salons`: create a new LT salon with default LE = MB, save.
8. Sign out, sign in as user B (developer account). Confirm the switcher state is per-user (B starts at "All" or whatever B's last value was).
9. Try to delete a referenced legal entity by hand via SQL or API — should fail with FK violation. (Skip if no delete UI; we don't add one in this plan.)

- [ ] **Step 23.5: Push the branch**

```bash
git push -u origin feat/multi-legal-entity
```

- [ ] **Step 23.6: Open the PR**

```bash
gh pr create --title "feat: multi legal entity + salon tenancy" --body "$(cat <<'EOF'
## Summary
- New `legal_entity` and `salon` tables; `appointment` / `transaction` / `hair_order` scoped by `legal_entity_id`; `appointment` scoped to a `salon`
- Topbar legal-entity switcher (persisted in `user_settings.active_legal_entity_id`); list pages filter by active LE
- Backfill: all existing rows assigned to `Prive UK Ltd` and salon `Prive UK`; manual cleanup expected post-deploy
- New admin routes `/legal-entities` and `/salons`
- Country-match validation between salon and legal entity at the server-function layer

## Spec
docs/superpowers/specs/2026-05-03-multi-legal-entity-design.md

## Test plan
- [ ] Migration applies cleanly to a copy of the latest production backup
- [ ] After deploy, all existing rows show `legal_entity_id = Prive UK Ltd` and `salon_id = Prive UK`
- [ ] Topbar switcher refetches scoped lists when changed
- [ ] LT appointment can be reassigned to MB; UK appointment is locked to UK Ltd
- [ ] FK RESTRICT prevents deleting a referenced legal entity
EOF
)"
```

---

## Self-Review

**Spec coverage check:**
- Goal "Introduce `legal_entity` and `salon`" → Tasks 2, 3.
- Goal "Scope `appointment`, `transaction`, `hair_order`" → Tasks 4, 13, 14, 15.
- Goal "Tie every appointment to a salon; default LE from salon, allow override only when country has >1 LE" → Tasks 4, 13, 18.
- Goal "Active legal entity switcher" → Tasks 8, 9, 17.
- Goal "Migrate existing data into UK Ltd + Prive UK" → Task 6.
- Goal "Foundation for bills/taxes" → covered implicitly by Tasks 2, 3, 11.
- Spec section "DB-level constraints" → Task 6 (FK RESTRICT, CHECK, indexes).
- Spec section "App-level constraints (country match)" → Task 13 (`assertSameCountry`), Task 12 (`assertLegalEntityCountry`).
- Spec section "Edge cases — country set-once" → reflected in `/legal-entities` form by *not* including a country field (Task 21).
- Spec testing: scope helper unit test (Task 7); manual smoke for server fns + UI (Tasks 17, 18, 19, 20, 23).
- Spec rollout: branch + PR + verification (Task 23).

**Placeholders / contradictions:** None remaining. The Vitest `bun.lock` mention in Task 1.6 is fine — `bun add` updates `bun.lock` at the workspace root and inside the package; either or both may show in `git status`.

**Type/name consistency:**
- `legalEntity` (drizzle export) and `legal_entity` (table name) — consistent.
- `legalEntityId` column / form field / Zod field — consistent.
- `whereActiveLegalEntity(column, activeId)` signature — consistent.
- `setActiveLegalEntity({ legalEntityId })` payload — consistent across mutation sites.
- `readActiveLegalEntityId(userId)` server-internal helper — consistent.
- Country code values `'GB'` / `'LT'` — consistent.
- LE type values `'LTD'` / `'IV'` / `'MB'` — consistent.
- `COUNTRY_FLAGS` / `COUNTRY_LABELS` / `COUNTRIES` / `LEGAL_ENTITY_TYPES` — defined in `lib/legal-entity.ts`, consistent.
