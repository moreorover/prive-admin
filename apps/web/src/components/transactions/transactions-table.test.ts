import type { ComponentProps, ReactNode } from "react"

import { MantineProvider } from "@mantine/core"
import { theme } from "@prive-admin-tanstack/ui/theme"
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
    createElement(
      MantineProvider,
      { theme },
      createElement(
        TransactionsTable,
        { items: transactionRows } as ComponentProps<typeof TransactionsTable>,
        children,
      ),
    ),
  )
}

describe("transactions table compound columns", () => {
  it("shows unresolved historical movements without reclassifying them", () => {
    expect(renderTransactionsTable(createElement(TransactionsTable.MovementType))).toContain("Legacy / unclassified")
  })

  it.each([
    ["received", "Received money"],
    ["personnel_allocation", "Personnel allocation"],
    ["refund", "Refund"],
    ["adjustment", "Adjustment"],
  ])("labels %s", (movementType, label) => {
    const markup = renderToStaticMarkup(
      createElement(
        MantineProvider,
        null,
        createElement(
          TransactionsTable,
          { items: [{ ...transactionRows[0], movementType }] } as ComponentProps<typeof TransactionsTable>,
          createElement(TransactionsTable.MovementType),
        ),
      ),
    )
    expect(markup).toContain(label)
  })

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
