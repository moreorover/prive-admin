import { createElement } from "react"
import { describe, expect, it } from "vite-plus/test"

import {
  TransactionsTable,
  getTransactionsTableColumnLabels,
  getTransactionsTableHasPagination,
} from "./transactions-table"

describe("transactions table compound columns", () => {
  it("reports declared column labels in child order", () => {
    expect(
      getTransactionsTableColumnLabels([
        createElement(TransactionsTable.Customer, { key: "customer" }),
        createElement(TransactionsTable.Name, { key: "name" }),
        createElement(TransactionsTable.Amount, { key: "amount" }),
        createElement(TransactionsTable.Actions, { key: "actions", onEdit: () => {}, onDelete: () => {} }),
      ]),
    ).toEqual(["Customer", "Name", "Amount", ""])
  })

  it("supports omitting customer when a route wants a narrower table", () => {
    expect(
      getTransactionsTableColumnLabels([
        createElement(TransactionsTable.Name, { key: "name" }),
        createElement(TransactionsTable.Amount, { key: "amount" }),
      ]),
    ).toEqual(["Name", "Amount"])
  })

  it("detects a declared pagination footer", () => {
    expect(
      getTransactionsTableHasPagination(
        createElement(TransactionsTable.Pagination, {
          page: 2,
          pageSize: 25,
          itemCount: 25,
          totalCount: 80,
          onChange: () => {},
        }),
      ),
    ).toBe(true)
  })
})
