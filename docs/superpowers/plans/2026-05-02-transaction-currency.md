# Transaction Currency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GBP/EUR currency support to transactions with a per-customer default that's overridable per-transaction. Backfill all existing rows to GBP.

**Architecture:** Two new `text` columns (`transaction.currency`, `customer.preferred_currency`), each defaulting to `'GBP'` so existing rows backfill on `db:push`. A new shared module `apps/web/src/lib/currency.ts` centralises the allow-list, Zod schema, symbol map, and `formatMinor` formatter. Aggregations (customer summary, appointment totals, dashboard stats) return per-currency shapes; UI renders a card/block per currency present.

**Tech Stack:** Drizzle (PostgreSQL), TanStack Start server fns, Mantine 9 (`NativeSelect`, `NumberInput`), `@mantine/form`, Zod.

**Spec:** `docs/superpowers/specs/2026-05-02-transaction-currency-design.md`

**Branch:** `feat/transaction-currency` (already created and contains the spec commit).

**Testing approach:** This repo has no automated test runner. Verification per task:

- `cd apps/web && bun run check-types` — TypeScript verification
- `bun run check` (root) — Oxlint + Oxfmt
- Manual smoke in `bun run dev` (root) where called out

---

## File Map

**Schema (packages/db/src/schema/)**
- Modify `customer.ts` — add `preferredCurrency` column.
- Modify `transaction.ts` — add `currency` column.

**Shared lib (apps/web/src/lib/)**
- Create `currency.ts` — `CURRENCIES`, `Currency`, `currencySchema`, `currencySymbol`, `formatMinor`, `CURRENCY_OPTIONS`.
- Modify `schemas.ts` — add `preferredCurrency` to `customerSchema`.

**Transaction UI (apps/web/src/components/transactions/)**
- Modify `transaction-form.tsx` — currency select, dynamic `NumberInput` prefix, rename `amountPounds` → `amountMajor`.
- Modify `create-transaction-dialog.tsx` — accept `defaultCurrency` prop, thread into form.
- Modify `edit-transaction-dialog.tsx` — initial currency from transaction row.
- Modify `delete-transaction-dialog.tsx` — replace `formatCents` with `formatMinor(amount, currency)`.
- Modify `transactions-table.tsx` — add `currency` to `TransactionRow`, replace `formatCents` with `formatMinor`.

**Server fns (apps/web/src/functions/)**
- Modify `transactions.ts` — add `currency` to field schema; insert/update writes column.
- Modify `customers.ts` — accept `preferredCurrency` on create/update; `getCustomerSummary` returns per-currency totals.
- Modify `dashboard.ts` — `getTransactionStatsForDate` returns `{ GBP, EUR }` shape; helper `categoryFromMinor(raw, currency)`.

**Routes (apps/web/src/routes/_authenticated/)**
- Modify `customers/index.tsx` — add `preferredCurrency` to create form.
- Modify `customers/$customerId.tsx` — add `preferredCurrency` to edit form, drop `formatCurrency`, render split-totals StatCard.
- Modify `appointments/$appointmentId.tsx` — group txs by currency for totals; pass customer `preferredCurrency` as `defaultCurrency` to `CreateTransactionDialog`.
- Modify `dashboard.tsx` — render per-currency `EnhancedStatCard`s.

---

## Task 1: Add currency columns to schema

**Files:**
- Modify: `packages/db/src/schema/customer.ts`
- Modify: `packages/db/src/schema/transaction.ts`

- [ ] **Step 1: Add `preferredCurrency` to `customer`**

Edit `packages/db/src/schema/customer.ts` — replace the file contents with:

```ts
import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const customer = pgTable("customer", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull().unique(),
  phoneNumber: text("phone_number"),
  preferredCurrency: text("preferred_currency").notNull().default("GBP"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
})
```

- [ ] **Step 2: Add `currency` to `transaction`**

Edit `packages/db/src/schema/transaction.ts` — add the `currency` column right after `amount`:

```ts
import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp, date } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { customer } from "./customer"
import { order } from "./order"

export const transaction = pgTable("transaction", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name"),
  notes: text("notes"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("GBP"),
  type: text("type").notNull().default("BANK"),
  status: text("status").notNull().default("PENDING"),
  completedDateBy: date("completed_date_by").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
  appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "set null" }),
})
```

- [ ] **Step 3: Push migration to local Postgres**

Run from repo root:

```bash
bun run db:push
```

Expected: Drizzle prints two `ALTER TABLE … ADD COLUMN … NOT NULL DEFAULT 'GBP'` statements (one per table) and exits without prompting for destructive changes. If it asks about renames, answer "create column" — there are no renames.

- [ ] **Step 4: Verify backfill in psql**

Run (assumes the dev `DATABASE_URL` is exported from `apps/web/.env`):

