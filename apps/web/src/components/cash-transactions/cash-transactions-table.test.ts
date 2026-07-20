import { createElement } from "react"
import { describe, expect, it } from "vite-plus/test"

import {
  CashTransactionsTable,
  getCashTransactionsTableColumnKeys,
  getCashTransactionsTableColumnLabels,
  getCashTransactionsTableHasPagination,
} from "./cash-transactions-table"

describe("cash transactions table compound columns", () => {
  it("reports declared column labels in child order", () => {
    expect(
      getCashTransactionsTableColumnLabels([
        createElement(CashTransactionsTable.Date, { key: "date" }),
        createElement(CashTransactionsTable.Customer, { key: "customer" }),
        createElement(CashTransactionsTable.Description, { key: "description" }),
        createElement(CashTransactionsTable.Amount, { key: "amount" }),
        createElement(CashTransactionsTable.CreatedBy, { key: "created-by" }),
        createElement(CashTransactionsTable.Actions, { key: "actions", onEdit: () => {}, onDelete: () => {} }),
      ]),
    ).toEqual(["Date", "Customer", "Description", "Amount", "Created by", "Actions"])
  })

  it("reports stable declared column keys in child order", () => {
    expect(
      getCashTransactionsTableColumnKeys([
        createElement(CashTransactionsTable.Date, { key: "date" }),
        createElement(CashTransactionsTable.Customer, { key: "customer" }),
        createElement(CashTransactionsTable.Actions, { key: "actions", onEdit: () => {}, onDelete: () => {} }),
      ]),
    ).toEqual(["date", "customer", "actions"])
  })

  it("detects a declared pagination footer", () => {
    expect(
      getCashTransactionsTableHasPagination(
        createElement(CashTransactionsTable.Pagination, {
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
