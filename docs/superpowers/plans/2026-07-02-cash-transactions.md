# Cash Transactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated Cash page for customer-linked manual cash transactions with signed amounts, creator tracking, filtering, search, pagination, and CRUD.

**Architecture:** Add a new Drizzle `cash_transaction` table and relations, then expose authenticated TanStack Start server functions for listing and mutations. Build a top-level `/cash` route using existing Mantine, TanStack Query, notification, dialog, and table patterns.

**Tech Stack:** TypeScript, Bun, TanStack Start/Router/Query, Mantine, Drizzle ORM, PostgreSQL, Vitest.

---

## File Structure

- Create `packages/db/src/schema/cash-transaction.ts`: Drizzle table definition.
- Modify `packages/db/src/schema/relations.ts`: cash transaction relations to customer and user.
- Modify `packages/db/src/schema/index.ts`: export the new schema.
- Create `packages/db/src/cash-transaction-schema.test.ts`: schema-level tests for table metadata and relation fields.
- Generate one Drizzle migration under `packages/db/src/migrations/` with snapshot metadata.
- Modify `apps/web/src/lib/schemas.ts`: shared Zod schema for cash transaction inputs.
- Modify `apps/web/src/lib/query-keys.ts`: cash query keys.
- Create `apps/web/src/functions/cash-transactions.ts`: authenticated server functions.
- Create `apps/web/src/components/cash-transactions/cash-transaction-form.tsx`: reusable create/edit form.
- Create `apps/web/src/components/cash-transactions/cash-transactions-table.tsx`: paginated table.
- Create `apps/web/src/components/cash-transactions/create-cash-transaction-dialog.tsx`: create dialog.
- Create `apps/web/src/components/cash-transactions/edit-cash-transaction-dialog.tsx`: edit dialog.
- Create `apps/web/src/components/cash-transactions/delete-cash-transaction-dialog.tsx`: delete confirmation.
- Create `apps/web/src/routes/_authenticated/cash.tsx`: Cash page.
- Modify `apps/web/src/routes/_authenticated/route.tsx`: add Cash sidebar item.

## Task 1: Database Schema

**Files:**
- Create: `packages/db/src/schema/cash-transaction.ts`
- Modify: `packages/db/src/schema/relations.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/db/src/cash-transaction-schema.test.ts`

- [ ] **Step 1: Write the schema metadata test**

Create `packages/db/src/cash-transaction-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { cashTransaction } from "./schema/cash-transaction"

describe("cashTransaction schema", () => {
  it("uses a required restricted customer relation and required creator relation", () => {
    expect(cashTransaction.customerId.notNull).toBe(true)
    expect(cashTransaction.createdById.notNull).toBe(true)
  })

  it("stores signed integer amounts and day-level createdAt dates", () => {
    expect(cashTransaction.amount.notNull).toBe(true)
    expect(cashTransaction.createdAt.notNull).toBe(true)
  })
})
```

- [ ] **Step 2: Run the failing db test**

Run:

```bash
bun --filter @prive-admin-tanstack/db test cash-transaction-schema.test.ts
```

Expected: fail because `./schema/cash-transaction` does not exist.

- [ ] **Step 3: Add the cash transaction schema**

Create `packages/db/src/schema/cash-transaction.ts`:

```ts
import { createId } from "@paralleldrive/cuid2"
import { date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { user } from "./auth"
import { customer } from "./customer"

export const cashTransaction = pgTable("cash_transaction", {
  id: text("id").primaryKey().$defaultFn(createId),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("EUR"),
  createdAt: date("created_at").notNull(),
  description: text("description"),
  notes: text("notes"),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "restrict" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})
```

- [ ] **Step 4: Wire exports and relations**

Modify `packages/db/src/schema/index.ts` by adding:

```ts
export * from "./cash-transaction"
```

Modify `packages/db/src/schema/relations.ts` imports:

```ts
import { cashTransaction } from "./cash-transaction"
```

Add to `userRelations`:

```ts
cashTransactionsCreated: many(cashTransaction),
```

Add to `customerRelations`:

```ts
cashTransactions: many(cashTransaction),
```

Add after the existing transaction relations:

