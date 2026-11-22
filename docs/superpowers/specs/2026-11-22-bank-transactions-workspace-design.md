# Bank transactions workspace design

## Intent

Make bank-statement review a first-class daily workflow. Users should be able to open one unified inbox and see transactions across all legal entities and bank accounts without navigating through `Entities → Bank accounts → Bank account`.

The existing legal-entity bank-account pages remain useful for account setup and maintenance, but they should no longer be the only entry point to transactions.

## Goals

- Add a top-level `Bank transactions` workspace to the authenticated navigation.
- Show statement entries from all configured bank accounts by default.
- Make legal entity and bank account visible on every row and available as filters.
- Preserve the existing pending/ignored workflow, attachment upload and assignment, and attachment export capabilities.
- Make CSV import available from the unified workspace, with the destination account derived from the CSV IBAN and clearly confirmed to the user.
- Keep filters, pagination, and mutations owned by the route/page owner in accordance with the frontend architecture rules.
- Extend the existing resource-oriented `list` API/application service rather than adding a page-specific backend procedure.

## Non-goals

- Combining bank statement entries with appointment transactions or cash transactions into one financial ledger.
- Redesigning legal-entity or bank-account creation/editing flows beyond adding useful links to the new workspace.
- Adding automatic bank feeds or scheduled imports.
- Replacing the existing attachment storage, preview, assignment, or ZIP export behavior.
- Building a full transaction detail page in the first iteration.

## Anti-goals

- Do not make users select an entity or account before seeing useful transaction data.
- Do not hide the source account in a cross-account list.
- Do not duplicate CSV import into multiple competing screens.
- Do not put server reads or mutations inside reusable table, filter, import, or attachment components.
- Do not introduce a REST/Hono adapter for the internal web workflow.

## Current state and constraints

The current statement-entry route is nested at `/legal-entities/:legalEntityId/bank-accounts/:bankAccountId`. It owns the statement query, status filter, pagination, CSV import, attachment queries, attachment mutations, and ignore/undo mutations. The table already receives account metadata through the statement-entry relation, and the repository list query already supports an optional `bankAccountId` filter and returns bank-account/legal-entity relations.

The existing `bankStatementEntries.list` procedure already uses the standard paged response envelope. Its input currently supports `pageSize`, `page`, optional `bankAccountId`, and optional `status`. API governance requires the backend capability to remain modeled first in `packages/application/src/services`, with the tRPC router acting as a transport adapter.

## Approaches considered

### Dedicated unified workspace — selected

Add a route such as `/bank-transactions` and a main navigation item. The default query has no account filter, so it returns all statement entries. The page provides legal-entity, bank-account, status, date, and text filters; the table shows source context and row actions. CSV import opens from this page and uses the file IBAN to identify the configured account.

This best matches the user goal and keeps the daily mental model centered on transactions.

### Persistent global account switcher

Keep the current account-detail route as the main experience, add an account switcher to global navigation, and add an all-accounts option. This is smaller, but still makes accounts the primary object and risks crowding the global header.

### Unified inbox with split-pane transaction details

Use the selected approach's inbox, but open complete row details and attachment actions in a side panel. This may improve scanning later, but it adds interaction complexity and is not needed to remove the current navigation friction.

## Proposed experience

### Entry point

Add `Bank transactions` under the Workspace navigation group. The route opens with all statement entries, defaulting to `Pending` status so the existing reconciliation workflow remains focused. A secondary `All statuses` choice is available for review and audit work.

The legal-entity bank-account list should retain setup actions and gain a clear link back to the unified transaction workspace. The account detail page can retain its existing transaction section for deep links and backward compatibility, but the new workspace becomes the recommended daily entry point.

### Filters and URL state

The route owns filter state and serializes it in search parameters so filtered views can be bookmarked and refreshed. Proposed filters:

- `entityId`: optional legal entity filter.
- `bankAccountId`: optional bank account filter, constrained by the selected entity when present.
- `status`: `PENDING`, `IGNORED`, or `ALL`; default `PENDING`.
- `from` and `to`: optional transaction-date range.
- `q`: optional search over the supported transaction text fields.
- `page`: current page, default 1.

