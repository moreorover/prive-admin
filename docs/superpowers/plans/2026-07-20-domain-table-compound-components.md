# Domain Table Compound Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the reusable domain table components to compound component APIs so routes declare visible columns directly.

**Architecture:** Each domain table root owns empty-state rendering, Mantine table structure, row iteration, and row context. Each static column component contributes one header cell and one body cell for the current row. Route call sites compose columns explicitly instead of passing boolean column props or table-level action callbacks.

**Tech Stack:** React 19, TypeScript, Mantine 9, TanStack Router, Vite+, Vitest through `vite-plus/test`.

## Global Constraints

- Do not commit to `main`; switch to a feature branch or isolated worktree before any commit.
- Do not introduce a generic `ResourceTable` abstraction in this stage.
- Do not refactor route workflows, dialogs, or page layout primitives in this stage.
- Do not change data fetching, pagination behavior, permissions, or mutation behavior.
- Do not redesign the table UI.
- Preserve current empty-state copy, link targets, amount/date formatting, action labels, icons, callbacks, and Mantine table layout.
- Defer `HairOrdersTable`; it has loading skeleton behavior but no optional domain columns/actions, so it does not justify this compound API in this stage.
- Run `vp check` and `vp test` before completion.

---

## File Structure

- Modify `apps/web/src/components/hair-assigned/hair-assigned-table.tsx`
  - Owns `HairAssignedTable` root and static columns: `Client`, `Source`, `HairOrder`, `Weight`, `SoldFor`, `Profit`, `PricePerGram`, `Actions`.
- Modify `apps/web/src/components/hair-assigned/hair-assigned-table.test.ts`
  - Keeps existing source-label tests and adds pure column-definition tests for the compound table.
- Modify `apps/web/src/routes/_authenticated/hair-orders/$hairOrderId.tsx`
  - Migrates the hair order detail table call site.
- Modify `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`
  - Migrates the appointment detail hair assigned table call site.
- Modify `apps/web/src/routes/_authenticated/customers/$customerId/hair-sales.tsx`
  - Migrates the customer hair sales table call site.
- Modify `apps/web/src/components/transactions/transactions-table.tsx`
  - Owns `TransactionsTable` root and static columns: `Customer`, `Name`, `Amount`, `Actions`.
- Create `apps/web/src/components/transactions/transactions-table.test.ts`
  - Adds pure column-definition tests for `TransactionsTable`.
- Modify `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`
  - Migrates the appointment detail transactions table call site.
- Modify `apps/web/src/components/cash-transactions/cash-transactions-table.tsx`
  - Owns `CashTransactionsTable` root and static columns: `Date`, `Customer`, `Description`, `Amount`, `CreatedBy`, `Actions`.
- Create `apps/web/src/components/cash-transactions/cash-transactions-table.test.ts`
  - Adds pure column-definition tests for `CashTransactionsTable`.
- Modify `apps/web/src/routes/_authenticated/cash.tsx`
  - Migrates the cash transactions table call site.

---

### Task 0: Branch Safety Preflight

**Files:**
- Read: git branch state
- Modify: none
- Test: none

**Interfaces:**
- Consumes: user constraint "do not commit to main"
- Produces: a non-`main` branch for implementation commits

- [ ] **Step 1: Confirm current branch**

Run:

```bash
git branch --show-current
git status --short
```

Expected:

```text
main
?? docs/superpowers/specs/2026-07-20-domain-table-compound-components-design.md
?? docs/superpowers/plans/2026-07-20-domain-table-compound-components.md
```

- [ ] **Step 2: Create the feature branch before code changes**

Run:

```bash
git switch -c feat/domain-table-compound-components
```

Expected:

```text
Switched to a new branch 'feat/domain-table-compound-components'
```

- [ ] **Step 3: Verify branch safety**

Run:

```bash
git branch --show-current
```

Expected:

```text
feat/domain-table-compound-components
```

---

### Task 1: Refactor HairAssignedTable To Compound Columns

**Files:**
- Modify: `apps/web/src/components/hair-assigned/hair-assigned-table.tsx`
- Modify: `apps/web/src/components/hair-assigned/hair-assigned-table.test.ts`