```bash
psql "$DATABASE_URL" -c "SELECT count(*) total, count(*) FILTER (WHERE currency = 'GBP') gbp FROM transaction;"
psql "$DATABASE_URL" -c "SELECT count(*) total, count(*) FILTER (WHERE preferred_currency = 'GBP') gbp FROM customer;"
```

Expected: `total = gbp` for both queries.

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/schema/customer.ts packages/db/src/schema/transaction.ts
git commit -m "feat(db): add currency to transaction and preferredCurrency to customer"
```

---

## Task 2: Create shared currency module

**Files:**
- Create: `apps/web/src/lib/currency.ts`

- [ ] **Step 1: Write the module**

Create `apps/web/src/lib/currency.ts` with:

```ts
import { z } from "zod"

export const CURRENCIES = ["GBP", "EUR"] as const
export type Currency = (typeof CURRENCIES)[number]

export const currencySchema = z.enum(CURRENCIES)

const SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  EUR: "€",
}

export const currencySymbol = (currency: Currency): string => SYMBOLS[currency]

export const formatMinor = (minor: number, currency: Currency): string =>
  `${SYMBOLS[currency]}${(minor / 100).toFixed(2)}`

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "GBP", label: "£ GBP" },
  { value: "EUR", label: "€ EUR" },
]
```

- [ ] **Step 2: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/currency.ts
git commit -m "feat(web): add shared currency module"
```

---

## Task 3: Server fns — write/read currency on transactions

**Files:**
- Modify: `apps/web/src/functions/transactions.ts`

- [ ] **Step 1: Import `currencySchema` and add to field schema**

In `apps/web/src/functions/transactions.ts`, add the import below the existing `zod` import:

```ts
import { currencySchema } from "@/lib/currency"
```

Replace the `transactionFieldsSchema` block (currently lines 14–21) with:

```ts
const transactionFieldsSchema = z.object({
  name: z.string().nullish(),
  notes: z.string().nullish(),
  amount: z.number().int(),
  currency: currencySchema,
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  completedDateBy: dateStringSchema,
})
```

- [ ] **Step 2: Write `currency` on insert**

In the `createTransaction` handler, update the `.values({…})` call (currently inside lines 64–75) to include `currency`:

```ts
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
  })
  .returning()
```

- [ ] **Step 3: Write `currency` on update**

In the `updateTransaction` handler, update the `.set({…})` call (currently lines 94–101) to include `currency`:

```ts
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
  })
  .where(eq(transaction.id, data.id))
  .returning()
```

(Read paths — `getTransactionsByAppointmentId` already returns the full row via `findMany`, so `currency` flows through automatically.)

- [ ] **Step 4: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: errors point at the form/dialog/table call sites (those are fixed in later tasks). The server file itself should be clean — confirm no errors in `functions/transactions.ts`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/functions/transactions.ts
git commit -m "feat(web): persist transaction currency on create/update"
```

---

## Task 4: Update `TransactionForm` for currency selection

**Files:**
- Modify: `apps/web/src/components/transactions/transaction-form.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire contents of `apps/web/src/components/transactions/transaction-form.tsx` with:

```tsx
import { Button, Group, NativeSelect, NumberInput, Stack, Textarea, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { useState } from "react"

import { CURRENCY_OPTIONS, type Currency, currencySymbol } from "@/lib/currency"

export type TransactionFormValues = {
  name: string
  notes: string
  amountMajor: number
  currency: Currency
  type: "BANK" | "CASH" | "PAYPAL"
  status: "PENDING" | "COMPLETED"
  completedDateBy: string | null
}

export type TransactionFormSubmit = {
  name: string | null
  notes: string | null
  amount: number
  currency: Currency
  type: "BANK" | "CASH" | "PAYPAL"
  status: "PENDING" | "COMPLETED"
  completedDateBy: string
}

type TransactionFormProps = {
  initialValues: TransactionFormValues
  submitLabel: string
  onSubmit: (values: TransactionFormSubmit) => void | Promise<void>
  loading?: boolean
}

export function TransactionForm({ initialValues, submitLabel, onSubmit, loading }: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    mode: "uncontrolled",
    initialValues,
    validate: {
      completedDateBy: (value) => (value ? null : "Date is required"),
      amountMajor: (value) => (Number.isFinite(value) ? null : "Amount is required"),
    },
  })

  const [status, setStatus] = useState<TransactionFormValues["status"]>(initialValues.status)
  const [currency, setCurrency] = useState<Currency>(initialValues.currency)
  const dateLabel = status === "COMPLETED" ? "When was it completed?" : "When should it be completed by?"

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        if (!values.completedDateBy) return
        await onSubmit({
          name: values.name.trim() || null,
          notes: values.notes.trim() || null,
          amount: Math.round(values.amountMajor * 100),
          currency: values.currency,
          type: values.type,
          status: values.status,
          completedDateBy: values.completedDateBy,
        })
      })}
    >
      <Stack>
        <TextInput label="Name" placeholder="Transaction name" {...form.getInputProps("name")} />
        <Textarea label="Notes" placeholder="Notes (optional)" autosize minRows={2} {...form.getInputProps("notes")} />
        <Group grow>
          <NativeSelect
            label="Type"
            data={[
              { value: "BANK", label: "Bank" },
              { value: "CASH", label: "Cash" },
              { value: "PAYPAL", label: "PayPal" },
            ]}
            {...form.getInputProps("type")}
          />
          <NativeSelect
            label="Status"
            data={[
              { value: "PENDING", label: "Pending" },
              { value: "COMPLETED", label: "Completed" },
            ]}
            {...form.getInputProps("status")}
            onChange={(event) => {
              const next = event.currentTarget.value as TransactionFormValues["status"]
              form.setFieldValue("status", next)
              setStatus(next)
            }}
          />
          <NativeSelect
            label="Currency"
            data={CURRENCY_OPTIONS}
            {...form.getInputProps("currency")}
            onChange={(event) => {
              const next = event.currentTarget.value as Currency
              form.setFieldValue("currency", next)
              setCurrency(next)
            }}
          />
        </Group>
        <DateInput label={dateLabel} valueFormat="DD MMM YYYY" required {...form.getInputProps("completedDateBy")} />
        <NumberInput
          label="Amount"
          prefix={currencySymbol(currency)}
          decimalScale={2}
          fixedDecimalScale
          step={0.01}
          {...form.getInputProps("amountMajor")}
        />
        <Group justify="flex-end">
          <Button type="submit" loading={loading}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
```