```ts
export const cashTransactionRelations = relations(cashTransaction, ({ one }) => ({
  customer: one(customer, { fields: [cashTransaction.customerId], references: [customer.id] }),
  createdBy: one(user, { fields: [cashTransaction.createdById], references: [user.id] }),
}))
```

- [ ] **Step 5: Run the db test**

Run:

```bash
bun --filter @prive-admin-tanstack/db test cash-transaction-schema.test.ts
```

Expected: pass.

- [ ] **Step 6: Generate the migration**

Run:

```bash
bun run db:generate
```

Expected: a new SQL migration under `packages/db/src/migrations/` creates `cash_transaction` with `customer_id` using `ON DELETE restrict`, `created_by_id`, signed integer `amount`, default `EUR`, date `created_at`, and `updated_at`.

- [ ] **Step 7: Commit**

```bash
git add packages/db/src/schema/cash-transaction.ts packages/db/src/schema/relations.ts packages/db/src/schema/index.ts packages/db/src/cash-transaction-schema.test.ts packages/db/src/migrations
git commit -m "feat: add cash transaction schema"
```

## Task 2: Server Functions

**Files:**
- Modify: `apps/web/src/lib/schemas.ts`
- Modify: `apps/web/src/lib/query-keys.ts`
- Create: `apps/web/src/functions/cash-transactions.ts`

- [ ] **Step 1: Add query keys**

Modify `apps/web/src/lib/query-keys.ts`:

```ts
export const cashTransactionKeys = {
  all: ["cash-transactions"] as const,
  list: (filter: Record<string, unknown>) => [...cashTransactionKeys.all, "list", filter] as const,
}
```

- [ ] **Step 2: Add shared validation schema**

Modify `apps/web/src/lib/schemas.ts`. The file already imports `z` and `currencySchema`; add this export after `bankAccountSchema`:

```ts
export const cashTransactionSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  description: z.string().max(120).nullish(),
  notes: z.string().max(1000).nullish(),
  amount: z.number().int().refine((value) => value !== 0, "Amount cannot be zero"),
  currency: currencySchema.default("EUR"),
})
```

- [ ] **Step 3: Create server functions**

Create `apps/web/src/functions/cash-transactions.ts`:

