# tRPC Resource Router Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize the existing tRPC API around resource-oriented router contracts and update all web call sites in the same change.

**Architecture:** Keep `packages/api/src/routers/*` as the JSON business API and keep Hono as the transport host for `/trpc/*`, auth, and file endpoints. Add shared list helpers, migrate routers to `list`/`get`/`create`/`update`/`delete` where those capabilities already exist, and keep explicit domain actions only for workflow operations.

**Tech Stack:** TypeScript, tRPC v11, Hono, Drizzle ORM, Zod, React Query, TanStack Router, Vite+.

---

## File Structure

- Create `packages/api/src/pagination.ts`: shared page/search schemas, offset helper, page envelope helper.
- Create `packages/api/src/pagination.test.ts`: unit tests for pagination defaults, bounds, search trimming, offset, and envelope output.
- Modify `packages/api/package.json`: add `test` and `test:watch` scripts.
- Modify `packages/api/src/routers/customers.ts`: make this the reference resource router with `list`, `get`, `create`, `update`, `summary`.
- Modify `packages/api/src/routers/appointments.ts`: rename `byId` to `get`, fold `byCustomerId` into paged/filterable `list`, rename `updateMaster` to `update`, keep `linkPersonnel`.
- Modify `packages/api/src/routers/transactions.ts`: replace `byAppointmentId` with paged/filterable `list`.
- Modify `packages/api/src/routers/cash-transactions.ts`: reuse shared pagination helpers without changing the public capability set.
- Modify `packages/api/src/routers/hair-orders.ts`: rename `byId` to `get`, make `list` object-shaped and paged.
- Modify `packages/api/src/routers/hair-assigned.ts`: replace `byAppointment` and `byCustomer` with `list` filters, keep `availableOrders`.
- Modify `packages/api/src/routers/bank-accounts.ts`: rename `byId` to `get`.
- Modify `packages/api/src/routers/bank-statement-entries.ts`: rename `byId` to `get`, align `list` pagination with shared helpers.
- Modify `packages/api/src/routers/bank-statement-attachments.ts`: combine assigned/unassigned row reads under `list`, keep `counts`, `assign`, `unassign`, `delete`.
- Modify `packages/api/src/routers/legal-entities.ts` and `packages/api/src/routers/salons.ts`: rename `byId` to `get`, make list inputs object-shaped where currently absent.
- Modify `apps/web/src/**/*.tsx` and `apps/web/src/**/*.ts`: update tRPC procedure names, list result handling, loaders, invalidation keys, and table rendering for paged envelopes.

## Task 1: Add Shared Pagination Helpers

**Files:**
- Create: `packages/api/src/pagination.ts`
- Create: `packages/api/src/pagination.test.ts`
- Modify: `packages/api/package.json`

- [ ] **Step 1: Add the API package test scripts**

Modify `packages/api/package.json` scripts to:

```json
{
  "scripts": {
    "check-types": "tsc --noEmit",
    "test": "vp test run",
    "test:watch": "vp test"
  }
}
```

- [ ] **Step 2: Write failing pagination helper tests**

Create `packages/api/src/pagination.test.ts`:

```ts
import { describe, expect, it } from "vite-plus/test"

import { getOffset, pageSchema, pagedResult, searchSchema } from "./pagination"

describe("pagination helpers", () => {
  it("defaults page and pageSize", () => {
    expect(pageSchema.parse({})).toEqual({ page: 1, pageSize: 25 })
  })

  it("rejects unsafe page sizes", () => {
    expect(() => pageSchema.parse({ page: 1, pageSize: 101 })).toThrow()
    expect(() => pageSchema.parse({ page: 0, pageSize: 25 })).toThrow()
  })

  it("trims blank search to undefined", () => {
    expect(searchSchema.parse("  alice  ")).toBe("alice")
    expect(searchSchema.parse("   ")).toBeUndefined()
    expect(searchSchema.parse(undefined)).toBeUndefined()
  })

  it("calculates offsets", () => {
    expect(getOffset({ page: 1, pageSize: 25 })).toBe(0)
    expect(getOffset({ page: 3, pageSize: 25 })).toBe(50)
  })

  it("returns the standard page envelope", () => {
    expect(pagedResult([{ id: "c1" }], { page: 2, pageSize: 10 }, 31)).toEqual({
      items: [{ id: "c1" }],
      page: 2,
      pageSize: 10,
      totalCount: 31,
    })
  })
})
```

