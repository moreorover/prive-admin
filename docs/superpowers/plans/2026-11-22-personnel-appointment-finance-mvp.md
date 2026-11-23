# Personnel, Appointment, and Finance MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow the owner to manage eligible appointment personnel and report received money, personnel allocations, and owner remainder using the existing appointment transaction model.

**Architecture:** Add a personnel profile keyed to the existing customer record. Keep appointment assignments and existing transactions backward-compatible, but add explicit transaction movement types and enforce eligibility in application services. Build owner reporting from typed appointment transactions; do not introduce personnel accounts, compensation policies, payroll, or a separate financial ledger.

**Tech Stack:** TypeScript, React, TanStack Router, TanStack Query, tRPC, Drizzle ORM, SQLite/D1, Vitest, Vite+.

**Spec:** `docs/superpowers/specs/2026-11-22-personnel-appointment-finance-design.md`

## Global Constraints

- Backend capability must be modeled first as an application service in `packages/application/src/services`.
- tRPC routers are transport adapters and must use resource-oriented procedure names.
- Route/page owners own server reads and mutations; components receive data and handlers through props.
- Existing customer, appointment, and transaction IDs must remain valid.
- Personnel do not receive Better Auth accounts or application access in this phase.
- EUR and GBP totals must remain separate.
- Existing transaction rows must be preserved; ambiguous historical rows must not be silently reclassified.
- Use the repository's Vite+ commands for validation: `vp check`, `vp test`, and relevant package checks.

## Review Focus

- A normal customer is selected as a master or supporting personnel: appointment create/update must reject it, covered by appointment service/router tests.
- An inactive personnel member is referenced by a historical appointment: reads remain valid while new assignments reject it, covered by personnel and appointment repository/service tests.
- A personnel allocation targets an unrelated customer: transaction creation must reject it, covered by transaction service tests.
- Existing transactions have no movement type or mixed currencies: migration/default behavior must preserve rows and reports must separate currencies, covered by schema/repository/report tests.
- Allocated money is not the same as a separately recorded payout: reports must not claim an outstanding balance unless the data supports it, covered by reporting-service tests.

---

### Task 1: Add the personnel profile schema and migration

**Files:**
- Create: `packages/db/src/schema/personnel.ts`
- Modify: `packages/db/src/schema/index.ts`
- Modify: `packages/db/src/schema/relations.ts`
- Create: generated Drizzle migration under `packages/db/src/migrations/`
- Test: `packages/db/src/personnel-schema.test.ts`

**Interfaces:**
- Produces `personnel` with a unique `customerId`, personnel type, active flag, optional salon scope, and timestamps.
- Produces relations from personnel to customer and from customer to personnel.

- [ ] **Step 1: Write failing schema tests** for unique customer linkage, supported personnel types, active default, and customer relation shape.
- [ ] **Step 2: Run `vp test run packages/db/src/personnel-schema.test.ts`** and verify the new schema expectations fail.
- [ ] **Step 3: Implement the Drizzle table, exports, relations, and migration.** Preserve existing customer IDs and use a nullable salon scope unless existing requirements prove it is mandatory.
- [ ] **Step 4: Run `vp test run packages/db/src/personnel-schema.test.ts` and `vp run --filter @prive-admin-tanstack/db check-types`.**
- [ ] **Step 5: Commit** with `feat: add personnel profiles`.

### Task 2: Add personnel repository and application-service capabilities

**Files:**
- Create: `packages/db/src/repositories/personnel.ts`
- Create: `packages/db/src/repositories/personnel.test.ts`
- Modify: `packages/db/src/repositories/index.ts`
- Create: `packages/application/src/services/personnel.ts`
- Create: `packages/application/src/services/personnel.test.ts`
- Modify: `packages/application/src/services/index.ts`

**Interfaces:**
- `listPersonnel(database, { pageSize, offset, search, activeOnly?, type? })` returns the standard `{ items, totalCount }` shape with customer details.
- `getPersonnel(database, customerId)` returns the personnel profile and customer.
- `createPersonnel(input: { customerId, type, salonId? })` creates a profile.
- `updatePersonnel(input: { customerId, type?, active?, salonId? })` updates profile state.
- `assertActivePersonnel(customerId, options?)` throws a domain error when the person is not eligible.

