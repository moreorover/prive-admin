import type { ReactElement, ReactNode } from "react"

import { Children, isValidElement } from "react"

export type CompoundTableColumnComponent<Props = object> = ((props: Props) => ReactElement | null) & {
  columnKey: string
  columnLabel: string
  Header: () => ReactElement
  Cell: (props: Props) => ReactElement
}

type CompoundTableColumnElement = ReactElement<object, CompoundTableColumnComponent<object>>

type CompoundTablePaginationComponent<Props = object> = ((props: Props) => ReactElement) & {
  isTablePagination: true
}

type CompoundTablePaginationElement<Props = object> = ReactElement<Props, CompoundTablePaginationComponent<Props>>

export function getCompoundTableColumns(children: ReactNode) {
  return Children.toArray(children).filter(isCompoundTableColumn)
}

export function getCompoundTablePagination<Props = object>(children: ReactNode) {
  return Children.toArray(children).find(isCompoundTablePagination<Props>) ?? null
}

function isCompoundTableColumn(child: ReactNode): child is CompoundTableColumnElement {
  return isValidElement(child) && typeof child.type !== "string" && "Header" in child.type && "Cell" in child.type
}

function isCompoundTablePagination<Props>(child: ReactNode): child is CompoundTablePaginationElement<Props> {
  return isValidElement(child) && typeof child.type !== "string" && "isTablePagination" in child.type
}
