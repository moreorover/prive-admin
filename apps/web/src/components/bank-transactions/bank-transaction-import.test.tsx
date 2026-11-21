import { Button, FileInput, MantineProvider } from "@mantine/core"
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
    account: { id: "a", displayName: "Main account", legalEntity: { id: "e", name: "Prive LT" } },
  }
  const props = {
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

  it("offers only preview until an account has been validated", () => {
    const controls = elements(BankTransactionImport(props))
    const buttons = controls.filter((el) => el.type === Button)
    expect(buttons.map((el) => el.props.children)).toEqual(["Preview CSV"])
    buttons[0]!.props.onClick()
    expect(props.onPreview).toHaveBeenCalledOnce()
    expect(props.onImport).not.toHaveBeenCalled()
  })

  it("shows destination and row count before the explicit confirm action", () => {
    const html = renderToStaticMarkup(
      createElement(MantineProvider, null, createElement(BankTransactionImport, { ...props, preview })),
    )
    expect(html).toContain("LT121000011101001000")
    expect(html).toContain("Main account")
    expect(html).toContain("Prive LT")
    expect(html).toContain("5 rows")
    const confirm = elements(BankTransactionImport({ ...props, preview })).find(
      (el) => el.type === Button && el.props.children === "Confirm import",
    )!
    confirm.props.onClick()
    expect(props.onImport).toHaveBeenCalledOnce()
  })

  it("locks file selection and confirmation while importing", () => {
    const controls = elements(BankTransactionImport({ ...props, preview, importPending: true }))
    expect(controls.find((el) => el.type === FileInput)!.props.disabled).toBe(true)
    expect(controls.find((el) => el.type === Button)!.props.loading).toBe(true)
  })

  it("renders validation errors with a setup link and no confirmation", () => {
    const html = renderToStaticMarkup(
      createElement(
        MantineProvider,
        null,
        createElement(BankTransactionImport, {
          ...props,
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
