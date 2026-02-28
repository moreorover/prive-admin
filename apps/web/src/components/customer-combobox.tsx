import { useState } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export function CustomerCombobox({
  users,
  value,
  onChange,
}: {
  users: { id: string; name: string; email: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const selectedUser = users.find((u) => u.id === value);

  const filtered = users.filter(
    (u) =>
      !inputValue ||
      u.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      u.email.toLowerCase().includes(inputValue.toLowerCase()),
  );

  return (
    <Combobox
      value={value ? [value] : []}
      onValueChange={(vals) => onChange(vals[0] ?? "")}
      onInputValueChange={setInputValue}
    >
      <ComboboxInput placeholder={selectedUser ? selectedUser.name : "Search customers..."} />
      <ComboboxContent>
        <ComboboxList>
          {filtered.length === 0 && <ComboboxEmpty>No customers found.</ComboboxEmpty>}
          {filtered.map((u) => (
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
  );
}