```ts
import { db } from "@prive-admin-tanstack/db"
import { user } from "@prive-admin-tanstack/db/schema/auth"
import { cashTransaction } from "@prive-admin-tanstack/db/schema/cash-transaction"
import { customer } from "@prive-admin-tanstack/db/schema/customer"
import { createServerFn } from "@tanstack/react-start"
import { and, count, desc, eq, gt, ilike, lt, or, sql } from "drizzle-orm"
import { z } from "zod"

import { cashTransactionSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

const listSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
  customerId: z.string().optional(),
  currency: z.enum(["EUR", "GBP"]).optional(),
  direction: z.enum(["all", "received", "paid"]).default("all"),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

function nullableText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function buildWhere(data: z.infer<typeof listSchema>) {
  const clauses = []
  if (data.search) {
    const pattern = `%${data.search}%`
    clauses.push(or(ilike(cashTransaction.description, pattern), ilike(cashTransaction.notes, pattern), ilike(customer.name, pattern)))
  }
  if (data.customerId) clauses.push(eq(cashTransaction.customerId, data.customerId))
  if (data.currency) clauses.push(eq(cashTransaction.currency, data.currency))
  if (data.direction === "received") clauses.push(gt(cashTransaction.amount, 0))
  if (data.direction === "paid") clauses.push(lt(cashTransaction.amount, 0))
  if (data.dateFrom) clauses.push(sql`${cashTransaction.createdAt} >= ${data.dateFrom}`)
  if (data.dateTo) clauses.push(sql`${cashTransaction.createdAt} <= ${data.dateTo}`)
  return clauses.length ? and(...clauses) : undefined
}

export const listCashTransactions = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(listSchema)
  .handler(async ({ data }) => {
    const where = buildWhere(data)
    const offset = (data.page - 1) * data.pageSize
    const rows = await db
      .select({
        id: cashTransaction.id,
        amount: cashTransaction.amount,
        currency: cashTransaction.currency,
        createdAt: cashTransaction.createdAt,
        description: cashTransaction.description,
        notes: cashTransaction.notes,
        customerId: cashTransaction.customerId,
        createdById: cashTransaction.createdById,
        customer: { id: customer.id, name: customer.name },
        createdBy: { id: user.id, name: user.name },
      })
      .from(cashTransaction)
      .innerJoin(customer, eq(cashTransaction.customerId, customer.id))
      .innerJoin(user, eq(cashTransaction.createdById, user.id))
      .where(where)
      .orderBy(desc(cashTransaction.createdAt), desc(cashTransaction.id))
      .limit(data.pageSize)
      .offset(offset)

    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(cashTransaction)
      .innerJoin(customer, eq(cashTransaction.customerId, customer.id))
      .where(where)

    return { items: rows, page: data.page, pageSize: data.pageSize, totalCount }
  })

export const createCashTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(cashTransactionSchema)
  .handler(async ({ data, context }) => {
    const existingCustomer = await db.query.customer.findFirst({
      where: eq(customer.id, data.customerId),
      columns: { id: true },
    })
    if (!existingCustomer) throw new Error("Customer not found")

    const [result] = await db
      .insert(cashTransaction)
      .values({
        customerId: data.customerId,
        createdById: context.session.user.id,
        createdAt: data.createdAt,
        description: nullableText(data.description),
        notes: nullableText(data.notes),
        amount: data.amount,
        currency: data.currency,
      })
      .returning()
    return result
  })

export const updateCashTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(cashTransactionSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const existing = await db.query.cashTransaction.findFirst({
      where: eq(cashTransaction.id, data.id),
      columns: { id: true, createdById: true },
    })
    if (!existing) throw new Error("Cash transaction not found")

    const existingCustomer = await db.query.customer.findFirst({
      where: eq(customer.id, data.customerId),
      columns: { id: true },
    })
    if (!existingCustomer) throw new Error("Customer not found")

    const [result] = await db
      .update(cashTransaction)
      .set({
        customerId: data.customerId,
        createdAt: data.createdAt,
        description: nullableText(data.description),
        notes: nullableText(data.notes),
        amount: data.amount,
        currency: data.currency,
      })
      .where(eq(cashTransaction.id, data.id))
      .returning()
    return result
  })

export const deleteCashTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await db.query.cashTransaction.findFirst({
      where: eq(cashTransaction.id, data.id),
      columns: { id: true },
    })
    if (!existing) throw new Error("Cash transaction not found")
    await db.delete(cashTransaction).where(eq(cashTransaction.id, data.id))
  })
```

- [ ] **Step 4: Type-check**

Run:

```bash
bun run check-types
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/schemas.ts apps/web/src/lib/query-keys.ts apps/web/src/functions/cash-transactions.ts
git commit -m "feat: add cash transaction server functions"
```

## Task 3: Cash Transaction Components

**Files:**
- Create: `apps/web/src/components/cash-transactions/cash-transaction-form.tsx`
- Create: `apps/web/src/components/cash-transactions/cash-transactions-table.tsx`
- Create: `apps/web/src/components/cash-transactions/create-cash-transaction-dialog.tsx`
- Create: `apps/web/src/components/cash-transactions/edit-cash-transaction-dialog.tsx`
- Create: `apps/web/src/components/cash-transactions/delete-cash-transaction-dialog.tsx`

- [ ] **Step 1: Add the form component**

Create `apps/web/src/components/cash-transactions/cash-transaction-form.tsx`:

