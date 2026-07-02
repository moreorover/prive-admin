# Cash Transactions Design

## Goal

Add a dedicated Cash page for recording manual cashflow transactions. Cash transactions must be stored separately from the existing appointment/order transaction table, must not belong to a salon or legal entity, and must be linked to the customer involved in the cash movement and the user who created the record.

## Scope

This design covers:

- A new `cash_transaction` database table.
- A top-level `/cash` page.
- Create, update, delete, search, filter, and pagination flows.
- Server-side validation and authenticated mutations.
- Focused tests for schema and server behavior.

This design does not include:

- Relations to salon or legal entity.
- Integration into bank statement imports.
- Creator-only permissions.
- Cash balance reporting beyond the transaction list.

## Data Model

Create a new `cash_transaction` table.

Fields:

- `id`: text primary key using the existing CUID pattern.
- `amount`: integer minor units, signed. Positive values mean cash received, negative values mean cash paid out.
- `currency`: text, limited by application validation to `EUR` or `GBP`, defaulting to `EUR`.
- `createdAt`: date column, user-editable, required, defaulting to the current day in the form.
- `description`: optional short text.
- `notes`: optional longer text.
- `customerId`: required FK to `customer.id`, with `onDelete: restrict`.
- `createdById`: required FK to `users.id`, set from the authenticated session, with the existing user relation pattern.
- `updatedAt`: timestamp with timezone, maintained on update.

The user-facing transaction date is intentionally day-level only. The field is named `createdAt` to match the requested model, but it is a Postgres `date`, not a timestamp. If a future audit timestamp is needed, add a separately named system field such as `recordedAt`.

Add Drizzle relations:

- `cashTransaction.customer`
- `cashTransaction.createdBy`
- `customer.cashTransactions`
- `user.cashTransactionsCreated`

## Page

Add a top-level Cash page at `/cash`, available from the Workspace navigation.

The page should use existing Mantine and TanStack Query patterns. It should show:

- A toolbar with search and filters.
- A server-paginated table, newest-first by default.
- Dialogs for create, update, and delete confirmation.

Toolbar controls:

- Search across description, notes, and customer name.
- Customer filter.
- Currency filter.
- Date range filter against `createdAt`.
- Direction filter: all, received, or paid, derived from the sign of `amount`.

Table columns:

- Date
- Customer
- Description
- Amount
- Created by
- Actions

Amount formatting should reuse the existing currency helpers and preserve the sign. Empty optional fields should display the app's existing muted dash style.

## Server Functions

Add cash transaction server functions protected by `requireAuthMiddleware`.

Functions:

- `listCashTransactions({ page, pageSize, search, customerId, currency, direction, dateFrom, dateTo })`
- `createCashTransaction(input)`
- `updateCashTransaction(input)`
- `deleteCashTransaction({ id })`

List behavior:

- Server-side pagination.
- Bounded `pageSize`.
- Newest-first ordering by `createdAt`, with a stable secondary order by `id`.
- Return rows with customer and creator display data.
- Return `items`, `page`, `pageSize`, and `totalCount` so the UI can render page controls.

Mutation behavior:

- `createdById` is always taken from the authenticated session.
- Form input must not be trusted to set or update `createdById`.
- Update and delete are allowed for any authenticated user, matching the app's current CRUD style.
- Updating does not change `createdById`.

## Validation

Shared validation should live near the existing app schemas or in the cash transaction server module, following the local pattern.

Rules:

- `customerId` is required.
- `createdAt` is required as a day-level date.
- `amount` is required, stored as integer minor units, and must not be zero.
- Negative amounts are valid.
- `currency` must be `EUR` or `GBP` and defaults to `EUR` in the form.
- `description` is optional and length-bounded.
- `notes` is optional and length-bounded.
- Pagination and filter inputs must be bounded and normalized server-side.

## Errors

Expected errors:

- Creating or updating with a missing customer returns a clear server error.
- Deleting a customer with cash transactions is blocked by the `onDelete: restrict` FK.
- Invalid filters or page sizes are rejected or normalized before querying.
- Missing authentication is handled by the existing auth middleware.

UI errors should follow the app's existing notification style.

## Tests

Add focused tests scaled to the feature risk.

Database/schema tests:

- `cash_transaction.customerId` restricts customer deletion.
- `cash_transaction.createdById` relates to users.
- Signed amounts can be stored.

Server function tests:

- Create defaults to `EUR` when the form default is submitted.
- Create stores positive and negative amounts unchanged.
- Create sets `createdById` from the session.
- Update does not change `createdById`.
- Search matches description, notes, and customer name.
- Filters work for customer, currency, direction, and date range.
- Pagination returns bounded result sets and metadata.

UI testing can be limited to smoke coverage unless broader browser tests are already being added for nearby CRUD pages.

## Implementation Notes

Prefer option 1 from brainstorming: a dedicated `cash_transaction` ledger. Do not extend the existing `transaction` table, because that table currently models appointment/order-linked transactions and has different relation constraints.

Keep components narrow:

- `CashTransactionForm`
- `CashTransactionsTable`
- `CreateCashTransactionDialog`
- `EditCashTransactionDialog`
- `DeleteCashTransactionDialog`

Reuse existing components and helpers where possible:

- `PageHeader`
- `Section`
- currency helpers from `@/lib/currency`
- customer query patterns
- existing mutation notification and query invalidation patterns

## Approval

Approved by user on 2026-07-02.