**Interfaces:**
- Consumes: `HairAssignedRow`, `getHairAssignedSource`
- Produces:
  - `export const HairAssignedTable`
  - `HairAssignedTable.Client`
  - `HairAssignedTable.Source`
  - `HairAssignedTable.HairOrder`
  - `HairAssignedTable.Weight`
  - `HairAssignedTable.SoldFor`
  - `HairAssignedTable.Profit`
  - `HairAssignedTable.PricePerGram`
  - `HairAssignedTable.Actions`
  - `export function getHairAssignedTableColumnLabels(children: React.ReactNode): string[]`

- [ ] **Step 1: Add failing pure tests for column composition**

Append these tests to `apps/web/src/components/hair-assigned/hair-assigned-table.test.ts`:

```ts
import { HairAssignedTable, getHairAssignedTableColumnLabels } from "./hair-assigned-table"

describe("hair assigned table compound columns", () => {
  it("reports declared column labels in child order", () => {
    expect(
      getHairAssignedTableColumnLabels([
        <HairAssignedTable.Client key="client" />,
        <HairAssignedTable.Source key="source" />,
        <HairAssignedTable.HairOrder key="hair-order" />,
        <HairAssignedTable.Actions key="actions" onEdit={() => {}} onDelete={() => {}} />,
      ]),
    ).toEqual(["Client", "Source", "Hair Order", ""])
  })

  it("omits columns that are not declared", () => {
    expect(
      getHairAssignedTableColumnLabels([
        <HairAssignedTable.Client key="client" />,
        <HairAssignedTable.Weight key="weight" />,
        <HairAssignedTable.Actions key="actions" onEdit={() => {}} onDelete={() => {}} />,
      ]),
    ).toEqual(["Client", "Weight", ""])
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
vp test apps/web/src/components/hair-assigned/hair-assigned-table.test.ts
```

Expected: FAIL because `getHairAssignedTableColumnLabels` and static table column members do not exist.

- [ ] **Step 3: Replace the table with a compound implementation**

Replace `apps/web/src/components/hair-assigned/hair-assigned-table.tsx` with this implementation:

