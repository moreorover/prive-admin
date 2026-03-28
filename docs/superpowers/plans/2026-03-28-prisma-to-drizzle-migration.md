# Prisma to Drizzle Migration — Phase 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Prisma schema to Drizzle ORM and build core CRUD pages (Customers, Appointments, Hair Orders, Notes) with TanStack Start server functions and shadcn/ui.

**Architecture:** Bottom-up — schema first, then server functions per entity, then UI pages. All business models are created in one pass since they're tightly coupled. Server functions replace tRPC routers using `createServerFn`. UI uses shadcn/ui with TanStack Form + Router.

**Tech Stack:** Drizzle ORM, TanStack Start (server functions), TanStack Router (file-based routing), TanStack React Query, TanStack React Form, shadcn/ui (base-ui), Zod v4, PostgreSQL

---

## File Structure

### Schema files (`packages/db/src/schema/`)

| File | Responsibility |
|------|---------------|
| `auth.ts` | User, Session, Account, Verification tables — **modify**: rename table names to match Prisma (`users`, `sessions`, etc.), add relations to business models |
| `customer.ts` | Customer table + relations |
| `product.ts` | Product + ProductVariant tables + relations |
| `order.ts` | Order + OrderItem tables + relations |
| `appointment.ts` | Appointment + PersonnelOnAppointments tables + relations |
| `transaction.ts` | Transaction table + relations |
| `hair.ts` | HairOrder + HairAssigned tables + relations |
| `note.ts` | Note table + relations |
| `index.ts` | Re-exports all schema files |

### Server functions (`apps/web/src/functions/`)

| File | Responsibility |
|------|---------------|
| `customers.ts` | getCustomers, getCustomer, createCustomer, updateCustomer |
| `appointments.ts` | getAppointments, getAppointment, createAppointment, updateAppointment, linkPersonnel, getAppointmentsByCustomerId |
| `hair-orders.ts` | getHairOrders, getHairOrder, createHairOrder, updateHairOrder |
| `notes.ts` | getNotes, createNote, updateNote, deleteNote |

### Route pages (`apps/web/src/routes/`)

| File | Responsibility |
|------|---------------|
| `_authenticated.tsx` | **Modify**: add nav links for Customers, Appointments, Hair Orders; rename Dashboard to Playground |
| `_authenticated.playground.tsx` | **Rename** from `_authenticated.dashboard.tsx` |
| `_authenticated.customers.tsx` | Customer list page |
| `_authenticated.customers.$customerId.tsx` | Customer detail page with tabs |
| `_authenticated.appointments.tsx` | Appointment list page |
| `_authenticated.appointments.$appointmentId.tsx` | Appointment detail page |
| `_authenticated.hair-orders.tsx` | Hair order list page |
| `_authenticated.hair-orders.$hairOrderId.tsx` | Hair order detail page |

### Shared (`apps/web/src/lib/`)

| File | Responsibility |
|------|---------------|
| `query-keys.ts` | **Modify**: add customer, appointment, hair order, note query keys |
| `schemas.ts` | **Create**: Zod validation schemas for all entities |

---

## Task 1: Drizzle Schema — Customer, Product, Order

**Files:**
- Create: `packages/db/src/schema/customer.ts`
- Create: `packages/db/src/schema/product.ts`
- Create: `packages/db/src/schema/order.ts`
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 1: Create customer schema**

Create `packages/db/src/schema/customer.ts`:

```typescript
import { createId } from "@paralleldrive/cuid2"
import { relations } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const customer = pgTable("customers", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull().unique(),
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
})

export const customerRelations = relations(customer, ({ many }) => ({
  orders: many(order),
  transactions: many(transaction),
  appointmentsAsCustomer: many(appointment),
  appointmentsAsPersonnel: many(personnelOnAppointments),
  hairOrders: many(hairOrder),
  hairAssigned: many(hairAssigned),
  notes: many(note),
}))
```

Note: The relation imports will reference tables from other files. They'll resolve once all schema files are created. For now, write the file with the relations referencing the table names — they'll be imported in a later step.

Actually, to avoid circular imports: define all **tables** in their respective files without relations first, then define all **relations** together. Let's restructure:

Create `packages/db/src/schema/customer.ts` (table only):

```typescript
import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const customer = pgTable("customers", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull().unique(),
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
})
```

- [ ] **Step 2: Create product schema**

Create `packages/db/src/schema/product.ts`:

```typescript
import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp, unique } from "drizzle-orm/pg-core"

import { customer } from "./customer"

export const product = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
})

export const productVariant = pgTable(
  "product_variants",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    price: integer("price").notNull(),
    stock: integer("stock").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique().on(table.productId, table.size)],
)
```

- [ ] **Step 3: Create order schema**

Create `packages/db/src/schema/order.ts`:

```typescript
import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp, date, unique } from "drizzle-orm/pg-core"

import { customer } from "./customer"
import { productVariant } from "./product"

export const order = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(createId),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("PURCHASE"),
  status: text("status").notNull().default("PENDING"),
  placedAt: date("placed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
})

export const orderItem = pgTable(
  "order_items",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    productVariantId: text("product_variant_id")
      .notNull()
      .references(() => productVariant.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    totalPrice: integer("total_price").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique().on(table.orderId, table.productVariantId)],
)
```

- [ ] **Step 4: Update schema index**

Update `packages/db/src/schema/index.ts`:

```typescript
export * from "./auth"
export * from "./customer"
export * from "./product"
export * from "./order"
```

- [ ] **Step 5: Install cuid2 dependency**

