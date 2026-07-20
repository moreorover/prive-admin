import { createElement } from "react"
import { describe, expect, it } from "vite-plus/test"

import { getCompoundTableColumns, getCompoundTablePagination } from "./compound-table"

describe("compound table helpers", () => {
  it("separates columns from pagination children", () => {
    const Column = Object.assign(() => null, {
      columnKey: "name",
      columnLabel: "Name",
      Header: () => null,
      Cell: () => null,
    })
    const Pagination = Object.assign(() => null, {
      isTablePagination: true as const,
    })

    const children = [
      createElement(Column, { key: "column" }),
      createElement(Pagination, { key: "pagination", page: 1 }),
      createElement("div", { key: "ignored" }),
    ]

    expect(getCompoundTableColumns(children)).toHaveLength(1)
    expect(getCompoundTableColumns(children)[0]?.type).toBe(Column)
    expect(getCompoundTableColumns(children)[0]?.type.columnKey).toBe("name")
    expect(getCompoundTablePagination(children)?.type).toBe(Pagination)
  })
})
