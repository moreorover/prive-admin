import type { ReactElement, ReactNode } from "react"

import { ActionIcon, Menu, Table, Text } from "@mantine/core"
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { Children, createContext, isValidElement, useContext } from "react"

import { type Currency, formatMinor } from "../../lib/currency"

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

type TransactionsTableRootProps = {
  items: TransactionRow[]
  children: ReactNode
}

type TransactionActionsProps = {
  onEdit: (item: TransactionRow) => void
  onDelete: (item: TransactionRow) => void
}

type TransactionColumnComponent<Props = object> = ((props: Props) => ReactElement | null) & {
  columnLabel: string
  Header: () => ReactElement
  Cell: (props: Props) => ReactElement
}

type TransactionColumnElement = ReactElement<object, TransactionColumnComponent<object>>

type TransactionsTableComponent = ((props: TransactionsTableRootProps) => ReactElement) & {
  Customer: TransactionColumnComponent
  Name: TransactionColumnComponent
  Amount: TransactionColumnComponent
  Actions: TransactionColumnComponent<TransactionActionsProps>
}

const TransactionRowContext = createContext<TransactionRow | null>(null)

function useTransactionRow() {
  const row = useContext(TransactionRowContext)
  if (!row) throw new Error("TransactionsTable column must be rendered inside TransactionsTable")
  return row
}

function getTransactionColumns(children: ReactNode) {
  return Children.toArray(children).filter(isValidTransactionColumn)
}

function isValidTransactionColumn(child: ReactNode): child is TransactionColumnElement {
  return isValidElement(child) && typeof child.type !== "string" && "Header" in child.type && "Cell" in child.type
}

export function getTransactionsTableColumnLabels(children: ReactNode) {
  return getTransactionColumns(children).map((child) => child.type.columnLabel)
}

function createColumn(label: string, Cell: () => ReactElement): TransactionColumnComponent {
  const Column = (() => null) as unknown as TransactionColumnComponent
  Column.columnLabel = label
  Column.Header = () => <Table.Th>{label}</Table.Th>
  Column.Cell = Cell
  return Column
}

function createActionsColumn(): TransactionColumnComponent<TransactionActionsProps> {
  const Column = (() => null) as unknown as TransactionColumnComponent<TransactionActionsProps>
  Column.columnLabel = ""
  Column.Header = () => <Table.Th />
  Column.Cell = ({ onEdit, onDelete }) => {
    const row = useTransactionRow()
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
  return Column
}

function TransactionsTableRoot({ items, children }: TransactionsTableRootProps) {
  const columns = getTransactionColumns(children)

  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No transactions.
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
        {items.map((row) => (
          <TransactionRowContext.Provider key={row.id} value={row}>
            <Table.Tr>
              {columns.map((column, index) => (
                <column.type.Cell key={index} {...column.props} />
              ))}
            </Table.Tr>
          </TransactionRowContext.Provider>
        ))}
      </Table.Tbody>
    </Table>
  )
}

const Customer = createColumn("Customer", () => {
  const row = useTransactionRow()
  return (
    <Table.Td>
      {row.customer ? (
        <Text
          renderRoot={(props) => (
            <Link to="/customers/$customerId" params={{ customerId: row.customer!.id }} {...props} />
          )}
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

export const TransactionsTable = Object.assign(TransactionsTableRoot, {
  Customer,
  Name,
  Amount,
  Actions: createActionsColumn(),
}) satisfies TransactionsTableComponent
