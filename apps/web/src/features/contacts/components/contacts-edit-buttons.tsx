import { Pencil } from "lucide-react";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/features/contacts/data/schema";
import { useContacts } from "./contacts-provider";

interface Props {
  contact: Contact;
}

export function ContactsEditButtons(props: Props): JSX.Element {
  const { setOpen, setCurrentRow } = useContacts();
  return (
    <div className="flex gap-2">
      <Button
        className="space-x-1"
        onClick={() => {
          setCurrentRow(props.contact);
          setOpen("update");
        }}
      >
        <span>Edit</span> <Pencil size={18} />
      </Button>
    </div>
  );
}