- [ ] **Step 3: Run the failing helper tests**

Run: `vp run --filter @prive-admin-tanstack/api test -- pagination.test.ts`

Expected: fail because `packages/api/src/pagination.ts` does not exist.

- [ ] **Step 4: Implement pagination helpers**

Create `packages/api/src/pagination.ts`:

```ts
import { z } from "zod"

export const pageSchema = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
})

export const searchSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => (value ? value : undefined))

export type PageInput = z.infer<typeof pageSchema>

export function getOffset(input: PageInput) {
  return (input.page - 1) * input.pageSize
}

export function pagedResult<T>(items: T[], input: PageInput, totalCount: number) {
  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    totalCount,
  }
}
```

- [ ] **Step 5: Run helper tests**

Run: `vp run --filter @prive-admin-tanstack/api test -- pagination.test.ts`

Expected: pass.

- [ ] **Step 6: Commit helper foundation**

Run:

```bash
git add packages/api/package.json packages/api/src/pagination.ts packages/api/src/pagination.test.ts
git commit -m "test(api): add pagination helper contract"
```

## Task 2: Standardize Customers As The Reference Router

**Files:**
- Modify: `packages/api/src/routers/customers.ts`
- Modify: `apps/web/src/routes/_authenticated/customers/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId.tsx`

- [ ] **Step 1: Replace customer router with paged list and get**

Modify `packages/api/src/routers/customers.ts` so the router has this shape:

```ts
const customerListSchema = pageSchema.extend({
  search: searchSchema,
})

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

export const customersRouter = router({
  list: protectedProcedure.input(customerListSchema).query(async ({ input }) => {
    const where = input.search
      ? or(ilike(customer.name, `%${escapeLikePattern(input.search)}%`), ilike(customer.phoneNumber, `%${escapeLikePattern(input.search)}%`))
      : undefined

    const items = await db.query.customer.findMany({
      where,
      orderBy: (customer, { asc }) => [asc(customer.name)],
      limit: input.pageSize,
      offset: getOffset(input),
    })

    const [countRow] = await db.select({ totalCount: count() }).from(customer).where(where)
    return pagedResult(items, input, countRow?.totalCount ?? 0)
  }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const result = await db.query.customer.findFirst({
      where: eq(customer.id, input.id),
    })
    if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" })
    return result
  }),

  create: protectedProcedure.input(customerInputSchema).mutation(async ({ input }) => {
    const [result] = await db.insert(customer).values({ name: input.name, phoneNumber: input.phoneNumber }).returning()
    return result
  }),

  update: protectedProcedure.input(customerInputSchema.required({ id: true })).mutation(async ({ input }) => {
    const [result] = await db
      .update(customer)
      .set({ name: input.name, phoneNumber: input.phoneNumber })
      .where(eq(customer.id, input.id))
      .returning()
    if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" })
    return result
  }),
})
```

Keep the current `summary` procedure implementation in `customersRouter` after `update`; do not change its input, output, or aggregation logic in this task. Add imports for `count`, `ilike`, `or`, `getOffset`, `pageSchema`, `pagedResult`, and `searchSchema`.

- [ ] **Step 2: Run type check and observe customer call-site failures**

Run: `vp run -r check-types`

Expected: fail on `trpc.customers.byId` and on places that treat `customers.list` data as an array.

- [ ] **Step 3: Update customer list route for paged response**

In `apps/web/src/routes/_authenticated/customers/index.tsx`, use explicit list input:

```ts
const defaultCustomersListInput = { page: 1, pageSize: 25, search: undefined as string | undefined }
const customersQueryOptions = trpc.customers.list.queryOptions(defaultCustomersListInput)
```

In `CustomersPage`, read items from the envelope:

```ts
const { data, isLoading } = useQuery(customersQueryOptions)
const customers = data?.items ?? []
```

Replace `customers?.map` with `customers.map` and `customers?.length === 0` with `customers.length === 0`.

- [ ] **Step 4: Update customer detail route procedure names**

In `apps/web/src/routes/_authenticated/customers/$customerId.tsx`, replace:

