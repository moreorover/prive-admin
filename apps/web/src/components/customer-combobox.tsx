import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

export function CustomerCombobox({
  users,
  value,
  onChange,
}: {
  users: { id: string; name: string; email: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Combobox value={value} onValueChange={(val) => onChange(val as string)}>
      <ComboboxInput placeholder="Search customers..." />
      <ComboboxContent>
        <ComboboxEmpty>No customers found.</ComboboxEmpty>
        <ComboboxList>
          {users.map((u) => (
            <ComboboxItem key={u.id} value={u.id}>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{u.name}</span>
                <span className="text-muted-foreground text-xs">{u.email}</span>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