- [ ] **Step 2: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: errors only in `create-transaction-dialog.tsx` and `edit-transaction-dialog.tsx` (those still pass `amountPounds` and don't pass `currency`). Both are fixed in Task 5.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/transactions/transaction-form.tsx
git commit -m "feat(web): add currency picker to transaction form"
```

---

## Task 5: Update create/edit transaction dialogs

**Files:**
- Modify: `apps/web/src/components/transactions/create-transaction-dialog.tsx`
- Modify: `apps/web/src/components/transactions/edit-transaction-dialog.tsx`

- [ ] **Step 1: Replace `create-transaction-dialog.tsx`**

Replace the entire contents of `apps/web/src/components/transactions/create-transaction-dialog.tsx` with:

```tsx
import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { TransactionForm, type TransactionFormSubmit } from "@/components/transactions/transaction-form"
import { createTransaction } from "@/functions/transactions"
import type { Currency } from "@/lib/currency"

type CreateTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  customerId: string
  defaultCurrency: Currency
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

const todayIso = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
  appointmentId,
  customerId,
  defaultCurrency,
  invalidateKeys,
}: CreateTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: TransactionFormSubmit) =>
      createTransaction({ data: { ...values, appointmentId, customerId } }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      onOpenChange(false)
      notifications.show({ color: "green", message: "Transaction created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Transaction">
      <TransactionForm
        initialValues={{
          name: "",
          notes: "",
          amountMajor: 0,
          currency: defaultCurrency,
          type: "BANK",
          status: "PENDING",
          completedDateBy: todayIso(),
        }}
        submitLabel="Create"
        loading={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values)
        }}
      />
    </Modal>
  )
}
```

- [ ] **Step 2: Replace `edit-transaction-dialog.tsx`**

Replace the entire contents of `apps/web/src/components/transactions/edit-transaction-dialog.tsx` with:

```tsx
import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { TransactionForm, type TransactionFormSubmit } from "@/components/transactions/transaction-form"
import { updateTransaction } from "@/functions/transactions"
import { CURRENCIES, type Currency } from "@/lib/currency"

type EditTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    name: string | null
    notes: string | null
    amount: number
    currency: Currency | string
    type: "BANK" | "CASH" | "PAYPAL" | string
    status: "PENDING" | "COMPLETED" | string
    completedDateBy: string
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function EditTransactionDialog({ open, onOpenChange, transaction, invalidateKeys }: EditTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: TransactionFormSubmit) => updateTransaction({ data: { ...values, id: transaction.id } }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      onOpenChange(false)
      notifications.show({ color: "green", message: "Transaction updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const initialType: "BANK" | "CASH" | "PAYPAL" =
    transaction.type === "BANK" || transaction.type === "CASH" || transaction.type === "PAYPAL"
      ? transaction.type
      : "BANK"
  const initialStatus: "PENDING" | "COMPLETED" = transaction.status === "COMPLETED" ? "COMPLETED" : "PENDING"
  const initialCurrency: Currency = (CURRENCIES as readonly string[]).includes(transaction.currency)
    ? (transaction.currency as Currency)
    : "GBP"

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Transaction">
      <TransactionForm
        initialValues={{
          name: transaction.name ?? "",
          notes: transaction.notes ?? "",
          amountMajor: transaction.amount / 100,
          currency: initialCurrency,
          type: initialType,
          status: initialStatus,
          completedDateBy: transaction.completedDateBy,
        }}
        submitLabel="Save Changes"
        loading={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values)
        }}
      />
    </Modal>
  )
}
```

- [ ] **Step 3: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: errors now point at consumers of `CreateTransactionDialog` (the appointment page) for missing `defaultCurrency`, and at `transactions-table.tsx` / `delete-transaction-dialog.tsx` for the new `currency` field on the row type. Both are fixed in Tasks 6 and 11.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/transactions/create-transaction-dialog.tsx apps/web/src/components/transactions/edit-transaction-dialog.tsx
git commit -m "feat(web): thread currency through transaction create/edit dialogs"
```

