# Appointment Transactions UI — Design

**Date:** 2026-04-27
**Status:** Approved (brainstorm)
**Scope:** Restore transactions UI on `/appointments/$appointmentId` to match `main_backup` behaviour, using current TanStack Start + Drizzle conventions.

## Background

The `transaction` table already exists in `packages/db/src/schema/transaction.ts` with FKs:

- `customerId` → `customer.id` (cascade)
- `orderId` → `order.id` (set null, nullable)
- `appointmentId` → `appointment.id` (set null, nullable)

No FK to `hair_orders` (intentionally removed in `main_backup` migration `20250509124115_removed_transactions_from_hair_order`).

The current TanStack Start app has zero transaction CRUD UI. The customer detail page shows a `transactionSum` stat card (already wired through `getCustomerSummary`). Appointment and hair-order pages have no transaction surfaces.

In `main_backup`:

- `/customers/[id]` — summary stat only (already migrated equivalent).
- `/appointments/[id]` — full transactions table + donut chart + create/edit/delete drawers + per-personnel "New transaction" action + client-card "New transaction" action.
- `/hair-orders/[id]` — no transactions UI.

## Goals

1. Add full transactions surface on `/appointments/$appointmentId` (table, summary chart, create/edit/delete).
2. Add per-personnel "New transaction" action on the appointment Personnel card.
3. Match existing TanStack Start app conventions (Drizzle, server functions, Modal-based dialogs, `formatCents` helper, Mantine UI).

## Non-goals

- `/transactions` standalone page.
- Customer-detail transactions list / CRUD (stat stays as-is).
- Hair-order transactions (no FK; would require schema change — explicitly out).
- Order-linked transactions UI.
- CSV import (main_backup feature).

## Decisions

| # | Decision |
|---|----------|
| Currency | `£` symbol everywhere transactions display. Also flip `formatCurrency` in `apps/web/src/routes/_authenticated/customers/$customerId.tsx` from `$` → `£` for consistency. |
| Amount unit | Cents on the wire and in DB (matches existing app). Form input takes pounds (decimal); server multiplies by 100 on insert/update. Display divides by 100 via `formatCents`. |
| Dialog style | Mantine `Modal` (matches current hair-assigned / customer dialogs). |
| Summary chart | `@mantine/charts` `DonutChart` (Completed vs Pending). Add dep. |
| Entry points | (a) "New" button in Transactions card header. (b) Per-personnel row action "New transaction" preselecting that personnel as customer. |
| Row actions | Update + Delete (no "View Transaction" — no transactions detail page in scope). Customer name cell links to `/customers/$customerId`. |

## Architecture

### Data layer — `apps/web/src/functions/transactions.ts` (new)

Server functions using `createServerFn` with the existing auth-guard pattern (matches `apps/web/src/functions/appointments.ts`, `hair-assigned.ts`). Drizzle queries against the existing `transaction` table.

| Function | Input | Output / Behaviour |
|----------|-------|-------------------|
| `getTransactionsByAppointmentId` | `{ appointmentId: string }` | Returns transactions for the appointment, joined with `customer` (id, name). Ordered by `completedDateBy` ascending. |
| `createTransaction` | `{ appointmentId, customerId, name?, notes?, amount: number (cents), type: "BANK"|"CASH"|"PAYPAL", status: "PENDING"|"COMPLETED", completedDateBy: string (YYYY-MM-DD) }` | Inserts row. Validates `customerId` is the appointment client OR a personnel attached to the appointment. |
| `updateTransaction` | `{ id, name?, notes?, amount, type, status, completedDateBy: string (YYYY-MM-DD) }` | Updates fields. `customerId`, `appointmentId`, `orderId` immutable. |
| `deleteTransaction` | `{ id }` | Hard delete. |

Validation: `zod` schemas inline (matches existing functions).

Errors: server fns throw `Error` with a user-readable message; React Query `onError` surfaces via `notifications.show({ color: "red", ... })`. No special 404 — the appointment route already 404s before transactions render.

### Query keys — `apps/web/src/lib/query-keys.ts`

Add:

```ts
export const transactionKeys = {
  all: ["transactions"] as const,
  byAppointment: (appointmentId: string) =>
    [...transactionKeys.all, "by-appointment", appointmentId] as const,
}
```

Mutations (create / update / delete) invalidate `transactionKeys.byAppointment(appointmentId)`.

### UI components — `apps/web/src/components/transactions/` (new)