- [ ] **Step 1: Write repository and service tests** for paged active filtering, search, customer/personnel overlap, deactivation, and missing-profile rejection.
- [ ] **Step 2: Run the focused DB/application tests** and verify failures.
- [ ] **Step 3: Implement repository queries and application-service validation.** Keep customer creation separate; personnel profile creation should reference an existing customer.
- [ ] **Step 4: Run focused tests and package type checks.**
- [ ] **Step 5: Commit** with `feat: add personnel service`.

### Task 3: Enforce personnel eligibility in appointment services and API

**Files:**
- Modify: `packages/db/src/repositories/appointments.ts`
- Modify: `packages/application/src/services/appointments.ts`
- Modify: `packages/application/src/services/appointments.test.ts`
- Modify: `packages/api/src/routers/appointments.ts`
- Modify: `packages/db/src/repositories/appointments.test.ts`

**Interfaces:**
- Appointment create/update continues to accept `clientId`, `masterId`, `salonId`, and supporting personnel IDs.
- Service validation calls `assertActivePersonnel` for `masterId` and each supporting personnel ID.
- `linkPersonnelToAppointment` becomes safe for repeated writes and rejects ineligible or duplicate assignments with domain errors.

- [ ] **Step 1: Add failing tests** for ordinary-customer master rejection, ordinary-customer personnel rejection, inactive-personnel rejection for new assignment, valid customer-plus-personnel overlap, and historical read behavior.
- [ ] **Step 2: Run appointment DB/application/API tests** and verify failures.
- [ ] **Step 3: Implement validation in the application service and repository-safe assignment behavior.** Do not rely on UI filtering for correctness.
- [ ] **Step 4: Run the focused tests and `vp run --filter @prive-admin-tanstack/api check-types`.**
- [ ] **Step 5: Commit** with `fix: restrict appointment personnel assignments`.

### Task 4: Add explicit transaction movement types while preserving legacy rows

**Files:**
- Modify: `packages/db/src/schema/transaction.ts`
- Modify: `packages/db/src/schema/index.ts` if enum/types are exported separately
- Create: generated Drizzle migration under `packages/db/src/migrations/`
- Modify: `packages/db/src/repositories/transactions.ts`
- Create or modify: `packages/db/src/repositories/transactions.test.ts`
- Modify: `packages/application/src/services/transactions.ts`
- Create or modify: `packages/application/src/services/transactions.test.ts`
- Modify: `packages/api/src/routers/transactions.ts`

**Interfaces:**
- Define a movement type union: `received | personnel_allocation | refund | adjustment`.
- Existing rows receive a compatibility value that is explicitly treated as legacy/unclassified until reviewed; do not infer personnel allocations from `customerId`.
- Create/update transaction inputs require movement type for new writes.
- Personnel allocations require `customerId` to be the appointment master or assigned personnel.

- [ ] **Step 1: Write failing tests** for valid received rows, valid personnel allocations, unrelated-person rejection, invalid type/sign combinations, legacy-row preservation, and EUR/GBP separation.
- [ ] **Step 2: Run focused transaction tests** and verify failures.
- [ ] **Step 3: Add the movement-type column with a migration-safe default, update repository/service/router types, and enforce assignment validation.** Keep existing list/detail behavior compatible.
- [ ] **Step 4: Run focused tests and DB/API type checks.**
- [ ] **Step 5: Commit** with `feat: classify appointment transactions`.

### Task 5: Update appointment transaction UI and personnel selectors

