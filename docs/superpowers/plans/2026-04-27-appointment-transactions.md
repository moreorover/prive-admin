# Appointment Transactions UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the transactions surface on `/appointments/$appointmentId` (table, donut summary, create/edit/delete dialogs, per-personnel "New transaction") matching `main_backup` behaviour, using current TanStack Start + Drizzle conventions.

**Architecture:** Server functions in `apps/web/src/functions/transactions.ts` query the existing `transaction` table (Drizzle, cents, FK to appointment + customer). UI lives in `apps/web/src/components/transactions/` (Mantine `Modal` dialogs, shared form). Route file `routes/_authenticated/appointments/$appointmentId.tsx` prefetches in loader, renders summary + table + dialogs, and adds a per-personnel row menu. Mantine `DonutChart` (`@mantine/charts`) used for the Completed/Pending split.

**Tech Stack:** TanStack Start (`createServerFn`), TanStack Router file-based routes, TanStack Query, Drizzle ORM, Mantine v9 (`core`, `dates`, `form`, `notifications`, `charts`), Zod, `@tabler/icons-react`, `dayjs`.

**Spec:** `docs/superpowers/specs/2026-04-27-appointment-transactions-design.md`

**Branch:** `feature/appointment-transactions` (already created and contains the spec commit).

**Verification model:** Repository has no automated tests (no vitest, no spec files). After each task that produces code, verification is `bun run check-types`, `bun run check` (oxlint + oxfmt), and where applicable a manual browser check on the dev server (`bun run dev:web`). Each task ends with a commit.

---

## File Structure

**New files:**
- `apps/web/src/functions/transactions.ts` — four server functions: `getTransactionsByAppointmentId`, `createTransaction`, `updateTransaction`, `deleteTransaction`.
- `apps/web/src/components/transactions/transactions-table.tsx` — pure table render.
- `apps/web/src/components/transactions/transaction-form.tsx` — shared form for create + edit.
- `apps/web/src/components/transactions/create-transaction-dialog.tsx` — Modal wrapper around the form, calls `createTransaction`.
- `apps/web/src/components/transactions/edit-transaction-dialog.tsx` — Modal wrapper around the form, calls `updateTransaction`.
- `apps/web/src/components/transactions/delete-transaction-dialog.tsx` — confirm Modal, calls `deleteTransaction`.

**Modified files:**
- `apps/web/package.json` — add `@mantine/charts` dependency.
- `apps/web/src/lib/query-keys.ts` — add `transactionKeys`.
- `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx` — prefetch, summary card, transactions card, dialogs, per-personnel "New transaction" menu.
- `apps/web/src/routes/_authenticated/customers/$customerId.tsx` — flip `formatCurrency` from `$` to `£`.

---

## Task 1: Add `@mantine/charts` dependency

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add `@mantine/charts` to dependencies**

In `apps/web/package.json`, add the dependency in the existing alphabetical block (next to other `@mantine/*` entries):

```json
"@mantine/charts": "^9.0.0",
```

Final dependencies block must contain:

```json
"@mantine/charts": "^9.0.0",
"@mantine/core": "^9.0.0",
"@mantine/dates": "^9.1.0",
"@mantine/form": "^9.0.0",
"@mantine/hooks": "^9.0.0",
"@mantine/modals": "^9.0.0",
"@mantine/notifications": "^9.0.0",
"@mantine/schedule": "^9.1.0",
```

- [ ] **Step 2: Install**

Run from repo root:

```bash
bun install
```

Expected: lockfile updates, no errors. `node_modules/@mantine/charts` exists.

Verify:

```bash
ls node_modules/@mantine/charts/package.json
```

Expected: file exists.

