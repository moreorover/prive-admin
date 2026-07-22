import type { ReactElement, ReactNode } from "react"

import { ActionIcon, Group, Menu, Pagination, Table, Text } from "@mantine/core"
import {
  type CompoundTableColumnComponent,
  getCompoundTableColumns,
  getCompoundTablePagination,
} from "@prive-admin-tanstack/ui/components/compound-table"
import { type Currency, formatMinor } from "@prive-admin-tanstack/ui/lib/currency"
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react"
import { createContext, useContext } from "react"

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

type TransactionCustomerProps = {
  renderCustomer?: (customer: { id: string; name: string }) => ReactNode
}

type TransactionPaginationProps = {
  page: number
  pageSize: number
  itemCount: number
  totalCount: number
  onChange: (page: number) => void
  label?: ReactNode
  mt?: "md"
  px?: "md"
  pb?: "md"
}

type TransactionColumnComponent<Props = object> = CompoundTableColumnComponent<Props>
type TransactionPaginationComponent = ((props: TransactionPaginationProps) => ReactElement) & {
  isTablePagination: true
}

type TransactionsTableComponent = ((props: TransactionsTableRootProps) => ReactElement) & {
  Customer: TransactionColumnComponent<TransactionCustomerProps>
  Name: TransactionColumnComponent
  Amount: TransactionColumnComponent
  Actions: TransactionColumnComponent<TransactionActionsProps>
  Pagination: TransactionPaginationComponent
}

const TransactionRowContext = createContext<TransactionRow | null>(null)

function useTransactionRow() {
  const row = useContext(TransactionRowContext)
  if (!row) throw new Error("TransactionsTable column must be rendered inside TransactionsTable")
  return row
}

function getTransactionColumns(children: ReactNode) {
  return getCompoundTableColumns(children)
}

function getTransactionPagination(children: ReactNode) {
  return getCompoundTablePagination<TransactionPaginationProps>(children)
}

function createColumn(columnKey: string, label: string, Cell: () => ReactElement): TransactionColumnComponent {
  const Column = (() => null) as unknown as TransactionColumnComponent
  Column.columnKey = columnKey
  Column.Header = () => <Table.Th>{label}</Table.Th>
  Column.Cell = Cell
  return Column
}

function createActionsColumn(): TransactionColumnComponent<TransactionActionsProps> {
  const Column = (() => null) as unknown as TransactionColumnComponent<TransactionActionsProps>
  Column.columnKey = "actions"
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
  const pagination = getTransactionPagination(children)

  if (items.length === 0) {
    return (
      <>
        <Text size="sm" c="dimmed">
          No transactions.
        </Text>
        {pagination ? <pagination.type {...pagination.props} /> : null}
      </>
    )
  }

  return (
    <>
      <Table>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <column.type.Header key={column.type.columnKey} />
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((row) => (
            <TransactionRowContext.Provider key={row.id} value={row}>
              <Table.Tr>
                {columns.map((column) => (
                  <column.type.Cell key={column.type.columnKey} {...column.props} />
                ))}
              </Table.Tr>
            </TransactionRowContext.Provider>
          ))}
        </Table.Tbody>
      </Table>
      {pagination ? <pagination.type {...pagination.props} /> : null}
    </>
  )
}

const TablePagination = Object.assign(
  ({ page, pageSize, totalCount, onChange, label, mt = "md", px, pb }: TransactionPaginationProps) => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
    const clampedPage = Math.min(page, totalPages)
    return (
      <Group justify={label ? "space-between" : "flex-end"} mt={mt} px={px} pb={pb}>
        {label ? (
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        ) : null}
        <Pagination total={totalPages} value={clampedPage} onChange={onChange} />
      </Group>
    )
  },
  { isTablePagination: true as const },
)

const Customer = (() => null) as unknown as TransactionColumnComponent<TransactionCustomerProps>
Customer.columnKey = "customer"
Customer.Header = () => <Table.Th>Customer</Table.Th>
Customer.Cell = ({ renderCustomer }) => {
  const row = useTransactionRow()
  if (!row.customer) return <Table.Td>—</Table.Td>
  return <Table.Td>{renderCustomer ? renderCustomer(row.customer) : row.customer.name}</Table.Td>
}

const Name = createColumn("name", "Name", () => {
  const row = useTransactionRow()
  return <Table.Td>{row.name ?? <Text c="dimmed">—</Text>}</Table.Td>
})

const Amount = createColumn("amount", "Amount", () => {
  const row = useTransactionRow()
  return <Table.Td>{formatMinor(row.amount, row.currency)}</Table.Td>
})

export const TransactionsTable = Object.assign(TransactionsTableRoot, {
  Customer,
  Name,
  Amount,
  Actions: createActionsColumn(),
  Pagination: TablePagination,
}) satisfies TransactionsTableComponent
