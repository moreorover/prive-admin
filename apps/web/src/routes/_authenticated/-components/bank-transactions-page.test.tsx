import { MantineProvider } from "@mantine/core"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vite-plus/test"

import { BreadcrumbProvider } from "@/components/breadcrumbs"

import { BankTransactionsPage } from "./bank-transactions-page"

function renderPage(overrides: Partial<Parameters<typeof BankTransactionsPage>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(
      MantineProvider,
      null,
      createElement(
        BreadcrumbProvider,
        null,
        createElement(BankTransactionsPage, {
          search: { status: "PENDING", page: 1 },
          options: { entities: [], accounts: [] },
          result: { items: [], totalCount: 0, page: 1, pageSize: 10 },
          isFetching: false,
          error: null,
          onFiltersChange: () => {},
          onPageChange: () => {},
          onViewAllTransactions: () => {},
          ...overrides,
        }),
      ),
    ),
  )
}

describe("BankTransactionsPage shell", () => {
  it("renders the header, all filter controls and pending empty-state action", () => {
    const markup = renderPage()
    for (const label of [
      "Bank transactions",
      "Legal entity",
      "Bank account",
      "Status",
      "From",
      "To",
      "Search",
      "View all transactions",
      "No pending transactions",
    ]) {
      expect(markup).toContain(label)
    }
    expect(markup).toContain("0 transactions")
  })

  it("shows a generic empty state without the pending action for all statuses", () => {
    const markup = renderPage({ search: { status: "ALL", page: 1 } })
    expect(markup).toContain("No transactions found")
    expect(markup).not.toContain("View all transactions")
  })

  it("distinguishes failures and loading from a successful empty result", () => {
    expect(renderPage({ result: undefined, error: "Unable to load transactions" })).toContain(
      "Unable to load transactions",
    )
    expect(renderPage({ result: undefined, error: "Unable to load transactions" })).not.toContain(
      "No pending transactions",
    )
    expect(renderPage({ result: undefined, isFetching: true })).not.toContain("No pending transactions")
  })

  it("narrows bank account options to the selected entity", () => {
    const markup = renderPage({
      search: { entityId: "entity-1", bankAccountId: "account-1", status: "PENDING", page: 1 },
      options: {
        entities: [
          { id: "entity-1", name: "First entity" },
          { id: "entity-2", name: "Second entity" },
        ],
        accounts: [
          { id: "account-1", legalEntityId: "entity-1", displayName: "Main account", iban: "LT123" },
          { id: "account-2", legalEntityId: "entity-2", displayName: "Excluded account", iban: "GB456" },
        ],
      },
    })
    expect(markup).toContain("Main account")
    expect(markup).not.toContain("Excluded account")
  })
})