```ts
trpc.customers.byId.queryOptions({ id: params.customerId })
trpc.customers.byId.queryOptions({ id: customerId })
```

with:

```ts
trpc.customers.get.queryOptions({ id: params.customerId })
trpc.customers.get.queryOptions({ id: customerId })
```

Update invalidation from `trpc.customers.byId` to `trpc.customers.get`.

- [ ] **Step 5: Run type check**

Run: `vp run -r check-types`

Expected: no customer-related errors. Other routers may still have old names until later tasks.

- [ ] **Step 6: Commit customer reference router**

Run:

```bash
git add packages/api/src/routers/customers.ts apps/web/src/routes/_authenticated/customers/index.tsx 'apps/web/src/routes/_authenticated/customers/$customerId.tsx'
git commit -m "refactor(api): standardize customer router"
```

## Task 3: Standardize Appointment And Transaction Resource Reads

**Files:**
- Modify: `packages/api/src/routers/appointments.ts`
- Modify: `packages/api/src/routers/transactions.ts`
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId.tsx`
- Modify: files reported by `rg -n "appointments\\.(byId|byCustomerId|updateMaster)|transactions\\.byAppointmentId" apps/web/src`

- [ ] **Step 1: Update appointment router names and list filters**

In `packages/api/src/routers/appointments.ts`, define:

```ts
const appointmentListSchema = pageSchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  customerId: z.string().optional(),
  salonId: z.string().optional(),
})
```

Change `byId` to `get`. Change `list` to build conditions for `startDate`, `endDate`, `customerId`, and `salonId`, apply `limit`, `offset`, and return `pagedResult(items, input, totalCount)`.

Change `updateMaster` to:

```ts
update: protectedProcedure
  .input(z.object({ id: z.string().min(1), masterId: z.string().min(1) }))
  .mutation(async ({ input }) => {
    const [result] = await db.update(appointment).set({ masterId: input.masterId }).where(eq(appointment.id, input.id)).returning()
    if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Appointment not found" })
    return result
  })
