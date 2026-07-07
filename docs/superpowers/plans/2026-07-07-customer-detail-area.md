# Customer Detail Area Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the customer detail area into a snapshot-first workspace and remove the temporary `/customers2` comparison route.

**Architecture:** Keep the customer detail routes split by concern, but move the repeated page-shell framing into a small shared helper so the overview and tab panels share the same hierarchy. The overview route owns the customer snapshot and quick actions; the tab routes keep their data and mutations but align on the same workspace bands and control placement.

**Tech Stack:** TypeScript, Mantine, TanStack Router, TanStack Query, existing `trpc` client, existing customer/appointment/note/hair-sale components.

---

### Task 1: Add a shared customer detail frame

**Files:**
- Create: `apps/web/src/components/customer-detail-frame.tsx`

- [ ] **Step 1: Implement the shared frame component**

```tsx
import type { ReactNode } from "react"

import { ActionIcon, Anchor, Box, Button, Card, Container, Group, SimpleGrid, Stack, Tabs, Text, Title } from "@mantine/core"
import { Link } from "@tanstack/react-router"

export function CustomerDetailFrame({
  customerName,
  customerPhone,
  joinedLabel,
  summaryCards,
  quickActions,
  activeTab,
  onTabChange,
  children,
}: {
  customerName: string
  customerPhone?: ReactNode
  joinedLabel: ReactNode
  summaryCards: ReactNode
  quickActions: ReactNode
  activeTab: string
  onTabChange: (value: string | null) => void
  children: ReactNode
}) {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <Anchor component={Link} to="/customers" size="xs" c="dimmed" display="inline-block">
          Back to customers
        </Anchor>

        <Card withBorder padding="lg">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Box miw={0}>
                <Title order={2} fw={700} lh={1.1}>
                  {customerName}
                </Title>
                <Text size="sm" c="dimmed" mt={4}>
                  {customerPhone ?? "No phone number"}
                </Text>
                <Text size="sm" c="dimmed" mt={2}>
                  Joined {joinedLabel}
                </Text>
              </Box>
              {quickActions}
            </Group>

            {summaryCards}

            <Tabs value={activeTab} onChange={onTabChange}>
              <Tabs.List>
                <Tabs.Tab value="appointments">Appointments</Tabs.Tab>
                <Tabs.Tab value="notes">Notes</Tabs.Tab>
                <Tabs.Tab value="hair-sales">Hair sales</Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Stack>
        </Card>

        {children}
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 2: Run formatting/type checks on the new helper**

Run: `vp check`
Expected: pass or report only issues in the new file.

### Task 2: Refactor the customer detail overview route

**Files:**
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId/route.tsx`

- [ ] **Step 1: Replace the current shell with the shared frame**

```tsx
import { Button, Card, SimpleGrid, Stack, Text, Title } from "@mantine/core"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router"

import { CustomerDetailFrame } from "@/components/customer-detail-frame"
import { ClientDate } from "@/components/client-date"
import { CURRENCIES, formatMinor } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

function CustomerDetailRoute() {
  const { customerId } = Route.useParams()
  const navigate = Route.useNavigate()
  const location = useLocation()
  const { data: customer } = useQuery(trpc.customers.get.queryOptions({ id: customerId }))
  const { data: summary } = useQuery(trpc.customers.summary.queryOptions({ id: customerId }))

  const activeTab = location.pathname.endsWith("/notes")
    ? "notes"
    : location.pathname.endsWith("/hair-sales")
      ? "hair-sales"
      : "appointments"

  if (!customer || !summary) return <CustomerNotFound />

  return (
    <CustomerDetailFrame
      customerName={customer.name}
      customerPhone={customer.phoneNumber}
      joinedLabel={<ClientDate date={summary.customerCreatedAt} />}
      summaryCards={<SummaryGrid summary={summary} />}
      quickActions={<Button variant="default" leftSection={<IconPencil size={14} />} onClick={() => setEditOpen(true)}>Edit</Button>}
      activeTab={activeTab}
      onTabChange={(value) => {
        if (!value || value === activeTab) return
        navigate({ to: `/customers/$customerId/${value}`, params: { customerId } })
      }}
    >
      <Outlet />
      <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
    </CustomerDetailFrame>
  )
}
```

