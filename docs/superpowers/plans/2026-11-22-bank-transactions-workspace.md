# Bank Transactions Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a top-level unified bank-transactions workspace that shows statement entries across all accessible accounts and preserves import, review, attachment, and export workflows.

**Architecture:** Extend the existing resource-oriented bank-statement list service, repository, and tRPC `list` procedure with legal-entity, date, and text filters. Add a route-owned `/bank-transactions` page whose URL search params drive identical loader prefetch and rendered queries; keep mutations and server-state side effects in the route owner while reusable UI components remain prop-driven.

**Tech Stack:** React, TanStack Router, TanStack Query, tRPC, Mantine, Drizzle, Vitest, Vite+ (`vp`).

**Spec:** `docs/superpowers/specs/2026-11-22-bank-transactions-workspace-design.md`

## Global Constraints

- Backend capability must be modeled first as an application service in `packages/application/src/services`.
- Keep the existing resource-oriented `bankStatementEntries.list` procedure; do not add a page-specific procedure.
- Collection reads return the standard paged response envelope and use backend default `pageSize` 10 when omitted.
- Route owners own server reads, mutations, cache invalidation, navigation, notifications, and dialog state.
- Components receive data/loading/error state and explicit callbacks; they must not initiate server reads or mutations.
- All entity/account lists and transaction results use the signed-in user's existing access scope.
- Search is case-insensitive and partial across counterparty, purpose, document number, external reference, IBAN, and bank name.
- Date filters are inclusive date-only values against the transaction date.
- CSV import requires exactly one normalized configured IBAN match.
- The default status is `PENDING`; an empty pending view offers an explicit all-statuses action.
- ZIP export requires an account; all-account mode opens an account-and-month picker.

## Review Focus

- Cross-account rows must always identify legal entity and bank account; test the unfiltered result shape and table rendering.
- An entity filter and account filter must compose correctly and reject/clear accounts outside the selected entity; test repository and route search behavior.
- Text/date filters must not be applied only in the browser; test inclusive boundaries and representative searchable fields at the repository/service boundary.
- CSV imports with formatted IBANs, missing IBANs, invalid IBANs, or ambiguous matches must not import; test the service/router contract and UI confirmation state.
- Lazy attachment queries and account-scoped ZIP export must remain safe in all-account mode; test route owner behavior and export target selection.

### Task 1: Extend bank-statement listing filters

**Files:**
- Modify: `packages/db/src/repositories/bank-statement-entries.ts`
- Modify: `packages/application/src/services/bank-statement-entries.ts`
- Modify: `packages/api/src/routers/bank-statement-entries.ts`
- Test: `packages/db/src/repositories/bank-statement-entries.test.ts`
- Test: `packages/application/src/services/bank-statement-entries.test.ts`
- Test: `packages/api/src/routers/bank-statement-entries.test.ts`

**Interfaces:**
- Produces `listBankStatementEntries({ pageSize, offset, bankAccountId?, legalEntityId?, status?, from?, to?, query? })` through the application service and the same filters in the `bankStatementEntries.list` input schema.
- Keeps the paged result shape and relation payload needed by the UI: bank account plus legal entity.

- [ ] **Step 1: Write failing repository tests** for unfiltered cross-account listing, legal-entity filtering, inclusive date boundaries, case-insensitive partial text matching across the approved fields, and account/entity filter composition.
- [ ] **Step 2: Run the focused repository tests** with `vp test packages/db/src/repositories/bank-statement-entries.test.ts`; confirm the new cases fail for missing filter behavior.
- [ ] **Step 3: Implement repository filters** using Drizzle conditions, preserving date/imported-at ordering, pagination, count parity, and relation loading.
- [ ] **Step 4: Write failing application/router tests** asserting the exact expanded input is forwarded and the paged envelope remains unchanged.
- [ ] **Step 5: Extend the application service and tRPC schema** with the agreed filter names and validation; keep `list` resource-oriented and default page-size behavior intact.
- [ ] **Step 6: Run focused DB/application/API tests** and confirm all pass.
- [ ] **Step 7: Commit** with `feat: add bank transaction list filters`.

### Task 2: Add the route-owned unified workspace shell

**Files:**
- Modify: `apps/web/src/lib/app-navigation.ts`
- Create: `apps/web/src/routes/_authenticated/bank-transactions.tsx`
- Create: `apps/web/src/routes/_authenticated/-components/bank-transactions-page.tsx`
- Create: `apps/web/src/routes/_authenticated/-data/bank-transactions-data.ts`
- Test: `apps/web/src/lib/app-navigation.test.ts`
- Test: `apps/web/src/routes/-route-component-organization.test.ts`
- Test: `apps/web/src/routes/_authenticated/-route-data-organization.test.ts`

**Interfaces:**
- Route search params represent `entityId?`, `bankAccountId?`, `status`, `from?`, `to?`, `q?`, and `page`.
- The route-local query builder accepts the parsed search state and returns the exact `trpc.bankStatementEntries.list.queryOptions` used by both loader prefetch and rendered query.
- `BankTransactionsPage` receives data and explicit event handlers; it does not call `useQuery`, `useMutation`, or route action hooks.

- [ ] **Step 1: Write failing navigation and architecture tests** for the new main-nav item and the rule that server-state hooks remain in the route owner/data module rather than the page component.
- [ ] **Step 2: Implement the `/bank-transactions` route** with validated search params, `loaderDeps`, query-option reuse, legal-entity/account option loading, and page-one reset navigation when filters change.
- [ ] **Step 3: Add the navigation item** under Workspace and ensure active-state matching works for the route.
- [ ] **Step 4: Implement the prop-driven workspace shell** with page header, filter region, transaction summary count, and an empty state that offers `View all transactions` when Pending has no rows.
- [ ] **Step 5: Run focused web tests** and verify direct links preserve search state and prefetch/render query keys are identical.
- [ ] **Step 6: Commit** with `feat: add unified bank transactions workspace`.

