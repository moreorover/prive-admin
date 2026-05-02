# Transaction Currency Support — Design

Date: 2026-05-02

## Pivot (2026-05-02, post-implementation)

The original design stored the preferred currency on `customer`. During implementation it was clarified that customers don't access the application — staff/admin users do. The preferred currency is therefore a per-app-user setting, not a per-customer one.

**What changed:**

- `customer.preferred_currency` is **not** added. The customer schema is unchanged.
- A new `user_settings` table (`packages/db/src/schema/user-settings.ts`) holds the preferred currency keyed by `userId` (FK to `users.id`, cascade delete). Existing users have no row; reads default to `"GBP"` until they save a preference. New columns: `user_id PK`, `preferred_currency text NOT NULL DEFAULT 'GBP'`, `created_at`, `updated_at`.
- The picker lives on the profile page's `EditUserModal` (`apps/web/src/routes/_authenticated/profile.tsx`), not the customer create/edit forms. Customer forms are unchanged.
- New transactions default to the signed-in user's `preferredCurrency`, sourced via `getUserSettings()` (a TanStack `useQuery` on the appointment page), with a runtime `CURRENCIES.includes(...)` guard falling back to `"GBP"`.
- New server fns: `getUserSettings`, `updateUserSettings` (`apps/web/src/functions/user-settings.ts`).
- The "per-user/session default-currency preference" entry under Non-Goals is now in scope and was implemented.

The rest of the design (per-transaction currency column, `formatMinor`, split totals on customer/appointment pages, per-currency dashboard cards, GBP-only hair stats, GBP/EUR allow-list) stands as originally specified.

The sections below describe the original customer-side design and remain for historical context. Read them with the pivot above in mind.

## Background

Transactions currently store `amount` as an integer in pence (minor units) with the currency hardcoded to GBP throughout the UI (`£` prefix, `formatCents` helpers in five files). The system needs to support EUR alongside GBP.

All existing transactions are GBP and must be backfilled accordingly. Customers gain a preferred currency that pre-fills new transaction forms but is overridable per transaction. Aggregations (customer summary, appointment totals, dashboard stats) display split totals per currency — no FX conversion.

## Goals

- Store currency on each transaction.
- Store a preferred currency on each customer (default for new transactions).
- Allow currency override per transaction.
- Display correct symbol everywhere a transaction amount is rendered.
- Show split (per-currency) totals for customer summaries, appointment totals, and dashboard stats.
- Backfill all existing rows to GBP.

## Non-Goals

- FX conversion or merging totals across currencies.
- Adding currencies beyond GBP/EUR (code change to extend later).
- Currency support for hair pricing (`hair.pricePerGram`, `hairAssigned.soldFor`, `hairAssigned.profit`) — stays GBP-only.
- Currency support for order pricing.
- Per-user/session default-currency preference.

## Schema Changes

### `customer` (packages/db/src/schema/customer.ts)

Add column:

```ts
preferredCurrency: text("preferred_currency").notNull().default("GBP"),
```

### `transaction` (packages/db/src/schema/transaction.ts)

Add column:

```ts
currency: text("currency").notNull().default("GBP"),
```

### Migration

`bun run db:push` issues `ALTER TABLE … ADD COLUMN … NOT NULL DEFAULT 'GBP'` for both tables. Existing rows backfill automatically via the column default. No separate data-migration script needed.

### Validation

No `pgEnum` (matches the rest of the schema, which uses plain `text` columns gated by Zod). Allowed values are enforced application-side via the shared `currencySchema`.

## Shared Currency Module

New file: `apps/web/src/lib/currency.ts`

```ts
import { z } from "zod"

export const CURRENCIES = ["GBP", "EUR"] as const
export type Currency = (typeof CURRENCIES)[number]

export const currencySchema = z.enum(CURRENCIES)

const SYMBOLS: Record<Currency, string> = { GBP: "£", EUR: "€" }

export const currencySymbol = (c: Currency) => SYMBOLS[c]

export const formatMinor = (minor: number, c: Currency) =>
  `${SYMBOLS[c]}${(minor / 100).toFixed(2)}`

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "GBP", label: "£ GBP" },
  { value: "EUR", label: "€ EUR" },
]
```

This module replaces the five hardcoded `£` / `formatCents` / `formatCurrency` sites:

- `apps/web/src/components/transactions/transactions-table.tsx:25`
- `apps/web/src/components/transactions/delete-transaction-dialog.tsx:19`
- `apps/web/src/components/transactions/transaction-form.tsx:88`
- `apps/web/src/routes/_authenticated/customers/$customerId.tsx:87`
- `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx:42`

Each call site switches to `formatMinor(amount, currency)` (or `currencySymbol(currency)` for the form prefix).

## Transaction Form

`apps/web/src/components/transactions/transaction-form.tsx`

