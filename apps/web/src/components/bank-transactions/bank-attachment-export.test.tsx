import { Button, Select } from "@mantine/core"
import { MonthPickerInput } from "@mantine/dates"
import { describe, expect, it, vi } from "vite-plus/test"

import { BankAttachmentExportForm } from "./bank-attachment-export"
import { elements } from "./test-elements"

const month = new Date(2026, 10, 1)
const accounts = [
  { id: "a", displayName: "Main", iban: "LT123", legalEntityName: "First" },
  { id: "b", displayName: "Reserve", iban: "LT456", legalEntityName: "Second" },
]
function props() {
  return {
    accounts,
    bankAccountId: null as string | null,
    fixedAccount: false,
    month,
    pending: false,
    onAccountChange: vi.fn<(id: string | null) => void>(),
    onMonthChange: vi.fn<(month: Date | null) => void>(),
    onExport: vi.fn<(id: string, month: Date) => void>(),
  }
}

describe("account-scoped attachment export picker", () => {
  it("requires explicit account selection in all-account mode before invoking the owner", () => {
    const input = props()
    const controls = elements(BankAttachmentExportForm(input))
    const select = controls.find((el) => el.type === Select)!
    expect(select.props.data).toEqual([
      { value: "a", label: "LT123 · Main · First" },
      { value: "b", label: "LT456 · Reserve · Second" },
    ])
    const option = select.props.renderOption({
      option: { value: "a", label: "LT123 · Main · First" },
    })
    expect(option.props.children[0].props.children).toBe("First")
    expect(option.props.children[1].props.children).toBe("LT123")
    const button = controls.find((el) => el.type === Button)!
    expect(button.props.disabled).toBe(true)
    button.props.onClick()
    expect(input.onExport).not.toHaveBeenCalled()
    select.props.onChange("b")
    expect(input.onAccountChange).toHaveBeenCalledWith("b")
    const selected = elements(BankAttachmentExportForm({ ...input, bankAccountId: "b" }))
    selected.find((el) => el.type === Button)!.props.onClick()
    expect(input.onExport).toHaveBeenCalledWith("b", month)
  })

  it("does not repeat an IBAN when the account display name is the IBAN", () => {
    const input = {
      ...props(),
      accounts: [{ id: "a", displayName: "LT123", iban: "LT123", legalEntityName: "First" }],
    }
    const select = elements(BankAttachmentExportForm(input)).find((el) => el.type === Select)!
    expect(select.props.data).toEqual([{ value: "a", label: "LT123 · First" }])
  })

  it("reuses the filtered or detail account and passes the chosen month to the owner", () => {
    const input = { ...props(), bankAccountId: "a", fixedAccount: true }
    const controls = elements(BankAttachmentExportForm(input))
    expect(controls.some((el) => el.type === Select)).toBe(false)
    const picker = controls.find((el) => el.type === MonthPickerInput)!
    picker.props.onChange("2026-10-01")
    expect(input.onMonthChange).toHaveBeenCalledWith(new Date(2026, 9, 1))
    controls.find((el) => el.type === Button)!.props.onClick()
    expect(input.onExport).toHaveBeenCalledWith("a", month)
  })

  it.each([{ month: null }, { pending: true }, { bankAccountId: "removed" }])(
    "blocks missing month, pending requests and obsolete picker accounts: %j",
    (override) => {
      const input = { ...props(), bankAccountId: "a", ...override }
      const button = elements(BankAttachmentExportForm(input)).find((el) => el.type === Button)!
      expect(button.props.disabled).toBe(true)
      button.props.onClick()
      expect(input.onExport).not.toHaveBeenCalled()
    },
  )
})