```tsx
import type { ReactElement, ReactNode } from "react"
import { Children, createContext, isValidElement, useContext } from "react"

import { ActionIcon, Badge, Group, Table, Text } from "@mantine/core"
import { IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

import { getHairAssignedSource } from "./hair-assigned-source"

export type HairAssignedRow = {
  id: string
  appointmentId?: string | null
  weightInGrams: number
  soldFor: number
  profit: number
  pricePerGram: number
  client?: { id: string; name: string } | null
  hairOrder?: { id: string; uid: number } | null
}

type HairAssignedColumnComponent = ((props: never) => ReactElement | null) & {
  columnLabel: string
  Header: () => ReactElement
  Cell: () => ReactElement
}

type HairAssignedActionsProps = {
  onEdit: (item: HairAssignedRow) => void
  onDelete: (item: HairAssignedRow) => void
}

type HairAssignedActionsComponent = ((props: HairAssignedActionsProps) => ReactElement | null) & {
  columnLabel: string
  Header: () => ReactElement
  Cell: (props: HairAssignedActionsProps) => ReactElement
}

type HairAssignedColumnElement =
  | ReactElement<never, HairAssignedColumnComponent>
  | ReactElement<HairAssignedActionsProps, HairAssignedActionsComponent>

type HairAssignedTableRootProps = {
  items: HairAssignedRow[]
  children: ReactNode
}

type HairAssignedTableComponent = ((props: HairAssignedTableRootProps) => ReactElement) & {
  Client: HairAssignedColumnComponent
  Source: HairAssignedColumnComponent
  HairOrder: HairAssignedColumnComponent
  Weight: HairAssignedColumnComponent
  SoldFor: HairAssignedColumnComponent
  Profit: HairAssignedColumnComponent
  PricePerGram: HairAssignedColumnComponent
  Actions: HairAssignedActionsComponent
}

const HairAssignedRowContext = createContext<HairAssignedRow | null>(null)

const formatCents = (cents: number) => `€${(cents / 100).toFixed(2)}`

function useHairAssignedRow() {
  const row = useContext(HairAssignedRowContext)
  if (!row) throw new Error("HairAssignedTable column must be rendered inside HairAssignedTable")
  return row
}

function getHairAssignedColumns(children: ReactNode) {
  return Children.toArray(children).filter(isValidHairAssignedColumn)
}

function isValidHairAssignedColumn(child: ReactNode): child is HairAssignedColumnElement {
  return isValidElement(child) && typeof child.type !== "string" && "Header" in child.type && "Cell" in child.type
}

export function getHairAssignedTableColumnLabels(children: ReactNode) {
  return getHairAssignedColumns(children).map((child) => child.type.columnLabel)
}

function createColumn(label: string, Cell: () => ReactElement): HairAssignedColumnComponent {
  const Column = (() => null) as HairAssignedColumnComponent
  Column.columnLabel = label
  Column.Header = () => <Table.Th>{label}</Table.Th>
  Column.Cell = Cell
  return Column
}

function createActionsColumn(): HairAssignedActionsComponent {
  const Column = (() => null) as HairAssignedActionsComponent
  Column.columnLabel = ""
  Column.Header = () => <Table.Th />
  Column.Cell = ({ onEdit, onDelete }) => {
    const row = useHairAssignedRow()
    return (
      <Table.Td>
        <Group gap={4}>
          <ActionIcon variant="subtle" size="sm" onClick={() => onEdit(row)} aria-label="Edit">
            <IconPencil size={14} />
          </ActionIcon>
          <ActionIcon variant="subtle" size="sm" color="red" onClick={() => onDelete(row)} aria-label="Delete">
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Table.Td>
    )
  }
  return Column
}

function HairAssignedTableRoot({ items, children }: HairAssignedTableRootProps) {
  const columns = getHairAssignedColumns(children)

  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No hair assigned yet.
      </Text>
    )
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          {columns.map((column, index) => (
            <column.type.Header key={index} />
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((row) => {
          const needsAttention = row.weightInGrams === 0 || row.soldFor === 0
          return (
            <HairAssignedRowContext value={row} key={row.id}>
              <Table.Tr bg={needsAttention ? "var(--mantine-color-red-0)" : undefined}>
                {columns.map((column, index) => (
                  <column.type.Cell key={index} {...column.props} />
                ))}
              </Table.Tr>
            </HairAssignedRowContext>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}

const Client = createColumn("Client", () => {
  const row = useHairAssignedRow()
  return (
    <Table.Td>
      {row.client ? (
        <Text
          renderRoot={(props) => <Link to="/customers/$customerId" params={{ customerId: row.client!.id }} {...props} />}
          c="blue"
        >
          {row.client.name}
        </Text>
      ) : (
        "—"
      )}
    </Table.Td>
  )
})

const Source = createColumn("Source", () => {
  const row = useHairAssignedRow()
  const source = getHairAssignedSource(row)
  return (
    <Table.Td>
      <Badge variant="light" color={source.color}>
        {source.label}
      </Badge>
    </Table.Td>
  )
})

const HairOrder = createColumn("Hair Order", () => {
  const row = useHairAssignedRow()
  return (
    <Table.Td>
      {row.hairOrder ? (
        <Text
          renderRoot={(props) => (
            <Link to="/hair-orders/$hairOrderId" params={{ hairOrderId: row.hairOrder!.id }} {...props} />
          )}
          c="blue"
        >
          #{row.hairOrder.uid}
        </Text>
      ) : (
        "—"
      )}
    </Table.Td>
  )
})

const Weight = createColumn("Weight", () => {
  const row = useHairAssignedRow()
  return <Table.Td>{row.weightInGrams}g</Table.Td>
})

const SoldFor = createColumn("Sold For", () => {
  const row = useHairAssignedRow()
  return <Table.Td>{formatCents(row.soldFor)}</Table.Td>
})

const Profit = createColumn("Profit", () => {
  const row = useHairAssignedRow()
  return <Table.Td>{formatCents(row.profit)}</Table.Td>
})

const PricePerGram = createColumn("€/g", () => {
  const row = useHairAssignedRow()
  return <Table.Td>{formatCents(row.pricePerGram)}</Table.Td>
})

export const HairAssignedTable = Object.assign(HairAssignedTableRoot, {
  Client,
  Source,
  HairOrder,
  Weight,
  SoldFor,
  Profit,
  PricePerGram,
  Actions: createActionsColumn(),
}) satisfies HairAssignedTableComponent
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
vp test apps/web/src/components/hair-assigned/hair-assigned-table.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run type checking for the web app**

Run:

```bash
vp run --filter web check-types
```

Expected: FAIL because route call sites still pass removed props.

---

### Task 2: Migrate HairAssignedTable Call Sites

**Files:**
- Modify: `apps/web/src/routes/_authenticated/hair-orders/$hairOrderId.tsx`
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId/hair-sales.tsx`