- [ ] **Step 2: Update the summary cards and edit dialog to fit the snapshot-first layout**

Run: `vp check`
Expected: overview route still loads customer and summary data, and tabs still switch correctly.

### Task 3: Normalize the tab panels to the new hierarchy

**Files:**
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId/appointments.tsx`
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId/notes.tsx`
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId/hair-sales.tsx`

- [ ] **Step 1: Reframe each tab panel to sit below the shared snapshot frame**

```tsx
import { Section } from "@/components/section"

return (
  <Section title="Appointments" description="Appointment history for this customer." padding={hasItemsOnCurrentPage ? 0 : "lg"}>
    ...
  </Section>
)
```

```tsx
return (
  <Section title="Notes" description="Customer notes and internal reminders." padding={hasItemsOnCurrentPage ? 0 : "lg"}>
    ...
  </Section>
)
```

```tsx
return (
  <Section title="Hair sales" description="Hair sales tied to this customer." padding={hasItemsOnCurrentPage ? 0 : "lg"}>
    ...
  </Section>
)
```

- [ ] **Step 2: Keep each tab's existing search, add, edit, delete, and pagination behavior intact**

Run: `vp check`
Expected: no regressions in tab routing, loaders, or mutations.

### Task 4: Delete the temporary `/customers2` route and refresh route artifacts

**Files:**
- Delete: `apps/web/src/routes/_authenticated/customers2.tsx`
- Modify: `apps/web/src/routeTree.gen.ts`

- [ ] **Step 1: Remove the temporary comparison route**

```bash
rm apps/web/src/routes/_authenticated/customers2.tsx
```

- [ ] **Step 2: Regenerate the route tree and confirm `/customers2` disappears**

Run: `vp build` from `apps/web`
Expected: the generated route tree no longer includes `/customers2`.

- [ ] **Step 3: Keep `customers-page.tsx` in place for the list page**

Run: `rg -n "customers-page" apps/web/src`
Expected: only the customers list route imports it.

### Task 5: Regenerate and verify route artifacts

**Files:**
- Modify: `apps/web/src/routeTree.gen.ts`

- [ ] **Step 1: Regenerate the route tree by building the web app**

Run: `vp build` from `apps/web`
Expected: build succeeds and `routeTree.gen.ts` drops `/customers2`.

- [ ] **Step 2: Verify the generated route tree no longer references the deleted route**

Run: `rg -n "customers2|/_authenticated/customers2" apps/web/src/routeTree.gen.ts`
Expected: no matches.

### Task 6: Verify and commit

**Files:**
- All files touched above

- [ ] **Step 1: Run workspace checks**

Run: `vp check`
Expected: formatting and lint pass.

- [ ] **Step 2: Run the workspace test suite**

Run: `vp test`
Expected: existing baseline failures remain baseline-only; no new failures are introduced by the customer detail changes.

- [ ] **Step 3: Commit on the feature branch**

```bash
git add apps/web/src/components/customer-detail-frame.tsx apps/web/src/routes/_authenticated/customers/$customerId/route.tsx apps/web/src/routes/_authenticated/customers/$customerId/appointments.tsx apps/web/src/routes/_authenticated/customers/$customerId/notes.tsx apps/web/src/routes/_authenticated/customers/$customerId/hair-sales.tsx apps/web/src/routeTree.gen.ts docs/superpowers/plans/2026-07-07-customer-detail-area.md
git rm apps/web/src/routes/_authenticated/customers2.tsx
git commit -m "feat: redesign customer detail area"
```
