import type { ReactNode } from "react"

import { MantineProvider } from "@mantine/core"
import { createElement, Fragment } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vite-plus/test"

import { TransactionsTable } from "./transactions-table"

const transactionRows = [
  {
    id: "transaction-1",
    name: "Deposit",
    notes: null,
    amount: 12345,
    currency: "EUR" as const,
    customerId: null,
    appointmentId: null,
    customer: null,
  },
]

function renderTransactionsTable(children: ReactNode) {
  return renderToStaticMarkup(
    createElement(MantineProvider, null, createElement(TransactionsTable, { items: transactionRows }, children)),
  )
}

describe("transactions table compound columns", () => {
  it("renders declared columns", () => {
    const markup = renderTransactionsTable(
      createElement(
        Fragment,
        null,
        createElement(TransactionsTable.Customer),
        createElement(TransactionsTable.Name),
        createElement(TransactionsTable.Amount),
        createElement(TransactionsTable.Actions, { onEdit: () => {}, onDelete: () => {} }),
      ),
    )

    expect(markup).toContain("Customer")
    expect(markup).toContain("Name")
    expect(markup).toContain("Amount")
  })

  it("supports omitting customer when a route wants a narrower table", () => {
    const markup = renderTransactionsTable(
      createElement(Fragment, null, createElement(TransactionsTable.Name), createElement(TransactionsTable.Amount)),
    )

    expect(markup).toContain("Name")
    expect(markup).toContain("Amount")
    expect(markup).not.toContain("Customer")
  })

  it("renders a declared pagination footer", () => {
    expect(
      renderTransactionsTable(
        createElement(TransactionsTable.Pagination, {
          page: 2,
          pageSize: 25,
          itemCount: 25,
          totalCount: 80,
          onChange: () => {},
          label: "Showing transactions",
        }),
      ),
    ).toContain("Showing transactions")
  })
})