- [ ] **Step 3: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json bun.lock
git commit -m "build(web): add @mantine/charts dependency"
```

---

## Task 2: Add `transactionKeys` to query-keys

**Files:**
- Modify: `apps/web/src/lib/query-keys.ts`

- [ ] **Step 1: Append `transactionKeys` factory**

Add this to the bottom of `apps/web/src/lib/query-keys.ts`:

```ts
export const transactionKeys = {
  all: ["transactions"] as const,
  byAppointment: (appointmentId: string) =>
    [...transactionKeys.all, "by-appointment", appointmentId] as const,
}
```

- [ ] **Step 2: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 3: Lint + format**

```bash
bun run check
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/query-keys.ts
git commit -m "feat(web): add transactionKeys query-key factory"
```

---

## Task 3: Implement server functions in `transactions.ts`

**Files:**
- Create: `apps/web/src/functions/transactions.ts`

- [ ] **Step 1: Create the file with all four server functions**

Create `apps/web/src/functions/transactions.ts` with this exact contents:

```ts
import { db } from "@prive-admin-tanstack/db"
import { personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { transaction } from "@prive-admin-tanstack/db/schema/transaction"
import { createServerFn } from "@tanstack/react-start"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"

const transactionTypeSchema = z.enum(["BANK", "CASH", "PAYPAL"])
const transactionStatusSchema = z.enum(["PENDING", "COMPLETED"])
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")

const transactionFieldsSchema = z.object({
  name: z.string().nullish(),
  notes: z.string().nullish(),
  amount: z.number().int(),
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  completedDateBy: dateStringSchema,
})

export const getTransactionsByAppointmentId = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ appointmentId: z.string() }))
  .handler(async ({ data }) => {
    return db.query.transaction.findMany({
      where: eq(transaction.appointmentId, data.appointmentId),
      with: { customer: { columns: { id: true, name: true } } },
      orderBy: [asc(transaction.completedDateBy)],
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
    const allowedCustomerIds = new Set<string>()
    const appointmentRow = await db.query.appointment.findFirst({
      where: (a, { eq }) => eq(a.id, data.appointmentId),
      columns: { clientId: true },
    })
    if (!appointmentRow) {
      throw new Error("Appointment not found")
    }
    allowedCustomerIds.add(appointmentRow.clientId)
    const personnelRows = await db
      .select({ personnelId: personnelOnAppointments.personnelId })
      .from(personnelOnAppointments)
      .where(eq(personnelOnAppointments.appointmentId, data.appointmentId))
    for (const row of personnelRows) {
      allowedCustomerIds.add(row.personnelId)
    }
    if (!allowedCustomerIds.has(data.customerId)) {
      throw new Error("Customer is not the appointment client or assigned personnel")
    }

    const [result] = await db
      .insert(transaction)
      .values({
        appointmentId: data.appointmentId,
        customerId: data.customerId,
        name: data.name ?? null,
        notes: data.notes ?? null,
        amount: data.amount,
        type: data.type,
        status: data.status,
        completedDateBy: data.completedDateBy,
      })
      .returning()
    return result
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
        type: data.type,
        status: data.status,
        completedDateBy: data.completedDateBy,
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

Note: the unused `and` import is intentional reservation removed — replace the `import { and, asc, eq }` line with `import { asc, eq } from "drizzle-orm"` if oxlint flags `and` as unused. Run lint to find out.

- [ ] **Step 2: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 3: Lint + format**

```bash
bun run check
```

Expected: exits 0. If oxlint flags `and` as unused, remove it from the import:

```ts
import { asc, eq } from "drizzle-orm"
```

Re-run `bun run check`. Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/functions/transactions.ts
git commit -m "feat(web): add transactions server functions"
```

---

## Task 4: Build `TransactionsTable` component

**Files:**
- Create: `apps/web/src/components/transactions/transactions-table.tsx`

- [ ] **Step 1: Create the table component**

Create `apps/web/src/components/transactions/transactions-table.tsx` with this exact contents:

```tsx
import { ActionIcon, Badge, Group, Menu, Table, Text, Tooltip } from "@mantine/core"
import { IconAlertTriangle, IconCheck, IconClock, IconDots, IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import dayjs from "dayjs"

export type TransactionRow = {
  id: string
  name: string | null
  notes: string | null
  amount: number
  type: "BANK" | "CASH" | "PAYPAL" | string
  status: "PENDING" | "COMPLETED" | string
  completedDateBy: string
  customerId: string
  appointmentId: string | null
  customer?: { id: string; name: string } | null
}

type TransactionsTableProps = {
  items: TransactionRow[]
  onEdit: (item: TransactionRow) => void
  onDelete: (item: TransactionRow) => void
}

const formatCents = (cents: number) => `£${(cents / 100).toFixed(2)}`

const typeColor: Record<string, string> = {
  BANK: "teal",
  CASH: "blue",
  PAYPAL: "grape",
}

export function TransactionsTable({ items, onEdit, onDelete }: TransactionsTableProps) {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No transactions.
      </Text>
    )
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Customer</Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Amount</Table.Th>
          <Table.Th>Completed</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((tx) => {
          const isCompleted = tx.status === "COMPLETED"
          const completedDate = dayjs(tx.completedDateBy)
          const isOverdue = !isCompleted && completedDate.isBefore(dayjs(), "day")
          const statusBadgeColor = isCompleted ? "green" : "pink"
          const statusIcon = isCompleted ? <IconCheck size={12} /> : <IconClock size={12} />
          return (
            <Table.Tr key={tx.id}>
              <Table.Td>
                {tx.customer ? (
                  <Text
                    renderRoot={(props) => (
                      <Link to="/customers/$customerId" params={{ customerId: tx.customer!.id }} {...props} />
                    )}
                    c="blue"
                  >
                    {tx.customer.name}
                  </Text>
                ) : (
                  "—"
                )}
              </Table.Td>
              <Table.Td>{tx.name ?? <Text c="dimmed">—</Text>}</Table.Td>
              <Table.Td>
                <Badge color={typeColor[tx.type] ?? "gray"} variant="light">
                  {tx.type}
                </Badge>
              </Table.Td>
              <Table.Td>{formatCents(tx.amount)}</Table.Td>
              <Table.Td>
                <Group gap="xs" align="center">
                  <Badge color={statusBadgeColor} leftSection={statusIcon} radius="sm" size="sm" variant="light">
                    {tx.status}
                  </Badge>
                  <Text size="xs" c={isOverdue ? "red" : "dimmed"} fw={500}>
                    {completedDate.format("DD MMM YYYY")}
                  </Text>
                  {isOverdue && (
                    <Tooltip label="Pending transaction is overdue" withArrow>
                      <IconAlertTriangle size={14} color="red" />
                    </Tooltip>
                  )}
                </Group>
              </Table.Td>
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
          )
        })}
      </Table.Tbody>
    </Table>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 3: Lint + format**

```bash
bun run check
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/transactions/transactions-table.tsx
git commit -m "feat(web): add transactions table component"
```

---

## Task 5: Build `TransactionForm` component

**Files:**
- Create: `apps/web/src/components/transactions/transaction-form.tsx`

- [ ] **Step 1: Create the form**

Create `apps/web/src/components/transactions/transaction-form.tsx` with this exact contents:

```tsx
import { Button, Group, NativeSelect, NumberInput, Stack, Textarea, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { useMemo } from "react"

export type TransactionFormValues = {
  name: string
  notes: string
  amountPounds: number
  type: "BANK" | "CASH" | "PAYPAL"
  status: "PENDING" | "COMPLETED"
  completedDateBy: Date | null
}

export type TransactionFormSubmit = {
  name: string | null
  notes: string | null
  amount: number
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

const toIsoDate = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function TransactionForm({ initialValues, submitLabel, onSubmit, loading }: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    mode: "uncontrolled",
    initialValues,
    validate: {
      completedDateBy: (value) => (value ? null : "Date is required"),
      amountPounds: (value) => (Number.isFinite(value) ? null : "Amount is required"),
    },
  })

  const dateLabel = useMemo(
    () => (form.getValues().status === "COMPLETED" ? "When was it completed?" : "When should it be completed by?"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.getValues().status],
  )

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        if (!values.completedDateBy) return
        await onSubmit({
          name: values.name.trim() || null,
          notes: values.notes.trim() || null,
          amount: Math.round(values.amountPounds * 100),
          type: values.type,
          status: values.status,
          completedDateBy: toIsoDate(values.completedDateBy),
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
          />
        </Group>
        <DateInput label={dateLabel} valueFormat="DD MMM YYYY" required {...form.getInputProps("completedDateBy")} />
        <NumberInput
          label="Amount"
          prefix="£"
          decimalScale={2}
          fixedDecimalScale
          step={0.01}
          {...form.getInputProps("amountPounds")}
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

If oxlint flags the `eslint-disable-next-line` comment as unrecognized, remove that comment line and replace `[form.getValues().status]` with the literal `[]` and accept the static label, OR move the label computation inline (re-evaluated on every render — fine). Simpler safer alternative if lint complains: drop `useMemo` entirely and compute inline:

```tsx
const dateLabel =
  form.getValues().status === "COMPLETED" ? "When was it completed?" : "When should it be completed by?"
```

- [ ] **Step 2: Type-check**

```bash
bun run check-types
```

Expected: exits 0. If `DateInput` value type is `string | null` instead of `Date | null` in this Mantine version, change the type alias `completedDateBy: Date | null` to `completedDateBy: string | null` and update `toIsoDate` to accept `string` (re-parse via `dayjs(value).format("YYYY-MM-DD")`). Re-run.

- [ ] **Step 3: Lint + format**

```bash
bun run check
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/transactions/transaction-form.tsx
git commit -m "feat(web): add shared transaction form"
```

---

## Task 6: Build `CreateTransactionDialog`

**Files:**
- Create: `apps/web/src/components/transactions/create-transaction-dialog.tsx`

- [ ] **Step 1: Create the dialog**

Create `apps/web/src/components/transactions/create-transaction-dialog.tsx` with this exact contents:

```tsx
import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { TransactionForm, type TransactionFormSubmit } from "@/components/transactions/transaction-form"
import { createTransaction } from "@/functions/transactions"

type CreateTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  customerId: string
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
  appointmentId,
  customerId,
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
          amountPounds: 0,
          type: "BANK",
          status: "PENDING",
          completedDateBy: new Date(),
        }}
        submitLabel="Create"
        loading={mutation.isPending}
        onSubmit={(values) => mutation.mutateAsync(values)}
      />
    </Modal>
  )
}
```

If Task 5's type adjustment switched `completedDateBy` to `string | null`, change `completedDateBy: new Date()` here to a YYYY-MM-DD string built the same way as `toIsoDate(new Date())`.

- [ ] **Step 2: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 3: Lint + format**

```bash
bun run check
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/transactions/create-transaction-dialog.tsx
git commit -m "feat(web): add create transaction dialog"
```

---

## Task 7: Build `EditTransactionDialog`

**Files:**
- Create: `apps/web/src/components/transactions/edit-transaction-dialog.tsx`

- [ ] **Step 1: Create the dialog**

Create `apps/web/src/components/transactions/edit-transaction-dialog.tsx` with this exact contents:

```tsx
import { Modal } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { TransactionForm, type TransactionFormSubmit } from "@/components/transactions/transaction-form"
import { updateTransaction } from "@/functions/transactions"

type EditTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    name: string | null
    notes: string | null
    amount: number
    type: "BANK" | "CASH" | "PAYPAL" | string
    status: "PENDING" | "COMPLETED" | string
    completedDateBy: string
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  invalidateKeys,
}: EditTransactionDialogProps) {
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

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Transaction">
      <TransactionForm
        initialValues={{
          name: transaction.name ?? "",
          notes: transaction.notes ?? "",
          amountPounds: transaction.amount / 100,
          type: initialType,
          status: initialStatus,
          completedDateBy: new Date(transaction.completedDateBy),
        }}
        submitLabel="Save Changes"
        loading={mutation.isPending}
        onSubmit={(values) => mutation.mutateAsync(values)}
      />
    </Modal>
  )
}
```

Same `completedDateBy` type note from Task 6 applies: if Task 5 switched the form field to `string | null`, replace `new Date(transaction.completedDateBy)` here with `transaction.completedDateBy`.

- [ ] **Step 2: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 3: Lint + format**

```bash
bun run check
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/transactions/edit-transaction-dialog.tsx
git commit -m "feat(web): add edit transaction dialog"
```

---

## Task 8: Build `DeleteTransactionDialog`

**Files:**
- Create: `apps/web/src/components/transactions/delete-transaction-dialog.tsx`

- [ ] **Step 1: Create the dialog**

Create `apps/web/src/components/transactions/delete-transaction-dialog.tsx` with this exact contents:

```tsx
import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteTransaction } from "@/functions/transactions"

type DeleteTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    id: string
    name: string | null
    amount: number
    customer?: { name: string } | null
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

const formatCents = (cents: number) => `£${(cents / 100).toFixed(2)}`

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
          {transaction.name ? ` "${transaction.name}"` : ""} of {formatCents(transaction.amount)}
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

- [ ] **Step 2: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 3: Lint + format**

```bash
bun run check
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/transactions/delete-transaction-dialog.tsx
git commit -m "feat(web): add delete transaction dialog"
```

---

## Task 9: Wire transactions into appointment route — loader prefetch + table card

**Files:**
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`

- [ ] **Step 1: Add imports for transactions module**

At the top of `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`, add the new imports alongside the existing ones (keep alphabetical groups). Do not touch the `@tabler/icons-react` import yet (Tasks 10/11 will add their own icons).

Add new imports below the existing component imports:

```tsx
import { CreateTransactionDialog } from "@/components/transactions/create-transaction-dialog"
import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog"
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog"
import { TransactionsTable, type TransactionRow } from "@/components/transactions/transactions-table"
import { getTransactionsByAppointmentId } from "@/functions/transactions"
```

In the existing `@/lib/query-keys` import line, add `transactionKeys`:

```tsx
import { appointmentKeys, customerKeys, hairAssignedKeys, transactionKeys } from "@/lib/query-keys"
```

- [ ] **Step 2: Add prefetch in route loader**

Inside the `loader` array passed to `Promise.all`, add a third prefetch entry. The full loader becomes:

```tsx
loader: async ({ context, params }) => {
  await Promise.all([
    context.queryClient.prefetchQuery(
      queryOptions({
        queryKey: appointmentKeys.detail(params.appointmentId),
        queryFn: () => getAppointment({ data: { id: params.appointmentId } }),
      }),
    ),
    context.queryClient.prefetchQuery(
      queryOptions({
        queryKey: hairAssignedKeys.byAppointment(params.appointmentId),
        queryFn: () => getHairAssignedByAppointment({ data: { appointmentId: params.appointmentId } }),
      }),
    ),
    context.queryClient.prefetchQuery(
      queryOptions({
        queryKey: transactionKeys.byAppointment(params.appointmentId),
        queryFn: () => getTransactionsByAppointmentId({ data: { appointmentId: params.appointmentId } }),
      }),
    ),
  ])
},
```

- [ ] **Step 3: Add transactions query, state hooks, and invalidate key inside `AppointmentDetailPage`**

Locate the `useQuery` calls inside `AppointmentDetailPage`. Just below the existing `hairAssigned` query, add:

```tsx
const { data: transactions } = useQuery({
  queryKey: transactionKeys.byAppointment(appointmentId),
  queryFn: () => getTransactionsByAppointmentId({ data: { appointmentId } }),
})
```

Add new state hooks alongside the existing `createOpen`, `editItem`, `deleteItem`, `pickPersonnelOpen`:

```tsx
const [createTxOpen, setCreateTxOpen] = useState(false)
const [createTxCustomerId, setCreateTxCustomerId] = useState<string | null>(null)
const [editTx, setEditTx] = useState<TransactionRow | null>(null)
const [deleteTx, setDeleteTx] = useState<TransactionRow | null>(null)
```

After the existing `invalidateKeys` declaration, add:

```tsx
const txInvalidateKeys = [{ queryKey: transactionKeys.byAppointment(appointmentId) }]