**Interfaces:**
- Consumes: `HairAssignedTable` static column API from Task 1
- Produces: all existing hair-assigned table call sites use compound children

- [ ] **Step 1: Update hair order detail call site**

In `apps/web/src/routes/_authenticated/hair-orders/$hairOrderId.tsx`, replace:

```tsx
<HairAssignedTable items={hairOrder.hairAssigned ?? []} onEdit={setEditItem} onDelete={setDeleteItem} />
```

with:

```tsx
<HairAssignedTable items={hairOrder.hairAssigned ?? []}>
  <HairAssignedTable.Client />
  <HairAssignedTable.Weight />
  <HairAssignedTable.SoldFor />
  <HairAssignedTable.Profit />
  <HairAssignedTable.PricePerGram />
  <HairAssignedTable.Actions onEdit={setEditItem} onDelete={setDeleteItem} />
</HairAssignedTable>
```

- [ ] **Step 2: Update appointment detail call site**

In `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`, replace:

```tsx
<HairAssignedTable items={hairAssigned} showHairOrderColumn onEdit={setEditItem} onDelete={setDeleteItem} />
```

with:

```tsx
<HairAssignedTable items={hairAssigned}>
  <HairAssignedTable.Client />
  <HairAssignedTable.HairOrder />
  <HairAssignedTable.Weight />
  <HairAssignedTable.SoldFor />
  <HairAssignedTable.Profit />
  <HairAssignedTable.PricePerGram />
  <HairAssignedTable.Actions onEdit={setEditItem} onDelete={setDeleteItem} />
</HairAssignedTable>
```

- [ ] **Step 3: Update customer hair sales call site**

In `apps/web/src/routes/_authenticated/customers/$customerId/hair-sales.tsx`, replace:

```tsx
<HairAssignedTable
  items={hairAssigned}
  showSourceColumn
  showHairOrderColumn
  onEdit={setHairEditItem}
  onDelete={setHairDeleteItem}
/>
```

with:

```tsx
<HairAssignedTable items={hairAssigned}>
  <HairAssignedTable.Client />
  <HairAssignedTable.Source />
  <HairAssignedTable.HairOrder />
  <HairAssignedTable.Weight />
  <HairAssignedTable.SoldFor />
  <HairAssignedTable.Profit />
  <HairAssignedTable.PricePerGram />
  <HairAssignedTable.Actions onEdit={setHairEditItem} onDelete={setHairDeleteItem} />
</HairAssignedTable>
```

- [ ] **Step 4: Run type checking**

Run:

```bash
vp run --filter web check-types
```

Expected: PASS for the migrated hair-assigned API or a focused TypeScript error that must be fixed in `hair-assigned-table.tsx`.

- [ ] **Step 5: Run focused tests**

Run:

```bash
vp test apps/web/src/components/hair-assigned/hair-assigned-table.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the hair-assigned migration**

Run only when `git branch --show-current` is not `main`:

```bash
git add apps/web/src/components/hair-assigned/hair-assigned-table.tsx apps/web/src/components/hair-assigned/hair-assigned-table.test.ts 'apps/web/src/routes/_authenticated/hair-orders/$hairOrderId.tsx' 'apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx' 'apps/web/src/routes/_authenticated/customers/$customerId/hair-sales.tsx'
git commit -m "refactor: compose hair assigned table columns"
```

Expected: commit created on the feature branch.

---

### Task 3: Refactor TransactionsTable To Compound Columns

**Files:**
- Modify: `apps/web/src/components/transactions/transactions-table.tsx`
- Create: `apps/web/src/components/transactions/transactions-table.test.ts`
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`

