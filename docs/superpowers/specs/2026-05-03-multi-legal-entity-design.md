# Multi Legal Entity + Salon Tenancy

**Date:** 2026-05-03
**Status:** Draft (pending user review)
**Scope:** Tenancy foundation only. Bills/expenses and taxes are deferred to separate specs.

## Problem

The app currently manages appointments, customers, hair orders, and transactions as a single-tenant system. In reality, the work is split across three legal entities:

- **UK Ltd** — UK limited company.
- **LT IV** — Lithuanian *individuali veikla* (sole-proprietor activity).
- **LT MB** — Lithuanian *mažoji bendrija* (small partnership).

Appointments happen in physical salons (one in the UK, one in Lithuania today, more possible). The UK salon's appointments are always billed by UK Ltd. The LT salon's appointments can be billed by either MB or IV depending on who is doing the work that day.

Each legal entity has its own books — its own transactions, its own purchased hair inventory (for cost tracking), and (later) its own bills and tax filings. The system needs to scope all bookkeeping-relevant data to a legal entity while keeping shared resources (customers, personnel) global.

## Goals

1. Introduce `legal_entity` and `salon` as first-class entities.
2. Scope `appointment`, `transaction`, and `hair_order` by legal entity.
3. Tie every appointment to a salon; default the appointment's legal entity from the salon, allow override only when the salon's country has more than one legal entity (LT case).
4. Provide a global "active legal entity" switcher that filters all list views.
5. Migrate existing single-tenant data into a chosen legal entity without manual per-row tagging.
6. Lay a clean foundation that later specs (bills, taxes) can build on by adding `legal_entity_id` columns to new tables.

## Non-goals

- Bills/expenses (equipment, rent, utilities, vendors).
- Tax tracking (VAT, GPM, Sodra, per-jurisdiction reports).
- Per-LE P&L dashboards.
- Inter-LE transfer transactions for hair (explicitly out — see "Hair use across LEs" below).
- Products and retail orders scoping (deferred until those features are actually used).
- Per-LE roles / permissions / membership tables.

## Decisions