---

## Task 6: Update transactions table + delete dialog

**Files:**
- Modify: `apps/web/src/components/transactions/transactions-table.tsx`
- Modify: `apps/web/src/components/transactions/delete-transaction-dialog.tsx`

- [ ] **Step 1: `transactions-table.tsx` — add `currency`, use `formatMinor`**

Replace the imports block + `formatCents` helper + `TransactionRow` type with:

```tsx
import { ActionIcon, Badge, Group, Menu, Table, Text, Tooltip } from "@mantine/core"
import { IconAlertTriangle, IconCheck, IconClock, IconDots, IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import dayjs from "dayjs"

import { type Currency, formatMinor } from "@/lib/currency"

export type TransactionRow = {
  id: string
  name: string | null
  notes: string | null
  amount: number
  currency: Currency
  type: "BANK" | "CASH" | "PAYPAL" | string
  status: "PENDING" | "COMPLETED" | string
  completedDateBy: string
  customerId: string
  appointmentId: string | null
  customer?: { id: string; name: string } | null
}
```

Delete the local `formatCents` constant (line 25).

In the amount cell (currently `<Table.Td>{formatCents(tx.amount)}</Table.Td>` at line 83), change to:

```tsx
<Table.Td>{formatMinor(tx.amount, tx.currency)}</Table.Td>
```

- [ ] **Step 2: Replace `delete-transaction-dialog.tsx`**

Replace the entire contents of `apps/web/src/components/transactions/delete-transaction-dialog.tsx` with:

```tsx
import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteTransaction } from "@/functions/transactions"
import { type Currency, formatMinor } from "@/lib/currency"

type DeleteTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    name: string | null
    amount: number
    currency: Currency
    customer?: { name: string } | null
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  transaction,
  invalidateKeys,
}: DeleteTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteTransaction({ data: { id: transaction.id } }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      onOpenChange(false)
      notifications.show({ color: "green", message: "Transaction deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Delete Transaction">
      <Stack>
        <Text size="sm">
          This will permanently remove the transaction
          {transaction.name ? ` "${transaction.name}"` : ""} of {formatMinor(transaction.amount, transaction.currency)}
          {transaction.customer ? ` for ${transaction.customer.name}` : ""}. This action cannot be undone.
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button color="red" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
```

Because `TransactionRow` (Step 1) now has `currency: Currency`, every consumer that passes a row to `DeleteTransactionDialog` continues to type-check.

- [ ] **Step 3: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: only consumer-side errors remain (appointment page passing rows without `currency` aren't an issue because the rows come from the server fn which now returns `currency`; type errors should localise to the appointment page's `defaultCurrency` prop and dashboard route — fixed in Tasks 11 and 13).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/transactions/transactions-table.tsx apps/web/src/components/transactions/delete-transaction-dialog.tsx
git commit -m "feat(web): render transaction amounts with currency-aware formatter"
```

---

## Task 7: Add `preferredCurrency` to customer schema + server fns

**Files:**
- Modify: `apps/web/src/lib/schemas.ts`
- Modify: `apps/web/src/functions/customers.ts`

- [ ] **Step 1: Extend `customerSchema`**

In `apps/web/src/lib/schemas.ts`, add the import and field:

```ts
import { z } from "zod"

import { currencySchema } from "./currency"

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(5, "Name must be at least 5 characters long").max(50, "Name cannot exceed 50 characters"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number must be at most 15 characters long")
    .regex(/^\+\d+$/, "Phone number must start with '+' and contain only digits after it")
    .nullish(),
  preferredCurrency: currencySchema.default("GBP"),
})
```

(Other schemas in this file stay unchanged.)

- [ ] **Step 2: Write `preferredCurrency` on customer insert/update**

In `apps/web/src/functions/customers.ts`, replace the `createCustomer` and `updateCustomer` handlers (currently lines 31–49) with:

```ts
export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(customerSchema)
  .handler(async ({ data }) => {
    const [result] = await db
      .insert(customer)
      .values({
        name: data.name,
        phoneNumber: data.phoneNumber,
        preferredCurrency: data.preferredCurrency,
      })
      .returning()
    return result
  })

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(customerSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [result] = await db
      .update(customer)
      .set({
        name: data.name,
        phoneNumber: data.phoneNumber,
        preferredCurrency: data.preferredCurrency,
      })
      .where(eq(customer.id, data.id!))
      .returning()
    return result
  })