**Interfaces:**
- Consumes: `TransactionRow`, `formatMinor`
- Produces:
  - `export const TransactionsTable`
  - `TransactionsTable.Customer`
  - `TransactionsTable.Name`
  - `TransactionsTable.Amount`
  - `TransactionsTable.Actions`
  - `export function getTransactionsTableColumnLabels(children: React.ReactNode): string[]`

- [ ] **Step 1: Add failing pure tests**

Create `apps/web/src/components/transactions/transactions-table.test.ts`:

```ts
import { describe, expect, it } from "vite-plus/test"

import { TransactionsTable, getTransactionsTableColumnLabels } from "./transactions-table"

describe("transactions table compound columns", () => {
  it("reports declared column labels in child order", () => {
    expect(
      getTransactionsTableColumnLabels([
        <TransactionsTable.Customer key="customer" />,
        <TransactionsTable.Name key="name" />,
        <TransactionsTable.Amount key="amount" />,
        <TransactionsTable.Actions key="actions" onEdit={() => {}} onDelete={() => {}} />,
      ]),
    ).toEqual(["Customer", "Name", "Amount", ""])
  })

  it("supports omitting customer when a route wants a narrower table", () => {
    expect(
      getTransactionsTableColumnLabels([
        <TransactionsTable.Name key="name" />,
        <TransactionsTable.Amount key="amount" />,
      ]),
    ).toEqual(["Name", "Amount"])
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
vp test apps/web/src/components/transactions/transactions-table.test.ts
```

Expected: FAIL because the compound API and label helper do not exist.

- [ ] **Step 3: Replace the table with a compound implementation**

Implement the same context pattern as `HairAssignedTable` in `apps/web/src/components/transactions/transactions-table.tsx`.

Use these exact exported types and helpers:

```tsx
export type TransactionRow = {
  id: string
  name: string | null
  notes: string | null
  amount: number
  currency: Currency
  customerId: string | null
  appointmentId: string | null
  customer?: { id: string; name: string } | null
}

export function getTransactionsTableColumnLabels(children: ReactNode) {
  return getTransactionColumns(children).map((child) => child.type.columnLabel)
}
```

Use these static columns:

```tsx
const Customer = createColumn("Customer", () => {
  const row = useTransactionRow()
  return (
    <Table.Td>
      {row.customer ? (
        <Text
          renderRoot={(props) => <Link to="/customers/$customerId" params={{ customerId: row.customer!.id }} {...props} />}
          c="blue"
        >
          {row.customer.name}
        </Text>
      ) : (
        "—"
      )}
    </Table.Td>
  )
})

const Name = createColumn("Name", () => {
  const row = useTransactionRow()
  return <Table.Td>{row.name ?? <Text c="dimmed">—</Text>}</Table.Td>
})

const Amount = createColumn("Amount", () => {
  const row = useTransactionRow()
  return <Table.Td>{formatMinor(row.amount, row.currency)}</Table.Td>
})
```

Use this action column body:

```tsx
<Table.Td>
  <Menu shadow="md" width={140} position="bottom-end">
    <Menu.Target>
      <ActionIcon variant="subtle" size="sm" aria-label="Actions">
        <IconDots size={14} />
      </ActionIcon>
    </Menu.Target>
    <Menu.Dropdown>
      <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => onEdit(row)}>
        Update
      </Menu.Item>
      <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => onDelete(row)}>
        Delete
      </Menu.Item>
    </Menu.Dropdown>
  </Menu>
</Table.Td>
```

Keep the empty state:

```tsx
<Text size="sm" c="dimmed">
  No transactions.
</Text>
```

- [ ] **Step 4: Migrate the appointment transaction call site**

In `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`, replace:

```tsx
return <TransactionsTable items={txRows} onEdit={setEditTx} onDelete={setDeleteTx} />
```

with:

```tsx
return (
  <TransactionsTable items={txRows}>
    <TransactionsTable.Customer />
    <TransactionsTable.Name />
    <TransactionsTable.Amount />
    <TransactionsTable.Actions onEdit={setEditTx} onDelete={setDeleteTx} />
  </TransactionsTable>
)
```