Run: `cd /Users/martynas/dev/prive/prive-admin/packages/db && bun add @paralleldrive/cuid2`

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/schema/ packages/db/package.json packages/db/node_modules
git commit -m "feat: add customer, product, and order drizzle schemas"
```

---

## Task 2: Drizzle Schema — Appointment, Transaction, Hair, Note

**Files:**
- Create: `packages/db/src/schema/appointment.ts`
- Create: `packages/db/src/schema/transaction.ts`
- Create: `packages/db/src/schema/hair.ts`
- Create: `packages/db/src/schema/note.ts`
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 1: Create appointment schema**

Create `packages/db/src/schema/appointment.ts`:

```typescript
import { createId } from "@paralleldrive/cuid2"
import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

import { customer } from "./customer"

export const appointment = pgTable("appointments", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.personnelId, table.appointmentId] })],
)
```

- [ ] **Step 2: Create transaction schema**

Create `packages/db/src/schema/transaction.ts`:

```typescript
import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp, date } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { customer } from "./customer"
import { order } from "./order"

export const transaction = pgTable("transactions", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name"),
  notes: text("notes"),
  amount: integer("amount").notNull(),
  type: text("type").notNull().default("BANK"),
  status: text("status").notNull().default("PENDING"),
  completedDateBy: date("completed_date_by").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
  appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "set null" }),
})
```

- [ ] **Step 3: Create hair schema**

Create `packages/db/src/schema/hair.ts`:

```typescript
import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, serial, text, timestamp, date } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { customer } from "./customer"
import { user } from "./auth"

export const hairOrder = pgTable("hair_orders", {
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
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
})

export const hairAssigned = pgTable("hair_assigned", {
  id: text("id").primaryKey().$defaultFn(createId),
  appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "cascade" }),
  hairOrderId: text("hair_order_id")
    .notNull()
    .references(() => hairOrder.id, { onDelete: "cascade" }),
  weightInGrams: integer("weight_in_grams").default(0).notNull(),
  soldFor: integer("sold_for").default(0).notNull(),
  profit: integer("profit").default(0).notNull(),
  pricePerGram: integer("price_per_gram").default(0).notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
})
```

- [ ] **Step 4: Create note schema**

Create `packages/db/src/schema/note.ts`:

```typescript
import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { customer } from "./customer"
import { hairOrder } from "./hair"
import { user } from "./auth"

export const note = pgTable("notes", {
  id: text("id").primaryKey().$defaultFn(createId),
  note: text("note").notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "cascade" }),
  hairOrderId: text("hair_order_id").references(() => hairOrder.id, { onDelete: "cascade" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
})
```

- [ ] **Step 5: Update schema index**

Update `packages/db/src/schema/index.ts`:

```typescript
export * from "./auth"
export * from "./customer"
export * from "./product"
export * from "./order"
export * from "./appointment"
export * from "./transaction"
export * from "./hair"
export * from "./note"
```

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/schema/
git commit -m "feat: add appointment, transaction, hair, and note drizzle schemas"
```

---

## Task 3: Drizzle Relations

**Files:**
- Create: `packages/db/src/schema/relations.ts`
- Modify: `packages/db/src/schema/auth.ts`
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 1: Create relations file**

Create `packages/db/src/schema/relations.ts` — this centralizes all relations to avoid circular imports:

```typescript
import { relations } from "drizzle-orm"

import { appointment, personnelOnAppointments } from "./appointment"
import { user, session, account } from "./auth"
import { customer } from "./customer"
import { hairAssigned, hairOrder } from "./hair"
import { note } from "./note"
import { order, orderItem } from "./order"
import { product, productVariant } from "./product"
import { transaction } from "./transaction"

// Auth relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  hairOrdersCreated: many(hairOrder),
  hairAssignedCreated: many(hairAssigned),
  notesCreated: many(note),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

// Customer relations
export const customerRelations = relations(customer, ({ many }) => ({
  orders: many(order),
  transactions: many(transaction),
  appointmentsAsCustomer: many(appointment),
  appointmentsAsPersonnel: many(personnelOnAppointments),
  hairOrders: many(hairOrder),
  hairAssigned: many(hairAssigned),
  notes: many(note),
}))

// Product relations
export const productRelations = relations(product, ({ many }) => ({
  variants: many(productVariant),
}))

export const productVariantRelations = relations(productVariant, ({ one, many }) => ({
  product: one(product, { fields: [productVariant.productId], references: [product.id] }),
  items: many(orderItem),
}))

// Order relations
export const orderRelations = relations(order, ({ one, many }) => ({
  customer: one(customer, { fields: [order.customerId], references: [customer.id] }),
  items: many(orderItem),
  transactions: many(transaction),
}))

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, { fields: [orderItem.orderId], references: [order.id] }),
  productVariant: one(productVariant, { fields: [orderItem.productVariantId], references: [productVariant.id] }),
}))

// Appointment relations
export const appointmentRelations = relations(appointment, ({ one, many }) => ({
  client: one(customer, { fields: [appointment.clientId], references: [customer.id] }),
  personnel: many(personnelOnAppointments),
  transactions: many(transaction),
  hairAssigned: many(hairAssigned),
  notes: many(note),
}))

export const personnelOnAppointmentsRelations = relations(personnelOnAppointments, ({ one }) => ({
  appointment: one(appointment, { fields: [personnelOnAppointments.appointmentId], references: [appointment.id] }),
  personnel: one(customer, { fields: [personnelOnAppointments.personnelId], references: [customer.id] }),
}))

// Transaction relations
export const transactionRelations = relations(transaction, ({ one }) => ({
  customer: one(customer, { fields: [transaction.customerId], references: [customer.id] }),
  order: one(order, { fields: [transaction.orderId], references: [order.id] }),
  appointment: one(appointment, { fields: [transaction.appointmentId], references: [appointment.id] }),
}))

// Hair relations
export const hairOrderRelations = relations(hairOrder, ({ one, many }) => ({
  customer: one(customer, { fields: [hairOrder.customerId], references: [customer.id] }),
  createdBy: one(user, { fields: [hairOrder.createdById], references: [user.id] }),
  hairAssigned: many(hairAssigned),
  notes: many(note),
}))

export const hairAssignedRelations = relations(hairAssigned, ({ one }) => ({
  appointment: one(appointment, { fields: [hairAssigned.appointmentId], references: [appointment.id] }),
  hairOrder: one(hairOrder, { fields: [hairAssigned.hairOrderId], references: [hairOrder.id] }),
  client: one(customer, { fields: [hairAssigned.clientId], references: [customer.id] }),
  createdBy: one(user, { fields: [hairAssigned.createdById], references: [user.id] }),
}))

// Note relations
export const noteRelations = relations(note, ({ one }) => ({
  customer: one(customer, { fields: [note.customerId], references: [customer.id] }),
  appointment: one(appointment, { fields: [note.appointmentId], references: [appointment.id] }),
  hairOrder: one(hairOrder, { fields: [note.hairOrderId], references: [hairOrder.id] }),
  createdBy: one(user, { fields: [note.createdById], references: [user.id] }),
}))
```