```

(Read paths in this file — `getCustomers`, `getCustomer` — already return the full row, so `preferredCurrency` is included automatically once the column exists.)

- [ ] **Step 3: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: errors at the customer create/edit form call sites (they don't yet pass `preferredCurrency`). Fixed in Task 8.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/schemas.ts apps/web/src/functions/customers.ts
git commit -m "feat(web): persist preferredCurrency on customer create/update"
```

---

## Task 8: Customer create form — add currency select

**Files:**
- Modify: `apps/web/src/routes/_authenticated/customers/index.tsx`

- [ ] **Step 1: Update the `CustomerFormDialog`**

The dialog currently sits at lines 25–57. Update it to:

1. Import `NativeSelect` from `@mantine/core` (add to existing import) and `CURRENCY_OPTIONS`, `Currency` from `@/lib/currency`.
2. Add `preferredCurrency` to the form's initial values and the mutation payload.

Replace the dialog's body with:

```tsx
function CustomerFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { name: string; phoneNumber: string | null; preferredCurrency: Currency }) =>
      createCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Customer created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm<{ name: string; phoneNumber: string; preferredCurrency: Currency }>({
    initialValues: { name: "", phoneNumber: "", preferredCurrency: "GBP" },
  })

  const handleSubmit = async (values: { name: string; phoneNumber: string; preferredCurrency: Currency }) => {
    await mutation.mutateAsync({
      name: values.name,
      phoneNumber: values.phoneNumber || null,
      preferredCurrency: values.preferredCurrency,
    })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone Number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <NativeSelect label="Preferred Currency" data={CURRENCY_OPTIONS} {...form.getInputProps("preferredCurrency")} />
          <Button type="submit" loading={mutation.isPending}>
            Create Customer
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
```

(Add `NativeSelect` to the `@mantine/core` import on line 1 of the file, and add a new line `import { CURRENCY_OPTIONS, type Currency } from "@/lib/currency"` to the imports block.)

- [ ] **Step 2: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: this file now type-checks clean. Customer-detail edit form still errors (Task 9).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/customers/index.tsx
git commit -m "feat(web): add preferred currency to customer create form"
```

---

## Task 9: Customer detail — edit form, drop `formatCurrency`, render split totals

**Files:**
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId.tsx`

- [ ] **Step 1: Add `preferredCurrency` to `EditCustomerDialog`**

The dialog sits at lines 89–131. Update it:

1. Add `NativeSelect` to the `@mantine/core` import line (line 1 is the existing import block — confirm).
2. Add `import { CURRENCIES, CURRENCY_OPTIONS, type Currency, formatMinor } from "@/lib/currency"` near the other local imports.
3. Widen the `customer` prop type and form to include `preferredCurrency`.

Replace the dialog with:

```tsx
function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: { id: string; name: string; phoneNumber: string | null; preferredCurrency: Currency }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: {
      id: string
      name: string
      phoneNumber?: string | null
      preferredCurrency: Currency
    }) => updateCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Customer updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: {
      name: customer.name,
      phoneNumber: customer.phoneNumber ?? "",
      preferredCurrency: customer.preferredCurrency,
    },
  })

  const handleSubmit = async (values: { name: string; phoneNumber: string; preferredCurrency: Currency }) => {
    await mutation.mutateAsync({
      id: customer.id,
      name: values.name,
      phoneNumber: values.phoneNumber || null,
      preferredCurrency: values.preferredCurrency,
    })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone Number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <NativeSelect label="Preferred Currency" data={CURRENCY_OPTIONS} {...form.getInputProps("preferredCurrency")} />
          <Button type="submit" loading={mutation.isPending}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 2: Update the consumer of `EditCustomerDialog`**

The call site (search for `<EditCustomerDialog`) passes `customer={customer}`. The `customer` from `getCustomer` already includes `preferredCurrency` after Task 1, so no consumer change is needed beyond a type cast if TypeScript complains — in that case wrap the prop:

```tsx
<EditCustomerDialog
  customer={{
    id: customer.id,
    name: customer.name,
    phoneNumber: customer.phoneNumber,
    preferredCurrency: customer.preferredCurrency as Currency,
  }}
  open={editOpen}
  onOpenChange={setEditOpen}