const openCreateTx = (customerId: string) => {
  setCreateTxCustomerId(customerId)
  setCreateTxOpen(true)
}
```

- [ ] **Step 4: Add the Transactions card before the existing Notes card**

Locate the existing `<Card withBorder>` whose title is `Notes` (the one wrapping `appointment.notes`). Immediately before it, insert this new card:

```tsx
<Card withBorder>
  <Group justify="space-between" mb="sm">
    <Title order={5}>Transactions</Title>
    <Button
      variant="subtle"
      size="xs"
      leftSection={<IconPlus size={12} />}
      onClick={() => openCreateTx(appointment.client.id)}
    >
      New
    </Button>
  </Group>
  <TransactionsTable items={transactions ?? []} onEdit={setEditTx} onDelete={setDeleteTx} />
</Card>
```

- [ ] **Step 5: Render the three dialogs at the bottom of the returned JSX**

Inside the outer `<Stack>`, after the `<PickPersonnelModal ... />` (the last existing JSX element), append:

```tsx
<CreateTransactionDialog
  open={createTxOpen}
  onOpenChange={(open) => {
    setCreateTxOpen(open)
    if (!open) setCreateTxCustomerId(null)
  }}
  appointmentId={appointmentId}
  customerId={createTxCustomerId ?? appointment.client.id}
  invalidateKeys={txInvalidateKeys}