- [ ] **Step 2: Remove relations from auth.ts**

In `packages/db/src/schema/auth.ts`, remove the `userRelations`, `sessionRelations`, and `accountRelations` exports (lines 76-93) and the `import { relations } from "drizzle-orm"` import. Relations are now in `relations.ts`.

- [ ] **Step 3: Update schema index**

Update `packages/db/src/schema/index.ts`:

```typescript
export * from "./auth"
export * from "./customer"
export * from "./product"
export * from "./order"
export * from "./appointment"
export * from "./transaction"
export * from "./hair"
export * from "./note"
export * from "./relations"
```

- [ ] **Step 4: Verify schema compiles**

Run: `cd /Users/martynas/dev/prive/prive-admin && bun run --filter @prive-admin-tanstack/db check-types`

If no `check-types` script exists, run: `cd packages/db && bunx tsc --noEmit`

- [ ] **Step 5: Push schema to dev database**

Run: `cd /Users/martynas/dev/prive/prive-admin/packages/db && bun run db:push`

Verify tables are created without errors.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/schema/
git commit -m "feat: add drizzle relations and centralize in relations.ts"
```

---

## Task 4: Auth Schema Table Name Alignment

**Files:**
- Modify: `packages/db/src/schema/auth.ts`
- Modify: `packages/auth/src/index.ts`

- [ ] **Step 1: Rename auth table names to match Prisma**

In `packages/db/src/schema/auth.ts`, update the table name strings:

- `pgTable("user", ...)` → `pgTable("users", ...)`
- `pgTable("session", ...)` → `pgTable("sessions", ...)`
- `pgTable("account", ...)` → `pgTable("accounts", ...)`
- `pgTable("verification", ...)` → `pgTable("verifications", ...)`

- [ ] **Step 2: Update Better Auth adapter config**

In `packages/auth/src/index.ts`, Better Auth needs to know about custom table names. The drizzle adapter uses the schema directly — since the table variables are still named `user`, `session`, `account`, `verification` but the underlying SQL table names changed, the adapter should pick them up automatically from the schema import. Verify by checking auth still works after the push.

- [ ] **Step 3: Push schema changes**

Run: `cd /Users/martynas/dev/prive/prive-admin/packages/db && bun run db:push`

This will rename the tables. If there's existing data, drizzle-kit push should handle the rename.

- [ ] **Step 4: Verify auth still works**

Run: `cd /Users/martynas/dev/prive/prive-admin && bun run --filter web dev`

Navigate to `http://localhost:3001/login` and verify sign-in works.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/schema/auth.ts packages/auth/src/index.ts
git commit -m "refactor: rename auth tables to match prisma conventions (users, sessions, etc.)"
```

---

## Task 5: Zod Schemas & Query Keys

**Files:**
- Create: `apps/web/src/lib/schemas.ts`
- Modify: `apps/web/src/lib/query-keys.ts`

- [ ] **Step 1: Create validation schemas**

Create `apps/web/src/lib/schemas.ts`:

```typescript
import { z } from "zod"

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(5, "Name must be at least 5 characters long")
    .max(50, "Name cannot exceed 50 characters"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number must be at most 15 characters long")
    .regex(/^\+\d+$/, "Phone number must start with '+' and contain only digits after it")
    .nullish(),
})

export type CustomerInput = z.infer<typeof customerSchema>

export const appointmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  startsAt: z.union([z.string(), z.date()]),
  clientId: z.string().min(1, "Client is required"),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>

export const hairOrderSchema = z.object({
  id: z.string().optional(),
  placedAt: z.union([z.string(), z.date(), z.null()]),
  arrivedAt: z.union([z.string(), z.date(), z.null()]),
  customerId: z.string().min(1, "Customer is required"),
  status: z.enum(["PENDING", "COMPLETED"]).default("PENDING"),
  weightReceived: z.number().min(0),
  weightUsed: z.number().min(0),
  total: z.number().min(0),
})

export type HairOrderInput = z.infer<typeof hairOrderSchema>

export const noteSchema = z.object({
  id: z.string().optional(),
  note: z.string().min(1, "Note cannot be empty"),
  customerId: z.string().min(1, "Customer is required"),
  appointmentId: z.string().nullish(),
  hairOrderId: z.string().nullish(),
})

export type NoteInput = z.infer<typeof noteSchema>
```

- [ ] **Step 2: Update query keys**

Replace `apps/web/src/lib/query-keys.ts` with:

```typescript
export const dashboardKeys = {
  all: ["dashboard"] as const,
  data: () => [...dashboardKeys.all, "data"] as const,
  capabilityDetails: (title: string) => [...dashboardKeys.all, "capability-details", title] as const,
}