### Task 3: Move transaction review UI into the unified workspace

**Files:**
- Modify: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/bank-statement-entries-card.tsx`
- Create or modify: `apps/web/src/components/bank-transactions/bank-transactions-table.tsx`
- Create or modify: `apps/web/src/components/bank-transactions/bank-transaction-filters.tsx`
- Create or modify: `apps/web/src/components/bank-transactions/bank-transaction-import.tsx`
- Test: focused component tests beside the new components

**Interfaces:**
- The table accepts statement rows, attachment state, pending state, pagination data, and explicit callbacks for attachment and ignore/undo actions.
- Filter controls accept legal entities, bank accounts, parsed filter values, and an `onChange` callback; they do not read or mutate server state.

- [ ] **Step 1: Write component tests** for entity/account visibility on every row, filter controls, status selection, empty state, and explicit callbacks for row actions.
- [ ] **Step 2: Extract or adapt the existing statement-entry table** so the unified table displays legal entity, bank account, date, counterparty, purpose, amount/currency, attachment count, and row actions.
- [ ] **Step 3: Add filter controls** with dependent account options, clear behavior for invalid account/entity combinations, and URL-state callbacks owned by the route.
- [ ] **Step 4: Keep attachment queries lazy** by passing the opened entry ID to the route owner and rendering the existing attachment cell through props.
- [ ] **Step 5: Run focused component tests** and verify the old bank-account detail screen remains compatible or is reduced to a supported deep-link view.
- [ ] **Step 6: Commit** with `refactor: share bank transaction review components`.

### Task 4: Integrate CSV import safely from the workspace

**Files:**
- Modify: `packages/application/src/services/bank-statement-entries.ts`
- Modify: `packages/api/src/routers/bank-statement-entries.ts`
- Modify: `apps/web/src/routes/_authenticated/bank-transactions.tsx`
- Modify: `apps/web/src/components/bank-transactions/bank-transaction-import.tsx`
- Test: `packages/application/src/services/bank-csv.test.ts`
- Test: `packages/api/src/routers/bank-statement-entries.test.ts`
- Test: focused web import component/route tests

**Interfaces:**
- CSV import continues to accept `{ csv: string }` and returns `{ accountIban, total, inserted, skipped }`.
- The route owner owns import pending state, confirmation state, cache invalidation, notification, and resetting the import UI.

- [ ] **Step 1: Write failing tests** for normalized IBAN matching, missing/invalid/ambiguous account matches, and successful confirmation/result reporting.
- [ ] **Step 2: Implement normalization and exact-match validation** in the application/API boundary without changing supported SEB/Swedbank parsing or duplicate semantics.
- [ ] **Step 3: Add the workspace import action** that previews IBAN, matched account/entity, and row count before explicit confirmation.
- [ ] **Step 4: Invalidate the unified list and show inserted/skipped results** after successful import; provide a setup link when no account is configured.
- [ ] **Step 5: Run focused import tests** and verify no import occurs before confirmation.
- [ ] **Step 6: Commit** with `feat: add bank statement import to unified workspace`.

### Task 5: Preserve attachments and account-scoped export

**Files:**
- Modify: `apps/web/src/routes/_authenticated/bank-transactions.tsx`
- Modify: `apps/web/src/components/bank-transactions/bank-transactions-table.tsx`
- Modify: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/bank-account-id-page.tsx`
- Test: focused route/component tests for export target selection and attachment action callbacks

**Interfaces:**
- Attachment list queries remain enabled only when an entry is opened.
- Export receives a concrete `bankAccountId`, selected month, and route-owned notification/error handling.

- [ ] **Step 1: Write failing tests** for attachment lazy-loading callbacks and ZIP export behavior with a selected account versus all-account mode.
- [ ] **Step 2: Add the export picker** that reuses the filtered account when available and requires account selection otherwise.
- [ ] **Step 3: Wire existing attachment upload/assign/remove/unassign actions** through the unified route owner and retain the old account-detail behavior.
- [ ] **Step 4: Run focused web tests** and confirm all-account export cannot produce an ambiguous URL.
- [ ] **Step 5: Commit** with `feat: preserve bank transaction attachments and exports`.

### Task 6: Verify the full workflow and update supporting links

**Files:**
- Modify: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/index-page.tsx`
- Modify: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/bank-account-id-page.tsx`
- Modify: relevant route-tree/generated files only if the project command requires regeneration
- Test: existing and new architecture, route, service, and component tests

- [ ] **Step 1: Add clear links** from bank-account setup/detail screens to the unified transaction workspace without removing existing deep links.
- [ ] **Step 2: Run `vp check`** and fix formatting, lint, and type errors introduced by the feature.
- [ ] **Step 3: Run `vp test`** and fix failures across DB, application, API, and web tests.
- [ ] **Step 4: Run any project-specific scripts** defined in `package.json` or `vite.config.ts` that are required for route generation or validation.
- [ ] **Step 5: Perform a manual smoke check**: main-nav entry, all-account pending list, entity/account filters, search/date boundaries, CSV confirmation/import, attachment action, pending/ignored transition, and account-scoped export.
- [ ] **Step 6: Commit** with `test: verify unified bank transactions workflow`.

