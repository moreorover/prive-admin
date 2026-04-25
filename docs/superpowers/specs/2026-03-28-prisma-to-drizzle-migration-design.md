# Prisma to Drizzle Migration — Phase 1

Migrate the Next.js + Prisma + tRPC app (main branch) to the TanStack Start + Drizzle rewrite branch. Phase 1 covers schema conversion and core CRUD for Customers, Appointments, and Hair Orders.

## Scope

**In scope (Phase 1):**
- Full Drizzle schema (all 15 business models — they're tightly coupled)
- Server functions + UI for: Customers, Appointments, Hair Orders, Notes
- Navigation and layout updates

**Deferred (Phase 2+):**
- Transactions, Orders, Products, Hair Assigned
- Dashboard analytics (month-over-month comparisons)
- CSV import
- Calendar view

## 1. Drizzle Schema

Convert all Prisma models to Drizzle ORM in `packages/db/src/schema/`. Table names match Prisma's `@@map()` values so the existing production DB works without data migration.

### File organization

| File | Tables |
|------|--------|
| `customer.ts` | `customers` |
| `product.ts` | `products`, `product_variants` |
| `order.ts` | `orders`, `order_items` |
| `appointment.ts` | `appointments`, `appointment_personnel` |
| `transaction.ts` | `transactions` |
| `hair.ts` | `hair_orders`, `hair_assigned` |
| `note.ts` | `notes` |
| `auth.ts` | `user`, `session`, `account`, `verification` (existing, updated with business relations) |

### Key schema decisions

- No Postgres enums — use plain `text` columns with TypeScript union types for enum-like fields (`OrderType`, `OrderStatus`, `TransactionType`, `TransactionStatus`, `HairOrderStatus`). Avoids migration pain when adding/removing values.

- Auth table names must be updated to match Prisma's `@@map()` values: `user` → `users`, `session` → `sessions`, `account` → `accounts`, `verification` → `verifications`. Better Auth's Drizzle adapter supports custom table names.
- IDs: `text` with `cuid2` default (matching Prisma `@default(cuid(2))`)
- Amounts: `integer` (cents) — formatting is a UI concern
- Timestamps: `timestamp` with `defaultNow()` and `$onUpdate()`
- `hair_orders.uid`: `serial` (autoincrement) with unique constraint
- `appointment_personnel`: composite PK on `[personnelId, appointmentId]`
- `product_variants`: unique constraint on `[productId, size]`
- `order_items`: unique constraint on `[orderId, productVariantId]`
- All FK cascades match Prisma (CASCADE or SET NULL)
- `auth.ts` user table gains relations: `hairOrders`, `hairAssigned`, `notesCreated`

## 2. Server Functions

Replace tRPC routers with TanStack Start `createServerFn` in `apps/web/src/functions/`. All protected with `requireAuthMiddleware`, input validated with Zod.

### `functions/customers.ts`

| Function | Method | Description |
|----------|--------|-------------|
| `getCustomers` | GET | List all customers |
| `getCustomer` | GET | By id, with relations |
| `createCustomer` | POST | Zod-validated input |
| `updateCustomer` | POST | Partial update |

### `functions/appointments.ts`

| Function | Method | Description |
|----------|--------|-------------|
| `getAppointments` | GET | With date range filter |
| `getAppointment` | GET | By id, with client + personnel |
| `createAppointment` | POST | Create with client link |
| `updateAppointment` | POST | Partial update |
| `linkPersonnel` | POST | Add personnel to appointment |
| `getAppointmentsByCustomerId` | GET | Customer's appointments |

### `functions/hair-orders.ts`

| Function | Method | Description |
|----------|--------|-------------|
| `getHairOrders` | GET | Ordered by uid |
| `getHairOrder` | GET | By id, with assignments |
| `createHairOrder` | POST | Create with customer link |
| `updateHairOrder` | POST | Partial update |

### `functions/notes.ts`

| Function | Method | Description |
|----------|--------|-------------|
| `getNotes` | GET | Flexible filter (by customer/appointment/hairOrder) |
| `createNote` | POST | Create linked note |
| `updateNote` | POST | Update content |
| `deleteNote` | POST | Delete by id |

## 3. Routes & UI

File-based routing under `_authenticated.*`. shadcn/ui components (tables, forms, dialogs, cards).

### Pages

**Customers:**
- `_authenticated.customers.tsx` — list with table, search, "New Customer" dialog
- `_authenticated.customers.$customerId.tsx` — detail with tabs: overview, appointments, hair sales, notes

**Appointments:**
- `_authenticated.appointments.tsx` — list with table, date filtering
- `_authenticated.appointments.$appointmentId.tsx` — detail showing client, personnel, notes

**Hair Orders:**
- `_authenticated.hair-orders.tsx` — list with table, status badges
- `_authenticated.hair-orders.$hairOrderId.tsx` — detail showing assignments, notes

### Shared patterns

- Route loaders prefetch via `queryClient.prefetchQuery()`
- Forms use `@tanstack/react-form` + Zod
- CRUD via shadcn Dialog (not separate pages)
- Query key factory extended in `lib/query-keys.ts`
- Delete confirmations via AlertDialog

### Navigation

Update `_authenticated.tsx` sidebar: add Customers, Appointments, Hair Orders links. Rename "Dashboard" to "Playground" (keeps demo pages accessible). Index redirects to `/customers`.

## 4. Removals & Changes

### Kept as-is

- Auth setup (Better Auth, middleware, sign-in/sign-up)
- Root layout, theme provider, toaster
- Router config with React Query SSR integration
- All packages (db, auth, env, ui, config)
- Demo pages (dashboard → renamed to "Playground", files, files-direct) and their server functions

### Modified

| File | Change |
|------|--------|
| `packages/db/src/schema/` | Add business model files |
| `packages/db/src/schema/auth.ts` | Rename tables to match Prisma (`users`, `sessions`, etc.), add user relations to business models |
| `apps/web/src/lib/query-keys.ts` | Add keys for customers, appointments, hair orders, notes |
| `_authenticated.tsx` | Add new nav links, rename Dashboard to Playground |
| `_authenticated.dashboard.tsx` | Rename route to `_authenticated.playground.tsx` |
| `index.tsx` | Redirect to `/customers` |