export const fileKeys = {
  all: ["files"] as const,
  list: () => [...fileKeys.all, "list"] as const,
}

export const customerKeys = {
  all: ["customers"] as const,
  list: () => [...customerKeys.all, "list"] as const,
  detail: (id: string) => [...customerKeys.all, "detail", id] as const,
}

export const appointmentKeys = {
  all: ["appointments"] as const,
  list: () => [...appointmentKeys.all, "list"] as const,
  detail: (id: string) => [...appointmentKeys.all, "detail", id] as const,
  byCustomer: (customerId: string) => [...appointmentKeys.all, "by-customer", customerId] as const,
}

export const hairOrderKeys = {
  all: ["hair-orders"] as const,
  list: () => [...hairOrderKeys.all, "list"] as const,
  detail: (id: string) => [...hairOrderKeys.all, "detail", id] as const,
}

export const noteKeys = {
  all: ["notes"] as const,
  list: (filter: Record<string, string | undefined>) => [...noteKeys.all, "list", filter] as const,
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/schemas.ts apps/web/src/lib/query-keys.ts
git commit -m "feat: add zod validation schemas and query key factories"
```

---

## Task 6: Server Functions — Customers

**Files:**
- Create: `apps/web/src/functions/customers.ts`

- [ ] **Step 1: Create customer server functions**

Create `apps/web/src/functions/customers.ts`:

```typescript
import { db } from "@prive-admin-tanstack/db"
import { customer } from "@prive-admin-tanstack/db/schema/customer"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"
import { customerSchema } from "@/lib/schemas"

export const getCustomers = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.customer.findMany({
      orderBy: (customer, { asc }) => [asc(customer.name)],
    })
  })

export const getCustomer = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.customer.findFirst({
      where: eq(customer.id, data.id),
    })
    if (!result) {
      throw new Error("Customer not found")
    }
    return result
  })

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .validator(customerSchema)
  .handler(async ({ data }) => {
    const [result] = await db
      .insert(customer)
      .values({ name: data.name, phoneNumber: data.phoneNumber })
      .returning()
    return result
  })

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .validator(customerSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [result] = await db
      .update(customer)
      .set({ name: data.name, phoneNumber: data.phoneNumber })
      .where(eq(customer.id, data.id!))
      .returning()
    return result
  })
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/martynas/dev/prive/prive-admin && bunx tsc --noEmit -p apps/web/tsconfig.json`

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/functions/customers.ts
git commit -m "feat: add customer server functions (CRUD)"
```

---

## Task 7: Server Functions — Appointments

**Files:**
- Create: `apps/web/src/functions/appointments.ts`

- [ ] **Step 1: Create appointment server functions**

Create `apps/web/src/functions/appointments.ts`:

```typescript
import { db } from "@prive-admin-tanstack/db"
import { appointment, personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, gte, lte } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"
import { appointmentSchema } from "@/lib/schemas"

export const getAppointments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const conditions = []
    if (data.startDate) {
      conditions.push(gte(appointment.startsAt, new Date(data.startDate)))
    }
    if (data.endDate) {
      conditions.push(lte(appointment.startsAt, new Date(data.endDate)))
    }

    return db.query.appointment.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { client: true },
      orderBy: (appointment, { asc }) => [asc(appointment.startsAt)],
    })
  })

export const getAppointment = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.appointment.findFirst({
      where: eq(appointment.id, data.id),
      with: {
        client: true,
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
  .validator(appointmentSchema)
  .handler(async ({ data }) => {
    const [result] = await db
      .insert(appointment)
      .values({
        name: data.name,
        startsAt: new Date(data.startsAt),
        clientId: data.clientId,
      })
      .returning()
    return result
  })

export const updateAppointment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .validator(appointmentSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [result] = await db
      .update(appointment)
      .set({
        name: data.name,
        startsAt: new Date(data.startsAt),
      })
      .where(eq(appointment.id, data.id!))
      .returning()
    return result
  })

export const linkPersonnel = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ appointmentId: z.string(), personnelIds: z.array(z.string()) }))
  .handler(async ({ data }) => {
    const values = data.personnelIds.map((personnelId) => ({
      appointmentId: data.appointmentId,
      personnelId,
    }))
    await db.insert(personnelOnAppointments).values(values)
  })

export const getAppointmentsByCustomerId = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ customerId: z.string() }))
  .handler(async ({ data }) => {
    return db.query.appointment.findMany({
      where: eq(appointment.clientId, data.customerId),
      orderBy: (appointment, { desc }) => [desc(appointment.startsAt)],
    })
  })
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/functions/appointments.ts
git commit -m "feat: add appointment server functions (CRUD + personnel linking)"
```

---

## Task 8: Server Functions — Hair Orders & Notes

**Files:**
- Create: `apps/web/src/functions/hair-orders.ts`
- Create: `apps/web/src/functions/notes.ts`

- [ ] **Step 1: Create hair order server functions**

Create `apps/web/src/functions/hair-orders.ts`:

```typescript
import { db } from "@prive-admin-tanstack/db"
import { hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"
import { hairOrderSchema } from "@/lib/schemas"

export const getHairOrders = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.hairOrder.findMany({
      with: { createdBy: true, customer: true },
      orderBy: (hairOrder, { asc }) => [asc(hairOrder.uid)],
    })
  })

export const getHairOrder = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.hairOrder.findFirst({
      where: eq(hairOrder.id, data.id),
      with: {
        createdBy: true,
        customer: true,
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
  .validator(hairOrderSchema)
  .handler(async ({ data, context }) => {
    const [result] = await db
      .insert(hairOrder)
      .values({
        placedAt: data.placedAt ? String(data.placedAt) : null,
        arrivedAt: data.arrivedAt ? String(data.arrivedAt) : null,
        status: data.status,
        customerId: data.customerId,
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
  .validator(hairOrderSchema.required({ id: true }))
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
      })
      .where(eq(hairOrder.id, data.id!))
      .returning()
    return result
  })
```

