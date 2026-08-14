import { type SelectOption } from "@/lib/resource-pagination"

export function getMasterCustomerQuerySearch(search: string, selectedOption?: SelectOption | null) {
  return search === selectedOption?.label ? "" : search
}