/>
```

- [ ] **Step 3: Drop `formatCurrency`, render split totals**

Delete the line:

```tsx
const formatCurrency = (n: number) => `£${n.toFixed(2)}`
```

Replace the "Transactions" `StatCard` (currently `<StatCard label="Transactions" value={formatCurrency(summary.transactionSum)} />` near line 264) with a custom card that handles split totals. Update the surrounding `SimpleGrid` block to:

```tsx
{summary ? (
  <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
    <StatCard label="Appointments" value={String(summary.appointmentCount)} />
    <Card withBorder padding="md">
      <Text size="xs" c="dimmed">
        Transactions
      </Text>
      <Title order={4}>
        {(() => {
          const parts = CURRENCIES.filter((c) => summary.transactionSumsMinor[c] !== 0).map((c) =>
            formatMinor(summary.transactionSumsMinor[c], c),
          )
          return parts.length > 0 ? parts.join(" · ") : formatMinor(0, "GBP")
        })()}
      </Title>
    </Card>
    <StatCard label="Hair Profit" value={`£${summary.hairAssignedProfitSum.toFixed(2)}`} />
    <StatCard label="Hair Sold For" value={`£${summary.hairAssignedSoldForSum.toFixed(2)}`} />
    <StatCard label="Hair Weight" value={`${summary.hairAssignedWeightInGramsSum}g`} />
    <StatCard label="Notes" value={String(summary.noteCount)} />
    <Card withBorder padding="md">
      <Text size="xs" c="dimmed">
        Joined
      </Text>
      <Title order={4}>
        <ClientDate date={summary.customerCreatedAt} />
      </Title>
    </Card>
  </SimpleGrid>
) : (
  // existing skeletons block stays
)}
```

(Hair stats stay GBP-hardcoded — out of scope per spec.)

- [ ] **Step 4: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: this file errors only because `summary.transactionSumsMinor` doesn't exist yet (still returns `transactionSum`). Fixed in Task 10.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/_authenticated/customers/\$customerId.tsx
git commit -m "feat(web): edit preferredCurrency and show split-currency totals on customer page"
```

---

## Task 10: `getCustomerSummary` — return per-currency totals

**Files:**
- Modify: `apps/web/src/functions/customers.ts`

- [ ] **Step 1: Replace `transactionSum` with `transactionSumsMinor`**

In `apps/web/src/functions/customers.ts`, edit the `getCustomerSummary` handler. Add this import near the top:

```ts
import { CURRENCIES, type Currency } from "@/lib/currency"
```

Replace the handler body (currently lines 51–80) with:

```ts
export const getCustomerSummary = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.customer.findFirst({
      where: eq(customer.id, data.id),
      columns: { createdAt: true },
      with: {
        appointmentsAsCustomer: { columns: { id: true } },
        transactions: { columns: { amount: true, currency: true } },
        hairAssigned: { columns: { profit: true, soldFor: true, weightInGrams: true } },
        notes: { columns: { id: true } },
      },
    })
    if (!result) {
      throw new Error("Customer not found")
    }
    const transactionSumsMinor: Record<Currency, number> = { GBP: 0, EUR: 0 }
    for (const t of result.transactions) {
      const currency = t.currency as Currency
      if (currency in transactionSumsMinor) {
        transactionSumsMinor[currency] += t.amount
      }
    }
    const hairAssignedProfitSumCents = result.hairAssigned.reduce((acc, ha) => acc + ha.profit, 0)
    const hairAssignedSoldForSumCents = result.hairAssigned.reduce((acc, ha) => acc + ha.soldFor, 0)
    const hairAssignedWeightInGramsSum = result.hairAssigned.reduce((acc, ha) => acc + ha.weightInGrams, 0)
    return {
      appointmentCount: result.appointmentsAsCustomer.length,
      transactionSumsMinor,
      hairAssignedProfitSum: hairAssignedProfitSumCents / 100,
      hairAssignedSoldForSum: hairAssignedSoldForSumCents / 100,
      hairAssignedWeightInGramsSum,
      noteCount: result.notes.length,
      customerCreatedAt: result.createdAt,
    }
  })
```

