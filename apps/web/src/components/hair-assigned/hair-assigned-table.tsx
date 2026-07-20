import type { ReactElement, ReactNode } from "react"

import { ActionIcon, Badge, Group, Table, Text } from "@mantine/core"
import { IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { Children, createContext, isValidElement, useContext } from "react"

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

type HairAssignedTableRootProps = {
  items: HairAssignedRow[]
  children: ReactNode
}

type HairAssignedActionsProps = {
  onEdit: (item: HairAssignedRow) => void
  onDelete: (item: HairAssignedRow) => void
}

type HairAssignedColumnComponent<Props = object> = ((props: Props) => ReactElement | null) & {
  columnLabel: string
  Header: () => ReactElement
  Cell: (props: Props) => ReactElement
}

type HairAssignedColumnElement = ReactElement<object, HairAssignedColumnComponent<object>>

type HairAssignedTableComponent = ((props: HairAssignedTableRootProps) => ReactElement) & {
  Client: HairAssignedColumnComponent
  Source: HairAssignedColumnComponent
  HairOrder: HairAssignedColumnComponent
  Weight: HairAssignedColumnComponent
  SoldFor: HairAssignedColumnComponent
  Profit: HairAssignedColumnComponent
  PricePerGram: HairAssignedColumnComponent
  Actions: HairAssignedColumnComponent<HairAssignedActionsProps>
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
  const Column = (() => null) as unknown as HairAssignedColumnComponent
  Column.columnLabel = label
  Column.Header = () => <Table.Th>{label}</Table.Th>
  Column.Cell = Cell
  return Column
}

function createActionsColumn(): HairAssignedColumnComponent<HairAssignedActionsProps> {
  const Column = (() => null) as unknown as HairAssignedColumnComponent<HairAssignedActionsProps>
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
            <HairAssignedRowContext.Provider key={row.id} value={row}>
              <Table.Tr bg={needsAttention ? "var(--mantine-color-red-0)" : undefined}>
                {columns.map((column, index) => (
                  <column.type.Cell key={index} {...column.props} />
                ))}
              </Table.Tr>
            </HairAssignedRowContext.Provider>
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
          renderRoot={(props) => (
            <Link to="/customers/$customerId" params={{ customerId: row.client!.id }} {...props} />
          )}
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