/>
{editTx && (
  <EditTransactionDialog
    open={!!editTx}
    onOpenChange={(open) => !open && setEditTx(null)}
    transaction={editTx}
    invalidateKeys={txInvalidateKeys}
  />
)}
{deleteTx && (
  <DeleteTransactionDialog
    open={!!deleteTx}
    onOpenChange={(open) => !open && setDeleteTx(null)}
    transaction={deleteTx}
    invalidateKeys={txInvalidateKeys}
  />
)}
```

- [ ] **Step 6: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 7: Lint + format**

```bash
bun run check
```

Expected: exits 0.

- [ ] **Step 8: Manual verification**

Start dev server (in a separate terminal):

```bash
bun run dev:web
```

Open `http://localhost:3001` in a browser, sign in, navigate to `/appointments` → pick an appointment.

Verify:
- "Transactions" card renders below "Hair Assigned"/"Personnel" group, above "Notes".
- Empty state shows "No transactions." (assuming none exist).
- Click "New" → modal opens with form fields (Name, Notes, Type, Status, Date, Amount).
- Submit a transaction → notification "Transaction created", row appears in table.
- Row "Update" action opens edit dialog with prefilled values; saving updates the row.
- Row "Delete" action opens confirm dialog; confirming removes the row.
- Type Badge color: BANK=teal, CASH=blue, PAYPAL=grape.
- Status Badge: COMPLETED=green check, PENDING=pink clock.
- Pending transaction with past date shows red date text + warning triangle icon.
- Customer name in row links to `/customers/$customerId`.

Stop the dev server (Ctrl+C).

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx
git commit -m "feat(web): wire transactions table + CRUD into appointment page"
```

---

## Task 10: Add Transactions Summary card with DonutChart

**Files:**
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`

- [ ] **Step 1: Add chart import + IconCash**

At the top of the route file, after the existing Mantine imports, add:

```tsx
import { DonutChart } from "@mantine/charts"
```

In the existing `@tabler/icons-react` import line, add `IconCash` (kept alphabetical):

```tsx
import { IconArrowLeft, IconCash, IconClock, IconPlus, IconUser, IconUsers } from "@tabler/icons-react"
```

If oxlint orders imports differently, run `bun run check` and let oxfmt rewrite.

- [ ] **Step 2: Compute summary totals inside the component**

Inside `AppointmentDetailPage`, after the `transactions` query, add:

