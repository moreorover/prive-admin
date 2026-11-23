# Appointment Finance Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove transaction movement classification from the appointment-finance PR and derive finance totals directly from signed transaction amounts and appointment relationships.

**Architecture:** Transactions remain the source of truth for signed money movements. Appointment finance queries group those movements by appointment, client, master, and assigned personnel; personnel profiles remain only for appointment role validation and management. Historical ambiguous transactions remain ordinary signed transactions and are not given an invented category.

**Tech Stack:** TypeScript, Drizzle ORM, SQLite/D1, tRPC, TanStack Router/Query, Mantine, Vite+, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-23-appointment-finance-simplification-design.md`

## Global Constraints

- Backend capability must be modeled first as an application service in `packages/application/src/services`.
- Components must not initiate server reads or mutations; route/page owners own server state.
- Keep signed integer minor-unit amounts and exact aggregate handling.
- Do not add salary, percentage, refund, adjustment, or personnel-authentication behavior.
- Use Vite+ commands: `vp check`, `vp test`, and `vp run -r check-types`.

## Review Focus

- Positive and negative transactions for the same appointment: report the signed net amount without movement-type filtering.
- Client, master, assistant, and unrelated customer transaction links: group only by explicit appointment relationships.
- Transactions without appointments: exclude from appointment finance without changing them.
- Existing transaction create/edit flows: keep amount, customer, appointment, and currency behavior intact after removing movement type.
- Existing personnel assignment validation: keep active master/assistant eligibility and set-based D1 validation intact.

### Task 1: Remove movement classification from the data and transaction APIs

**Files:**
- Modify: `packages/db/src/schema/transaction.ts`
- Delete/revert: `packages/db/src/migrations/0007_married_star_brand.sql` and its migration metadata additions
- Modify: `packages/db/src/repositories/transactions.ts`
- Modify: `packages/application/src/services/transactions.ts`
- Modify: `packages/api/src/routers/transactions.ts`
- Modify: transaction form/table/dialog files and their tests under `apps/web/src/components/transactions/`
- Test: existing transaction repository, service, API, and form tests

**Interfaces:**
- `transaction` returns the existing transaction fields without `movementType`.
- Transaction create/update inputs accept the existing signed `amount` and relationship fields without a movement-type argument.

- [ ] **Step 1: Write/update failing tests** asserting transaction creation, editing, validation, and rendering no longer require or expose `movementType`.
- [ ] **Step 2: Run focused transaction tests and verify failures identify movement-type assumptions.**
- [ ] **Step 3: Remove movement-type schema, migration, repository/service/router inputs, form controls, labels, and related compatibility tests while preserving signed amount and counterparty validation.
- [ ] **Step 4: Run all transaction-focused tests and verify they pass.**
- [ ] **Step 5: Commit `refactor: remove transaction movement classification`.**

### Task 2: Replace finance aggregation with signed relationship-based totals

**Files:**
- Modify: `packages/db/src/repositories/appointment-finance.ts`
- Modify: `packages/application/src/services/appointment-finance.ts`
- Modify: `packages/api/src/routers/reports.ts` only if output validation/types change
- Test: `packages/db/src/repositories/appointment-finance.test.ts`
- Test: `packages/application/src/services/appointment-finance.test.ts`

**Interfaces:**
- Finance rows expose signed totals derived from `transaction.amount` and appointment relationships.
- Personnel finance groups by the master and assigned personnel customer IDs and preserves the signed amount.

- [ ] **Step 1: Add failing tests for signed net appointment totals and relationship-based personnel totals without movement-type fields.**
- [ ] **Step 2: Run focused finance tests and verify failures.**
- [ ] **Step 3: Implement set-based joins/subqueries using appointment client/master and appointment personnel relationships; exclude transactions without appointments and preserve exact integer aggregation.**
- [ ] **Step 4: Run focused repository and application finance tests.**
- [ ] **Step 5: Commit `feat: derive appointment finance from signed transactions`.**

### Task 3: Simplify finance screens and appointment detail

**Files:**
- Modify: `apps/web/src/routes/_authenticated/-components/appointment-finance-page.tsx`
- Modify: `apps/web/src/routes/_authenticated/-components/finance-totals-table.tsx`
- Modify: `apps/web/src/routes/_authenticated/-data/appointment-finance-data.ts`
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`
- Modify: appointment detail components/actions/tests that currently display or edit movement types

- [ ] **Step 1: Update route/component tests for signed net totals and signed personnel amounts.**
- [ ] **Step 2: Run focused web tests and verify failures.**
- [ ] **Step 3: Replace movement-type labels and category columns with signed net/relationship-oriented labels; keep route-owned queries and pagination behavior.**
- [ ] **Step 4: Run focused web tests and architecture tests.**
- [ ] **Step 5: Commit `refactor: simplify appointment finance screens`.**

### Task 4: Remove obsolete backfill and preview-seeding behavior

**Files:**
- Delete: `packages/db/src/backfills/appointment-finance.ts`
- Delete: `packages/db/src/backfills/appointment-finance.sql`
- Delete or rewrite: `packages/db/src/backfills/appointment-finance.test.ts`
- Modify: `packages/db/src/backfills/README.md`
- Modify: `scripts/seed_preview_d1_database.sh`
- Modify: docs/specs/plans that describe movement classification

- [ ] **Step 1: Add a regression test that preview seeding does not classify or rewrite signed transactions.**
- [ ] **Step 2: Run the focused backfill/seed tests and verify the obsolete assumptions fail.**
- [ ] **Step 3: Remove the classification backfill and leave preview seeding responsible only for copying data/schema.**
- [ ] **Step 4: Run the full test, check, and type-check suites.**
- [ ] **Step 5: Commit `chore: remove appointment finance classification backfill`.**

### Task 5: Final verification and PR update

- [ ] **Step 1: Run `vp check`.**
- [ ] **Step 2: Run `vp test`.**
- [ ] **Step 3: Run `vp run -r check-types`.**
- [ ] **Step 4: Review the diff for leftover `movement_type`/`legacy_unclassified` references.**
- [ ] **Step 5: Push the branch and update PR #384 with the simplified finance behavior.**