- [ ] **Step 5: Run focused tests and type checking**

Run:

```bash
vp test apps/web/src/components/transactions/transactions-table.test.ts
vp run --filter web check-types
```

Expected: both commands PASS.

- [ ] **Step 6: Commit the transactions migration**

Run only when `git branch --show-current` is not `main`:

```bash
git add apps/web/src/components/transactions/transactions-table.tsx apps/web/src/components/transactions/transactions-table.test.ts 'apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx'
git commit -m "refactor: compose transaction table columns"
```

Expected: commit created on the feature branch.

---

### Task 4: Refactor CashTransactionsTable To Compound Columns

**Files:**
- Modify: `apps/web/src/components/cash-transactions/cash-transactions-table.tsx`
- Create: `apps/web/src/components/cash-transactions/cash-transactions-table.test.ts`
- Modify: `apps/web/src/routes/_authenticated/cash.tsx`

**Interfaces:**
- Consumes: `CashTransactionRow`, `coerceCashTransactionCurrency`, `formatMinor`, `dayjs`
- Produces:
  - `export const CashTransactionsTable`
  - `CashTransactionsTable.Date`
  - `CashTransactionsTable.Customer`
  - `CashTransactionsTable.Description`
  - `CashTransactionsTable.Amount`
  - `CashTransactionsTable.CreatedBy`
  - `CashTransactionsTable.Actions`
  - `export function getCashTransactionsTableColumnLabels(children: React.ReactNode): string[]`

- [ ] **Step 1: Add failing pure tests**

Create `apps/web/src/components/cash-transactions/cash-transactions-table.test.ts`:

```ts
import { describe, expect, it } from "vite-plus/test"

import { CashTransactionsTable, getCashTransactionsTableColumnLabels } from "./cash-transactions-table"

describe("cash transactions table compound columns", () => {
  it("reports declared column labels in child order", () => {
    expect(
      getCashTransactionsTableColumnLabels([
        <CashTransactionsTable.Date key="date" />,
        <CashTransactionsTable.Customer key="customer" />,
        <CashTransactionsTable.Description key="description" />,
        <CashTransactionsTable.Amount key="amount" />,
        <CashTransactionsTable.CreatedBy key="created-by" />,
        <CashTransactionsTable.Actions key="actions" onEdit={() => {}} onDelete={() => {}} />,
      ]),
    ).toEqual(["Date", "Customer", "Description", "Amount", "Created by", "Actions"])
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
vp test apps/web/src/components/cash-transactions/cash-transactions-table.test.ts
```

Expected: FAIL because the compound API and label helper do not exist.

- [ ] **Step 3: Replace the table with a compound implementation**

Implement the same context pattern as `HairAssignedTable` in `apps/web/src/components/cash-transactions/cash-transactions-table.tsx`.

Use these exact exported types and helpers:

```tsx
export type CashTransactionRow = {
  id: string
  amount: number
  currency: string
  createdAt: string
  description: string | null
  notes: string | null
  customerId: string
  createdById: string
  customer: { id: string; name: string }
  createdBy: { id: string; name: string }
}

export function getCashTransactionsTableColumnLabels(children: ReactNode) {
  return getCashTransactionColumns(children).map((child) => child.type.columnLabel)
}
```

Use these static columns:

```tsx
const Date = createColumn("Date", () => {
  const row = useCashTransactionRow()
  return <Table.Td>{dayjs(row.createdAt).format("YYYY-MM-DD")}</Table.Td>
})

const Customer = createColumn("Customer", () => {
  const row = useCashTransactionRow()
  return (
    <Table.Td>
      <Text
        renderRoot={(props) => <Link to="/customers/$customerId" params={{ customerId: row.customer.id }} {...props} />}
        c="blue"
      >
        {row.customer.name}
      </Text>
    </Table.Td>
  )
})

const Description = createColumn("Description", () => {
  const row = useCashTransactionRow()
  return <Table.Td>{row.description ?? <Text c="dimmed">—</Text>}</Table.Td>
})

const Amount = createColumn("Amount", () => {
  const row = useCashTransactionRow()
  return <Table.Td ta="right">{formatMinor(row.amount, coerceCashTransactionCurrency(row.currency))}</Table.Td>
})

const CreatedBy = createColumn("Created by", () => {
  const row = useCashTransactionRow()
  return <Table.Td>{row.createdBy.name}</Table.Td>
})
```