- [ ] **Step 2: Create note server functions**

Create `apps/web/src/functions/notes.ts`:

```typescript
import { db } from "@prive-admin-tanstack/db"
import { note } from "@prive-admin-tanstack/db/schema/note"
import { createServerFn } from "@tanstack/react-start"
import { and, eq } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"
import { noteSchema } from "@/lib/schemas"

export const getNotes = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .validator(
    z.object({
      customerId: z.string().optional(),
      appointmentId: z.string().optional(),
      hairOrderId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const conditions = []
    if (data.customerId) conditions.push(eq(note.customerId, data.customerId))
    if (data.appointmentId) conditions.push(eq(note.appointmentId, data.appointmentId))
    if (data.hairOrderId) conditions.push(eq(note.hairOrderId, data.hairOrderId))

    return db.query.note.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { createdBy: true },
      orderBy: (note, { desc }) => [desc(note.createdAt)],
    })
  })

export const createNote = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .validator(noteSchema)
  .handler(async ({ data, context }) => {
    const [result] = await db
      .insert(note)
      .values({
        note: data.note,
        customerId: data.customerId,
        appointmentId: data.appointmentId,
        hairOrderId: data.hairOrderId,
        createdById: context.session.user.id,
      })
      .returning()
    return result
  })

export const updateNote = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .validator(noteSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [result] = await db
      .update(note)
      .set({ note: data.note })
      .where(eq(note.id, data.id!))
      .returning()
    return result
  })

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(note).where(eq(note.id, data.id))
  })
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/functions/hair-orders.ts apps/web/src/functions/notes.ts
git commit -m "feat: add hair order and note server functions"
```

---

## Task 9: Navigation — Rename Dashboard, Add Nav Links

**Files:**
- Rename: `apps/web/src/routes/_authenticated.dashboard.tsx` → `apps/web/src/routes/_authenticated.playground.tsx`
- Modify: `apps/web/src/routes/_authenticated.tsx`
- Modify: `apps/web/src/components/sign-in-form.tsx`

- [ ] **Step 1: Rename dashboard route to playground**

Run: `mv apps/web/src/routes/_authenticated.dashboard.tsx apps/web/src/routes/_authenticated.playground.tsx`

In the renamed file, update the route definition:

Change: `createFileRoute("/_authenticated/dashboard")`
To: `createFileRoute("/_authenticated/playground")`

Also update the header text from "Dashboard" to "Playground" in the component.

- [ ] **Step 2: Update nav items in `_authenticated.tsx`**

In `apps/web/src/routes/_authenticated.tsx`, replace the `NAV_ITEMS` array and update the lucide imports:

Replace the lucide import with:
```typescript
import {
  AlertCircle,
  ChevronLeft,
  FolderOpen,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Scissors,
  Sun,
  Users,
  Calendar,
  X,
} from "lucide-react"
```

Replace the `NAV_ITEMS` constant:
```typescript
const NAV_ITEMS = [
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/appointments", label: "Appointments", icon: Calendar },
  { to: "/hair-orders", label: "Hair Orders", icon: Scissors },
  { to: "/playground", label: "Playground", icon: LayoutDashboard },
  { to: "/files", label: "Files (Proxy)", icon: FolderOpen },
  { to: "/files-direct", label: "Files (Direct)", icon: HardDrive },
] as const
```

- [ ] **Step 3: Update sign-in redirect**

In `apps/web/src/components/sign-in-form.tsx`, change the redirect from `/dashboard` to `/customers`:

Change: `to: redirectTo ?? "/dashboard"`
To: `to: redirectTo ?? "/customers"`

- [ ] **Step 4: Verify dev server starts**

Run: `cd /Users/martynas/dev/prive/prive-admin && bun run --filter web dev`

Check that navigation works, playground page loads at `/playground`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/_authenticated.dashboard.tsx apps/web/src/routes/_authenticated.playground.tsx apps/web/src/routes/_authenticated.tsx apps/web/src/components/sign-in-form.tsx
git commit -m "refactor: rename dashboard to playground, add business entity nav links"
```

---

## Task 10: Customer List Page

**Files:**
- Create: `apps/web/src/routes/_authenticated.customers.tsx`

- [ ] **Step 1: Create customer list route**

Create `apps/web/src/routes/_authenticated.customers.tsx`:

```typescript
import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@prive-admin-tanstack/ui/components/dialog"
import { Input } from "@prive-admin-tanstack/ui/components/input"
import { Label } from "@prive-admin-tanstack/ui/components/label"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prive-admin-tanstack/ui/components/table"
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Plus, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

import { getCustomers, createCustomer } from "@/functions/customers"
import { customerKeys } from "@/lib/query-keys"
import { customerSchema } from "@/lib/schemas"

const customersQueryOptions = queryOptions({
  queryKey: customerKeys.list(),
  queryFn: () => getCustomers(),
})

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(customersQueryOptions)
  },
})

function CustomerFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof customerSchema>) => createCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      onOpenChange(false)
      toast.success("Customer created")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const form = useForm({
    defaultValues: { name: "", phoneNumber: "" },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        name: value.name,
        phoneNumber: value.phoneNumber || null,
      })
    },
    validators: { onSubmit: customerSchema },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>Add a new customer to the system.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
          <form.Field name="phoneNumber">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Phone Number</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="+1234567890"
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Customer"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CustomersPage() {
  const { data: customers, isLoading } = useQuery(customersQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" />
            <span className="text-xs tracking-widest uppercase">Customers</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Customers</h1>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3" />
          New Customer
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                : customers?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link
                          to="/customers/$customerId"
                          params={{ customerId: c.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.phoneNumber ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && customers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No customers yet. Create your first one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
```

- [ ] **Step 2: Verify page renders**

Run dev server and navigate to `/customers`. Verify:
- Page loads without errors
- Table shows (empty or with data)
- "New Customer" dialog opens and submits

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated.customers.tsx
git commit -m "feat: add customer list page with create dialog"
```

---

## Task 11: Customer Detail Page

**Files:**
- Create: `apps/web/src/routes/_authenticated.customers.$customerId.tsx`

- [ ] **Step 1: Create customer detail route**

Create `apps/web/src/routes/_authenticated.customers.$customerId.tsx`:

```typescript
import { Badge } from "@prive-admin-tanstack/ui/components/badge"
import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@prive-admin-tanstack/ui/components/dialog"
import { Input } from "@prive-admin-tanstack/ui/components/input"
import { Label } from "@prive-admin-tanstack/ui/components/label"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prive-admin-tanstack/ui/components/table"
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, Edit, Phone, Plus, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { getCustomer, updateCustomer } from "@/functions/customers"
import { getAppointmentsByCustomerId } from "@/functions/appointments"
import { getNotes, createNote, deleteNote } from "@/functions/notes"
import { customerKeys, appointmentKeys, noteKeys } from "@/lib/query-keys"
import { customerSchema, noteSchema } from "@/lib/schemas"

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  component: CustomerDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: customerKeys.detail(params.customerId),
          queryFn: () => getCustomer({ data: { id: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: appointmentKeys.byCustomer(params.customerId),
          queryFn: () => getAppointmentsByCustomerId({ data: { customerId: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: noteKeys.list({ customerId: params.customerId }),
          queryFn: () => getNotes({ data: { customerId: params.customerId } }),
        }),
      ),
    ])
  },
})

function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: { id: string; name: string; phoneNumber: string | null }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { id: string; name: string; phoneNumber?: string | null }) =>
      updateCustomer({ data: { id: data.id, name: data.name, phoneNumber: data.phoneNumber } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      onOpenChange(false)
      toast.success("Customer updated")
    },
    onError: (error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: { name: customer.name, phoneNumber: customer.phoneNumber ?? "" },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: customer.id, name: value.name, phoneNumber: value.phoneNumber || null })
    },
    validators: { onSubmit: customerSchema },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Update customer details.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">{error?.message}</p>
                ))}
              </div>
            )}
          </form.Field>
          <form.Field name="phoneNumber">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Phone Number</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="+1234567890"
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">{error?.message}</p>
                ))}
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddNoteDialog({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { note: string; customerId: string }) => createNote({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
      onOpenChange(false)
      toast.success("Note added")
    },
    onError: (error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: { note: "" },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ note: value.note, customerId })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="note">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Note</Label>
                <textarea
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  placeholder="Write a note..."
                />
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Note"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CustomerDetailPage() {
  const { customerId } = Route.useParams()
  const [editOpen, setEditOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: customer, isLoading } = useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => getCustomer({ data: { id: customerId } }),
  })

  const { data: appointments } = useQuery({
    queryKey: appointmentKeys.byCustomer(customerId),
    queryFn: () => getAppointmentsByCustomerId({ data: { customerId } }),
  })

  const { data: notes } = useQuery({
    queryKey: noteKeys.list({ customerId }),
    queryFn: () => getNotes({ data: { customerId } }),
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteNote({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
      toast.success("Note deleted")
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!customer) {
    return <div className="px-6 py-8 text-muted-foreground">Customer not found.</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link to="/customers" className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" />
            Back to customers
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{customer.name}</h1>
          {customer.phoneNumber && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="size-3" />
              {customer.phoneNumber}
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Edit className="size-3" />
          Edit
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments && appointments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Link
                          to="/appointments/$appointmentId"
                          params={{ appointmentId: a.id }}
                          className="text-primary hover:underline"
                        >
                          {a.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(a.startsAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No appointments yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Notes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setNoteOpen(true)}>
              <Plus className="size-3" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {notes && notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="flex items-start justify-between rounded-md border p-3">
                    <div className="space-y-1">
                      <p className="text-sm">{n.note}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.createdBy?.name ?? "Unknown"} &middot; {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteNoteMutation.mutate(n.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
      <AddNoteDialog customerId={customerId} open={noteOpen} onOpenChange={setNoteOpen} />
    </div>
  )
}
```

- [ ] **Step 2: Verify page renders**

Navigate to `/customers`, click a customer name, verify detail page loads with appointments and notes sections.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated.customers.\$customerId.tsx
git commit -m "feat: add customer detail page with edit, appointments, and notes"
```

---

## Task 12: Appointment List & Detail Pages

**Files:**
- Create: `apps/web/src/routes/_authenticated.appointments.tsx`
- Create: `apps/web/src/routes/_authenticated.appointments.$appointmentId.tsx`

- [ ] **Step 1: Create appointment list route**

Create `apps/web/src/routes/_authenticated.appointments.tsx`:

```typescript
import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent } from "@prive-admin-tanstack/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@prive-admin-tanstack/ui/components/dialog"
import { Input } from "@prive-admin-tanstack/ui/components/input"
import { Label } from "@prive-admin-tanstack/ui/components/label"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prive-admin-tanstack/ui/components/table"
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Calendar, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { getAppointments, createAppointment } from "@/functions/appointments"
import { getCustomers } from "@/functions/customers"
import { appointmentKeys, customerKeys } from "@/lib/query-keys"
import { appointmentSchema } from "@/lib/schemas"

const appointmentsQueryOptions = queryOptions({
  queryKey: appointmentKeys.list(),
  queryFn: () => getAppointments({ data: {} }),
})

export const Route = createFileRoute("/_authenticated/appointments")({
  component: AppointmentsPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(appointmentsQueryOptions)
  },
})

function CreateAppointmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const mutation = useMutation({
    mutationFn: (data: { name: string; startsAt: string; clientId: string }) =>
      createAppointment({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      onOpenChange(false)
      toast.success("Appointment created")
    },
    onError: (error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: { name: "", startsAt: "", clientId: "" },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
    validators: { onSubmit: appointmentSchema },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>Schedule a new appointment.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">{error?.message}</p>
                ))}
              </div>
            )}
          </form.Field>
          <form.Field name="startsAt">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Date & Time</Label>
                <Input
                  id={field.name}
                  type="datetime-local"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">{error?.message}</p>
                ))}
              </div>
            )}
          </form.Field>
          <form.Field name="clientId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Client</Label>
                <select
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="">Select a client...</option>
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">{error?.message}</p>
                ))}
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Appointment"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AppointmentsPage() {
  const { data: appointments, isLoading } = useQuery(appointmentsQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4" />
            <span className="text-xs tracking-widest uppercase">Appointments</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Appointments</h1>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3" />
          New Appointment
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                : appointments?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Link
                          to="/appointments/$appointmentId"
                          params={{ appointmentId: a.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {a.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.client?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(a.startsAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && appointments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No appointments yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateAppointmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
```

- [ ] **Step 2: Create appointment detail route**

Create `apps/web/src/routes/_authenticated.appointments.$appointmentId.tsx`:

```typescript
import { Badge } from "@prive-admin-tanstack/ui/components/badge"
import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import { useQuery, queryOptions } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"

import { getAppointment } from "@/functions/appointments"
import { appointmentKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/appointments/$appointmentId")({
  component: AppointmentDetailPage,
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      queryOptions({
        queryKey: appointmentKeys.detail(params.appointmentId),
        queryFn: () => getAppointment({ data: { id: params.appointmentId } }),
      }),
    )
  },
})

function AppointmentDetailPage() {
  const { appointmentId } = Route.useParams()

  const { data: appointment, isLoading } = useQuery({
    queryKey: appointmentKeys.detail(appointmentId),
    queryFn: () => getAppointment({ data: { id: appointmentId } }),
  })

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!appointment) {
    return <div className="px-6 py-8 text-muted-foreground">Appointment not found.</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      {/* Header */}
      <div className="space-y-1">
        <Link to="/appointments" className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3" />
          Back to appointments
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{appointment.name}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {new Date(appointment.startsAt).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <User className="size-3" />
            <Link
              to="/customers/$customerId"
              params={{ customerId: appointment.client.id }}
              className="text-primary hover:underline"
            >
              {appointment.client.name}
            </Link>
          </span>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Personnel</CardTitle>
          </CardHeader>
          <CardContent>
            {appointment.personnel && appointment.personnel.length > 0 ? (
              <div className="space-y-2">
                {appointment.personnel.map((p) => (
                  <div key={p.personnelId} className="flex items-center gap-2 rounded-md border p-2">
                    <User className="size-3 text-muted-foreground" />
                    <span className="text-sm">{p.personnel.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No personnel assigned.</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {appointment.notes && appointment.notes.length > 0 ? (
              <div className="space-y-3">
                {appointment.notes.map((n) => (
                  <div key={n.id} className="rounded-md border p-3">
                    <p className="text-sm">{n.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.createdBy?.name ?? "Unknown"} &middot; {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated.appointments.tsx apps/web/src/routes/_authenticated.appointments.\$appointmentId.tsx
git commit -m "feat: add appointment list and detail pages"
```

---

## Task 13: Hair Order List & Detail Pages

**Files:**
- Create: `apps/web/src/routes/_authenticated.hair-orders.tsx`
- Create: `apps/web/src/routes/_authenticated.hair-orders.$hairOrderId.tsx`

- [ ] **Step 1: Create hair order list route**

Create `apps/web/src/routes/_authenticated.hair-orders.tsx`:

```typescript
import { Badge } from "@prive-admin-tanstack/ui/components/badge"
import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent } from "@prive-admin-tanstack/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@prive-admin-tanstack/ui/components/dialog"
import { Input } from "@prive-admin-tanstack/ui/components/input"
import { Label } from "@prive-admin-tanstack/ui/components/label"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prive-admin-tanstack/ui/components/table"
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Link, createFileRoute } from "@tanstack/react-router"
import { Plus, Scissors } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { getHairOrders, createHairOrder } from "@/functions/hair-orders"
import { getCustomers } from "@/functions/customers"
import { hairOrderKeys, customerKeys } from "@/lib/query-keys"
import { hairOrderSchema } from "@/lib/schemas"

const hairOrdersQueryOptions = queryOptions({
  queryKey: hairOrderKeys.list(),
  queryFn: () => getHairOrders(),
})

export const Route = createFileRoute("/_authenticated/hair-orders")({
  component: HairOrdersPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(hairOrdersQueryOptions)
  },
})

function CreateHairOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const mutation = useMutation({
    mutationFn: (data: {
      customerId: string
      placedAt: string | null
      arrivedAt: string | null
      status: "PENDING" | "COMPLETED"
      weightReceived: number
      weightUsed: number
      total: number
    }) => createHairOrder({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      onOpenChange(false)
      toast.success("Hair order created")
    },
    onError: (error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: {
      customerId: "",
      placedAt: "",
      weightReceived: 0,
      total: 0,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        customerId: value.customerId,
        placedAt: value.placedAt || null,
        arrivedAt: null,
        status: "PENDING",
        weightReceived: value.weightReceived,
        weightUsed: 0,
        total: value.total,
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Hair Order</DialogTitle>
          <DialogDescription>Create a new hair order.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="customerId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Customer</Label>
                <select
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="">Select a customer...</option>
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>
          <form.Field name="placedAt">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Placed At</Label>
                <Input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="weightReceived">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Weight (g)</Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="total">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Total (cents)</Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                </div>
              )}
            </form.Field>
          </div>
          <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Hair Order"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HairOrdersPage() {
  const { data: hairOrders, isLoading } = useQuery(hairOrdersQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scissors className="size-4" />
            <span className="text-xs tracking-widest uppercase">Hair Orders</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Hair Orders</h1>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3" />
          New Order
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Weight (g)</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                : hairOrders?.map((ho) => (
                    <TableRow key={ho.id}>
                      <TableCell>
                        <Link
                          to="/hair-orders/$hairOrderId"
                          params={{ hairOrderId: ho.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          #{ho.uid}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ho.customer?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={ho.status === "COMPLETED" ? "default" : "outline"}>
                          {ho.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ho.weightReceived}g</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ho.placedAt ? new Date(ho.placedAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && hairOrders?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hair orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateHairOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
```

- [ ] **Step 2: Create hair order detail route**

Create `apps/web/src/routes/_authenticated.hair-orders.$hairOrderId.tsx`:

```typescript
import { Badge } from "@prive-admin-tanstack/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prive-admin-tanstack/ui/components/table"
import { useQuery, queryOptions } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, Scissors, User, Weight } from "lucide-react"

import { getHairOrder } from "@/functions/hair-orders"
import { hairOrderKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/hair-orders/$hairOrderId")({
  component: HairOrderDetailPage,
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      queryOptions({
        queryKey: hairOrderKeys.detail(params.hairOrderId),
        queryFn: () => getHairOrder({ data: { id: params.hairOrderId } }),
      }),
    )
  },
})

function HairOrderDetailPage() {
  const { hairOrderId } = Route.useParams()

  const { data: hairOrder, isLoading } = useQuery({
    queryKey: hairOrderKeys.detail(hairOrderId),
    queryFn: () => getHairOrder({ data: { id: hairOrderId } }),
  })

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!hairOrder) {
    return <div className="px-6 py-8 text-muted-foreground">Hair order not found.</div>
  }

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      {/* Header */}
      <div className="space-y-1">
        <Link to="/hair-orders" className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3" />
          Back to hair orders
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Hair Order #{hairOrder.uid}</h1>
          <Badge variant={hairOrder.status === "COMPLETED" ? "default" : "outline"}>
            {hairOrder.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="size-3" />
            <Link
              to="/customers/$customerId"
              params={{ customerId: hairOrder.customer.id }}
              className="text-primary hover:underline"
            >
              {hairOrder.customer.name}
            </Link>
          </span>
          <span>Created by {hairOrder.createdBy?.name ?? "Unknown"}</span>
        </div>
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Weight Received</p>
            <p className="text-lg font-bold">{hairOrder.weightReceived}g</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Weight Used</p>
            <p className="text-lg font-bold">{hairOrder.weightUsed}g</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Price/Gram</p>
            <p className="text-lg font-bold">{formatCents(hairOrder.pricePerGram)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{formatCents(hairOrder.total)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hair Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            {hairOrder.hairAssigned && hairOrder.hairAssigned.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Sold For</TableHead>
                    <TableHead>Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hairOrder.hairAssigned.map((ha) => (
                    <TableRow key={ha.id}>
                      <TableCell>{ha.client?.name ?? "—"}</TableCell>
                      <TableCell>{ha.weightInGrams}g</TableCell>
                      <TableCell>{formatCents(ha.soldFor)}</TableCell>
                      <TableCell>{formatCents(ha.profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No hair assigned yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {hairOrder.notes && hairOrder.notes.length > 0 ? (
              <div className="space-y-3">
                {hairOrder.notes.map((n) => (
                  <div key={n.id} className="rounded-md border p-3">
                    <p className="text-sm">{n.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.createdBy?.name ?? "Unknown"} &middot; {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated.hair-orders.tsx apps/web/src/routes/_authenticated.hair-orders.\$hairOrderId.tsx
git commit -m "feat: add hair order list and detail pages"
```

---

## Task 14: Final Verification

- [ ] **Step 1: Start dev server**

Run: `cd /Users/martynas/dev/prive/prive-admin && bun run --filter web dev`

- [ ] **Step 2: Verify all pages load**

Navigate through each route and verify:
- `/customers` — list loads, create dialog works
- `/customers/:id` — detail page shows appointments + notes
- `/appointments` — list loads, create dialog works with customer selector
- `/appointments/:id` — detail page shows personnel + notes
- `/hair-orders` — list loads, create dialog works
- `/hair-orders/:id` — detail page shows assignments + notes + stats
- `/playground` — old dashboard still works
- `/files` and `/files-direct` — demo pages still work

- [ ] **Step 3: Fix any TypeScript errors**

Run: `cd /Users/martynas/dev/prive/prive-admin && bunx tsc --noEmit -p apps/web/tsconfig.json`

Fix any type errors found.

- [ ] **Step 4: Run linter**

Run: `cd /Users/martynas/dev/prive/prive-admin && bun run lint`

Fix any lint errors.

- [ ] **Step 5: Format**

Run: `cd /Users/martynas/dev/prive/prive-admin && bun run format`

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "fix: resolve type and lint errors from migration"
```
