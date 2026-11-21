import { NativeSelect, TextInput } from "@mantine/core"
import { describe, expect, it, vi } from "vite-plus/test"

import { BankTransactionFilters } from "./bank-transaction-filters"
import { elements } from "./test-elements"

const entities = [
  { id: "entity-1", name: "First" },
  { id: "entity-2", name: "Second" },
]
const accounts = [
  { id: "account-1", legalEntityId: "entity-1", displayName: "Main", iban: "LT123" },
  { id: "account-2", legalEntityId: "entity-2", displayName: "Reserve", iban: "GB456" },
]
function controls(values = { entityId: "entity-1", bankAccountId: "account-1", status: "PENDING" as const, page: 2 }) {
  const onChange = vi.fn<Parameters<typeof BankTransactionFilters>[0]["onChange"]>()
  const tree = elements(BankTransactionFilters({ entities, accounts, values, onChange }))
  const control = (label: string) =>
    tree.find((el) => (el.type === NativeSelect || el.type === TextInput) && el.props.label === label)!.props
  return { control, onChange }
}
function change(control: Record<string, any>, value: string) {
  control.onChange({ currentTarget: { value } })
}

describe("BankTransactionFilters", () => {
  it("narrows account options and displays only valid controlled values", () => {
    const { control } = controls()
    expect(control("Bank account").data).toEqual([
      { value: "", label: "All bank accounts" },
      { value: "account-1", label: "Main · LT123" },
    ])
    expect(control("Bank account").value).toBe("account-1")
    expect(
      controls({ entityId: "entity-2", bankAccountId: "account-1", status: "PENDING", page: 2 }).control("Bank account")
        .value,
    ).toBe("")
  })

  it("clears an incompatible account when changing entity and preserves a valid account when clearing entity", () => {
    const { control, onChange } = controls()
    change(control("Legal entity"), "entity-2")
    expect(onChange.mock.calls.at(-1)).toStrictEqual([{ entityId: "entity-2", bankAccountId: undefined }])
    change(control("Legal entity"), "")
    expect(onChange).toHaveBeenLastCalledWith({ entityId: undefined })
    change(control("Bank account"), "")
    expect(onChange).toHaveBeenLastCalledWith({ bankAccountId: undefined })
  })

  it("rejects incompatible account selections", () => {
    const { control, onChange } = controls()
    change(control("Bank account"), "account-2")
    expect(onChange).toHaveBeenCalledWith({ bankAccountId: undefined })
  })

  it("emits parsed status, date, and search patches for the route to own URL updates", () => {
    const { control, onChange } = controls()
    expect(control("Status").data.map((option: { value: string }) => option.value)).toEqual([
      "PENDING",
      "IGNORED",
      "ALL",
    ])
    expect(control("Status").value).toBe("PENDING")
    change(control("Status"), "IGNORED")
    change(control("Status"), "ALL")
    change(control("From"), "2026-11-01")
    change(control("To"), "")
    change(control("Search"), "invoice")
    expect(onChange.mock.calls).toEqual([
      [{ status: "IGNORED" }],
      [{ status: "ALL" }],
      [{ from: "2026-11-01" }],
      [{ to: undefined }],
      [{ q: "invoice" }],
    ])
  })
})
