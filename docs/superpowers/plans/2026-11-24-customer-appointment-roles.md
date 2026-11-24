# Customer Appointment Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a customer's complete appointment history when they are the client, master, or assigned personnel, with a singular role label on each row.

**Architecture:** Keep `customers.appointments.list` as the existing paged resource query. Expand the database repository predicate with client/master/personnel membership and load personnel assignments for the returned appointment rows. The route owner will derive the selected customer's role and pass role-aware rows to the presentational appointments page.

**Tech Stack:** TypeScript, Drizzle ORM/SQLite, tRPC, TanStack Router, TanStack Query, React, Mantine, Vite+ Vitest.

**Spec:** `docs/superpowers/specs/2026-11-24-customer-appointment-roles-design.md`

## Global Constraints

- Keep `customers.appointments.list` as the stable resource-oriented procedure.
- Continue searching appointment names only.
- Keep newest-first ordering.
- Show one role label: `Client`, `Master`, or `Personnel`.
- Do not add role-filter UI or change appointment creation/editing/calendar behavior.
- Components must not initiate server reads or mutations; the customer appointment route owns query data and transforms it for the component.

## Review Focus

- A customer who is only the master must appear: repository regression test in Task 1.
- A customer who is only assigned personnel must appear: repository regression test in Task 1.
- A customer who is the client must remain included: repository regression test in Task 1.
- Personnel matching must not duplicate appointment rows or inflate counts: repository regression test in Task 1.
- The UI must display the selected customer's role while retaining search, pagination, and links: route/component test in Task 3.

### Task 1: Expand customer appointment repository coverage and query

**Files:**
- Modify: `packages/db/src/repositories/customers.ts`
- Test: `packages/db/src/repositories/customers.test.ts` (create; the repository currently has no focused test file)

**Interfaces:**
- Consumes: existing `listCustomerAppointments(database, { customerId, pageSize, offset, search })` signature.
- Produces: the same paged result shape, with appointment rows including `client`, `master`, and `personnel` relation data needed by the route owner.

- [ ] **Step 1: Write failing repository tests** for the customer appointment predicate and returned relations. Assert that the query includes client/master matching and an `EXISTS` personnel-membership condition, that `with` includes `client`, `master`, and `personnel`, and that the count uses the same deduplicated predicate. Include search and non-search cases if the existing repository test style supports query inspection.
- [ ] **Step 2: Run the focused DB test** with `vp test run packages/db/src/repositories/customers.test.ts` and verify it fails because the current repository only filters `appointment.clientId` and does not load personnel assignments.
- [ ] **Step 3: Implement the minimal repository change** in `packages/db/src/repositories/customers.ts`: import the needed Drizzle helpers and `personnelOnAppointments`; build a base role predicate using `or(eq(appointment.clientId, customerId), eq(appointment.masterId, customerId), sql<boolean>`exists (... appointment_personnel ...)`)`; combine it with the appointment-name search using `and`; query with `client`, `master`, and `personnel: { with: { personnel: true } }`; reuse the same `where` for the count.
- [ ] **Step 4: Run the focused DB test** again and verify it passes.

### Task 2: Preserve the application/API contract and validate forwarding

**Files:**
- Modify: `packages/application/src/services/customers.ts` only if the return type or input needs an explicit update.
- Test: `packages/application/src/services/customers.test.ts` if a regression assertion is needed.
- Modify: `packages/api/src/routers/customers.ts` only if TypeScript requires a schema/return adjustment; no new procedure.
- Test: `packages/api/src/routers/resource-reads.test.ts` only if the existing customer appointment forwarding test needs updating.

**Interfaces:**
- Consumes: Task 1's repository result.
- Produces: the existing `listCustomerAppointments({ customerId, pageSize, offset, search })` service and `customers.appointments.list` procedure, with the expanded row payload.

- [ ] **Step 1: Inspect and update the existing service/API tests** so they explicitly preserve the stable input mapping and paged response envelope while allowing role relation data through unchanged.
- [ ] **Step 2: Run the focused application/API tests** with `vp test run packages/application/src/services/customers.test.ts packages/api/src/routers/resource-reads.test.ts` and verify the expected failures if assertions need the expanded payload.
- [ ] **Step 3: Make only the minimal type/forwarding changes** required; do not add a page-specific procedure or duplicate query.
- [ ] **Step 4: Re-run the focused application/API tests** and verify they pass.

### Task 3: Derive and display the customer's appointment role

**Files:**
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId/appointments.tsx`
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId/-components/appointments-page.tsx`
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId/-data/appointments-data.ts` only if a local row type/query helper needs to reflect the relation payload.
- Test: add or modify the nearest existing customer appointment route/component test under `apps/web/src/routes/_authenticated/customers/$customerId/`.

**Interfaces:**
- Consumes: Task 1/2 appointment rows with `client`, `master`, and personnel assignments.
- Produces: `CustomerAppointmentsPage` receives rows with `role: "Client" | "Master" | "Personnel"` and renders a `Role` table column.

- [ ] **Step 1: Write a failing UI/route test** that supplies rows where the selected customer is the client, master, and personnel, then asserts the table renders the corresponding singular role labels; also assert the appointment name remains a link and the existing empty/search state is unchanged.
- [ ] **Step 2: Run the focused web test** with the repository's matching `vp test run` path and verify it fails because the page has no Role column and the route passes raw rows.
- [ ] **Step 3: Implement the minimal route-owner mapping**: derive `role` from the selected `customerId` against `client.id`, `master.id`, and `personnel[].personnelId`, checking `Client`, then `Master`, then `Personnel` as a defensive priority; pass the mapped rows to `CustomerAppointmentsPage`. Keep query options, loader dependencies, pagination, search, and mutation ownership unchanged.
- [ ] **Step 4: Add the `Role` column** to `CustomerAppointmentsPage` and render the mapped label for each appointment.
- [ ] **Step 5: Run the focused web test** and verify it passes.

### Task 4: Full verification

**Files:**
- No new files; review all changes from Tasks 1–3.

- [ ] **Step 1: Run `vp check`** and verify formatting/linting completes without errors.
- [ ] **Step 2: Run `vp test`** and verify the full test suite completes with zero failures.
- [ ] **Step 3: Run `vp run -r check-types`** and verify all workspace TypeScript checks pass.
- [ ] **Step 4: Review `git diff`** against the approved design, confirming no unrelated files or behavior changed.
