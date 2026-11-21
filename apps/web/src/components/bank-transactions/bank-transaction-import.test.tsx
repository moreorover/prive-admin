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