Changing any filter resets the page to 1. Selecting an entity narrows the bank-account selector. Clearing the entity clears the account filter if that account is no longer valid in the visible set.

The first implementation should use the existing backend-supported fields plus entity/account filtering. Date and text search should be added at the repository/service/API boundary together so the UI does not pretend to filter data locally.

### Table

Each row should show:

- Date.
- Legal entity and bank account.
- Counterparty.
- Purpose/description.
- Credit or debit amount with currency.
- Attachment count and attachment actions.
- Pending/ignored state and row actions.

The current attachment cell and ignore/undo actions should be reused through prop-driven components. Account context must remain visible even when the list contains multiple accounts.

### CSV import

Place one `Import CSV` action in the workspace header. The import dialog/card should:

1. Accept a supported CSV file.
2. Parse and display the IBAN, detected account name, legal entity, row count, and duplicate estimate/result.
3. Block import when the IBAN is not configured and link the user to bank-account setup.
4. Require an explicit confirmation when the destination account is known.
5. Invalidate the unified list and show the inserted/skipped result after import.

The existing import parser and service remain the source of truth for SEB/Swedbank format support and duplicate handling.

### Attachments and export

Keep attachment preview, upload, assignment, removal, and unassignment available from each row. Keep the monthly ZIP export in the workspace header, with the selected account filter applied when one exists. When no account is selected, the export action should require choosing one account before generating a ZIP, since the current export endpoint is account-scoped.

## Backend shape

Extend the application service `listBankStatementEntries` input with the stable resource filters needed by the workspace, likely `legalEntityId`, `from`, `to`, and `query`/`q`, while retaining optional `bankAccountId` and `status`. Update the database repository query and indexes only if profiling or the existing schema shows they are necessary.

Keep the existing `bankStatementEntries.list` procedure and extend its input schema. Do not create a procedure named after the page or UI workflow. The procedure continues to return the standard paged envelope, with the backend default page size of 10 when omitted; the UI may pass its chosen page size explicitly.

The row shape should continue to include the bank account and legal entity relation needed to render source context. Attachment queries remain lazy and are only started for the opened row, consistent with the existing interaction-only query behavior.

## Frontend ownership

The new route owner loads legal entities/accounts and the statement list through TanStack Router loader query options. The rendered query must use the same option builder and every search value that changes the query must be included in `loaderDeps`.

The route/page owner owns:

- Search-parameter parsing and navigation.
- Query option construction and prefetching.
- CSV import, ignore, undo, attachment, and export side effects.
- Cache invalidation, notifications, pagination reset, and import-dialog close/reset.

Reusable components receive data, loading/error state, and explicit callbacks only. Architecture tests should be added or updated to protect this ownership boundary.

## Success criteria

- A user can reach all bank transactions from the main navigation in one click.
- The default view shows transactions across all bank accounts and identifies their source account/entity.
- Switching entity/account filters does not require a route change or multi-step navigation.
- CSV import can be completed from the unified workspace and clearly reports its destination and result.
- Existing attachment and pending/ignored workflows remain available.
- Direct links preserve filters and page state.
- Existing bank-account setup flows and deep links continue to work.

## Open decisions for implementation

The builder can settle visual spacing, exact table column widths, and whether the import confirmation is a modal or an inline step. The product-level decisions are:

- The unified inbox and filter options use the existing access scope of the signed-in user and show every legal entity and bank account that user can access.
- Text search is case-insensitive and partial across counterparty, purpose, document number, external reference, IBAN, and bank name.
- `from` and `to` are inclusive date-only filters against the transaction date.
- IBANs are normalized before matching. Import requires exactly one configured account match; missing, invalid, or ambiguous matches block import.
- The default Pending view remains selected when it has no rows; its empty state offers an explicit `View all transactions` action.
- ZIP export reuses the selected account when one is filtered. With all accounts selected, it opens an account-and-month picker.

The remaining implementation defaults are pending-first, URL-backed filters, all accounts initially, and account-required ZIP export.
