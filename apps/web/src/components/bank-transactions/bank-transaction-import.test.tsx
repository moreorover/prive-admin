import { Button, FileInput, Group, MantineProvider, Modal, Stack } from "@mantine/core"
import { Children } from "react"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vite-plus/test"

import { BankStatementImportCard } from "@/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/-components/bank-statement-import-card"

import { BankTransactionImport } from "./bank-transaction-import"
import { elements } from "./test-elements"

describe("BankTransactionImport", () => {
  it("keeps file selection and import execution controlled by the owner", () => {
    const onFileChange = vi.fn<(file: File | null) => void>()
    const onImport = vi.fn<() => void>()
    const props = { file: null, onFileChange, onImport, importPending: false, importResult: null }
    const controls = elements(BankTransactionImport(props))
    const fileInput = controls.find((el) => el.type === FileInput)!
    const button = controls.find((el) => el.type === Button)!
    expect(button.props.disabled).toBe(true)
    const file = new File(["csv"], "statement.csv", { type: "text/csv" })
    fileInput.props.onChange(file)
    expect(onFileChange).toHaveBeenCalledWith(file)
    expect(onImport).not.toHaveBeenCalled()
    const selected = elements(BankTransactionImport({ ...props, file, importPending: true }))
    const ready = selected.find((el) => el.type === Button)!
    expect(ready.props.disabled).toBe(false)
    expect(ready.props.loading).toBe(true)
    ready.props.onClick()
    expect(onImport).toHaveBeenCalledOnce()
  })

  it("renders import results through the legacy detail-screen interface", () => {
    const html = renderToStaticMarkup(
      createElement(
        MantineProvider,
        null,
        createElement(BankStatementImportCard, {
          file: null,
          onFileChange: () => {},
          onImport: () => {},
          importPending: false,
          importResult: { accountIban: "LT123", inserted: 3, skipped: 2, total: 5 },
        }),
      ),
    )
    expect(html).toContain("LT123")
    expect(html).toContain("imported 3 new entries, skipped 2 duplicates (total rows 5)")
  })
})

describe("workspace confirmation", () => {
  const preview = {
    accountIban: "LT121000011101001000",
    total: 5,
    inserted: 3,
    skipped: 2,
    account: { id: "a", displayName: "Main account", legalEntity: { id: "e", name: "Prive LT" } },
  }
  const props = {
    opened: true,
    onCancel: vi.fn<() => void>(),
    file: new File(["csv"], "statement.csv"),
    onFileChange: vi.fn<(file: File | null) => void>(),
    onPreview: vi.fn<() => void>(),
    onImport: vi.fn<() => void>(),
    importPending: false,
    importResult: null,
    preview: null as typeof preview | null,
    previewPending: false,
    error: null as string | null,
  }

  it("opens a modal with selection and cancel but no preview or import action before validation", () => {
    const tree = BankTransactionImport(props)
    expect(tree.type).toBe(Modal)
    expect(tree.props.opened).toBe(true)
    tree.props.onClose()
    expect(props.onCancel).toHaveBeenCalledOnce()
    expect(
      elements(tree)
        .filter((el) => el.type === Button)
        .map((el) => el.props.children),
    ).toEqual(["Cancel"])
    expect(props.onImport).not.toHaveBeenCalled()
    expect(elements(BankTransactionImport({ ...props, opened: false }))[0]!.props.opened).toBe(false)
  })

  it("centers the modal and keeps a right-aligned footer below the full-width picker and feedback", () => {
    const tree = BankTransactionImport({ ...props, preview })
    expect(tree.props.centered).toBe(true)
    const content = elements(tree).find((el) => el.type === Stack)!
    const children = Children.toArray(content.props.children)
    const footer = children.at(-1) as ReturnType<typeof BankTransactionImport>
    expect(footer.type).toBe(Group)
    expect(footer.props.justify).toBe("flex-end")
    expect(elements(footer).some((el) => el.type === FileInput)).toBe(false)
    expect(
      elements(footer)
        .filter((el) => el.type === Button)
        .map((el) => el.props.children),
    ).toEqual(["Cancel", "Confirm import"])
    expect(children.findIndex((child) => elements(child).some((el) => el.type === FileInput))).toBeLessThan(
      children.length - 1,
    )
    expect(elements(tree).find((el) => el.type === FileInput)!.props.w).toBe("100%")
  })

  it("combines account name, IBAN, and entity into one import destination", () => {
    const tree = BankTransactionImport({ ...props, preview })
    const html = renderToStaticMarkup(createElement(MantineProvider, null, tree.props.children))
    for (const [label, value] of [
      ["Total CSV rows", "5"],
      ["New entries", "3"],
      ["Duplicates ignored", "2"],
    ]) {
      expect(html).toMatch(new RegExp(`<dt[^>]*>${label}</dt><dd[^>]*>${value}</dd>`))
    }
    expect(html).toMatch(/<dt[^>]*>Import to<\/dt><dd[^>]*>Main account/)
    expect(html).toContain("LT121000011101001000")
    expect(html).toContain("Prive LT")
    expect(html).not.toMatch(/<dt[^>]*>Destination account<\/dt>/)
    expect(html).not.toMatch(/<dt[^>]*>IBAN<\/dt>/)
    expect(html).toContain('data-with-border="true"')
  })

  it("shows destination and row count before the explicit confirm action", () => {
    const html = renderToStaticMarkup(
      createElement(
        MantineProvider,
        null,
        createElement(BankTransactionImport, { ...props, preview, opened: undefined }),
      ),
    )
    expect(html).toContain("LT121000011101001000")
    expect(html).toContain("Main account")
    expect(html).toContain("Prive LT")
    const confirm = elements(BankTransactionImport({ ...props, preview })).find(
      (el) => el.type === Button && el.props.children === "Confirm import",
    )!
    confirm.props.onClick()
    expect(props.onImport).toHaveBeenCalledOnce()
  })

  it("shows a success summary and closes the completed modal without another import", () => {
    const onCancel = vi.fn<() => void>()
    const onImport = vi.fn<() => void>()
    const tree = BankTransactionImport({
      ...props,
      file: null,
      onCancel,
      onImport,
      importResult: { accountIban: preview.accountIban, total: 5, inserted: 3, skipped: 2 },
    })
    const buttons = elements(tree).filter((el) => el.type === Button)
    expect(buttons.map((el) => el.props.children)).toEqual(["Close"])
    buttons[0]!.props.onClick()
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onImport).not.toHaveBeenCalled()
    const html = renderToStaticMarkup(createElement(MantineProvider, null, tree.props.children))
    expect(html).toContain("imported 3 new entries, skipped 2 duplicates (total rows 5)")
  })

  it("locks file selection and confirmation while importing", () => {
    const controls = elements(BankTransactionImport({ ...props, preview, importPending: true }))
    expect(controls.find((el) => el.type === FileInput)!.props.disabled).toBe(true)
    expect(controls.find((el) => el.type === Button && el.props.children === "Confirm import")!.props.loading).toBe(
      true,
    )
  })

  it("renders validation errors with a setup link and no confirmation", () => {
    const html = renderToStaticMarkup(
      createElement(
        MantineProvider,
        null,
        createElement(BankTransactionImport, {
          ...props,
          opened: undefined,
          error: "No bank account configured",
          setupHref: "/legal-entities",
        }),
      ),
    )
    expect(html).toContain("No bank account configured")
    expect(html).toContain('href="/legal-entities"')
    expect(html).not.toContain("Confirm import")
  })
})
