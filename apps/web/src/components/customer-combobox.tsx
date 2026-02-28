import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

export function CustomerCombobox({
  customers,
  value,
  onChange,
}: {
  customers: { id: string; name: string; email: string }[]
  value: string
  onChange: (value: string) => void
}) {
  const customerMap = new Map(customers.map((c) => [c.id, c]))

  return (
    <Combobox
      value={value}
      onValueChange={(val) => onChange(val as string)}
      itemToStringLabel={(id) => {
        const c = customerMap.get(id)
        return c ? `${c.name} (${c.email})` : ""
      }}
    >
      <ComboboxInput placeholder="Search customers..." />
      <ComboboxContent>
        <ComboboxEmpty>No customers found.</ComboboxEmpty>
        <ComboboxList>
          {customers.map((c) => (
            <ComboboxItem key={c.id} value={c.id}>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-muted-foreground text-xs">{c.email}</span>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