| File | Purpose |
|------|---------|
| `transactions-table.tsx` | `<TransactionsTable items={...} onEdit onDelete />`. Mantine `Table`. Columns: Customer (Link), Name, Type (Badge: BANK=teal, CASH=blue, PAYPAL=grape), Amount (`formatCents`), Completed (Badge + date, red if overdue), Actions (`ActionIcon` menu → Update / Delete). Empty state: dimmed "No transactions." |
| `transaction-form.tsx` | Shared form used by create + edit dialogs. Fields: Name (TextInput), Notes (Textarea), Type (NativeSelect), Status (NativeSelect), CompletedDateBy (`@mantine/dates` `DateInput`, label flips by status — value normalized to YYYY-MM-DD on submit), Amount (NumberInput, prefix `£`, decimal). Submit emits cents-normalized payload (`Math.round(pounds * 100)`). |
| `create-transaction-dialog.tsx` | Mantine `Modal`. Calls `createTransaction`. Props: `open`, `onOpenChange`, `appointmentId`, `customerId`, `invalidateKeys`. |
| `edit-transaction-dialog.tsx` | Mantine `Modal`. Calls `updateTransaction`. Initial amount = `cents / 100`. |
| `delete-transaction-dialog.tsx` | Mantine `Modal` confirm. Calls `deleteTransaction`. |

### Route integration — `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`

**Loader:** add prefetch for `transactionKeys.byAppointment(appointmentId)`.

**Component:**

- `useQuery` for transactions.
- Compute `completedSum`, `pendingSum`, `totalSum` (sum of all amounts).
- DonutChart `chartData = [{ name: "Completed", value: |completedSum|, color: "green.4" }, { name: "Pending", value: |pendingSum|, color: "pink.6" }]`.
- New cards (after the existing Personnel/Hair Assigned `Group grow`, before Notes):
  - **Transactions Summary card** — `DonutChart size={124} thickness={15}` + caption `Total: £{(totalSum/100).toFixed(2)}`.
  - **Transactions card** — header "Transactions" + "New" button → `<CreateTransactionDialog>` with `customerId = appointment.client.id`. Body = `<TransactionsTable>`.
- Personnel card update: each personnel row gains a row-action "New transaction" → opens `<CreateTransactionDialog>` with `customerId = p.personnelId`.
- State hooks: `editTx`, `deleteTx` mirroring hair-assigned pattern.
- Invalidate keys passed to dialogs: `[{ queryKey: transactionKeys.byAppointment(appointmentId) }]`.

**Side cleanup (in scope):** flip `formatCurrency` in `apps/web/src/routes/_authenticated/customers/$customerId.tsx` from `$` to `£`.

### Dependencies

- Add `@mantine/charts` to `apps/web/package.json` (matching `@mantine/core` major).
- `@mantine/dates` already present.

## Edge cases

| Case | Behaviour |
|------|-----------|
| Empty transactions list | Table renders dimmed "No transactions." |
| Personnel not yet picked | "New" still works for client. |
| Customer deleted | Transaction cascade-deletes (existing FK behaviour, no action needed). |
| Appointment deleted | Transaction `appointmentId` set null, row persists (existing FK; out of scope). |
| Overdue | `status === "PENDING" && completedDateBy < today` → red date text + warning icon. |
| Negative amounts | Allowed (refunds). `NumberInput` has no `min`. |

## Testing

No automated test infra in repo today. Manual verification checklist (to be expanded in implementation plan):

- [ ] Create transaction (default customer = appointment client) — appears in table with correct fields.
- [ ] Create transaction from personnel row — `customerId` matches personnel.
- [ ] Edit transaction — updates persist, table refreshes.
- [ ] Delete transaction — row removed.
- [ ] Pending transaction with past date — shows red overdue indicator.
- [ ] Donut chart matches Completed vs Pending sums.
- [ ] Customer-name cell links to `/customers/$customerId`.
- [ ] `formatCurrency` on customer detail now shows `£`.

## Files touched

**New:**
- `apps/web/src/functions/transactions.ts`
- `apps/web/src/components/transactions/transactions-table.tsx`
- `apps/web/src/components/transactions/transaction-form.tsx`
- `apps/web/src/components/transactions/create-transaction-dialog.tsx`
- `apps/web/src/components/transactions/edit-transaction-dialog.tsx`
- `apps/web/src/components/transactions/delete-transaction-dialog.tsx`

**Modified:**
- `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`
- `apps/web/src/routes/_authenticated/customers/$customerId.tsx` (currency symbol only)
- `apps/web/src/lib/query-keys.ts` (add `transactionKeys`)
- `apps/web/package.json` (add `@mantine/charts`)