```tsx
const txList = transactions ?? []
const completedSum = txList
  .filter((t) => t.status === "COMPLETED")
  .reduce((acc, t) => acc + t.amount, 0)
const pendingSum = txList
  .filter((t) => t.status === "PENDING")
  .reduce((acc, t) => acc + t.amount, 0)
const totalSum = txList.reduce((acc, t) => acc + t.amount, 0)
const chartData = [
  { name: "Completed", value: Math.abs(completedSum), color: "green.4" },
  { name: "Pending", value: Math.abs(pendingSum), color: "pink.6" },
]
const formatCents = (cents: number) => `£${(cents / 100).toFixed(2)}`
```

- [ ] **Step 3: Insert the summary card right before the Transactions card**

Immediately before the `<Card withBorder>` for "Transactions" added in Task 9, insert:

```tsx
<Card withBorder>
  <Group justify="space-between" mb="sm">
    <Title order={5}>
      <Group gap={6}>
        <IconCash size={14} />
        Transactions Summary
      </Group>
    </Title>
  </Group>
  {totalSum === 0 ? (
    <Text size="sm" c="dimmed">
      No transactions yet.
    </Text>
  ) : (
    <Group align="center" gap="xl">
      <DonutChart size={124} thickness={15} data={chartData} withLabels={false} />
      <Stack gap={2}>
        <Text size="sm">
          Completed: <b>{formatCents(completedSum)}</b>
        </Text>
        <Text size="sm">
          Pending: <b>{formatCents(pendingSum)}</b>
        </Text>
        <Text size="sm">
          Total: <b>{formatCents(totalSum)}</b>
        </Text>
      </Stack>
    </Group>
  )}
</Card>
```

- [ ] **Step 4: Add Mantine charts CSS to the root layout**

Mantine charts requires its CSS imported once. Open `apps/web/src/routes/__root.tsx` and verify whether `@mantine/charts/styles.css` is already imported. If not, add it after the existing Mantine CSS imports:

```tsx
import "@mantine/charts/styles.css"
```

If `__root.tsx` does not exist or imports differ, search for the file that imports `@mantine/core/styles.css` (run `grep -rn "@mantine/core/styles" apps/web/src`) and add the charts CSS import there in the same group.

- [ ] **Step 5: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 6: Lint + format**

```bash
bun run check
```

Expected: exits 0.

- [ ] **Step 7: Manual verification**

Start dev server:

```bash
bun run dev:web
```

Navigate to an appointment with at least one COMPLETED and one PENDING transaction. Verify:
- "Transactions Summary" card renders above the Transactions card.
- Donut shows green slice = completed sum, pink slice = pending sum.
- Right-side text lines display correctly formatted £ totals.
- With zero transactions, summary card shows "No transactions yet." (no donut).

Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx apps/web/src/routes/__root.tsx
git commit -m "feat(web): add appointment transactions donut summary"
```

If `__root.tsx` was untouched (CSS already imported elsewhere), drop it from the `git add`.

---

## Task 11: Per-personnel "New transaction" action

**Files:**
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`

- [ ] **Step 1: Replace personnel row with menu-equipped layout**

Locate the existing personnel rendering inside the Personnel `<Card>`:

```tsx
{appointment.personnel.map((p) => (
  <Card key={p.personnelId} withBorder padding="xs">
    <Group gap="xs">
      <IconUser size={12} />
      <Text size="sm">{p.personnel.name}</Text>
    </Group>
  </Card>
))}
```

Replace with:

```tsx
{appointment.personnel.map((p) => (
  <Card key={p.personnelId} withBorder padding="xs">
    <Group justify="space-between" gap="xs">
      <Group gap="xs">
        <IconUser size={12} />
        <Text size="sm">{p.personnel.name}</Text>
      </Group>
      <Menu shadow="md" width={180} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" size="sm" aria-label="Personnel actions">
            <IconDots size={14} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconCash size={14} />} onClick={() => openCreateTx(p.personnelId)}>
            New transaction
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  </Card>
))}
```

- [ ] **Step 2: Add missing imports**

