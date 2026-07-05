# Customers No-Loading-States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the `/customers` index route to a route-owned data boundary so the table renders from loader-ready query data instead of a component-level loading state.

**Architecture:** The index route will own its pagination/search state through route search params and will use a route loader with `ensureQueryData` to guarantee the current page is cached before the route commits. The page component will read the current search params from the router, render directly from query data, and keep mutation-driven UI like the create dialog unchanged.

**Tech Stack:** TanStack Router, TanStack Query, tRPC, Mantine, TypeScript

---

### Task 1: Add route-owned search params and loader data to `/customers`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/customers/index.tsx`

- [ ] **Step 1: Write the route contract**

```ts
const searchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  search: z.string().catch(""),
})

export const Route = createFileRoute("/_authenticated/customers/")({
  validateSearch: searchSchema,
  loader: async ({ context, search }) => {
    await context.queryClient.ensureQueryData(
      trpc.customers.list.queryOptions({
        page: search.page,
        pageSize: PAGE_SIZE,
        search: search.search.trim() || undefined,
      }),
    )
  },
  component: CustomersPage,
})
```

- [ ] **Step 2: Verify the file still type-checks conceptually**

Run: `sed -n '1,220p' apps/web/src/routes/_authenticated/customers/index.tsx`
Expected: the route file imports `z`, defines `validateSearch`, and uses `ensureQueryData` in the loader.

- [ ] **Step 3: Implement the loader and search schema**

Replace the current `prefetchQuery` loader with `ensureQueryData`, add `validateSearch`, and make the page read `page` and `search` from `Route.useSearch()`.

- [ ] **Step 4: Verify the route compiles**

Run: `vp run check-types`
Expected: no TypeScript errors in the `/customers` route.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/_authenticated/customers/index.tsx docs/superpowers/plans/2026-07-05-customers-no-loading-states.md
git commit -m "feat: move customers list loading to route loader"
```

### Task 2: Remove the page-level loading branch from the customers table

**Files:**
- Modify: `apps/web/src/routes/_authenticated/customers/index.tsx`

- [ ] **Step 1: Rewrite the table rendering**

```tsx
const { data } = useQuery(
  trpc.customers.list.queryOptions(listInput, { placeholderData: (previousData) => previousData }),
)

const customers = data?.items ?? []
const totalCount = data?.totalCount ?? 0

<Table.Tbody>
  {customers.map((c) => (
    <Table.Tr key={c.id}>
      <Table.Td>
        <Text renderRoot={(props) => <Link to="/customers/$customerId" params={{ customerId: c.id }} {...props} />} c="blue" fw={500}>
          {c.name}
        </Text>
      </Table.Td>
      <Table.Td c="dimmed">{c.phoneNumber ?? "—"}</Table.Td>
      <Table.Td c="dimmed">
        <ClientDate date={c.createdAt} />
      </Table.Td>
    </Table.Tr>
  ))}
  {customers.length === 0 && (
    <Table.Tr>
      <Table.Td colSpan={3} ta="center" c="dimmed">
        {search.trim() ? "No customers match your search." : "No customers yet. Create your first one."}
      </Table.Td>
    </Table.Tr>
  )}
</Table.Tbody>
```

- [ ] **Step 2: Remove the skeleton fallback**

Delete the `Skeleton` import and the `isLoading` conditional branch from the table body.

- [ ] **Step 3: Verify the page still behaves as a list**

Run: `vp run check-types`
Expected: the page still compiles after removing loading-specific UI.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated/customers/index.tsx
git commit -m "refactor: remove customers table loading skeleton"
```

### Task 3: Test the route locally

**Files:**
- None

- [ ] **Step 1: Start the web app**

Run: `vp run dev:web`
Expected: the app starts and `/customers` loads with the route-owned data flow.

- [ ] **Step 2: Exercise pagination and search**

Open `/customers`, change the page and search term, and confirm the table transitions without a component-level loading skeleton.

- [ ] **Step 3: Verify the result**

If the route feels correct, stop here; if not, adjust the loader/search param boundary before expanding the pattern to another route.