```tsx
import { Button, Group, NativeSelect, NumberInput, Stack, Textarea, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useState } from "react"

import { CURRENCY_OPTIONS, type Currency, currencySymbol } from "@/lib/currency"

export type CashTransactionFormValues = {
  customerId: string
  createdAt: string
  description: string
  notes: string
  amountMajor: number
  currency: Currency
}

export type CashTransactionFormSubmit = {
  customerId: string
  createdAt: string
  description: string | null
  notes: string | null
  amount: number
  currency: Currency
}

type CustomerOption = { id: string; name: string }

type CashTransactionFormProps = {
  customers: CustomerOption[]
  initialValues: CashTransactionFormValues
  submitLabel: string
  loading?: boolean
  onSubmit: (values: CashTransactionFormSubmit) => void | Promise<void>
}

export function CashTransactionForm({ customers, initialValues, submitLabel, loading, onSubmit }: CashTransactionFormProps) {
  const form = useForm<CashTransactionFormValues>({
    mode: "uncontrolled",
    initialValues,
    validate: {
      customerId: (value) => (value ? null : "Customer is required"),
      createdAt: (value) => (value ? null : "Date is required"),
      amountMajor: (value) => (Number.isFinite(value) && value !== 0 ? null : "Amount cannot be zero"),
    },
  })

  const [currency, setCurrency] = useState<Currency>(initialValues.currency)

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        await onSubmit({
          customerId: values.customerId,
          createdAt: values.createdAt,
          description: values.description.trim() || null,
          notes: values.notes.trim() || null,
          amount: Math.round(values.amountMajor * 100),
          currency: values.currency,
        })
      })}
    >
      <Stack>
        <NativeSelect
          label="Customer"
          data={[
            { value: "", label: "Select a customer..." },
            ...customers.map((c) => ({ value: c.id, label: c.name })),
          ]}
          {...form.getInputProps("customerId")}
        />
        <TextInput label="Date" type="date" {...form.getInputProps("createdAt")} />
        <TextInput label="Description" placeholder="Cash transaction description" {...form.getInputProps("description")} />
        <Textarea label="Notes" placeholder="Notes (optional)" autosize minRows={2} {...form.getInputProps("notes")} />
        <Group grow>
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
          <NumberInput
            label="Amount"
            prefix={currencySymbol(currency)}
            decimalScale={2}
            fixedDecimalScale
            step={0.01}
            {...form.getInputProps("amountMajor")}
          />
        </Group>
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

- [ ] **Step 2: Add the table component**

Create `apps/web/src/components/cash-transactions/cash-transactions-table.tsx`:

```tsx
import { ActionIcon, Menu, Table, Text } from "@mantine/core"
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

import { type Currency, formatMinor } from "@/lib/currency"

export type CashTransactionRow = {
  id: string
  amount: number
  currency: Currency | string
  createdAt: string
  description: string | null
  notes: string | null
  customerId: string
  createdById: string
  customer: { id: string; name: string }
  createdBy: { id: string; name: string }
}

type CashTransactionsTableProps = {
  items: CashTransactionRow[]
  onEdit: (item: CashTransactionRow) => void
  onDelete: (item: CashTransactionRow) => void
}

export function CashTransactionsTable({ items, onEdit, onDelete }: CashTransactionsTableProps) {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No cash transactions.
      </Text>
    )
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th>Customer</Table.Th>
          <Table.Th>Description</Table.Th>
          <Table.Th>Amount</Table.Th>
          <Table.Th>Created by</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((tx) => (
          <Table.Tr key={tx.id}>
            <Table.Td>{tx.createdAt}</Table.Td>
            <Table.Td>
              <Text
                renderRoot={(props) => (
                  <Link to="/customers/$customerId" params={{ customerId: tx.customer.id }} {...props} />
                )}
                c="blue"
              >
                {tx.customer.name}
              </Text>
            </Table.Td>
            <Table.Td>{tx.description ?? <Text c="dimmed">-</Text>}</Table.Td>
            <Table.Td>{formatMinor(tx.amount, tx.currency as Currency)}</Table.Td>
            <Table.Td>{tx.createdBy.name}</Table.Td>
            <Table.Td>
              <Menu shadow="md" width={140} position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" size="sm" aria-label="Actions">
                    <IconDots size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => onEdit(tx)}>
                    Update
                  </Menu.Item>
                  <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => onDelete(tx)}>
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
```

- [ ] **Step 3: Add the create dialog**

Create `apps/web/src/components/cash-transactions/create-cash-transaction-dialog.tsx`:

```tsx
import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  CashTransactionForm,
  type CashTransactionFormSubmit,
} from "@/components/cash-transactions/cash-transaction-form"
import { createCashTransaction } from "@/functions/cash-transactions"
import { cashTransactionKeys } from "@/lib/query-keys"

type CreateCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: { id: string; name: string }[]
}