```

Remove `byCustomerId`.

- [ ] **Step 2: Update transactions router list**

In `packages/api/src/routers/transactions.ts`, replace `byAppointmentId` with:

```ts
const transactionListSchema = pageSchema.extend({
  appointmentId: z.string().optional(),
  customerId: z.string().optional(),
  currency: currencySchema.optional(),
})
```

Implement `list` with filters, `limit`, `offset`, and `pagedResult`. If `appointmentId` is provided, preserve the existing appointment existence check and `NOT_FOUND` behavior before querying transactions.

- [ ] **Step 3: Run type check and identify web failures**

Run: `vp run -r check-types`

Expected: fail on old appointment and transaction procedure names and array handling for newly paged responses.

- [ ] **Step 4: Update web call sites**

Run: `rg -n "appointments\\.(byId|byCustomerId|updateMaster)|transactions\\.byAppointmentId" apps/web/src`

For each result:

```ts
trpc.appointments.byId.queryOptions({ id })
```

becomes:

```ts
trpc.appointments.get.queryOptions({ id })
```

```ts
trpc.appointments.byCustomerId.queryOptions({ customerId })
```

becomes:

```ts
trpc.appointments.list.queryOptions({ page: 1, pageSize: 25, customerId })
```

```ts
trpc.appointments.updateMaster.mutationOptions()
```

becomes:

```ts
trpc.appointments.update.mutationOptions()
```

and mutation variables change from `{ appointmentId, masterId }` to `{ id: appointmentId, masterId }`.

```ts
trpc.transactions.byAppointmentId.queryOptions({ appointmentId })
```

becomes:

```ts
trpc.transactions.list.queryOptions({ page: 1, pageSize: 25, appointmentId })
```

Where list data is rendered, use `data?.items ?? []`.

- [ ] **Step 5: Run type check**

Run: `vp run -r check-types`

Expected: no appointment or transaction procedure-name errors.

- [ ] **Step 6: Commit appointment and transaction standardization**

Run:

```bash
git add packages/api/src/routers/appointments.ts packages/api/src/routers/transactions.ts apps/web/src
git commit -m "refactor(api): standardize appointment and transaction reads"
```

## Task 4: Standardize Hair Routers

**Files:**
- Modify: `packages/api/src/routers/hair-orders.ts`
- Modify: `packages/api/src/routers/hair-assigned.ts`
- Modify: files reported by `rg -n "hairOrders\\.byId|hairAssigned\\.(byAppointment|byCustomer)" apps/web/src`

- [ ] **Step 1: Update hair orders router**

In `packages/api/src/routers/hair-orders.ts`, rename `byId` to `get`. Change `list` to accept:

```ts
const hairOrderListSchema = pageSchema.extend({
  customerId: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
})
```

Use `and(...conditions)` when filters exist, order by the current order, apply `limit` and `offset`, and return `pagedResult(items, input, totalCount)`.

- [ ] **Step 2: Update hair assigned router**

In `packages/api/src/routers/hair-assigned.ts`, replace `byAppointment` and `byCustomer` with:

```ts
const hairAssignedListSchema = pageSchema.extend({
  appointmentId: z.string().optional(),
  customerId: z.string().optional(),
})
```

Implement `list` with the existing relation includes, filters, `limit`, `offset`, and `pagedResult`. Keep `availableOrders`, `create`, `update`, and `delete`.

- [ ] **Step 3: Update web call sites**

Run: `rg -n "hairOrders\\.byId|hairAssigned\\.(byAppointment|byCustomer)" apps/web/src`

Replace:

```ts
trpc.hairOrders.byId.queryOptions({ id })
```

with:

```ts
trpc.hairOrders.get.queryOptions({ id })
```

Replace:

```ts
trpc.hairAssigned.byCustomer.queryOptions({ customerId })
trpc.hairAssigned.byAppointment.queryOptions({ appointmentId })
```

with:

```ts
trpc.hairAssigned.list.queryOptions({ page: 1, pageSize: 25, customerId })
trpc.hairAssigned.list.queryOptions({ page: 1, pageSize: 25, appointmentId })
```

Use `data?.items ?? []` where tables expect arrays.

- [ ] **Step 4: Run type check**

Run: `vp run -r check-types`

Expected: no hair router procedure-name errors.

- [ ] **Step 5: Commit hair router standardization**

Run:

```bash
git add packages/api/src/routers/hair-orders.ts packages/api/src/routers/hair-assigned.ts apps/web/src
git commit -m "refactor(api): standardize hair routers"
```

## Task 5: Standardize Bank And Reference Routers

**Files:**
- Modify: `packages/api/src/routers/bank-accounts.ts`
- Modify: `packages/api/src/routers/bank-statement-entries.ts`
- Modify: `packages/api/src/routers/bank-statement-attachments.ts`
- Modify: `packages/api/src/routers/legal-entities.ts`
- Modify: `packages/api/src/routers/salons.ts`
- Modify: matching web call sites under `apps/web/src`

- [ ] **Step 1: Rename single-resource reads**

Rename these procedures:

```ts
bankAccounts.byId -> bankAccounts.get
bankStatementEntries.byId -> bankStatementEntries.get
legalEntities.byId -> legalEntities.get
salons.byId -> salons.get
```

Keep the existing bodies and `NOT_FOUND` behavior.

- [ ] **Step 2: Make simple reference lists object-shaped**

For `legalEntities.list` and `salons.list`, use input schemas:

```ts
const simpleListSchema = z.object({}).optional().default({})
```

Keep return values unpaged only if the current screens use them as bounded option/reference lists. Do not add missing create/delete operations.

- [ ] **Step 3: Standardize bank statement entry list**

In `bank-statement-entries.ts`, merge the existing list filters with `pageSchema`, use `getOffset(input)`, and return `pagedResult(items, input, totalCount)`.

- [ ] **Step 4: Standardize attachment row reads**

In `bank-statement-attachments.ts`, replace `unassigned` with `list({ assigned: false })` support:

```ts
const attachmentListSchema = z.object({
  entryId: z.string().min(1).optional(),
  assigned: z.boolean().optional(),
})
```

Keep `counts`, `assign`, `unassign`, and `delete`. Keep Hono upload, preview, and export endpoints unchanged.

- [ ] **Step 5: Update web call sites**

Run:

```bash
rg -n "bankAccounts\\.byId|bankStatementEntries\\.byId|legalEntities\\.byId|salons\\.byId|bankStatementAttachments\\.unassigned" apps/web/src
```

Replace each old name with the standardized name. For bank statement entry paged data, use `data?.items ?? []`.

- [ ] **Step 6: Run type check**

Run: `vp run -r check-types`

Expected: no bank/reference router procedure-name errors.

- [ ] **Step 7: Commit bank and reference standardization**

Run:

```bash
git add packages/api/src/routers apps/web/src
git commit -m "refactor(api): standardize bank and reference routers"
```

## Task 6: Align Existing Good Routers And Query Invalidations

**Files:**
- Modify: `packages/api/src/routers/cash-transactions.ts`
- Modify: web files reported by `rg -n "invalidateQueries|queryKey\\(|queryOptions\\(" apps/web/src`

- [ ] **Step 1: Reuse shared pagination in cash transactions**

In `cash-transactions.ts`, replace local page/pageSize fields with:

```ts
const listSchema = pageSchema.extend({
  search: searchSchema,
  customerId: z.string().optional(),
  currency: currencySchema.optional(),
  direction: z.enum(["all", "received", "paid"]).default("all"),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
})
```

Replace manual offset calculation with `getOffset(input)` and wrap the return with `pagedResult(rows, input, countRow?.totalCount ?? 0)`.

- [ ] **Step 2: Audit all tRPC invalidations**

Run:

```bash
rg -n "trpc\\.[A-Za-z0-9]+\\.[A-Za-z0-9]+\\.(queryKey|queryOptions)|invalidateQueries" apps/web/src
```

For renamed procedures, update invalidation to the new names. For paged lists, prefer invalidating the router list key broadly:

```ts
queryClient.invalidateQueries({ queryKey: trpc.customers.list.queryKey() })
```

Use exact input query keys only when the mutation is known to affect a single loaded query.

- [ ] **Step 3: Search for old API names**

Run:

```bash
rg -n "\\.(byId|byCustomerId|byAppointmentId|byCustomer|byAppointment|updateMaster|unassigned)\\b" packages/api/src apps/web/src
```

Expected: no matches for removed procedure names. Matches are acceptable only for unrelated words outside tRPC procedure names.

- [ ] **Step 4: Run type check**

Run: `vp run -r check-types`

Expected: pass.

- [ ] **Step 5: Commit cleanup**

Run:

```bash
git add packages/api/src/routers/cash-transactions.ts apps/web/src
git commit -m "refactor(api): align pagination helpers and query invalidation"
```

## Task 7: Full Verification

**Files:**
- No planned source edits unless verification exposes a defect.

- [ ] **Step 1: Run API tests**

Run: `vp run --filter @prive-admin-tanstack/api test`

Expected: pagination helper tests pass.

- [ ] **Step 2: Run workspace type checks**

Run: `vp run -r check-types`

Expected: all packages pass.

- [ ] **Step 3: Run Vite+ check**

Run: `vp check`

Expected: formatting, linting, and type-related checks pass. If it formats files, inspect `git diff` and commit the formatting-only changes with the related task or a final cleanup commit.

- [ ] **Step 4: Run builds**

Run:

```bash
vp build apps/web
vp build apps/server
```

Expected: both builds pass.

- [ ] **Step 5: Runtime smoke test**

Start the apps with the project’s normal dev command:

```bash
vp run -r --parallel dev
```

Smoke these workflows in the browser:

- Customers page loads and renders rows from `customers.list(...).items`.
- Customer detail loads customer, summary, appointments, notes, and hair assigned data.
- Appointment detail loads transactions through `transactions.list({ appointmentId })`.
- Existing create/update/delete workflows refresh the expected lists after mutation.

- [ ] **Step 6: Commit final verification fixes**

If verification required source changes, run:

```bash
git add packages/api apps/web
git commit -m "fix: address trpc router standardization verification"
```

If no changes were required, do not create an empty commit.

## Self-Review

- Spec coverage: The plan covers shared helpers, resource naming, paged list envelopes, missing-operation restraint, Hono non-changes, web call-site migration, invalidation audit, and verification.
- Red-flag scan: The plan contains no deferred implementation step and no compatibility alias.
- Type consistency: The plan consistently uses `list`, `get`, `create`, `update`, `delete`, `pageSchema`, `searchSchema`, `getOffset`, and `pagedResult`.