Verify the imports at the top of the file include `ActionIcon` and `Menu` from `@mantine/core` (the existing top import block already imports `ActionIcon`; add `Menu` if missing). In the `@tabler/icons-react` import line add `IconDots` (kept alphabetical):

```tsx
import { IconArrowLeft, IconCash, IconClock, IconDots, IconPlus, IconUser, IconUsers } from "@tabler/icons-react"
```

`IconCash` was already added in Task 10.

- [ ] **Step 3: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 4: Lint + format**

```bash
bun run check
```

Expected: exits 0.

- [ ] **Step 5: Manual verification**

Start the dev server:

```bash
bun run dev:web
```

Navigate to an appointment that has at least one personnel assigned (use the existing "Pick" button to add one if needed). Verify:
- Each personnel card shows a kebab/dots action button on the right.
- Clicking it reveals a "New transaction" menu item.
- Selecting it opens the Create Transaction modal with the personnel preselected as `customerId` (verify by submitting a row and checking that the new row's customer cell shows that personnel's name).
- The "New" button in the Transactions card header still defaults to the appointment client.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx
git commit -m "feat(web): add per-personnel new-transaction action"
```

---

## Task 12: Flip customer-detail currency from `$` to `£`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId.tsx:87`

- [ ] **Step 1: Replace the formatCurrency definition**

In `apps/web/src/routes/_authenticated/customers/$customerId.tsx`, find:

```tsx
const formatCurrency = (n: number) => `$${n.toFixed(2)}`
```

Replace with:

```tsx
const formatCurrency = (n: number) => `£${n.toFixed(2)}`
```

- [ ] **Step 2: Type-check**

```bash
bun run check-types
```

Expected: exits 0.

- [ ] **Step 3: Lint + format**

```bash
bun run check
```

Expected: exits 0.

- [ ] **Step 4: Manual verification**

Start the dev server:

```bash
bun run dev:web
```

Navigate to `/customers` → pick a customer with non-zero transaction sum. Verify:
- Stat cards now show `£` prefix on Transactions, Hair Profit, Hair Sold For (previously `$`).

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/_authenticated/customers/$customerId.tsx
git commit -m "fix(web): use £ symbol on customer summary stats"
```

---

## Task 13: End-to-end manual verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run full type-check + lint**

```bash
bun run check-types && bun run check
```

Expected: both exit 0.

- [ ] **Step 2: Start dev server**

```bash
bun run dev:web
```

- [ ] **Step 3: Walk the manual checklist from the spec**

Open `http://localhost:3001`, sign in, then for an existing appointment with at least one personnel assigned:

- [ ] Create transaction (default customer = appointment client) — appears in table with correct fields, Customer column links to that client.
- [ ] Create transaction from a personnel row — `customerId` matches the personnel.
- [ ] Edit transaction — change name/amount/status/date — updates persist after modal close, table refreshes.
- [ ] Delete transaction — confirm dialog → row removed.
- [ ] Pending transaction with completedDateBy in the past — shows red date text + warning triangle icon.
- [ ] Donut chart Completed slice = sum of COMPLETED amounts; Pending slice = sum of PENDING amounts; Total caption matches.
- [ ] Customer-name cell links to `/customers/$customerId`.
- [ ] `formatCurrency` on customer detail now shows `£`.
- [ ] Empty state: appointment with zero transactions shows "No transactions." in the table card and "No transactions yet." in the summary card.
- [ ] Refunds: amount entered as `-12.34` saves and displays as `-£12.34`.

Stop the dev server (Ctrl+C).

- [ ] **Step 4: No commit (verification only)**

If any check fails, return to the relevant task and fix. Otherwise the branch is ready for PR.

---

## Done

After all tasks pass, the branch `feature/appointment-transactions` is ready to push and open a PR. Suggested PR title:

```
feat(web): restore transactions UI on appointment detail page
```

PR description should reference the spec at `docs/superpowers/specs/2026-04-27-appointment-transactions-design.md`.
