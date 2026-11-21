import { MantineProvider, Menu, Pagination, Table } from "@mantine/core"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

import { AttachmentsCell } from "@/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/attachments-cell"
import { BankStatementEntriesCard } from "@/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/bank-statement-entries-card"

import { BankTransactionsTable, type BankTransactionsTableProps } from "./bank-transactions-table"
import { elements } from "./test-elements"

const entries = [
  {
    id: "entry-1",
    date: "2026-11-21",
    amount: 12345,
    currency: "EUR",
    direction: "C",
    counterpartyName: "Customer",
    purpose: "Invoice 42",
    status: "PENDING",
    bankAccount: { displayName: "Main", iban: "LT123", legalEntity: { name: "First company" } },
  },
  {
    id: "entry-2",
    date: "2026-11-22",
    amount: 5000,
    currency: "USD",
    direction: "D",
    counterpartyName: null,
    purpose: null,
    status: "IGNORED",
    bankAccount: { displayName: "Reserve", iban: "GB456", legalEntity: { name: "Second company" } },
  },
]
function props() {
  return {
    entries,
    entriesTotalCount: 21,
    entriesTotalPages: 3,
    showPagination: true,
    page: 2,
    attachmentCounts: { "entry-1": 2 },
    attachments: [{ id: "file-1", originalName: "receipt.pdf", contentType: "application/pdf" }],
    attachmentsLoading: true,
    unassignedAttachments: [{ id: "file-2", originalName: "unassigned.pdf", contentType: "application/pdf" }],
    openAttachmentEntryId: "entry-1",
    uploadingAttachmentEntryId: "entry-1",
    assignPending: false,
    removePending: true,
    unassignPending: false,
    ignorePending: true,
    undoPending: false,
    onPageChange: vi.fn<BankTransactionsTableProps["onPageChange"]>(),
    onOpenAttachmentEntryChange: vi.fn<BankTransactionsTableProps["onOpenAttachmentEntryChange"]>(),
    onAssign: vi.fn<BankTransactionsTableProps["onAssign"]>(),
    onRemove: vi.fn<BankTransactionsTableProps["onRemove"]>(),
    onUnassign: vi.fn<BankTransactionsTableProps["onUnassign"]>(),
    onUpload: vi.fn<BankTransactionsTableProps["onUpload"]>(async () => {}),
    onIgnore: vi.fn<BankTransactionsTableProps["onIgnore"]>(),
    onUndo: vi.fn<BankTransactionsTableProps["onUndo"]>(),
  }
}
function rows(input: ReturnType<typeof props>) {
  return elements(BankTransactionsTable(input))
    .filter((el) => typeof el.type === "function")
    .filter((el) => el.props.entry)
    .map((el) => (el.type as (props: Record<string, any>) => React.ReactNode)(el.props))
}
function markup(input: ReturnType<typeof props>) {
  return renderToStaticMarkup(createElement(MantineProvider, null, createElement(BankTransactionsTable, input)))
}

describe("BankTransactionsTable", () => {
  it("identifies the entity and account on every row alongside transaction details", () => {
    const html = markup(props())
    const first = html.slice(html.indexOf("<tbody"), html.indexOf("</tbody>")).split("</tr>")
    expect(first[0]).toContain("First company")
    expect(first[0]).toContain("Main")
    expect(first[0]).toContain("LT123")
    expect(first[0]).toContain("2026-11-21")
    expect(first[0]).toContain("Customer")
    expect(first[0]).toContain("Invoice 42")
    expect(first[0]).toContain("123.45")
    expect(first[0]).toContain("EUR")
    expect(first[1]).toContain("Second company")
    expect(first[1]).toContain("Reserve")
    expect(first[1]).toContain("GB456")
    expect(first[1]).toContain("50.00")
    expect(first[1]).toContain("USD")
  })

  it("passes attachment data only to the opened row and routes each action with its entry ID", async () => {
    const input = props()
    const cells = rows(input).map((row) => elements(row).find((el) => el.type === AttachmentsCell)!.props)
    expect(cells[0]).toMatchObject({
      opened: true,
      count: 2,
      attachments: input.attachments,
      attachmentsLoading: true,
      unassignedAttachments: input.unassignedAttachments,
      pending: { upload: true, remove: true },
    })
    expect(cells[1]).toMatchObject({
      opened: false,
      count: 0,
      attachments: [],
      attachmentsLoading: false,
      unassignedAttachments: [],
      pending: { upload: false },
    })
    cells[1].onOpenChange(true)
    cells[0].onOpenChange(false)
    expect(input.onOpenAttachmentEntryChange.mock.calls).toEqual([["entry-2"], [null]])
    cells[0].onAssign("file-2")
    cells[0].onRemove("file-1")
    cells[0].onUnassign("file-1")
    const file = new File(["receipt"], "receipt.txt")
    await cells[1].onUpload(file)
    expect(input.onAssign).toHaveBeenCalledWith("file-2", "entry-1")
    expect(input.onRemove).toHaveBeenCalledWith("file-1")
    expect(input.onUnassign).toHaveBeenCalledWith("file-1")
    expect(input.onUpload).toHaveBeenCalledWith(file, "entry-2")
  })

  it("selects ignore or undo by status and respects route pending state", () => {
    const input = props()
    const actions = rows(input).map((row) => elements(row).find((el) => el.type === Menu.Item)!.props)
    expect(actions[0].disabled).toBe(true)
    expect(actions[1].disabled).toBe(false)
    actions[0].onClick()
    actions[1].onClick()
    expect(input.onIgnore).toHaveBeenCalledWith("entry-1")
    expect(input.onUndo).toHaveBeenCalledWith("entry-2")
    const pagination = elements(BankTransactionsTable(input)).find((el) => el.type === Pagination)!
    pagination.props.onChange(3)
    expect(input.onPageChange).toHaveBeenCalledWith(3)
  })

  it("renders an empty state spanning all eight columns and accepts legacy rows without account context", () => {
    const input = props()
    expect(markup({ ...input, entries: [] })).toContain("No entries.")
    const empty = elements(BankTransactionsTable({ ...input, entries: [] })).find((el) => el.type === Table.Td)!
    expect(empty.props.colSpan).toBe(8)
    const legacy = renderToStaticMarkup(
      createElement(
        MantineProvider,
        null,
        createElement(BankStatementEntriesCard, { ...input, entries: [{ ...entries[0]!, bankAccount: undefined }] }),
      ),
    )
    expect(legacy).toContain("Invoice 42")
    expect(legacy).toContain("Page 2")
  })
})
