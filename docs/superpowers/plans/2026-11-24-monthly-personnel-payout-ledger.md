# Monthly Personnel Payout Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Replace the confusing appointment-finance page with a month-focused personnel payout ledger.

**Architecture:** Extend the existing personnel finance application service and repository query to return monthly personnel payout rows with paid, credit, appointment count, and role data. Keep the route owner responsible for search state and query prefetching; render the result in a focused Mantine table.

**Tech Stack:** React, TanStack Router/Query, tRPC, Mantine, Drizzle SQLite/D1, Vitest, Vite+.

**Spec:** `docs/superpowers/specs/2026-11-24-monthly-personnel-payout-ledger-design.md`

## Global Constraints

- Preserve signed appointment transactions as the source of truth.
- Paid totals use only negative personnel-linked transactions, displayed as positive amounts.
- Positive personnel-linked transactions are shown separately as credits/adjustments.
- Keep currencies separate.
- Backend capability must remain in `packages/application/src/services`; tRPC remains a transport adapter.
- Route owners own server queries and search state; presentational components receive data and callbacks.

## Review Focus

- A month with no personnel transactions shows a useful empty state and zero totals.
- A person with both negative and positive transactions shows paid and credits separately.
- Masters and assistants are labeled with the stored personnel role.
- Multiple currencies never combine into one amount.
- Month/year/currency changes reset pagination and use matching loader/query keys.

---

### Task 1: Define the monthly payout result and failing backend tests

**Files:**
- Modify: `packages/db/src/repositories/appointment-finance.test.ts`
- Modify: `packages/application/src/services/appointment-finance.test.ts`
- Modify related API report tests if the response contract changes.

**Interfaces:**
- Consumes: existing signed transaction, appointment, appointment personnel, customer, and personnel tables.
- Produces: expected repository/service result shape for the UI.

- [ ] **Step 1: Write failing repository tests**

  Seed a selected month with master and assistant negative transactions, a positive personnel credit, multiple appointments, and at least two currencies. Assert one row per personnel/currency with role, distinct appointment count, positive paid amount, and positive credit amount.

- [ ] **Step 2: Run the focused repository tests and verify failure**

  Run: `vp test packages/db/src/repositories/appointment-finance.test.ts`

  Expected: FAIL because the existing query only returns one signed `amount` aggregate and no role/count or paid/credit split.

- [ ] **Step 3: Add failing service/API contract assertions**

  Assert the application service maps the new exact integer aggregates into safe numbers and the report procedure forwards month/year/currency filters.

- [ ] **Step 4: Run focused service/API tests and verify failure**

  Run the relevant application/API test files and confirm the new fields are missing before implementation.

### Task 2: Implement monthly personnel payout aggregation

**Files:**
- Modify: `packages/db/src/repositories/appointment-finance.ts`
- Modify: `packages/application/src/services/appointment-finance.ts`
- Modify: `packages/api/src/routers/reports.ts` only if input/output schemas require changes.

**Interfaces:**
- Produces: paged monthly payout rows with `month`, `personnelId`, `personnelName`, `personnelType`, `currency`, `appointmentCount`, `paid`, and `credits`.

- [ ] **Step 1: Implement the repository aggregate**

  Keep the existing personnel-link predicate. Group by month, customer, customer name, personnel type, and currency. Compute paid from the negative amount sum and credits from the positive amount sum, while counting distinct appointment IDs. Preserve exact integer aggregation before mapping to JavaScript numbers.

- [ ] **Step 2: Implement service mapping and defaults**

  Default the selected month to the caller-provided month; map all amount/count fields through safe numeric conversion and retain paging metadata.

- [ ] **Step 3: Run focused backend tests and verify they pass**

  Run the repository, application, and API finance tests.

### Task 3: Reshape route search state and finance UI

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-data/appointment-finance-data.ts`
- Modify: `apps/web/src/routes/_authenticated/appointment-finance.tsx`
- Modify: `apps/web/src/routes/_authenticated/-components/appointment-finance-page.tsx`
- Modify or create focused finance table components/tests under `apps/web/src/routes/_authenticated/-components/` and `-data/`.

**Interfaces:**
- Consumes: the monthly payout result from Task 2.
- Produces: route-owned year/month/currency/pagination state and a readable monthly payout ledger.

- [ ] **Step 1: Write failing route/component tests**

  Assert current month defaults, month/year/currency changes reset the page, the table labels roles, displays paid and credits, keeps currencies separate, and renders a useful empty state.

- [ ] **Step 2: Run focused UI tests and verify failure**

  Run the focused finance route/component tests and confirm the current page does not meet the new result shape.

- [ ] **Step 3: Implement the route-owned monthly view**

  Replace the mixed monthly totals/personnel allocation layout with a month-focused view. Add year/month/currency controls, a prominent selected-period summary, and a table with Personnel, Role, Appointments, Paid, Credits/adjustments, and Currency columns. Keep query builders identical between loader and rendered queries.

- [ ] **Step 4: Run focused UI tests and verify they pass**

  Run the finance route/component test files.

### Task 4: Full verification and commit

**Files:**
- No additional files beyond Tasks 1–3.

- [ ] **Step 1: Run formatting, lint, type checks, and tests**

  Run: `vp check`, `vp run -r check-types`, and `vp test`.

- [ ] **Step 2: Review the diff against the design**

  Confirm no compensation rules, new ledger tables, or personnel access were introduced; verify signed transactions remain the source of truth.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/db/src/repositories/appointment-finance.ts packages/application/src/services/appointment-finance.ts packages/api/src/routers/reports.ts apps/web/src/routes/_authenticated/appointment-finance.tsx apps/web/src/routes/_authenticated/-data/appointment-finance-data.ts apps/web/src/routes/_authenticated/-components
  git commit -m "feat: clarify monthly personnel payouts"
  ```
