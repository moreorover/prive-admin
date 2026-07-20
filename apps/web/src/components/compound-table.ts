import type { ReactElement, ReactNode } from "react"

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

export function getCompoundTableColumns(children: ReactNode) {
  return getCompoundTableChildren(children).filter(isCompoundTableColumn)
}

export function getCompoundTablePagination<Props = object>(children: ReactNode) {
  return getCompoundTableChildren(children).find(isCompoundTablePagination<Props>) ?? null
}

function isCompoundTableColumn(child: ReactNode): child is CompoundTableColumnElement {
  return isValidElement(child) && hasComponentMetadata(child.type) && "Header" in child.type && "Cell" in child.type
}

function isCompoundTablePagination<Props>(child: ReactNode): child is CompoundTablePaginationElement<Props> {
  return isValidElement(child) && hasComponentMetadata(child.type) && "isTablePagination" in child.type
}

function getCompoundTableChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return getCompoundTableChildren(child.props.children)
    }
    return [child]
  })
}

function hasComponentMetadata(type: ReactElement["type"]): type is Record<string, unknown> {
  return (typeof type === "function" || typeof type === "object") && type !== null
}