| Topic | Decision |
| --- | --- |
| Order of work | Tenancy first. Bills + taxes are separate specs. |
| Salon ↔ LE | Salon has a default LE. UK salon → UK Ltd (locked). LT salon → IV default; appointment can override to MB. |
| Customers / personnel | Global. Not LE-scoped. |
| Hair inventory | `hair_order.legal_entity_id` records the **payer** of the batch. No constraint on which LE later consumes the hair (no country, no auto-transfer transactions). |
| `hair_assigned` | Inherits its appointment's LE. No constraint vs `hair_order.legal_entity_id`. |
| Transactions | Mandatory `legal_entity_id`. |
| Products / orders | Untouched in this spec. |
| Users | Two users (owner + developer), both have full access to all LEs. No membership table now. |
| Existing data | Backfill all existing rows into UK Ltd, edit later via UI. |
| Active LE | Stored in `user_settings.active_legal_entity_id`. Topbar switcher writes here. "All" mode = no filter. |
| Table name | `legal_entity` (not `organization` — avoids collision with better-auth's organization plugin). |

## Architecture

Two new tables (`legal_entity`, `salon`) plus three FK columns added to existing tables (`appointment.salon_id`, `appointment.legal_entity_id`, `transaction.legal_entity_id`, `hair_order.legal_entity_id`). One column added to `user_settings` (`active_legal_entity_id`).

A shared scope helper (`whereActiveLegalEntity`) is applied at the query layer in every list/aggregate server function for the three scoped tables. "All" mode passes `null` and the helper returns `undefined` (no clause).

Customer, personnel (= customer rows used via `appointment_personnel`), `hair_assigned`, and `note` remain global. Their books context is derived through their parent appointment / hair_order when reports need it.

## Data model

### New tables

```ts
// packages/db/src/schema/legal-entity.ts
export const legalEntity = pgTable("legal_entity", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  type: text("type").notNull(),                          // 'LTD' | 'IV' | 'MB'
  country: text("country").notNull(),                    // 'GB' | 'LT'
  defaultCurrency: text("default_currency").notNull(),   // 'GBP' | 'EUR'
  registrationNumber: text("registration_number"),
  vatNumber: text("vat_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()).notNull(),
})
```

CHECK constraints (added by migration, not via pg enum, to keep evolution cheap):

- `legal_entity.type IN ('LTD','IV','MB')`
- `legal_entity.country IN ('GB','LT')`

```ts
// packages/db/src/schema/salon.ts
export const salon = pgTable("salon", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  country: text("country").notNull(),                    // 'GB' | 'LT'
  defaultLegalEntityId: text("default_legal_entity_id")
    .notNull()
    .references(() => legalEntity.id, { onDelete: "restrict" }),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()).notNull(),
})
```

CHECK: `salon.country IN ('GB','LT')`.

### Modified tables

`appointment`:

```ts
salonId:        text("salon_id").notNull().references(() => salon.id, { onDelete: "restrict" })
legalEntityId:  text("legal_entity_id").notNull().references(() => legalEntity.id, { onDelete: "restrict" })
```

`transaction`:

```ts
legalEntityId:  text("legal_entity_id").notNull().references(() => legalEntity.id, { onDelete: "restrict" })
```

`hair_order`:

```ts
legalEntityId:  text("legal_entity_id").notNull().references(() => legalEntity.id, { onDelete: "restrict" })
```

`user_settings`:

```ts
activeLegalEntityId: text("active_legal_entity_id").references(() => legalEntity.id, { onDelete: "set null" })
```

### Indexes

- `appointment(legal_entity_id, starts_at)`
- `appointment(salon_id, starts_at)`
- `transaction(legal_entity_id, completed_date_by)`
- `hair_order(legal_entity_id, placed_at)`

### Drizzle relations

Add `legalEntity` to relations of `appointment`, `transaction`, `hair_order`, `salon`, `user_settings`. Add `salon` to relations of `appointment`. `legalEntity` has many `salon`/`appointment`/`transaction`/`hair_order`. `salon` has many `appointment`.

## Migration

Backfill target: **UK Ltd**. Initial salons: **Prive UK** (GB) and **Prive LT** (LT).

The migration is split into three drizzle migration files so we can backfill between schema steps. All steps run inside a single transaction per file.

### Step 1 — additive (nullable columns + seed)

- Create `legal_entity`, `salon`.
- Add the new columns nullable.
- Seed three legal entities:
  - `Prive UK Ltd` — type `LTD`, country `GB`, default currency `GBP`.
  - `Prive LT IV` — type `IV`, country `LT`, default currency `EUR`.
  - `Prive LT MB` — type `MB`, country `LT`, default currency `EUR`.
- Seed two salons:
  - `Prive UK` — country `GB`, default LE = `Prive UK Ltd`.
  - `Prive LT` — country `LT`, default LE = `Prive LT IV`.

Registration / VAT numbers left empty; the user will fill them via UI.

### Step 2 — data backfill

- `UPDATE appointment SET salon_id = $priveUkId, legal_entity_id = $ukLtdId WHERE salon_id IS NULL`
- `UPDATE transaction SET legal_entity_id = $ukLtdId WHERE legal_entity_id IS NULL`
- `UPDATE hair_order SET legal_entity_id = $ukLtdId WHERE legal_entity_id IS NULL`
- Verify post-update: `SELECT count(*) FROM appointment WHERE salon_id IS NULL OR legal_entity_id IS NULL` returns 0; same check for `transaction` and `hair_order`. If non-zero, the migration aborts (raises inside the transaction).

The chosen IDs are looked up by stable identifying fields (`legal_entity.type` + `legal_entity.country`, `salon.name` + `salon.country`) to avoid hard-coded UUID values in SQL.

### Step 3 — tighten

- `ALTER COLUMN ... SET NOT NULL` on the four backfilled columns.
- Add CHECK constraints listed in "Data model".
- Add the indexes listed in "Indexes".

## Query scoping

New helper:

```ts
// packages/db/src/scope.ts
export function whereActiveLegalEntity(
  column: PgColumn,
  activeId: string | null,
) {
  return activeId ? eq(column, activeId) : undefined
}
```

Active LE resolution helper (web app):

```ts
// apps/web/src/functions/get-active-legal-entity.ts
export const getActiveLegalEntity = createServerFn(...).handler(async ({ context }) => {
  const settings = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, context.user.id) })
  return settings?.activeLegalEntityId ?? null  // null = "All" mode
})
```

Server functions to update (one-by-one in the implementation plan):

- `appointments.ts` — list/get filtered by active LE; create requires `salonId` + `legalEntityId` (defaulting from salon); update validates country match.
- `transactions.ts` — list/get filtered; create/update requires LE.
- `hair-orders.ts` — list/get filtered; create/update requires LE (payer).
- `dashboard.ts` / `get-dashboard-data.ts` — totals filtered; "All" aggregates across.
- `customers.ts`, `notes.ts`, `hair-assigned.ts` — no scope filter; remain global.
- `user-settings.ts` — add `setActiveLegalEntity(id | null)`.

New server function modules:

- `legal-entities.ts` — `listLegalEntities()`, `getLegalEntity(id)`, `updateLegalEntity(...)`. No `createLegalEntity` for now (the three are seeded; user can add later by extending this function, but it's not in scope).
- `salons.ts` — `listSalons()`, `listSalonsForCountry(country)`, `createSalon(...)`, `updateSalon(...)`.

## UI

### Topbar switcher

- Mantine `Select` in the app shell header.
- Options: `All`, then one row per legal entity (with a country-flag prefix and the LE's `name`).
- Persists via `setActiveLegalEntity` on change.
- Initial value loaded from `user_settings.active_legal_entity_id`. Default for a fresh user record: `null` (= "All").
- Switching invalidates the relevant TanStack Router routes so list queries refetch.

### Appointment create/edit

- Salon picker (required).
- On salon change: `legalEntityId` auto-fills with `salon.defaultLegalEntityId`.
- Legal entity picker (required):
  - UK salon: locked to UK Ltd, disabled.
  - LT salon: shows IV and MB; default = salon's default (IV).
- List rows show a small badge with the LE name so MB vs IV is visible at a glance.

### Transaction create/edit

- Legal entity picker required.
- Default = active LE if set; otherwise (= "All" mode) no default — user must pick.

### Hair order create/edit

- Legal entity picker required (= payer).
- Default = active LE if set; otherwise no default.

### List filtering

- All scoped list pages (`/appointments`, `/transactions`, `/hair-orders`, dashboard) filter by active LE.
- Page header shows a banner: `Filtering: LT MB · clear` (clears to "All" via `setActiveLegalEntity(null)`).

### New routes

- `/legal-entities` — list + edit form (name, registration #, VAT #). Type, country, currency are read-only (set-once, see "Edge cases").
- `/salons` — list + create/edit (name, country, default LE, address).

## Constraints, integrity, edge cases

### DB-level

- All new FKs use `ON DELETE RESTRICT`. Deleting a legal entity or salon while anything references it is blocked at the DB layer.
- CHECK constraints listed in "Data model".

### App-level

- `appointment.create/update`: assert `salon.country === legalEntity.country`. UK salon picking an LT entity (or vice versa) is rejected by Zod input schema and re-checked in the server function.
- `transaction.create/update`: no salon coupling; just LE existence.
- `hair_order.create/update`: LE existence.
- `setActiveLegalEntity`: id must exist OR be null.

### Edge cases

- **Salon's default LE changed later.** Allowed. `salon.defaultLegalEntityId` is mutable. Existing appointments retain their captured `legal_entity_id` (treated as immutable history).
- **LE country changed.** Disallowed via UI — country is set-once. Changing country would break invariants on every dependent salon/appointment.
- **Deleting an LE / salon.** UI checks dependent row count first and refuses if >0, prompting "reassign to X" workflow (manual edits). The DB-level RESTRICT is the safety net.
- **"All" mode write.** Create forms require an explicit LE pick when active = "All". No silent fallback to a default LE.
- **Currency mismatch.** Transaction currency is independent of `legalEntity.defaultCurrency`. UI pre-fills with the LE's default but the user can change it (already supported by the recent GBP/EUR work).
- **LT appointment with MB override.** Allowed; constraint is country-only. The legal entity picker shows every legal entity with the same country as the selected salon (the salon's default is pre-selected).
- **Hair order LE ≠ appointment LE on hair_assigned.** Allowed. No warning, no auto inter-LE transfer transaction. Cost stays in the buying LE's books; revenue stays in the selling LE's books. Mismatch accepted per Q4-B / Q10-B.

### Auth

- Two users, both have full access to all LEs.
- No per-LE permissions; no membership table; no role concept.
- Future: a membership table can be added without touching this spec's tables.

## Hair use across LEs (clarification)

This caused the most discussion during brainstorming so it's called out separately:

- Hair is bought in batches (`hair_order`). The batch is paid for by one legal entity.
- Hair is consumed via `hair_assigned`, attached to an appointment.
- LT IV and LT MB share a single physical hair pool — neither pays the other when they consume hair the other one bought.
- UK Ltd's hair can also be consumed in LT, and vice versa, with no inter-LE transaction.
- Result: `hair_order.legal_entity_id` records who paid (so cost lands in their P&L). `hair_assigned`'s LE (= its appointment's LE) records who sold (so revenue lands in their P&L). Profit attribution may not match a strict accounting view; the user accepts this.

## Testing

- Migration is dry-run on a copy of the latest backup (`backups/postgres_backup_2026-05-01_02-07-04.sql`). Verify zero NULL rows in the four backfilled columns post-migration.
- Unit tests for `whereActiveLegalEntity`: `null` → `undefined`; specific id → `eq(...)` clause shape.
- Server function tests:
  - `appointments.create` rejects salon/LE country mismatch.
  - `appointments.list` filtered by active LE; returns full set in "All" mode.
  - `setActiveLegalEntity(null)` clears filter.
  - Deleting an LE that has appointments / transactions / hair orders fails with FK violation (caught and rendered as a friendly error in the UI).
- UI smoke test (Playwright or manual): switch LE in topbar, list refetches, count changes.
- Manual: log in as both users, confirm both see the same data and the same active-LE switcher behavior.

## Rollout

Single-deploy plan. The app has two users; brief downtime is acceptable.

1. Branch `feat/multi-legal-entity` (separate from this spec branch).
2. One PR with: schema migrations + scope helper + server-function updates + UI changes.
3. Pre-deploy R2 backup runs automatically (existing release workflow, commit `f0a0a4b`).
4. Deploy to VPS. Migrations run on container start.
5. Post-deploy verification:
   - All existing rows now have `legal_entity_id = UK Ltd` and `salon_id = Prive UK`.
   - Topbar switcher visible and functional.
   - Create a test appointment in the LT salon, override LE to MB, confirm persisted; delete after.
6. Manual cleanup over the following days: edit existing appointments / transactions / hair orders to reassign to their correct LE/salon via UI.

### Rollback

- Roll the image back to a previous `IMAGE_TAG` (the new columns sit unused; old code ignores them).
- If the schema must be rolled back, restore from the pre-deploy R2 backup.

## Open follow-up specs (not blocking this one)

- **Bills / expenses** — vendors, equipment purchases, salon rent, utilities, recurring bills. Will add a new table with `legal_entity_id` FK.
- **Taxes** — VAT (UK Ltd), GPM + Sodra (LT), per-jurisdiction return preparation. Will use `legal_entity.type` to drive jurisdiction-specific logic.
- **Per-LE dashboards / P&L reports.**
- **Products + retail orders LE scoping** — when those features are actually used.
- **Per-LE permissions** — if outside parties ever get access (e.g., an accountant).