(Note: `CURRENCIES` is referenced from the customer detail page; it's not used inside this handler, but the `Record<Currency, number>` initializer guarantees both keys exist.)

- [ ] **Step 2: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: `customers/$customerId.tsx` now type-checks (it consumes `transactionSumsMinor`). Remaining errors are in the appointment page (`defaultCurrency` not yet passed) and dashboard.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/functions/customers.ts
git commit -m "feat(web): return per-currency totals from getCustomerSummary"
```

---

## Task 11: Appointment page — split totals + thread `defaultCurrency`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`

- [ ] **Step 1: Replace `formatCents` and totals computation**

In `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`:

1. Add the import: `import { CURRENCIES, type Currency, formatMinor } from "@/lib/currency"`.
2. Delete the local `const formatCents = (cents: number) => \`£${(cents / 100).toFixed(2)}\`` line (line 42).
3. Replace the totals computation block (currently lines 96–103) with:

```tsx
const txList = transactions ?? []
const totalsByCurrency: Record<Currency, { completed: number; pending: number; total: number }> = {
  GBP: { completed: 0, pending: 0, total: 0 },
  EUR: { completed: 0, pending: 0, total: 0 },
}
for (const t of txList) {
  const c = t.currency as Currency
  if (!(c in totalsByCurrency)) continue
  totalsByCurrency[c].total += t.amount
  if (t.status === "COMPLETED") totalsByCurrency[c].completed += t.amount
  else if (t.status === "PENDING") totalsByCurrency[c].pending += t.amount
}
const currenciesPresent = CURRENCIES.filter(
  (c) => totalsByCurrency[c].completed !== 0 || totalsByCurrency[c].pending !== 0,
)
const chartCurrency: Currency = currenciesPresent[0] ?? "GBP"
const chartData = [
  {
    name: "Completed",
    value: Math.abs(totalsByCurrency[chartCurrency].completed),
    color: "green.4",
  },
  {
    name: "Pending",
    value: Math.abs(totalsByCurrency[chartCurrency].pending),
    color: "pink.6",
  },
]
```

4. Replace the totals render (currently the `<Group align="center" gap="xl">…</Group>` block at lines 251–264) with:

```tsx
<Group align="flex-start" gap="xl" wrap="wrap">
  <DonutChart size={124} thickness={15} data={chartData} withLabels={false} />
  <Stack gap="md">
    {currenciesPresent.length === 0 ? (
      <Stack gap={2}>
        <Text size="sm">
          Completed: <b>{formatMinor(0, "GBP")}</b>
        </Text>
        <Text size="sm">
          Pending: <b>{formatMinor(0, "GBP")}</b>
        </Text>
        <Text size="sm">
          Total: <b>{formatMinor(0, "GBP")}</b>
        </Text>
      </Stack>
    ) : (
      currenciesPresent.map((c) => (
        <Stack key={c} gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase">
            {c}
          </Text>
          <Text size="sm">
            Completed: <b>{formatMinor(totalsByCurrency[c].completed, c)}</b>
          </Text>
          <Text size="sm">
            Pending: <b>{formatMinor(totalsByCurrency[c].pending, c)}</b>
          </Text>
          <Text size="sm">
            Total: <b>{formatMinor(totalsByCurrency[c].total, c)}</b>
          </Text>
        </Stack>
      ))
    )}
  </Stack>
</Group>
```

- [ ] **Step 2: Pass `defaultCurrency` to `CreateTransactionDialog`**

The dialog can be opened either for the appointment's client or for an assigned personnel customer. Resolve the chosen customer's `preferredCurrency` and pass it. Above the JSX block (around the existing `txInvalidateKeys` definition) add:

```tsx
const txCustomerId = createTxCustomerId ?? appointment.client.id
const txCustomer =
  txCustomerId === appointment.client.id
    ? appointment.client
    : appointment.personnel?.find((p) => p.personnel.id === txCustomerId)?.personnel
const txDefaultCurrency: Currency = (() => {
  const raw = txCustomer?.preferredCurrency
  return raw && (CURRENCIES as readonly string[]).includes(raw) ? (raw as Currency) : "GBP"
})()
```

Then update the `<CreateTransactionDialog>` JSX (currently lines 334–343) to:

```tsx
<CreateTransactionDialog
  open={createTxOpen}
  onOpenChange={(open) => {
    setCreateTxOpen(open)
    if (!open) setCreateTxCustomerId(null)
  }}
  appointmentId={appointmentId}
  customerId={txCustomerId}
  defaultCurrency={txDefaultCurrency}
  invalidateKeys={txInvalidateKeys}
/>
```

`getAppointment` selects `client: true` and `personnel: { with: { personnel: true } }` (see `apps/web/src/functions/appointments.ts:40-44`), so both `appointment.client.preferredCurrency` and `personnel.preferredCurrency` flow through automatically once the column exists.

- [ ] **Step 3: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: only `dashboard.ts` / `dashboard.tsx` errors remain.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated/appointments/\$appointmentId.tsx
git commit -m "feat(web): split appointment transaction totals by currency"
```

---

## Task 12: Dashboard server fn — per-currency stats

**Files:**
- Modify: `apps/web/src/functions/dashboard.ts`

- [ ] **Step 1: Add per-currency helper and rework `getTransactionStatsForDate`**

In `apps/web/src/functions/dashboard.ts`:

1. Add the import: `import { CURRENCIES, type Currency, currencySymbol } from "@/lib/currency"`.
2. Add a helper next to `categoryFromCents`:

```ts
function categoryFromMinor(raw: ReturnType<typeof calcAll>, currency: Currency): StatCategory {
  const fmt = (minor: number) => `${currencySymbol(currency)}${(minor / 100).toFixed(2)}`
  return {
    total: {
      current: fmt(Number(raw.total.current)),
      previous: fmt(Number(raw.total.previous)),
      difference: fmt(Number(raw.total.difference)),
      percentage: raw.total.percentage,
    },
    average: {
      current: fmt(Number(raw.average.current)),
      previous: fmt(Number(raw.average.previous)),
      difference: fmt(Number(raw.average.difference)),
      percentage: raw.average.percentage,
    },
    count: {
      current: raw.count.current,
      previous: raw.count.previous,
      difference: raw.count.difference,
      percentage: raw.count.percentage,
    },
  }
}
```

3. Replace the `getTransactionStatsForDate` handler (currently lines 109–133) with:

```ts
export const getTransactionStatsForDate = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ date: z.string() }))
  .handler(async ({ data }) => {
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

(Hair functions still use `categoryFromCents` — out of scope.)

- [ ] **Step 2: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: errors now move to `dashboard.tsx` (consumer destructures `txStats` as a single `StatCategory` rather than per-currency). Fixed in Task 13.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/functions/dashboard.ts
git commit -m "feat(web): return per-currency dashboard transaction stats"
```

---

## Task 13: Dashboard route — render per-currency cards

**Files:**
- Modify: `apps/web/src/routes/_authenticated/dashboard.tsx`

- [ ] **Step 1: Render one `EnhancedStatCard` per currency**

In `apps/web/src/routes/_authenticated/dashboard.tsx`:

1. Add the import: `import { CURRENCIES, type Currency } from "@/lib/currency"`.
2. Replace the JSX block that renders the transaction stat card (currently `<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>{txStats ? <EnhancedStatCard title="Transactions" data={txStats} /> : <Skeleton h={240} />}</SimpleGrid>`) with:

```tsx
<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
  {txStats
    ? CURRENCIES.map((c) => <EnhancedStatCard key={c} title={`Transactions (${c})`} data={txStats[c]} />)
    : Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} h={240} />)}
