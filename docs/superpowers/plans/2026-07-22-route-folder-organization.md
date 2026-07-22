# Route Folder Organization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor every TanStack Router route directory so route-local data, actions, and components live under `-data/`, `-actions/`, and `-components/` folders without changing runtime behavior.

**Architecture:** Route files stay as thin TanStack Router contract adapters. Route-owned query option factories and URL state helpers move to `-data/`, mutation orchestration moves to `-actions/`, and page-local UI moves to `-components/`. Shared components under `apps/web/src/components` remain server-state free and receive data and handlers from route/page owners.

**Tech Stack:** React, TanStack Router, TanStack Query, tRPC TanStack Query options proxy, Vite+, Vitest through `vite-plus/test`.

## Global Constraints

- Use `-data/`, `-actions/`, and `-components/` inside each route directory that has those concerns.
- Do not create empty folders.
- Route files keep only TanStack Router contracts: `validateSearch`, `loaderDeps`, `loader`, redirects, and `component`.
- Loader code uses `queryClient.ensureQueryData(...)`; do not replace it with direct tRPC calls or `prefetchQuery`.
- Reusable components in `apps/web/src/components` must not call `useQuery` or `useMutation`.
- Do not introduce `src/features/*`.
- Do not change route URLs, backend APIs, visual design, or user-visible behavior.
- Run validation with Vite+: targeted tests during migration, then `vp check` and `vp test`.

---

## File Structure

Move route-local helper files as follows.

Root public routes:

- `apps/web/src/routes/-index-page.tsx` -> `apps/web/src/routes/-components/index-page.tsx`
- `apps/web/src/routes/-login-page.tsx` -> `apps/web/src/routes/-components/login-page.tsx`
- `apps/web/src/routes/-root-page.tsx` -> `apps/web/src/routes/-components/root-page.tsx`

Authenticated layout routes:

- `apps/web/src/routes/_authenticated/-appointment-actions.ts` -> `apps/web/src/routes/_authenticated/-actions/appointment-actions.ts`
- `apps/web/src/routes/_authenticated/-cash-transaction-actions.ts` -> `apps/web/src/routes/_authenticated/-actions/cash-transaction-actions.ts`
- `apps/web/src/routes/_authenticated/-hair-assignment-actions.ts` -> `apps/web/src/routes/_authenticated/-actions/hair-assignment-actions.ts`
- `apps/web/src/routes/_authenticated/-calendar-data.ts` -> `apps/web/src/routes/_authenticated/-data/calendar-data.ts`
- `apps/web/src/routes/_authenticated/-calendar-page.tsx` -> `apps/web/src/routes/_authenticated/-components/calendar-page.tsx`
- `apps/web/src/routes/_authenticated/-cash-page.tsx` -> `apps/web/src/routes/_authenticated/-components/cash-page.tsx`
- `apps/web/src/routes/_authenticated/-dashboard-page.tsx` -> `apps/web/src/routes/_authenticated/-components/dashboard-page.tsx`
- `apps/web/src/routes/_authenticated/-profile-page.tsx` -> `apps/web/src/routes/_authenticated/-components/profile-page.tsx`
- `apps/web/src/routes/_authenticated/-route-page.tsx` -> `apps/web/src/routes/_authenticated/-components/route-page.tsx`
- `apps/web/src/routes/_authenticated/-settings-page.tsx` -> `apps/web/src/routes/_authenticated/-components/settings-page.tsx`

Appointments:

- `apps/web/src/routes/_authenticated/appointments/-appointment-detail-data.ts` -> `apps/web/src/routes/_authenticated/appointments/-data/appointment-detail-data.ts`
- `apps/web/src/routes/_authenticated/appointments/-appointment-transaction-actions.ts` -> `apps/web/src/routes/_authenticated/appointments/-actions/appointment-transaction-actions.ts`
- `apps/web/src/routes/_authenticated/appointments/-appointment-detail-page.tsx` -> `apps/web/src/routes/_authenticated/appointments/-components/appointment-detail-page.tsx`
- `apps/web/src/routes/_authenticated/appointments/-route-page.tsx` -> `apps/web/src/routes/_authenticated/appointments/-components/route-page.tsx`

Customers:

- `apps/web/src/routes/_authenticated/customers/-customer-actions.ts` -> `apps/web/src/routes/_authenticated/customers/-actions/customer-actions.ts`
- `apps/web/src/routes/_authenticated/customers/-index-data.ts` -> `apps/web/src/routes/_authenticated/customers/-data/index-data.ts`
- `apps/web/src/routes/_authenticated/customers/-index-page.tsx` -> `apps/web/src/routes/_authenticated/customers/-components/index-page.tsx`
- `apps/web/src/routes/_authenticated/customers/-route-page.tsx` -> `apps/web/src/routes/_authenticated/customers/-components/route-page.tsx`

