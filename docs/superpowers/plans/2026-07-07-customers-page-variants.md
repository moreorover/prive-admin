# Customers Page Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the customer list UI into a shared page frame and expose two route variants: `/customers` for the cleaner informational layout and `/customers2` for the contextual summary layout.

**Architecture:** Keep data loading in the route files, but move the page composition into one shared customer-page component so the two routes differ only by a `variant` prop. The shared component owns the create-customer dialog, the table frame, and the page-level hierarchy; the routes provide search state, pagination state, and query data.

**Tech Stack:** TypeScript, Mantine, TanStack Router, TanStack Query, existing `trpc` client, existing `ClientDate` component.

---

### Task 1: Add a shared customer page component

**Files:**
- Create: `apps/web/src/components/customers-page.tsx`

- [ ] **Step 1: Write the component API and implementation**

```tsx
import { useState } from "react"
import { Button, Container, Divider, Group, Modal, Pagination, Paper, Stack, Table, Text, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { z } from "zod"

import { ClientDate } from "@/components/client-date"
import { PageHeader } from "@/components/page-header"
import { trpc } from "@/utils/trpc"

export const PAGE_SIZE = 10

export const searchSchema = z.object({
  page: z.number().int().min(1).optional(),
  search: z.string().optional(),
})

export function customersListQueryOptions(page: number, search: string) {
  return trpc.customers.list.queryOptions({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

type CustomersPageVariant = "informational" | "contextual"

type CustomerRow = {
  id: string
  name: string
  phoneNumber: string | null
  createdAt: string
}

type CustomersPageProps = {
  variant: CustomersPageVariant
  customers: CustomerRow[]
  totalCount: number
  page: number
  totalPages: number
  searchValue: string
  onSearchChange: (nextValue: string) => void
  onPageChange: (nextPage: number) => void
}

function CustomerFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    ...trpc.customers.create.mutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.customers.list.queryKey() })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Customer created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
  const form = useForm({
    initialValues: { name: "", phoneNumber: "" },
  })
  const handleSubmit = async (values: { name: string; phoneNumber: string }) => {
    await mutation.mutateAsync({
      name: values.name,
      phoneNumber: values.phoneNumber || null,
    })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <Button type="submit" loading={mutation.isPending}>
            Create customer
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

export function CustomersPage({
  variant,
  customers,
  totalCount,
  page,
  totalPages,
  searchValue,
  onSearchChange,
  onPageChange,
}: CustomersPageProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const hasSearch = searchValue.trim().length > 0

  return (
    <Container size="xl">
      <Stack gap="lg">
        <PageHeader
          title="Customers"
          description={
            variant === "informational"
              ? "People you serve. Open a record to review appointments and notes."
              : "People you serve. This variant adds live list context above the search row."
          }
          actions={
            <Button leftSection={<IconPlus size={14} />} onClick={() => setCreateOpen(true)}>
              New customer
            </Button>
          }
        />

        {variant === "contextual" ? (
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Stack gap={2}>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Summary
                </Text>
                <Text fw={600}>{totalCount} customer{totalCount === 1 ? "" : "s"}</Text>
              </Stack>
              <Text size="sm" c="dimmed">
                {hasSearch ? `Filtered by "${searchValue.trim()}"` : "Showing all customers"}
              </Text>
            </Group>
          </Paper>
        ) : null}

        <Paper withBorder radius="md" p="md">
          <TextInput
            label="Search"
            placeholder="Search customers"
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
          />
        </Paper>

        <Paper withBorder radius="md" p={0}>
          <Table.ScrollContainer minWidth={640}>
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Created</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {customers.map((customer) => (
                  <Table.Tr key={customer.id}>
                    <Table.Td>
                      <Text
                        renderRoot={(props) => (
                          <Link to="/customers/$customerId" params={{ customerId: customer.id }} {...props} />
                        )}
                        c="blue"
                        fw={500}
                      >
                        {customer.name}
                      </Text>
                    </Table.Td>
                    <Table.Td c="dimmed">{customer.phoneNumber ?? "—"}</Table.Td>
                    <Table.Td c="dimmed">
                      <ClientDate date={customer.createdAt} />
                    </Table.Td>
                  </Table.Tr>
                ))}
                {customers.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3} ta="center" c="dimmed" py="xl">
                      {hasSearch ? "No customers match your search." : "No customers yet. Create your first one."}
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Divider />
          <Group justify="space-between" p="md" align="center">
            <Text size="sm" c="dimmed">
              Page {Math.min(page, totalPages)} of {totalPages}
            </Text>
            <Pagination
              total={totalPages}
              value={Math.min(page, totalPages)}
              onChange={onPageChange}
            />
          </Group>
        </Paper>
      </Stack>

      <CustomerFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </Container>
  )
}
```