export function CreateCashTransactionDialog({ open, onOpenChange, customers }: CreateCashTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: CashTransactionFormSubmit) => createCashTransaction({ data: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashTransactionKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Cash transaction created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Cash Transaction">
      <CashTransactionForm
        customers={customers}
        initialValues={{
          customerId: "",
          createdAt: new Date().toISOString().slice(0, 10),
          description: "",
          notes: "",
          amountMajor: 0,
          currency: "EUR",
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

- [ ] **Step 4: Add the edit dialog**

Create `apps/web/src/components/cash-transactions/edit-cash-transaction-dialog.tsx`:

```tsx
import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  CashTransactionForm,
  type CashTransactionFormSubmit,
} from "@/components/cash-transactions/cash-transaction-form"
import type { CashTransactionRow } from "@/components/cash-transactions/cash-transactions-table"
import { updateCashTransaction } from "@/functions/cash-transactions"
import { CURRENCIES, type Currency } from "@/lib/currency"
import { cashTransactionKeys } from "@/lib/query-keys"

type EditCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: CashTransactionRow
  customers: { id: string; name: string }[]
}

export function EditCashTransactionDialog({
  open,
  onOpenChange,
  transaction,
  customers,
}: EditCashTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (values: CashTransactionFormSubmit) =>
      updateCashTransaction({ data: { ...values, id: transaction.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashTransactionKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Cash transaction updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const initialCurrency: Currency = (CURRENCIES as readonly string[]).includes(transaction.currency)
    ? (transaction.currency as Currency)
    : "EUR"

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Cash Transaction">
      <CashTransactionForm
        customers={customers}
        initialValues={{
          customerId: transaction.customerId,
          createdAt: transaction.createdAt,
          description: transaction.description ?? "",
          notes: transaction.notes ?? "",
          amountMajor: transaction.amount / 100,
          currency: initialCurrency,
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

- [ ] **Step 5: Add the delete dialog**

Create `apps/web/src/components/cash-transactions/delete-cash-transaction-dialog.tsx`:

```tsx
import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { CashTransactionRow } from "@/components/cash-transactions/cash-transactions-table"
import { deleteCashTransaction } from "@/functions/cash-transactions"
import { type Currency, formatMinor } from "@/lib/currency"
import { cashTransactionKeys } from "@/lib/query-keys"

type DeleteCashTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: CashTransactionRow
}

export function DeleteCashTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: DeleteCashTransactionDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteCashTransaction({ data: { id: transaction.id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashTransactionKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Cash transaction deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Delete Cash Transaction">
      <Stack>
        <Text size="sm">
          This will permanently remove the cash transaction of{" "}
          {formatMinor(transaction.amount, transaction.currency as Currency)} for {transaction.customer.name}. This
          action cannot be undone.
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

- [ ] **Step 6: Type-check**

Run:

```bash
bun run check-types
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/cash-transactions
git commit -m "feat: add cash transaction components"
```

## Task 4: Cash Page and Navigation

**Files:**
- Create: `apps/web/src/routes/_authenticated/cash.tsx`
- Modify: `apps/web/src/routes/_authenticated/route.tsx`

- [ ] **Step 1: Add the Cash route**

Create `apps/web/src/routes/_authenticated/cash.tsx`:

```tsx
import { Button, Container, Group, NativeSelect, Pagination, Stack, TextInput } from "@mantine/core"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"

import { CreateCashTransactionDialog } from "@/components/cash-transactions/create-cash-transaction-dialog"
import { DeleteCashTransactionDialog } from "@/components/cash-transactions/delete-cash-transaction-dialog"
import { EditCashTransactionDialog } from "@/components/cash-transactions/edit-cash-transaction-dialog"
import { CashTransactionsTable, type CashTransactionRow } from "@/components/cash-transactions/cash-transactions-table"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { listCashTransactions } from "@/functions/cash-transactions"
import { getCustomers } from "@/functions/customers"
import { cashTransactionKeys, customerKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/cash")({
  component: CashPage,
})

function CashPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [currency, setCurrency] = useState("")
  const [direction, setDirection] = useState<"all" | "received" | "paid">("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CashTransactionRow | null>(null)
  const [deleting, setDeleting] = useState<CashTransactionRow | null>(null)

  const filter = useMemo(
    () => ({
      page,
      pageSize: 25,
      search: search || undefined,
      customerId: customerId || undefined,
      currency: currency || undefined,
      direction,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [page, search, customerId, currency, direction, dateFrom, dateTo],
  )

  const cashQuery = useQuery({
    queryKey: cashTransactionKeys.list(filter),
    queryFn: () => listCashTransactions({ data: filter }),
  })

  const customersQuery = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const customers = customersQuery.data ?? []
  const pageCount = Math.max(1, Math.ceil((cashQuery.data?.totalCount ?? 0) / (cashQuery.data?.pageSize ?? 25)))

  return (
    <Container size="xl">
      <PageHeader
        title="Cash"
        description="Record manual cash received from or paid to customers."
        actions={
          <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateOpen(true)}>
            New transaction
          </Button>
        }
      />

      <Stack gap="md">
        <Section padding="lg">
          <Stack gap="sm">
            <Group align="end">
              <TextInput
                label="Search"
                placeholder="Description, notes, or customer"
                leftSection={<IconSearch size={14} />}
                value={search}
                onChange={(event) => {
                  setPage(1)
                  setSearch(event.currentTarget.value)
                }}
              />
              <NativeSelect
                label="Customer"
                value={customerId}
                onChange={(event) => {
                  setPage(1)
                  setCustomerId(event.currentTarget.value)
                }}
                data={[{ value: "", label: "All customers" }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
              />
              <NativeSelect
                label="Currency"
                value={currency}
                onChange={(event) => {
                  setPage(1)
                  setCurrency(event.currentTarget.value)
                }}
                data={[
                  { value: "", label: "All currencies" },
                  { value: "EUR", label: "EUR" },
                  { value: "GBP", label: "GBP" },
                ]}
              />
              <NativeSelect
                label="Direction"
                value={direction}
                onChange={(event) => {
                  setPage(1)
                  setDirection(event.currentTarget.value as "all" | "received" | "paid")
                }}
                data={[
                  { value: "all", label: "All" },
                  { value: "received", label: "Received" },
                  { value: "paid", label: "Paid" },
                ]}
              />
            </Group>
            <Group align="end">
              <TextInput label="From" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.currentTarget.value)} />
              <TextInput label="To" type="date" value={dateTo} onChange={(event) => setDateTo(event.currentTarget.value)} />
            </Group>
          </Stack>
        </Section>

        <Section padding="lg">
          <Stack>
            <CashTransactionsTable items={cashQuery.data?.items ?? []} onEdit={setEditing} onDelete={setDeleting} />
            <Group justify="flex-end">
              <Pagination value={page} onChange={setPage} total={pageCount} />
            </Group>
          </Stack>
        </Section>
      </Stack>

      <CreateCashTransactionDialog open={createOpen} onOpenChange={setCreateOpen} customers={customers} />
      {editing && (
        <EditCashTransactionDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          transaction={editing}
          customers={customers}
        />
      )}
      {deleting && (
        <DeleteCashTransactionDialog
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
          transaction={deleting}
        />
      )}
    </Container>
  )
}
```

- [ ] **Step 2: Add Cash to sidebar navigation**

Modify `apps/web/src/routes/_authenticated/route.tsx`.

Add icon import:

```ts
IconCash,
```

Add to `workspaceNav`:

```ts
{ to: "/cash", label: "Cash", icon: IconCash },
```

- [ ] **Step 3: Build the web app and refresh generated route metadata**

Run:

```bash
bun --filter web build
```

Expected: build passes. If `apps/web/src/routeTree.gen.ts` changes because the new file route was discovered, include that generated file in the commit command below.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated/cash.tsx apps/web/src/routes/_authenticated/route.tsx apps/web/src/routeTree.gen.ts
git commit -m "feat: add cash transactions page"
```

## Task 5: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run db tests**

```bash
bun --filter @prive-admin-tanstack/db test
```

Expected: all db tests pass.

- [ ] **Step 2: Run type-check**

```bash
bun run check-types
```

Expected: all package type-checks pass.

- [ ] **Step 3: Run web build**

```bash
bun --filter web build
```

Expected: production build passes.

- [ ] **Step 4: Inspect final diff**

```bash
git status --short
git diff --stat main...HEAD
```

Expected: only cash transaction schema, migration, functions, components, route, nav, route tree, design spec, and this plan are changed.

- [ ] **Step 5: Commit final plan if not already committed**

```bash
git add docs/superpowers/plans/2026-07-02-cash-transactions.md
git commit -m "docs: add cash transactions implementation plan"
```
