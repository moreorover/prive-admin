import type { ReactElement, ReactNode } from "react"

import { Table } from "@mantine/core"
import { Children, Fragment, isValidElement } from "react"

export type CompoundTableColumnComponent<Props = object> = ((props: Props) => ReactElement | null) & {
  columnKey: string
  Header: () => ReactElement
  Cell: (props: Props) => ReactElement
}

type CompoundTableColumnElement = ReactElement<object, CompoundTableColumnComponent<object>>

type CompoundTablePaginationComponent<Props = object> = ((props: Props) => ReactElement) & {
  isTablePagination: true
}

type CompoundTablePaginationElement<Props = object> = ReactElement<Props, CompoundTablePaginationComponent<Props>>

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

export function getCompoundTableColumns(children: ReactNode) {
  return getCompoundTableChildren(children).filter(isCompoundTableColumn)
}

export function getCompoundTablePagination<Props = object>(children: ReactNode) {
  return getCompoundTableChildren(children).find(isCompoundTablePagination<Props>) ?? null
}

function isCompoundTableColumn(child: ReactNode): child is CompoundTableColumnElement {
  return (
    isValidElement(child) && hasObjectLikeComponentType(child.type) && "Header" in child.type && "Cell" in child.type
  )
}

function isCompoundTablePagination<Props>(child: ReactNode): child is CompoundTablePaginationElement<Props> {
  return isValidElement(child) && hasObjectLikeComponentType(child.type) && "isTablePagination" in child.type
}

function getCompoundTableChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return getCompoundTableChildren(child.props.children)
    }
    return [child]
  })
}

function hasObjectLikeComponentType(type: ReactElement["type"]) {
  return (typeof type === "function" || typeof type === "object") && type !== null
}