</SimpleGrid>
```

- [ ] **Step 2: Verify types**

```bash
cd apps/web && bun run check-types
```

Expected: zero errors across the project.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/dashboard.tsx
git commit -m "feat(web): render per-currency dashboard transaction cards"
```

---

## Task 14: Final lint + manual smoke

- [ ] **Step 1: Lint and format**

From repo root:

```bash
bun run check
```

Expected: zero errors. If oxfmt rewrites files, stage the changes:

```bash
git add -A
git commit -m "chore: oxfmt"
```

- [ ] **Step 2: Type check**

```bash
cd apps/web && bun run check-types
```

Expected: zero errors.

- [ ] **Step 3: Smoke test in dev**

From repo root:

```bash
bun run dev
```

In the browser:

1. **Customer create** — open Customers, click New Customer, set Preferred Currency = EUR, save. Reload, verify the new customer persists with EUR (open detail, click Edit, confirm dropdown).
2. **Customer edit** — change Preferred Currency to GBP and back to EUR. Save. Reload. Persists.
3. **Transaction create (inheritance)** — open an appointment whose client has `preferredCurrency = EUR`. Click New transaction. Currency dropdown is pre-filled `EUR`; the `NumberInput` prefix shows `€`. Submit. The transactions table renders the row with `€`.
4. **Transaction create (override)** — open New transaction again. Change Currency to GBP. Submit. Row renders with `£`.
5. **Edit transaction** — open the EUR row, edit the amount, save. Verify the edited row still shows `€`.
6. **Customer detail split totals** — visit a customer with mixed-currency transactions. The Transactions stat card shows e.g. `£12.34 · €56.78`. A customer with only GBP shows only `£X`.
7. **Appointment totals** — visit an appointment with mixed-currency transactions. Two totals blocks render (one per currency). DonutChart uses the first present currency.
8. **Dashboard** — navigate to the dashboard. Two transaction cards render (`Transactions (GBP)` and `Transactions (EUR)`). Move month forward/back; deltas update independently per currency.

If any smoke step fails, fix and re-run from Step 1.

- [ ] **Step 4: Push branch**

```bash
git push -u origin feat/transaction-currency
```

(Only when smoke is green.)

---

## Notes for the implementer

- **No automated tests in this repo.** Verification relies on `check-types`, `check`, and manual smoke per Task 14. Do not introduce a test runner just for this work.
- **`amountPounds` → `amountMajor`** is repo-wide for the form values type only. Search results from `grep -rn amountPounds apps/web/src` should be empty after Task 4–5; if not, propagate the rename.
- **`transactionSum` removal**: search `grep -rn transactionSum apps/web/src` after Task 10 — must be empty.
- **Mantine `NumberInput` prefix recompute**: requires the local `useState` mirror added in Task 4. Don't rely on `form.values.currency` directly — Mantine's uncontrolled mode won't re-render the prefix.
- **Out of scope**: hair currency, order currency, FX conversion, currency beyond GBP/EUR. Don't widen scope.
