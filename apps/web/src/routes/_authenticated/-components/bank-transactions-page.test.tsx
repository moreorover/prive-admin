import { Button, MantineProvider } from "@mantine/core"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

import { BankTransactionImport } from "@/components/bank-transactions/bank-transaction-import"
import {
  BankTransactionsTable,
  type BankTransactionsTableProps,
} from "@/components/bank-transactions/bank-transactions-table"
import { elements } from "@/components/bank-transactions/test-elements"
import { BreadcrumbProvider } from "@/components/breadcrumbs"
import { PageHeader } from "@/components/page-header"

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
    search: { page: 1 },
    options: { entities: [], accounts: [] },
    result: { items: [], totalCount: 0, page: 1, pageSize: 10 },
    isFetching: false,
    error: null,
    review: reviewProps(),
    onFiltersChange: () => {},
    onPageChange: vi.fn<(page: number) => void>(),
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
    expect(html).not.toContain("No transactions found")
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

  it("renders the header and all filter controls", () => {
    const markup = renderPage()
    for (const label of [
      "Bank transactions",
      "Bank accounts",
      "From",
      "To",
      "Search",
      "No transactions found",
      "Transactions",
    ]) {
      expect(markup).toContain(label)
    }
    expect(markup).not.toContain("Legal entity")
    expect(markup).not.toContain("Status")
    expect(markup).toContain("0 transactions")
  })

  it("distinguishes failures and loading from a successful empty result", () => {
    expect(renderPage({ result: undefined, error: "Unable to load transactions" })).toContain(
      "Unable to load transactions",
    )
    expect(renderPage({ result: undefined, error: "Unable to load transactions" })).not.toContain(
      "No transactions found",
    )
    expect(renderPage({ result: undefined, isFetching: true })).not.toContain("No transactions found")
  })

  it("narrows bank account options to the selected entity", () => {
    const markup = renderPage({
      search: { entityId: "entity-1", bankAccountId: "account-1", page: 1 },
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
    expect(markup).toContain("LT123")
    expect(markup).not.toContain("GB456")
  })
})

it("opens the workspace import card from the header using owner callbacks", () => {
  const importAction = {
    opened: false,
    onOpen: vi.fn<() => void>(),
    onCancel: vi.fn<() => void>(),
    file: null,
    onFileChange: vi.fn<(file: File | null) => void>(),
    onPreview: vi.fn<() => void>(),
    onImport: vi.fn<() => void>(),
    importPending: false,
    importResult: null,
  }
  const closed = elements(BankTransactionsPage({ ...pageProps(), importAction }))
  expect(closed.some((el) => el.type === BankTransactionImport)).toBe(false)
  const header = closed.find((el) => el.type === PageHeader)!
  const action = elements(header.props.actions).find((el) => el.type === Button)!
  expect(action.props.children).toBe("Import CSV")
  action.props.onClick()
  expect(importAction.onOpen).toHaveBeenCalledOnce()
  const opened = elements(BankTransactionsPage({ ...pageProps(), importAction: { ...importAction, opened: true } }))
  expect(opened.find((el) => el.type === BankTransactionImport)?.props.onImport).toBe(importAction.onImport)
})

it("does not offer attachment export on the transactions screen", () => {
  const input = {
    ...pageProps(),
    search: { page: 1, entityId: "e" },
    options: {
      entities: [],
      accounts: [
        { id: "a", legalEntityId: "e", displayName: "Main", iban: "LT123" },
        { id: "b", legalEntityId: "other", displayName: "Other", iban: "LT456" },
      ],
    },
  }
  const header = elements(BankTransactionsPage(input)).find((el) => el.type === PageHeader)!
  expect(header.props.actions.props.children).toBe(null)
})
