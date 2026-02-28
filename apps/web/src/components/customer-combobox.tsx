import { useMemo } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

type CustomerOption = { value: string; label: string }

export function CustomerCombobox({
  customers,
  value,
  onChange,
}: {
  customers: { id: string; name: string; email: string }[]
  value: string
  onChange: (value: string) => void
}) {
  const options: CustomerOption[] = useMemo(
    () =>
      customers.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.email})`,
      })),
    [customers],
  )

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  )

  return (
    <Combobox<CustomerOption>
      value={selected}
      onValueChange={(val) => onChange(val?.value ?? "")}
      isItemEqualToValue={(a, b) => a.value === b.value}
      items={options}
    >
      <ComboboxInput placeholder="Search customers..." />
      <ComboboxContent>
        <ComboboxEmpty>No customers found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
