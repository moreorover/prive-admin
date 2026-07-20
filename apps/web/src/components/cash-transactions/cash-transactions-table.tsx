import type { ReactElement, ReactNode } from "react"

import { ActionIcon, Group, Menu, Pagination, Table, Text } from "@mantine/core"
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import dayjs from "dayjs"
import { Children, createContext, isValidElement, useContext } from "react"

import { formatMinor } from "@/lib/currency"

import { coerceCashTransactionCurrency } from "./currency"

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

type CashTransactionsTableRootProps = {
  items: CashTransactionRow[]
  children: ReactNode
}

type CashTransactionActionsProps = {
  onEdit: (item: CashTransactionRow) => void
  onDelete: (item: CashTransactionRow) => void
}

type CashTransactionPaginationProps = {
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

type CashTransactionColumnComponent<Props = object> = ((props: Props) => ReactElement | null) & {
  columnLabel: string
  Header: () => ReactElement
  Cell: (props: Props) => ReactElement
}

type CashTransactionColumnElement = ReactElement<object, CashTransactionColumnComponent<object>>
type CashTransactionPaginationElement = ReactElement<CashTransactionPaginationProps, CashTransactionPaginationComponent>
type CashTransactionPaginationComponent = ((props: CashTransactionPaginationProps) => ReactElement) & {
  isTablePagination: true
}

type CashTransactionsTableComponent = ((props: CashTransactionsTableRootProps) => ReactElement) & {
  Date: CashTransactionColumnComponent
  Customer: CashTransactionColumnComponent
  Description: CashTransactionColumnComponent
  Amount: CashTransactionColumnComponent
  CreatedBy: CashTransactionColumnComponent
  Actions: CashTransactionColumnComponent<CashTransactionActionsProps>
  Pagination: CashTransactionPaginationComponent
}

const CashTransactionRowContext = createContext<CashTransactionRow | null>(null)

function useCashTransactionRow() {
  const row = useContext(CashTransactionRowContext)
  if (!row) throw new Error("CashTransactionsTable column must be rendered inside CashTransactionsTable")
  return row
}

function getCashTransactionColumns(children: ReactNode) {
  return Children.toArray(children).filter(isValidCashTransactionColumn)
}

function getCashTransactionPagination(children: ReactNode) {
  return Children.toArray(children).find(isValidCashTransactionPagination) ?? null
}

function isValidCashTransactionColumn(child: ReactNode): child is CashTransactionColumnElement {
  return isValidElement(child) && typeof child.type !== "string" && "Header" in child.type && "Cell" in child.type
}

function isValidCashTransactionPagination(child: ReactNode): child is CashTransactionPaginationElement {
  return isValidElement(child) && typeof child.type !== "string" && "isTablePagination" in child.type
}

export function getCashTransactionsTableColumnLabels(children: ReactNode) {
  return getCashTransactionColumns(children).map((child) => child.type.columnLabel)
}

export function getCashTransactionsTableHasPagination(children: ReactNode) {
  return getCashTransactionPagination(children) !== null
}

function createColumn(label: string, Cell: () => ReactElement): CashTransactionColumnComponent {
  const Column = (() => null) as unknown as CashTransactionColumnComponent
  Column.columnLabel = label
  Column.Header = () => <Table.Th>{label}</Table.Th>
  Column.Cell = Cell
  return Column
}

function createActionsColumn(): CashTransactionColumnComponent<CashTransactionActionsProps> {
  const Column = (() => null) as unknown as CashTransactionColumnComponent<CashTransactionActionsProps>
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
  return Column
}

function CashTransactionsTableRoot({ items, children }: CashTransactionsTableRootProps) {
  const columns = getCashTransactionColumns(children)
  const pagination = getCashTransactionPagination(children)

  if (items.length === 0) {
    return (
      <>
        <Text size="sm" c="dimmed">
          No cash transactions.
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
            {columns.map((column, index) => (
              <column.type.Header key={index} />
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((row) => (
            <CashTransactionRowContext.Provider key={row.id} value={row}>
              <Table.Tr>
                {columns.map((column, index) => (
                  <column.type.Cell key={index} {...column.props} />
                ))}
              </Table.Tr>
            </CashTransactionRowContext.Provider>
          ))}
        </Table.Tbody>
      </Table>
      {pagination ? <pagination.type {...pagination.props} /> : null}
    </>
  )
}

const TablePagination = Object.assign(
  ({ page, pageSize, totalCount, onChange, label, mt = "md", px, pb }: CashTransactionPaginationProps) => {
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
Amount.Header = () => <Table.Th ta="right">Amount</Table.Th>

const CreatedBy = createColumn("Created by", () => {
  const row = useCashTransactionRow()
  return <Table.Td>{row.createdBy.name}</Table.Td>
})

export const CashTransactionsTable = Object.assign(CashTransactionsTableRoot, {
  Date,
  Customer,
  Description,
  Amount,
  CreatedBy,
  Actions: createActionsColumn(),
  Pagination: TablePagination,
}) satisfies CashTransactionsTableComponent
