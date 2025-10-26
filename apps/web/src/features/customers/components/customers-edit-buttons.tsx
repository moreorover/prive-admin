import { Pencil } from "lucide-react";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/features/customers/data/schema";
import { useCustomers } from "./customers-provider";

interface Props {
  customer: Customer;
}

export function CustomersEditButtons(props: Props): JSX.Element {
  const { setOpen, setCurrentRow } = useCustomers();
  return (
    <div className="flex gap-2">
      <Button
        className="space-x-1"
        onClick={() => {
          setCurrentRow(props.customer);
          setOpen("update");
        }}
      >
        <span>Edit</span> <Pencil size={18} />
      </Button>
    </div>
  );
}
