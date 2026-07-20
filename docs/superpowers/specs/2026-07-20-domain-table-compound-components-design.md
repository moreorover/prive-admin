# Domain Table Compound Components Design

## Context

The web app has several reusable domain table components under `apps/web/src/components`. These tables currently own both the row iteration and the visible column decisions. The clearest example is `HairAssignedTable`, which uses `showSourceColumn` and `showHairOrderColumn` boolean props to vary the table by route.

The goal is to apply the compound component approach from https://jjenzz.com/compound-components/ to domain tables first. Call sites should declare the table parts they need, while the table root keeps shared behavior such as empty states, row iteration, row context, and common formatting.

## Goals

- Replace domain table boolean/config-style APIs with declarative compound column APIs.
- Keep current visual output and behavior.
- Establish a reusable local pattern for future route and workflow refactors.
- Avoid creating a generic table framework before there is a demonstrated need.

## Non-Goals

- Do not introduce a generic `ResourceTable` abstraction in this stage.
- Do not refactor route workflows, dialogs, or page layout primitives in this stage.
- Do not change data fetching, pagination behavior, permissions, or mutation behavior.
- Do not redesign the table UI.

## Stage 1 Scope

Refactor these reusable domain tables:

- `HairAssignedTable`
- `TransactionsTable`
- `CashTransactionsTable`

Evaluate `HairOrdersTable` during implementation planning. Include it in this stage only if it has the same domain-table composition pressure and can be migrated without broadening the design.

Route-local tables in large route files, such as documents and bank statement entries, remain out of scope for this stage. They are stronger candidates for a later route-workflow refactor because their table rendering is tightly coupled to local query and mutation state.

## Target API

`HairAssignedTable` should move from boolean-controlled columns:

```tsx
<HairAssignedTable
  items={hairAssigned}
  showSourceColumn
  showHairOrderColumn
  onEdit={setHairEditItem}
  onDelete={setHairDeleteItem}
/>
```

to explicit composition:

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

`TransactionsTable` should follow the same pattern:

```tsx
<TransactionsTable items={txRows}>
  <TransactionsTable.Customer />
  <TransactionsTable.Name />
  <TransactionsTable.Amount />
  <TransactionsTable.Actions onEdit={setEditTx} onDelete={setDeleteTx} />
</TransactionsTable>
```

`CashTransactionsTable` should expose its domain columns directly:

```tsx
<CashTransactionsTable items={items}>
  <CashTransactionsTable.Date />
  <CashTransactionsTable.Customer />
  <CashTransactionsTable.Description />
  <CashTransactionsTable.Amount />
  <CashTransactionsTable.CreatedBy />
  <CashTransactionsTable.Actions onEdit={setEditing} onDelete={setDeleting} />
</CashTransactionsTable>
```

## Component Architecture

Each table root owns:

- empty-state rendering
- Mantine `Table`, `Table.Thead`, and `Table.Tbody` structure
- row iteration
- row context for column components
- stable column ordering based on child order

Each column component owns:

- header label and header cell props
- row cell rendering
- column-specific formatting and links
- column-specific actions, if applicable

The implementation should use React context rather than cloning children. Context avoids exposing private row props and allows future nested composition if a column needs internal subcomponents.

## Data Flow

The table root receives `items` and `children`.

For each item:

1. The table root renders a row.
2. It provides the current row through a row context.
3. Each declared column renders its cell from that row context.

Column components must fail fast if rendered outside their matching table or row context. A small internal hook such as `useHairAssignedRow()` should throw a clear error when context is missing.

Action columns keep callbacks local to the column:

```tsx
<HairAssignedTable.Actions onEdit={setEditItem} onDelete={setDeleteItem} />
```

This keeps action availability explicit at the call site.

## Compatibility

The first implementation may keep legacy props temporarily if that makes migration safer, but the stage is complete only when current call sites use the compound API and the boolean column props are removed from the public component types.

The migrated tables should preserve:

- current empty-state copy
- current link targets
- current amount/date formatting
- current action labels, icons, and callbacks
- current Mantine table layout

## Testing

Add focused component tests where the current test setup supports rendering React components. At minimum:

- `HairAssignedTable` renders only the columns declared by children.
- `HairAssignedTable.Actions` calls the provided edit/delete callbacks with the row item.
- Transaction table action columns call their callbacks with the row item.
- Empty states still render when `items` is empty.

If the existing test environment is not configured for React component rendering, add pure helper tests where possible and document the remaining UI test gap in the implementation summary.

Run the project validation required by `AGENTS.md` after implementation:

- `vp check`
- `vp test`

## Risks

- Static compound exports can become awkward if implemented inconsistently across tables. Use one clear pattern and repeat it.
- Over-abstracting column definitions would recreate a config-driven table API. Keep columns as React components.
- Route-local tables may look tempting to include, but they need a separate workflow-component design to avoid mixing concerns.

## Rollout

1. Implement `HairAssignedTable` first and migrate its three current call sites.
2. Apply the same pattern to `TransactionsTable`.
3. Apply the same pattern to `CashTransactionsTable`.
4. Reassess `HairOrdersTable`; migrate only if it fits the same pattern without broadening scope.
5. Run validation and document any test gaps.