- Add `currency: Currency` to `TransactionFormValues` and `TransactionFormSubmit`.
- Rename `amountPounds` to `amountMajor` (no longer pound-specific).
- Add a `NativeSelect` next to the existing Type field, populated from `CURRENCY_OPTIONS`.
- The `NumberInput` `prefix` becomes `currencySymbol(currency)`. Because Mantine `NumberInput`'s `prefix` is read at render, mirror the form's currency in local state and update on change — same pattern already used for `status` at `transaction-form.tsx:41`.
- Validation unchanged otherwise.

### Dialogs

- `create-transaction-dialog.tsx`: accept a new `defaultCurrency: Currency` prop. Initial form value is `defaultCurrency`. Parents (appointment page, customer page) pass the selected customer's `preferredCurrency`. Falls back to `"GBP"` when no customer is yet chosen.
- `edit-transaction-dialog.tsx`: initial `currency` is `transaction.currency`.

### Server Functions (`apps/web/src/functions/transactions.ts`)

- Extend `transactionFieldsSchema` with `currency: currencySchema`.
- Insert/update statements write `currency`.
- Read queries return `currency` (already covered by `findMany`/`findFirst` selecting all columns).

### Table Row Type (`transactions-table.tsx`)

Add `currency: Currency` to `TransactionRow`. Amount cell renders `formatMinor(tx.amount, tx.currency)`.

## Customer Form

The customer create/edit form gains a `NativeSelect` bound to `preferredCurrency` with `CURRENCY_OPTIONS` data and `"GBP"` as the default. The corresponding server function (in `apps/web/src/functions/customers.ts`) extends its input validator with `preferredCurrency: currencySchema` and writes the column on insert/update.

## Aggregations — Split Totals

### Customer summary (`apps/web/src/functions/customers.ts:60-74`)

Replace the single `transactionSum` with a per-currency map:

```ts
transactions: { columns: { amount: true, currency: true } },
// …
const transactionSumsMinor: Record<Currency, number> = { GBP: 0, EUR: 0 }
for (const t of result.transactions) {
  transactionSumsMinor[t.currency as Currency] += t.amount
}
return { …, transactionSumsMinor }
```

`transactionSum` is removed from the return shape. Callers must read `transactionSumsMinor` instead.

### Customer detail page (`apps/web/src/routes/_authenticated/customers/$customerId.tsx:264`)

- Drop the local `formatCurrency` helper.
- The "Transactions" `StatCard` renders both currencies present (e.g. `£123.45 · €67.89`). Currencies whose total is `0` are omitted; if the customer has no transactions in either currency, render `£0.00` (their `preferredCurrency` default would be a small follow-up nicety but is out of scope here).
- Hair stats (`hairAssignedProfitSum`, `hairAssignedSoldForSum`) stay GBP-only — they read from a different table that doesn't have currency yet.

### Appointment page (`apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx:97-99`)

Group `txList` by currency, then compute `completedSum`, `pendingSum`, `totalSum` per group. Render one totals block per currency present (or a single GBP block if only GBP transactions exist).

### Dashboard (`apps/web/src/functions/dashboard.ts:109-133`)

`getTransactionStatsForDate` returns a per-currency shape:

```ts
{ GBP: CategoryStat, EUR: CategoryStat }
```

The fetch query adds `currency`. Each currency's amounts feed `calcAll` and `categoryFromCents` independently. The dashboard route renders one stat card per currency. If only one currency has data in the period, only that card renders.

## Display Format

`formatMinor` produces `£12.34` / `€12.34`. ISO-code suffixes (e.g. `12.34 GBP`) are not used — symbol-only display matches the existing `£12.34` convention.

## Risks

- **Mantine `NumberInput` prefix**: `prefix` is evaluated at render. The form must mirror the selected currency in local state (same pattern as the existing `status` mirror) so the prefix re-renders on currency change.
- **`transactionSum` removal**: the field disappears from the customer summary return shape. Any consumer beyond `customers/$customerId.tsx` must be migrated. Search for `transactionSum` before merging.
- **Dashboard shape change**: `getTransactionStatsForDate` return type changes. The dashboard route consumer must be updated together.

## Testing (Manual Smoke)

1. Create customer with `preferredCurrency = EUR`. New transaction form pre-fills EUR; override to GBP works; both persist correctly.
2. Edit an existing GBP transaction — currency stays GBP, change to EUR, refresh, value sticks.
3. Customer detail page: customer with mixed currencies shows split totals (`£X · €Y`); customer with only GBP shows only GBP.
4. Appointment page: appointment with mixed-currency transactions shows two totals blocks.
5. Dashboard: month with mixed currencies shows two stat cards with correct current/previous deltas.
6. Existing transactions (pre-migration) display as `£` after `db:push`.

## Out of Scope / Follow-Ups

- Hair pricing currency.
- Order pricing currency.
- FX conversion / unified totals.
- Adding more ISO currencies (extend `CURRENCIES` constant).
- A migration script to set `preferredCurrency = EUR` for specific customers (admin can edit individually for now).
