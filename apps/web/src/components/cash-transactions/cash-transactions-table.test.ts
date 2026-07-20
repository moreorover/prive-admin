import type { ReactNode } from "react"

import { MantineProvider } from "@mantine/core"
import { createElement, Fragment } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vite-plus/test"

import { CashTransactionsTable } from "./cash-transactions-table"

const cashTransactionRows = [
  {
    id: "cash-transaction-1",
    amount: 12345,
    currency: "EUR",
    createdAt: "2026-07-20T12:00:00.000Z",
    description: "Cash payment",
    notes: null,
    customerId: "customer-1",
    createdById: "user-1",
    customer: { id: "customer-1", name: "Jane Client" },
    createdBy: { id: "user-1", name: "Admin User" },
  },
]

function renderCashTransactionsTable(children: ReactNode) {
  return renderToStaticMarkup(
    createElement(
      MantineProvider,
      null,
      createElement(CashTransactionsTable, { items: cashTransactionRows }, children),
    ),
  )
}

describe("cash transactions table compound columns", () => {
  it("renders declared columns", () => {
    const markup = renderCashTransactionsTable(
      createElement(
        Fragment,
        null,
        createElement(CashTransactionsTable.Date),
        createElement(CashTransactionsTable.Description),
        createElement(CashTransactionsTable.Amount),
        createElement(CashTransactionsTable.CreatedBy),
        createElement(CashTransactionsTable.Actions, { onEdit: () => {}, onDelete: () => {} }),
      ),
    )

    expect(markup).toContain("Date")
    expect(markup).toContain("Description")
    expect(markup).toContain("Amount")
    expect(markup).toContain("Created by")
    expect(markup).toContain("Actions")
  })

  it("renders a declared pagination footer", () => {
    expect(
      renderCashTransactionsTable(
        createElement(CashTransactionsTable.Pagination, {
          page: 2,
          pageSize: 25,
          itemCount: 25,
          totalCount: 80,
          onChange: () => {},
          label: "Showing cash transactions",
        }),
      ),
    ).toContain("Showing cash transactions")
  })
})
