import type { ReactElement, ReactNode } from "react"

import { Table } from "@mantine/core"

import {
  getCompoundTableColumns,
  getCompoundTablePagination,
  type CompoundTableColumnElement,
} from "./compound-table-helpers"

type CompoundTableProps<Row> = {
  items: readonly Row[]
  children: ReactNode
  emptyMessage: ReactNode
  renderRow: (row: Row, columns: CompoundTableColumnElement[]) => ReactElement
}

export function CompoundTable<Row>({ items, children, emptyMessage, renderRow }: CompoundTableProps<Row>) {
  const columns = getCompoundTableColumns(children)
  const pagination = getCompoundTablePagination(children)

  if (items.length === 0) {
    return (
      <>
        {emptyMessage}
        {pagination ? pagination : null}
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
        <Table.Tbody>{items.map((row) => renderRow(row, columns))}</Table.Tbody>
      </Table>
      {pagination}
    </>
  )
}