**Files:**
- Modify: `apps/web/src/routes/_authenticated/appointments/-data/appointment-detail-data.ts`
- Modify: `apps/web/src/routes/_authenticated/calendar.tsx`
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`
- Modify: `apps/web/src/routes/_authenticated/appointments/-components/appointment-master-search.ts`
- Modify: `apps/web/src/routes/_authenticated/appointments/-components/pick-personnel-modal.tsx`
- Modify: `apps/web/src/routes/_authenticated/appointments/-components/appointment-detail-page.tsx`
- Modify: `apps/web/src/routes/_authenticated/appointments/-actions/appointment-transaction-actions.ts`
- Modify: relevant appointment component/action/data tests

**Interfaces:**
- Appointment option queries use personnel-specific query builders, not `trpc.customers.list`.
- Transaction forms submit the explicit movement type and render labels for received money, personnel allocation, refund, and adjustment.
- Route owners continue to own queries/mutations; child components receive data and callbacks.

- [ ] **Step 1: Add failing route/data/component tests** proving master/personnel option queries target personnel data and transaction actions invalidate the same route-owned query keys.
- [ ] **Step 2: Run focused web tests** and verify failures.
- [ ] **Step 3: Implement personnel option query builders, transaction-type UI, and owner-facing labels.** Keep personnel creation/editing out of this task unless the existing customer screen provides a small, clearly scoped profile toggle.
- [ ] **Step 4: Run focused web tests and the route/component architecture tests.**
- [ ] **Step 5: Commit** with `feat: use personnel selectors for appointments`.

### Task 6: Add owner transaction summaries and reporting

**Files:**
- Create: `packages/db/src/repositories/appointment-finance.ts`
- Create: `packages/db/src/repositories/appointment-finance.test.ts`
- Create: `packages/application/src/services/appointment-finance.ts`
- Create: `packages/application/src/services/appointment-finance.test.ts`
- Modify: `packages/application/src/services/index.ts`
- Create or modify: `packages/api/src/routers/reports.ts`
- Create or modify: `packages/api/src/routers/reports.test.ts`
- Create: route-local data module for the owner report
- Create: owner report route/component tests and UI files under `apps/web/src/routes/_authenticated/`

**Interfaces:**
- `getAppointmentFinance(appointmentId)` returns totals by movement type and currency plus owner remainder.
- `listPersonnelFinance({ year, month?, personnelId?, currency? })` returns paged personnel allocation totals.
- `getMonthlyAppointmentFinance({ year, currency? })` returns received, refunds, adjustments, personnel allocations, and owner remainder by month.
- Reports use the existing paged response envelope for collections and use the backend default page size when omitted.

- [ ] **Step 1: Write failing repository/service tests** for the example `+100/-60/-10 = 30`, refunds and adjustments, multiple currencies, unrelated transactions, and the distinction between allocations and outstanding balances.
- [ ] **Step 2: Run focused finance tests** and verify failures.
- [ ] **Step 3: Implement SQL aggregation and application-service shaping.** Compute owner remainder; do not store it as a transaction. Do not expose an outstanding payable unless separate payment data exists.
- [ ] **Step 4: Add owner-only route/API authorization appropriate to the existing owner model and build the route with loader-prefetched query options identical to rendered queries.**
- [ ] **Step 5: Run focused tests, route tests, and type checks.**
- [ ] **Step 6: Commit** with `feat: add appointment finance reports`.

### Task 7: Backfill and verify existing data safely

**Files:**
- Create: migration/backfill script under `packages/db` or `scripts/`, following existing migration conventions
- Create: backfill tests or fixture coverage
- Modify: design/report documentation if the actual legacy data requires a documented compatibility decision

**Interfaces:**
- Backfill preserves every existing transaction row and assigns only the documented compatibility movement type.
- Existing master/personnel references are candidates for personnel-profile backfill; no customer is silently promoted without an explicit migration rule or owner review.

- [ ] **Step 1: Add a dry-run/backfill test** that records counts and sums by currency before and after and proves IDs are preserved and reruns are idempotent.
- [ ] **Step 2: Run the dry-run test** and verify it fails before the script exists.
- [ ] **Step 3: Implement conservative backfill behavior** that keeps ambiguous rows legacy/unclassified and does not infer allocations from customer identity alone.
- [ ] **Step 4: Run the backfill test and inspect the report output.**
- [ ] **Step 5: Commit** with `chore: preserve legacy appointment finance data`.

### Task 8: Full verification and handoff

**Files:**
- No new production files; update tests only if verification exposes a real gap.

- [ ] **Step 1: Run `vp check`.** Expected: formatting and lint checks pass with no unrelated file changes.
- [ ] **Step 2: Run `vp test`.** Expected: the full test suite passes.
- [ ] **Step 3: Run relevant package checks for DB, application, API, and web.** Expected: all type checks pass.
- [ ] **Step 4: Manually verify the owner flow:** create a personnel profile, assign it to an appointment, record received money and personnel allocations, and confirm appointment/monthly reports show separate currencies and the correct owner remainder.
- [ ] **Step 5: Review the final diff for accidental personnel authentication, percentage compensation, payroll, or ledger scope.**
- [ ] **Step 6: Commit** any final verification fixes with a conventional commit message.

