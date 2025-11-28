import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useNavigate } from "@tanstack/react-router";
import type { Row } from "@tanstack/react-table";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { contactSchema } from "../data/schema";
import { useContacts } from "./contacts-provider";

type DataTableRowActionsProps<TData> = {
  row: Row<TData>;
};

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const navigate = useNavigate();
  const contact = contactSchema.parse(row.original);

  const { setOpen, setCurrentRow } = useContacts();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => {
            navigate({
              to: "/dashboard/contacts/$id",
              params: { id: contact.id },
            });
          }}
        >
          View
          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(contact);
            setOpen("update");
          }}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(contact.id)}
        >
          Copy contact ID
        </DropdownMenuItem>
        {/*<DropdownMenuItem disabled>Make a copy</DropdownMenuItem>*/}
        {/*<DropdownMenuItem disabled>Favorite</DropdownMenuItem>*/}
        {/*<DropdownMenuSeparator />*/}
        {/*<DropdownMenuSub>*/}
        {/*  <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>*/}
        {/*  <DropdownMenuSubContent>*/}
        {/*    <DropdownMenuRadioGroup value={contact.label}>*/}
        {/*      {labels.map((label) => (*/}
        {/*        <DropdownMenuRadioItem key={label.value} value={label.value}>*/}
        {/*          {label.label}*/}
        {/*        </DropdownMenuRadioItem>*/}
        {/*      ))}*/}
        {/*    </DropdownMenuRadioGroup>*/}
        {/*  </DropdownMenuSubContent>*/}
        {/*</DropdownMenuSub>*/}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={true}
          onClick={() => {
            setCurrentRow(contact);
            setOpen("delete");
          }}
        >
          Delete
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