Customer detail:

- `apps/web/src/routes/_authenticated/customers/$customerId/-appointments-data.ts` -> `apps/web/src/routes/_authenticated/customers/$customerId/-data/appointments-data.ts`
- `apps/web/src/routes/_authenticated/customers/$customerId/-hair-sales-data.ts` -> `apps/web/src/routes/_authenticated/customers/$customerId/-data/hair-sales-data.ts`
- `apps/web/src/routes/_authenticated/customers/$customerId/-notes-data.ts` -> `apps/web/src/routes/_authenticated/customers/$customerId/-data/notes-data.ts`
- `apps/web/src/routes/_authenticated/customers/$customerId/-customer-detail-actions.ts` -> `apps/web/src/routes/_authenticated/customers/$customerId/-actions/customer-detail-actions.ts`
- `apps/web/src/routes/_authenticated/customers/$customerId/-note-actions.ts` -> `apps/web/src/routes/_authenticated/customers/$customerId/-actions/note-actions.ts`
- `apps/web/src/routes/_authenticated/customers/$customerId/-appointments-page.tsx` -> `apps/web/src/routes/_authenticated/customers/$customerId/-components/appointments-page.tsx`
- `apps/web/src/routes/_authenticated/customers/$customerId/-hair-sales-page.tsx` -> `apps/web/src/routes/_authenticated/customers/$customerId/-components/hair-sales-page.tsx`
- `apps/web/src/routes/_authenticated/customers/$customerId/-notes-page.tsx` -> `apps/web/src/routes/_authenticated/customers/$customerId/-components/notes-page.tsx`
- `apps/web/src/routes/_authenticated/customers/$customerId/-route-page.tsx` -> `apps/web/src/routes/_authenticated/customers/$customerId/-components/route-page.tsx`

Documents:

- `apps/web/src/routes/_authenticated/documents/-document-actions.ts` -> `apps/web/src/routes/_authenticated/documents/-actions/document-actions.ts`
- `apps/web/src/routes/_authenticated/documents/-index-data.ts` -> `apps/web/src/routes/_authenticated/documents/-data/index-data.ts`
- `apps/web/src/routes/_authenticated/documents/-index-page.tsx` -> `apps/web/src/routes/_authenticated/documents/-components/index-page.tsx`
- `apps/web/src/routes/_authenticated/documents/$documentId/-document-match-actions.ts` -> `apps/web/src/routes/_authenticated/documents/$documentId/-actions/document-match-actions.ts`
- `apps/web/src/routes/_authenticated/documents/$documentId/-match-data.ts` -> `apps/web/src/routes/_authenticated/documents/$documentId/-data/match-data.ts`
- `apps/web/src/routes/_authenticated/documents/$documentId/-match-page.tsx` -> `apps/web/src/routes/_authenticated/documents/$documentId/-components/match-page.tsx`

Hair orders:

- `apps/web/src/routes/_authenticated/hair-orders/-$hairOrderId-data.ts` -> `apps/web/src/routes/_authenticated/hair-orders/-data/hair-order-id-data.ts`
- `apps/web/src/routes/_authenticated/hair-orders/-hair-order-detail-data.ts` -> `apps/web/src/routes/_authenticated/hair-orders/-data/hair-order-detail-data.ts`
- `apps/web/src/routes/_authenticated/hair-orders/-hair-order-actions.ts` -> `apps/web/src/routes/_authenticated/hair-orders/-actions/hair-order-actions.ts`
- `apps/web/src/routes/_authenticated/hair-orders/-$hairOrderId-page.tsx` -> `apps/web/src/routes/_authenticated/hair-orders/-components/hair-order-id-page.tsx`
- `apps/web/src/routes/_authenticated/hair-orders/-index-page.tsx` -> `apps/web/src/routes/_authenticated/hair-orders/-components/index-page.tsx`
- `apps/web/src/routes/_authenticated/hair-orders/-route-page.tsx` -> `apps/web/src/routes/_authenticated/hair-orders/-components/route-page.tsx`

Hair sales:

- `apps/web/src/routes/_authenticated/hair-sales/-index-data.ts` -> `apps/web/src/routes/_authenticated/hair-sales/-data/index-data.ts`
- `apps/web/src/routes/_authenticated/hair-sales/-$hairSaleId-page.tsx` -> `apps/web/src/routes/_authenticated/hair-sales/-components/hair-sale-id-page.tsx`
- `apps/web/src/routes/_authenticated/hair-sales/-index-page.tsx` -> `apps/web/src/routes/_authenticated/hair-sales/-components/index-page.tsx`
- `apps/web/src/routes/_authenticated/hair-sales/-route-page.tsx` -> `apps/web/src/routes/_authenticated/hair-sales/-components/route-page.tsx`