For the amount header, override the header cell to preserve right alignment:

```tsx
Amount.Header = () => <Table.Th ta="right">Amount</Table.Th>
```

Use this action column body and label:

```tsx
Column.columnLabel = "Actions"
Column.Header = () => <Table.Th>Actions</Table.Th>
Column.Cell = ({ onEdit, onDelete }) => {
  const row = useCashTransactionRow()
  return (
    <Table.Td>
      <Menu shadow="md" width={140} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" size="sm" aria-label="Actions">
            <IconDots size={14} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => onEdit(row)}>
            Update
          </Menu.Item>
          <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => onDelete(row)}>
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Table.Td>
  )
}
```

Keep the empty state:

```tsx
<Text size="sm" c="dimmed">
  No cash transactions.
</Text>
```

- [ ] **Step 4: Migrate the cash route call site**

In `apps/web/src/routes/_authenticated/cash.tsx`, replace:

```tsx
<CashTransactionsTable items={result?.items ?? []} onEdit={setEditing} onDelete={setDeleting} />
```

with:

```tsx
<CashTransactionsTable items={result?.items ?? []}>
  <CashTransactionsTable.Date />
  <CashTransactionsTable.Customer />
  <CashTransactionsTable.Description />
  <CashTransactionsTable.Amount />
  <CashTransactionsTable.CreatedBy />
  <CashTransactionsTable.Actions onEdit={setEditing} onDelete={setDeleting} />
</CashTransactionsTable>
```

- [ ] **Step 5: Run focused tests and type checking**

Run:

```bash
vp test apps/web/src/components/cash-transactions/cash-transactions-table.test.ts
vp run --filter web check-types
```

Expected: both commands PASS.

- [ ] **Step 6: Commit the cash transactions migration**

Run only when `git branch --show-current` is not `main`:

```bash
git add apps/web/src/components/cash-transactions/cash-transactions-table.tsx apps/web/src/components/cash-transactions/cash-transactions-table.test.ts apps/web/src/routes/_authenticated/cash.tsx
git commit -m "refactor: compose cash transaction table columns"
```

Expected: commit created on the feature branch.

---

### Task 5: Final Validation And Documentation Check

**Files:**
- Read: `docs/superpowers/specs/2026-07-20-domain-table-compound-components-design.md`
- Read: `docs/superpowers/plans/2026-07-20-domain-table-compound-components.md`
- Modify: only files with validation-driven fixes

**Interfaces:**
- Consumes: all migrated table APIs from Tasks 1-4
- Produces: verified implementation with no `HairAssignedTable` boolean column props and no table-level transaction action props

- [ ] **Step 1: Search for removed APIs**

Run:

```bash
rg "showSourceColumn|showHairOrderColumn|<TransactionsTable[^>]*onEdit|<CashTransactionsTable[^>]*onEdit|<HairAssignedTable[^>]*onEdit" apps/web/src
```

Expected: no output.

- [ ] **Step 2: Run full project validation**

Run:

```bash
vp check
vp test
```

Expected: both commands PASS.

- [ ] **Step 3: Inspect changed files**

Run:

```bash
git diff --stat
git diff -- docs/superpowers/specs/2026-07-20-domain-table-compound-components-design.md docs/superpowers/plans/2026-07-20-domain-table-compound-components.md
```

Expected: implementation changes are limited to the planned table, route, test, spec, and plan files. The spec and plan should not contain accidental implementation edits.

- [ ] **Step 4: Commit planning docs if they are still uncommitted**

Run only when `git branch --show-current` is not `main`:

```bash
git add docs/superpowers/specs/2026-07-20-domain-table-compound-components-design.md docs/superpowers/plans/2026-07-20-domain-table-compound-components.md
git commit -m "docs: plan domain table compound components"
```

Expected: commit created on the feature branch if the docs were not included in an earlier commit.

