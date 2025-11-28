import type { Table } from "@tanstack/react-table";
import { ArrowUpDown, CircleArrowUp, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTableBulkActions as BulkActionsToolbar } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sleep } from "@/lib/utils";
import { priorities, statuses } from "../data/data";
import type { Contact } from "../data/schema";
import { ContactsMultiDeleteDialog } from "./contacts-multi-delete-dialog";

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>;
};

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleBulkStatusChange = (status: string) => {
    const selectedContacts = selectedRows.map(
      (row) => row.original as Contact,
    );
    toast.promise(sleep(2000), {
      loading: "Updating status...",
      success: () => {
        table.resetRowSelection();
        return `Status updated to "${status}" for ${selectedContacts.length} contact${selectedContacts.length > 1 ? "s" : ""}.`;
      },
      error: "Error",
    });
    table.resetRowSelection();
  };

  const handleBulkPriorityChange = (priority: string) => {
    const selectedContacts = selectedRows.map(
      (row) => row.original as Contact,
    );
    toast.promise(sleep(2000), {
      loading: "Updating priority...",
      success: () => {
        table.resetRowSelection();
        return `Priority updated to "${priority}" for ${selectedContacts.length} contact${selectedContacts.length > 1 ? "s" : ""}.`;
      },
      error: "Error",
    });
    table.resetRowSelection();
  };

  const handleBulkExport = () => {
    const selectedContacts = selectedRows.map(
      (row) => row.original as Contact,
    );
    toast.promise(sleep(2000), {
      loading: "Exporting contacts...",
      success: () => {
        table.resetRowSelection();
        return `Exported ${selectedContacts.length} contact${selectedContacts.length > 1 ? "s" : ""} to CSV.`;
      },
      error: "Error",
    });
    table.resetRowSelection();
  };

  return (
    <>
      <BulkActionsToolbar table={table} entityName="contact">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Update status"
                  title="Update status"
                >
                  <CircleArrowUp />
                  <span className="sr-only">Update status</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Update status</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.value}
                defaultValue={status.value}
                onClick={() => handleBulkStatusChange(status.value)}
              >
                {status.icon && (
                  <status.icon className="size-4 text-muted-foreground" />
                )}
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label="Update priority"
                  title="Update priority"
                >
                  <ArrowUpDown />
                  <span className="sr-only">Update priority</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Update priority</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent sideOffset={14}>
            {priorities.map((priority) => (
              <DropdownMenuItem
                key={priority.value}
                defaultValue={priority.value}
                onClick={() => handleBulkPriorityChange(priority.value)}
              >
                {priority.icon && (
                  <priority.icon className="size-4 text-muted-foreground" />
                )}
                {priority.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleBulkExport()}
              className="size-8"
              aria-label="Export contacts"
              title="Export contacts"
            >
              <Download />
              <span className="sr-only">Export contacts</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export contacts</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="size-8"
              aria-label="Delete selected contacts"
              title="Delete selected contacts"
            >
              <Trash2 />
              <span className="sr-only">Delete selected contacts</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected contacts</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ContactsMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  );
}