Legal entities:

- `apps/web/src/routes/_authenticated/legal-entities/-index-page.tsx` -> `apps/web/src/routes/_authenticated/legal-entities/-components/index-page.tsx`
- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/-legal-entity-actions.ts` -> `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/-actions/legal-entity-actions.ts`
- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/-overview-page.tsx` -> `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/-components/overview-page.tsx`
- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/-route-page.tsx` -> `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/-components/route-page.tsx`
- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/-salons-page.tsx` -> `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/-components/salons-page.tsx`
- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-bank-account-actions.ts` -> `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-actions/bank-account-actions.ts`
- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-$bankAccountId-page.tsx` -> `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/bank-account-id-page.tsx`
- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-index-page.tsx` -> `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/index-page.tsx`

Profile and salons:

- `apps/web/src/routes/_authenticated/profile/-profile-actions.ts` -> `apps/web/src/routes/_authenticated/profile/-actions/profile-actions.ts`
- `apps/web/src/routes/_authenticated/salons/-salon-actions.ts` -> `apps/web/src/routes/_authenticated/salons/-actions/salon-actions.ts`
- `apps/web/src/routes/_authenticated/salons/-$salonId-page.tsx` -> `apps/web/src/routes/_authenticated/salons/-components/salon-id-page.tsx`

Files that remain in route roots:

- `apps/web/src/routes/**/route.tsx`
- `apps/web/src/routes/**/index.tsx`
- `apps/web/src/routes/**/*.tsx` files whose names are route path segments such as `$appointmentId.tsx`, `calendar.tsx`, `cash.tsx`, `dashboard.tsx`, `match.tsx`, `overview.tsx`, `profile.tsx`, `reports.tsx`, `salons.tsx`, and `settings.tsx`
- organization tests
- CSS module files such as `route.module.css`

---

### Task 1: Enforce Route Helper Folder Structure

**Files:**

- Modify: `apps/web/src/routes/-route-component-organization.test.ts`
- Modify: `apps/web/src/routes/_authenticated/-route-data-organization.test.ts`
- Create: `apps/web/src/routes/-route-helper-folder-organization.test.ts`
- Create: `apps/web/src/components/server-state-ownership.test.ts`

**Interfaces:**

- Consumes: current route and component file tree.
- Produces: tests that allow helpers under ignored `-data`, `-actions`, and `-components` folders, while failing flat route helper files.

- [ ] **Step 1: Write the failing route component test update**

Replace the route file walker in `apps/web/src/routes/-route-component-organization.test.ts` with a helper that skips ignored route helper directories:

```ts
function publicRouteFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      if (entry.startsWith("-")) return []
      return publicRouteFiles(path)
    }
    if (!path.endsWith(".tsx")) return []

    const basename = path.split("/").at(-1) ?? ""
    if (basename.startsWith("-")) return []
    return [path]
  })
}
```

- [ ] **Step 2: Write the failing authenticated route data test update**

Apply the same directory-skip behavior to `routePageFiles` in `apps/web/src/routes/_authenticated/-route-data-organization.test.ts`:

```ts
function routePageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      if (entry.startsWith("-")) return []
      return routePageFiles(path)
    }
    if (!path.endsWith(".tsx")) return []

    const basename = path.split("/").at(-1) ?? ""
    if (basename.startsWith("-")) return []
    return [path]
  })
}
```

- [ ] **Step 3: Add the failing flat-helper convention test**

Create `apps/web/src/routes/-route-helper-folder-organization.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

const routesDir = fileURLToPath(new URL("./", import.meta.url))
const allowedHelperDirectories = new Set(["-actions", "-components", "-data"])
const allowedFlatHelperFiles = new Set([
  "-route-component-organization.test.ts",
  "-route-helper-folder-organization.test.ts",
  "_authenticated/-route-data-organization.test.ts",
])

function flatHelperFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      if (entry.startsWith("-")) {
        expect(allowedHelperDirectories.has(entry), relative(routesDir, path)).toBe(true)
        return []
      }
      return flatHelperFiles(path)
    }

    if (!entry.startsWith("-")) return []
    if (!/\.(ts|tsx)$/.test(entry)) return []

    const routePath = relative(routesDir, path)
    if (allowedFlatHelperFiles.has(routePath)) return []
    return [routePath]
  })
}

