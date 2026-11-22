import { NativeSelect, Select, TextInput } from "@mantine/core"
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
  const findControl = (label: string) => {
    const found = tree.find(
      (el) => (el.type === NativeSelect || el.type === Select || el.type === TextInput) && el.props.label === label,
    )
    if (!found) return undefined
    return found.props
  }
  const control = (label: string) => {
    const props = findControl(label)
    if (!props) throw new Error("Missing filter control: " + label)
    return props
  }
  return { control, findControl, onChange }
}
function change(control: Record<string, any>, value: string) {
  control.onChange({ currentTarget: { value } })
}

describe("BankTransactionFilters", () => {
  it("lists bank accounts with their legal entity context", () => {
    const { control } = controls()
    const accountControl = control("Account")
    expect(accountControl.data).toEqual([
      { value: "", label: "All bank accounts" },
      {
        group: "Bank accounts",
        items: [
          { value: "account-1", label: "LT123 · Main · First" },
          { value: "account-2", label: "GB456 · Reserve · Second" },
        ],
      },
    ])
    const option = accountControl.renderOption({
      option: { value: "account-1", label: "LT123 · Main · First" },
    })
    expect(option.props.children[0].props.children).toBe("First")
    expect(option.props.children[1].props.children).toBe("LT123")
    expect(accountControl.value).toBe("account-1")
    expect(
      controls({ entityId: "entity-2", bankAccountId: "account-1", status: "PENDING", page: 2 }).control("Account")
        .value,
    ).toBe("account-1")
  })

  it("emits account patches from the selector", () => {
    const { control, onChange } = controls()
    control("Account").onChange("account-2")
    expect(onChange).toHaveBeenLastCalledWith({ entityId: undefined, bankAccountId: "account-2" })
    control("Account").onChange("")
    expect(onChange).toHaveBeenLastCalledWith({ entityId: undefined, bankAccountId: undefined })
  })

  it("removes the status control and emits date and search patches", () => {
    const { control, findControl, onChange } = controls()
    expect(findControl("Status")).toBeUndefined()
    change(control("From"), "2026-11-01")
    change(control("To"), "")
    change(control("Search"), "invoice")
    expect(onChange.mock.calls).toEqual([[{ from: "2026-11-01" }], [{ to: undefined }], [{ q: "invoice" }]])
  })
})