- [ ] **Step 2: Verify the shared component compiles cleanly**

Run: `vp check`
Expected: pass without new type or lint errors.

### Task 2: Refactor `/customers` to use the shared component

**Files:**
- Modify: `apps/web/src/routes/_authenticated/customers/index.tsx`

- [ ] **Step 1: Replace the in-file page composition with the shared component**

```tsx
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { CustomersPage, PAGE_SIZE, customersListQueryOptions, searchSchema } from "@/components/customers-page"

export const Route = createFileRoute("/_authenticated/customers/")({
  component: CustomersRoute,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(customersListQueryOptions(deps.page, deps.search))
  },
})

function CustomersRoute() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const { data } = useQuery(customersListQueryOptions(page, searchValue))

  return (
    <CustomersPage
      variant="informational"
      customers={data?.items ?? []}
      totalCount={data?.totalCount ?? 0}
      page={page}
      totalPages={Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE))}
      searchValue={searchValue}
      onSearchChange={(nextValue) => {
        navigate({ search: { page: 1, search: nextValue }, replace: true })
      }}
      onPageChange={(nextPage) => {
        navigate({ search: { page: nextPage, search: searchValue } })
      }}
    />
  )
}
```

- [ ] **Step 2: Remove now-unused local dialog, table, and section imports**

Run: `vp check`
Expected: `/customers` still renders and the route file is reduced to data loading plus composition.

### Task 3: Add the `/customers2` comparison route

**Files:**
- Create: `apps/web/src/routes/_authenticated/customers2.tsx`

- [ ] **Step 1: Add a second route that reuses the same loader and shared component**

```tsx
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { CustomersPage, PAGE_SIZE, customersListQueryOptions, searchSchema } from "@/components/customers-page"

export const Route = createFileRoute("/_authenticated/customers2")({
  component: Customers2Route,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(customersListQueryOptions(deps.page, deps.search))
  },
})

function Customers2Route() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const { data } = useQuery(customersListQueryOptions(page, searchValue))

  return (
    <CustomersPage
      variant="contextual"
      customers={data?.items ?? []}
      totalCount={data?.totalCount ?? 0}
      page={page}
      totalPages={Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE))}
      searchValue={searchValue}
      onSearchChange={(nextValue) => {
        navigate({ search: { page: 1, search: nextValue }, replace: true })
      }}
      onPageChange={(nextPage) => {
        navigate({ search: { page: nextPage, search: searchValue } })
      }}
    />
  )
}
```

- [ ] **Step 2: Confirm the new route is reachable through the generated route tree**

Run: `vp check`
Expected: route generation updates `apps/web/src/routeTree.gen.ts` if needed and the build still passes.

### Task 4: Verify the UI behavior

**Files:**
- Modify: any files touched above if verification reveals issues

- [ ] **Step 1: Run the full workspace checks**

Run: `vp check`
Expected: lint, typecheck, and formatting pass.

- [ ] **Step 2: Run the workspace test suite**

Run: `vp test`
Expected: existing tests still pass.

- [ ] **Step 3: Manually verify both routes in the browser**

Run the app, open `/customers` and `/customers2`, and confirm:
- the informational version stays visually lighter,
- the contextual version shows the extra summary strip,
- search resets to page 1,
- pagination still works,
- the empty state and detail links still behave correctly.

### Task 5: Commit on the feature branch

**Files:**
- All modified files above

- [ ] **Step 1: Review the final diff**

Run: `git diff --stat && git diff -- apps/web/src/components/customers-page.tsx apps/web/src/routes/_authenticated/customers/index.tsx apps/web/src/routes/_authenticated/customers2.tsx`

- [ ] **Step 2: Commit the implementation**

```bash
git add apps/web/src/components/customers-page.tsx apps/web/src/routes/_authenticated/customers/index.tsx apps/web/src/routes/_authenticated/customers2.tsx docs/superpowers/plans/2026-07-07-customers-page-variants.md
git commit -m "feat: redesign customer list pages"
```