describe("route helper folder organization", () => {
  it("keeps route-local helpers inside concern folders", () => {
    expect(flatHelperFiles(routesDir)).toEqual([])
  })
})
```

- [ ] **Step 4: Add the failing shared component server-state test**

Create `apps/web/src/components/server-state-ownership.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

const componentsDir = fileURLToPath(new URL("./", import.meta.url))

function componentFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return componentFiles(path)
    if (!/\.(ts|tsx)$/.test(entry)) return []
    if (entry.endsWith(".test.ts") || entry.endsWith(".test.tsx")) return []
    return [path]
  })
}

describe("shared component server-state ownership", () => {
  it.each(componentFiles(componentsDir))("keeps server reads and writes out of %s", (path) => {
    const source = readFileSync(path, "utf8")
    const componentPath = relative(componentsDir, path)

    expect(source, componentPath).not.toContain("useQuery(")
    expect(source, componentPath).not.toContain("useSuspenseQuery(")
    expect(source, componentPath).not.toContain("useMutation(")
  })
})
```

- [ ] **Step 5: Run tests to verify they fail for the current flat helper structure**

Run:

```bash
vp test apps/web/src/routes/-route-helper-folder-organization.test.ts apps/web/src/components/server-state-ownership.test.ts
```

Expected: the route helper test fails and reports existing flat `-*` helper files. The component ownership test should pass unless existing shared components already violate the ownership rule.

- [ ] **Step 6: Commit the failing tests only if your workflow allows red commits; otherwise keep them staged for Task 2**

Preferred during inline execution: do not commit yet. Keep the red test state visible while production files are moved.

---

### Task 2: Migrate Root And Authenticated Layout Helpers

**Files:**

- Move: root public and `_authenticated` layout files listed in the File Structure section.
- Modify imports in: `apps/web/src/routes/__root.tsx`, `apps/web/src/routes/index.tsx`, `apps/web/src/routes/login.tsx`, `apps/web/src/routes/_authenticated/route.tsx`, `apps/web/src/routes/_authenticated/calendar.tsx`, `apps/web/src/routes/_authenticated/cash.tsx`, `apps/web/src/routes/_authenticated/dashboard.tsx`, `apps/web/src/routes/_authenticated/profile.tsx`, `apps/web/src/routes/_authenticated/settings.tsx`.
- Modify imports in moved page files that import moved action/data files.

**Interfaces:**

- Consumes: Task 1 guard tests.
- Produces: root and authenticated layout route files importing from `./-components/*`, `./-data/*`, and `./-actions/*`.

- [ ] **Step 1: Move files with `git mv`**

Run one `git mv` per file from the File Structure section for root public routes and authenticated layout routes. Example commands:

```bash
mkdir -p apps/web/src/routes/-components
git mv apps/web/src/routes/-index-page.tsx apps/web/src/routes/-components/index-page.tsx
git mv apps/web/src/routes/-login-page.tsx apps/web/src/routes/-components/login-page.tsx
git mv apps/web/src/routes/-root-page.tsx apps/web/src/routes/-components/root-page.tsx
mkdir -p apps/web/src/routes/_authenticated/-actions apps/web/src/routes/_authenticated/-components apps/web/src/routes/_authenticated/-data
git mv apps/web/src/routes/_authenticated/-calendar-data.ts apps/web/src/routes/_authenticated/-data/calendar-data.ts
git mv apps/web/src/routes/_authenticated/-calendar-page.tsx apps/web/src/routes/_authenticated/-components/calendar-page.tsx
git mv apps/web/src/routes/_authenticated/-appointment-actions.ts apps/web/src/routes/_authenticated/-actions/appointment-actions.ts
```

- [ ] **Step 2: Update route imports**

Apply these import path changes:

```ts
// apps/web/src/routes/__root.tsx
import { RootPage } from "./-components/root-page"

// apps/web/src/routes/index.tsx
import { IndexPage } from "./-components/index-page"

// apps/web/src/routes/login.tsx
import { LoginPage } from "./-components/login-page"

// apps/web/src/routes/_authenticated/calendar.tsx
import { CalendarPage } from "./-components/calendar-page"
import { calendarAppointmentsQueryOptions } from "./-data/calendar-data"

// apps/web/src/routes/_authenticated/dashboard.tsx
import { DashboardPage } from "./-components/dashboard-page"
```

Use `rg -n "\"\\./-" apps/web/src/routes apps/web/src/routes/_authenticated` to find the remaining old imports and update them to the new folder paths.

- [ ] **Step 3: Update moved page imports**

Moved files under `_authenticated/-components/` now need one extra `../` segment for sibling route imports:

```ts
import { useAppointmentActions } from "../-actions/appointment-actions"
import { calendarAppointmentsQueryOptions } from "../-data/calendar-data"
import { Route } from "../calendar"
```

Use exact local names already present in each moved file; do not rename exports.

- [ ] **Step 4: Run targeted tests**

Run:

```bash
vp test apps/web/src/routes/-route-component-organization.test.ts apps/web/src/routes/_authenticated/-route-data-organization.test.ts apps/web/src/routes/-route-helper-folder-organization.test.ts
```

Expected: failures remain only for route directories not migrated yet. There should be no import-resolution errors.

---

### Task 3: Migrate Customer And Appointment Route Helpers

**Files:**

- Move: all `appointments`, `customers`, and `customers/$customerId` files listed in the File Structure section.
- Modify imports in route files under those directories.
- Modify imports inside moved component/data/action files.

**Interfaces:**

- Consumes: helper folders from Task 1 and route layout imports from Task 2.
- Produces: appointments and customers route directories with all local helper files grouped by concern.

- [ ] **Step 1: Move appointments helpers**

Run:

```bash
mkdir -p apps/web/src/routes/_authenticated/appointments/-actions apps/web/src/routes/_authenticated/appointments/-components apps/web/src/routes/_authenticated/appointments/-data
git mv apps/web/src/routes/_authenticated/appointments/-appointment-detail-data.ts apps/web/src/routes/_authenticated/appointments/-data/appointment-detail-data.ts
git mv apps/web/src/routes/_authenticated/appointments/-appointment-transaction-actions.ts apps/web/src/routes/_authenticated/appointments/-actions/appointment-transaction-actions.ts
git mv apps/web/src/routes/_authenticated/appointments/-appointment-detail-page.tsx apps/web/src/routes/_authenticated/appointments/-components/appointment-detail-page.tsx
git mv apps/web/src/routes/_authenticated/appointments/-route-page.tsx apps/web/src/routes/_authenticated/appointments/-components/route-page.tsx
```

- [ ] **Step 2: Move customers helpers**

Run:

```bash
mkdir -p apps/web/src/routes/_authenticated/customers/-actions apps/web/src/routes/_authenticated/customers/-components apps/web/src/routes/_authenticated/customers/-data
git mv apps/web/src/routes/_authenticated/customers/-customer-actions.ts apps/web/src/routes/_authenticated/customers/-actions/customer-actions.ts
git mv apps/web/src/routes/_authenticated/customers/-index-data.ts apps/web/src/routes/_authenticated/customers/-data/index-data.ts
git mv apps/web/src/routes/_authenticated/customers/-index-page.tsx apps/web/src/routes/_authenticated/customers/-components/index-page.tsx
git mv apps/web/src/routes/_authenticated/customers/-route-page.tsx apps/web/src/routes/_authenticated/customers/-components/route-page.tsx
```

- [ ] **Step 3: Move customer detail helpers**

Run:

```bash
mkdir -p apps/web/src/routes/_authenticated/customers/\$customerId/-actions apps/web/src/routes/_authenticated/customers/\$customerId/-components apps/web/src/routes/_authenticated/customers/\$customerId/-data
git mv apps/web/src/routes/_authenticated/customers/\$customerId/-appointments-data.ts apps/web/src/routes/_authenticated/customers/\$customerId/-data/appointments-data.ts
git mv apps/web/src/routes/_authenticated/customers/\$customerId/-hair-sales-data.ts apps/web/src/routes/_authenticated/customers/\$customerId/-data/hair-sales-data.ts
git mv apps/web/src/routes/_authenticated/customers/\$customerId/-notes-data.ts apps/web/src/routes/_authenticated/customers/\$customerId/-data/notes-data.ts
git mv apps/web/src/routes/_authenticated/customers/\$customerId/-customer-detail-actions.ts apps/web/src/routes/_authenticated/customers/\$customerId/-actions/customer-detail-actions.ts
git mv apps/web/src/routes/_authenticated/customers/\$customerId/-note-actions.ts apps/web/src/routes/_authenticated/customers/\$customerId/-actions/note-actions.ts
git mv apps/web/src/routes/_authenticated/customers/\$customerId/-appointments-page.tsx apps/web/src/routes/_authenticated/customers/\$customerId/-components/appointments-page.tsx
git mv apps/web/src/routes/_authenticated/customers/\$customerId/-hair-sales-page.tsx apps/web/src/routes/_authenticated/customers/\$customerId/-components/hair-sales-page.tsx
git mv apps/web/src/routes/_authenticated/customers/\$customerId/-notes-page.tsx apps/web/src/routes/_authenticated/customers/\$customerId/-components/notes-page.tsx
git mv apps/web/src/routes/_authenticated/customers/\$customerId/-route-page.tsx apps/web/src/routes/_authenticated/customers/\$customerId/-components/route-page.tsx
```

- [ ] **Step 4: Update imports**

Use these patterns:

```ts
// route files in the same directory
import { CustomersPage } from "./-components/index-page"
import { customersListQueryOptions } from "./-data/index-data"

// moved components importing actions/data in the same route directory
import { useCustomerActions } from "../-actions/customer-actions"
import { customersListQueryOptions } from "../-data/index-data"
import { Route } from "../index"
```

For `customers/$customerId` files, keep `$customerId` escaped only in shell commands. TypeScript imports should use normal relative paths such as `../route`, `../appointments`, `../-data/appointments-data`, and `../-actions/note-actions`.

- [ ] **Step 5: Run targeted route tests**

Run:

```bash
vp test apps/web/src/routes/-route-helper-folder-organization.test.ts apps/web/src/routes/-route-component-organization.test.ts apps/web/src/routes/_authenticated/-route-data-organization.test.ts
```

Expected: failures remain only for documents, hair orders, hair sales, legal entities, profile, and salons if they are not yet migrated.

---

### Task 4: Migrate Documents, Hair Orders, And Hair Sales Helpers

**Files:**

- Move: documents, documents `$documentId`, hair-orders, and hair-sales files listed in the File Structure section.
- Modify imports in route files and moved helpers.

**Interfaces:**

- Consumes: Task 1 guard tests.
- Produces: all document, hair order, and hair sale route helpers grouped under concern folders.

- [ ] **Step 1: Move documents helpers**

Run:

```bash
mkdir -p apps/web/src/routes/_authenticated/documents/-actions apps/web/src/routes/_authenticated/documents/-components apps/web/src/routes/_authenticated/documents/-data
git mv apps/web/src/routes/_authenticated/documents/-document-actions.ts apps/web/src/routes/_authenticated/documents/-actions/document-actions.ts
git mv apps/web/src/routes/_authenticated/documents/-index-data.ts apps/web/src/routes/_authenticated/documents/-data/index-data.ts
git mv apps/web/src/routes/_authenticated/documents/-index-page.tsx apps/web/src/routes/_authenticated/documents/-components/index-page.tsx
mkdir -p apps/web/src/routes/_authenticated/documents/\$documentId/-actions apps/web/src/routes/_authenticated/documents/\$documentId/-components apps/web/src/routes/_authenticated/documents/\$documentId/-data
git mv apps/web/src/routes/_authenticated/documents/\$documentId/-document-match-actions.ts apps/web/src/routes/_authenticated/documents/\$documentId/-actions/document-match-actions.ts
git mv apps/web/src/routes/_authenticated/documents/\$documentId/-match-data.ts apps/web/src/routes/_authenticated/documents/\$documentId/-data/match-data.ts
git mv apps/web/src/routes/_authenticated/documents/\$documentId/-match-page.tsx apps/web/src/routes/_authenticated/documents/\$documentId/-components/match-page.tsx
```

- [ ] **Step 2: Move hair orders helpers**

Run:

```bash
mkdir -p apps/web/src/routes/_authenticated/hair-orders/-actions apps/web/src/routes/_authenticated/hair-orders/-components apps/web/src/routes/_authenticated/hair-orders/-data
git mv apps/web/src/routes/_authenticated/hair-orders/-\$hairOrderId-data.ts apps/web/src/routes/_authenticated/hair-orders/-data/hair-order-id-data.ts
git mv apps/web/src/routes/_authenticated/hair-orders/-hair-order-detail-data.ts apps/web/src/routes/_authenticated/hair-orders/-data/hair-order-detail-data.ts
git mv apps/web/src/routes/_authenticated/hair-orders/-hair-order-actions.ts apps/web/src/routes/_authenticated/hair-orders/-actions/hair-order-actions.ts
git mv apps/web/src/routes/_authenticated/hair-orders/-\$hairOrderId-page.tsx apps/web/src/routes/_authenticated/hair-orders/-components/hair-order-id-page.tsx
git mv apps/web/src/routes/_authenticated/hair-orders/-index-page.tsx apps/web/src/routes/_authenticated/hair-orders/-components/index-page.tsx
git mv apps/web/src/routes/_authenticated/hair-orders/-route-page.tsx apps/web/src/routes/_authenticated/hair-orders/-components/route-page.tsx
```

- [ ] **Step 3: Move hair sales helpers**

Run:

```bash
mkdir -p apps/web/src/routes/_authenticated/hair-sales/-components apps/web/src/routes/_authenticated/hair-sales/-data
git mv apps/web/src/routes/_authenticated/hair-sales/-index-data.ts apps/web/src/routes/_authenticated/hair-sales/-data/index-data.ts
git mv apps/web/src/routes/_authenticated/hair-sales/-\$hairSaleId-page.tsx apps/web/src/routes/_authenticated/hair-sales/-components/hair-sale-id-page.tsx
git mv apps/web/src/routes/_authenticated/hair-sales/-index-page.tsx apps/web/src/routes/_authenticated/hair-sales/-components/index-page.tsx
git mv apps/web/src/routes/_authenticated/hair-sales/-route-page.tsx apps/web/src/routes/_authenticated/hair-sales/-components/route-page.tsx
```

- [ ] **Step 4: Update imports**

Use these patterns:

```ts
import { DocumentsPage } from "./-components/index-page"
import { documentsQueryOptions } from "./-data/index-data"
import { useDocumentActions } from "../-actions/document-actions"

import { HairOrderPage } from "./-components/hair-order-id-page"
import { hairOrderQueryOptions } from "./-data/hair-order-id-data"

import { HairSalesPage } from "./-components/index-page"
import { hairSalesQueryOptions } from "./-data/index-data"
```

Run `rg -n "\"\\./-|-data|-actions|-components" apps/web/src/routes/_authenticated/documents apps/web/src/routes/_authenticated/hair-orders apps/web/src/routes/_authenticated/hair-sales` and correct any stale paths.

- [ ] **Step 5: Run targeted route tests**

Run:

```bash
vp test apps/web/src/routes/-route-helper-folder-organization.test.ts apps/web/src/routes/-route-component-organization.test.ts apps/web/src/routes/_authenticated/-route-data-organization.test.ts
```

Expected: failures remain only for legal entities, profile, and salons if they are not yet migrated.

---

### Task 5: Migrate Legal Entities, Bank Accounts, Profile, And Salons Helpers

**Files:**

- Move: legal-entities, legal-entity detail, bank-accounts, profile, and salons files listed in the File Structure section.
- Modify imports in route files and moved helpers.

**Interfaces:**

- Consumes: Task 1 guard tests.
- Produces: no remaining flat route helper files outside allowed organization tests.

- [ ] **Step 1: Move legal entities helpers**

Run:

```bash
mkdir -p apps/web/src/routes/_authenticated/legal-entities/-components
git mv apps/web/src/routes/_authenticated/legal-entities/-index-page.tsx apps/web/src/routes/_authenticated/legal-entities/-components/index-page.tsx
mkdir -p apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/-actions apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/-components
git mv apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/-legal-entity-actions.ts apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/-actions/legal-entity-actions.ts
git mv apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/-overview-page.tsx apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/-components/overview-page.tsx
git mv apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/-route-page.tsx apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/-components/route-page.tsx
git mv apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/-salons-page.tsx apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/-components/salons-page.tsx
```

- [ ] **Step 2: Move bank accounts helpers**

Run:

```bash
mkdir -p apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/bank-accounts/-actions apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/bank-accounts/-components
git mv apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/bank-accounts/-bank-account-actions.ts apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/bank-accounts/-actions/bank-account-actions.ts
git mv apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/bank-accounts/-\$bankAccountId-page.tsx apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/bank-accounts/-components/bank-account-id-page.tsx
git mv apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/bank-accounts/-index-page.tsx apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/bank-accounts/-components/index-page.tsx
```

- [ ] **Step 3: Move profile and salons helpers**

Run:

```bash
mkdir -p apps/web/src/routes/_authenticated/profile/-actions
git mv apps/web/src/routes/_authenticated/profile/-profile-actions.ts apps/web/src/routes/_authenticated/profile/-actions/profile-actions.ts
mkdir -p apps/web/src/routes/_authenticated/salons/-actions apps/web/src/routes/_authenticated/salons/-components
git mv apps/web/src/routes/_authenticated/salons/-salon-actions.ts apps/web/src/routes/_authenticated/salons/-actions/salon-actions.ts
git mv apps/web/src/routes/_authenticated/salons/-\$salonId-page.tsx apps/web/src/routes/_authenticated/salons/-components/salon-id-page.tsx
```

- [ ] **Step 4: Update imports**

Use these patterns:

```ts
import { LegalEntitiesPage } from "./-components/index-page"
import { LegalEntityRoutePage } from "./-components/route-page"
import { useLegalEntityActions } from "../-actions/legal-entity-actions"

import { BankAccountPage } from "./-components/bank-account-id-page"
import { useBankAccountActions } from "../-actions/bank-account-actions"

import { useProfileActions } from "./-actions/profile-actions"
import { SalonPage } from "./-components/salon-id-page"
import { useSalonActions } from "../-actions/salon-actions"
```

Use TypeScript compiler errors to correct actual exported symbol names rather than renaming public exports.

- [ ] **Step 5: Run the convention tests**

Run:

```bash
vp test apps/web/src/routes/-route-helper-folder-organization.test.ts apps/web/src/routes/-route-component-organization.test.ts apps/web/src/routes/_authenticated/-route-data-organization.test.ts apps/web/src/components/server-state-ownership.test.ts
```

Expected: all tests pass.

---

### Task 6: Split Oversized Route-Local Components Without Behavior Changes

**Files:**

- Modify: `apps/web/src/routes/_authenticated/documents/-components/index-page.tsx`
- Create: `apps/web/src/routes/_authenticated/documents/-components/documents-table.tsx`
- Modify: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/bank-account-id-page.tsx`
- Create: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/statement-entries-table.tsx`
- Create: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/entry-attachments.tsx`
- Create: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/assignment-controls.tsx`

**Interfaces:**

- Consumes: migrated `-components/` folders from Tasks 4 and 5.
- Produces: focused route-local component files where large page files already contain multiple local components.

- [ ] **Step 1: Write a size-focused organization test**

Add this test case to `apps/web/src/routes/-route-helper-folder-organization.test.ts`:

```ts
function componentFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return componentFiles(path)
    if (!/\.(tsx)$/.test(entry)) return []
    if (!path.includes("/-components/")) return []
    return [path]
  })
}

describe("route helper folder organization", () => {
  it.each(componentFiles(routesDir))("keeps route-local component files focused %s", (path) => {
    const source = readFileSync(path, "utf8")
    const declarations = source.match(/function\s+[A-Z][A-Za-z0-9_]*|const\s+[A-Z][A-Za-z0-9_]*\s*=/g) ?? []

    expect(declarations.length, relative(routesDir, path)).toBeLessThanOrEqual(4)
  })
})
```

Expected: this fails for route-local component files with many component declarations.

- [ ] **Step 2: Extract existing local components**

Move whole existing component declarations from oversized page files into sibling files under the same `-components/` folder. Preserve prop types and JSX. Do not move data hooks or action hooks into reusable `src/components`.

Example extraction:

```ts
// documents-table.tsx
export function DocumentsTable(props: DocumentsTableProps) {
  return <Table.ScrollContainer minWidth={980}>{/* existing table body */}</Table.ScrollContainer>
}
```

Then import it from the page:

```ts
import { DocumentsTable } from "./documents-table"
```

- [ ] **Step 3: Run the organization tests**

Run:

```bash
vp test apps/web/src/routes/-route-helper-folder-organization.test.ts
```

Expected: pass.

---

### Task 7: Full Validation And Commit

**Files:**

- Modify: generated `apps/web/src/routeTree.gen.ts` only if Vite+/TanStack Router regenerates it during validation.
- No production behavior changes expected.

**Interfaces:**

- Consumes: all migrated route imports and guard tests.
- Produces: validated branch ready for review.

- [ ] **Step 1: Scan for remaining flat route helpers**

Run:

```bash
find apps/web/src/routes -type f -name '-*' | sort
```

Expected output:

```txt
apps/web/src/routes/-route-component-organization.test.ts
apps/web/src/routes/-route-helper-folder-organization.test.ts
apps/web/src/routes/_authenticated/-route-data-organization.test.ts
```

- [ ] **Step 2: Run Vite+ checks**

Run:

```bash
vp check
```

Expected: pass. The existing pnpm `packageManager`/`devEngines.packageManager` warning may appear and is not caused by this refactor.

- [ ] **Step 3: Run tests**

Run:

```bash
vp test
```

Expected: pass.

- [ ] **Step 4: Review git diff**

Run:

```bash
git diff --stat
git diff -- apps/web/src/routes apps/web/src/components docs/superpowers/plans/2026-07-22-route-folder-organization.md
```

Expected: moved files, import path updates, organization tests, and this plan only. No backend files, route URL changes, or visual behavior changes.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add apps/web/src/routes apps/web/src/components docs/superpowers/plans/2026-07-22-route-folder-organization.md
git commit -m "refactor: organize route helpers by concern"
```

Expected: commit succeeds on branch `route-folder-organization`.

## Self-Review

Spec coverage: covered target folders, route-file responsibilities, data/action/component boundaries, shared component ownership, testing, non-goals, and full route-tree migration.

Placeholder scan: no unresolved marker text or underspecified tasks.

Type consistency: the plan preserves current export names and changes import paths only. Shell paths escape `$customerId`, `$documentId`, `$hairOrderId`, `$hairSaleId`, and `$bankAccountId` where needed.
