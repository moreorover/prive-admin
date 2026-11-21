import { MantineProvider } from "@mantine/core"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

import {
  BankTransactionsTable,
  type BankTransactionsTableProps,
} from "@/components/bank-transactions/bank-transactions-table"
import { elements } from "@/components/bank-transactions/test-elements"
import { BreadcrumbProvider } from "@/components/breadcrumbs"

import { BankTransactionsPage } from "./bank-transactions-page"

function reviewProps() {
  return {
    attachmentCounts: { "entry-1": 2 },
    attachments: [],
    attachmentsLoading: false,
    unassignedAttachments: [],
    openAttachmentEntryId: null,
    uploadingAttachmentEntryId: null,
    assignPending: false,
    removePending: false,
    unassignPending: false,
    ignorePending: false,
    undoPending: true,
    onOpenAttachmentEntryChange: vi.fn<BankTransactionsTableProps["onOpenAttachmentEntryChange"]>(),
    onAssign: vi.fn<BankTransactionsTableProps["onAssign"]>(),
    onRemove: vi.fn<BankTransactionsTableProps["onRemove"]>(),
    onUnassign: vi.fn<BankTransactionsTableProps["onUnassign"]>(),
    onUpload: vi.fn<BankTransactionsTableProps["onUpload"]>(),
    onIgnore: vi.fn<BankTransactionsTableProps["onIgnore"]>(),
    onUndo: vi.fn<BankTransactionsTableProps["onUndo"]>(),
  }
}
const timestamp = "2026-11-22T00:00:00.000Z"
const entry = {
  id: "entry-1",
  bankAccountId: "account-1",
  externalRef: "ref-1",
  docNumber: null,
  date: "2026-11-21",
  amount: 12345,
  currency: "EUR",
  direction: "C",
  counterpartyName: "Workspace customer",
  counterpartyIban: null,
  counterpartyBank: null,
  swift: null,
  purpose: "Workspace invoice",
  transactionType: null,
  status: "PENDING",
  importedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  bankAccount: {
    id: "account-1",
    legalEntityId: "entity-1",
    iban: "LT123",
    currency: "EUR",
    bankName: null,
    swift: null,
    displayName: "Main account",
    createdAt: timestamp,
    updatedAt: timestamp,
    legalEntity: {
      id: "entity-1",
      name: "First company",
      type: "LTD",
      country: "LT",
      defaultCurrency: "EUR",
      registrationNumber: null,
      vatNumber: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },
}
function pageProps() {
  return {
    search: { status: "PENDING" as const, page: 1 },
    options: { entities: [], accounts: [] },
    result: { items: [], totalCount: 0, page: 1, pageSize: 10 },
    isFetching: false,
    error: null,
    review: reviewProps(),
    onFiltersChange: () => {},
    onPageChange: vi.fn<(page: number) => void>(),
    onViewAllTransactions: () => {},
  }
}
function renderPage(overrides: Partial<Parameters<typeof BankTransactionsPage>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(
      MantineProvider,
      null,
      createElement(
        BreadcrumbProvider,
        null,
        createElement(BankTransactionsPage, {
          ...pageProps(),
          ...overrides,
        }),
      ),
    ),
  )
}

describe("BankTransactionsPage shell", () => {
  it("renders populated workspace rows with entity/account context and review controls", () => {
    const html = renderPage({
      result: { items: [entry, { ...entry, id: "entry-2", status: "IGNORED" }], totalCount: 21, page: 1, pageSize: 10 },
    })
    for (const label of [
      "First company",
      "Main account",
      "LT123",
      "Workspace customer",
      "Workspace invoice",
      "123.45",
      "EUR",
      'aria-label="Actions"',
      'aria-label="Files"',
      "Page 1 of 3",
    ])
      expect(html).toContain(label)
    expect(html).not.toContain("No pending transactions")
    expect(html.match(/<tbody/g)).toHaveLength(1)
  })

  it("passes populated results and explicit route-owned actions to the shared table", () => {
    const props = { ...pageProps(), result: { items: [entry], totalCount: 21, page: 1, pageSize: 10 } }
    const table = elements(BankTransactionsPage(props)).find((el) => el.type === BankTransactionsTable)
    expect(table).toBeDefined()
    expect(table!.props.entries).toEqual([entry])
    expect(table!.props.attachmentCounts).toEqual({ "entry-1": 2 })
    expect(table!.props.undoPending).toBe(true)
    table!.props.onIgnore("entry-1")
    table!.props.onUndo("entry-2")
    table!.props.onOpenAttachmentEntryChange("entry-1")
    expect(props.review.onIgnore).toHaveBeenCalledWith("entry-1")
    expect(props.review.onUndo).toHaveBeenCalledWith("entry-2")
    expect(props.review.onOpenAttachmentEntryChange).toHaveBeenCalledWith("entry-1")
    expect(table!.props.showPagination).toBe(false)
  })

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
