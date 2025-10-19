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
import type { Customer } from "../data/schema";
import { CustomersMultiDeleteDialog } from "./customers-multi-delete-dialog";

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>;
};

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleBulkStatusChange = (status: string) => {
    const selectedCustomers = selectedRows.map(
      (row) => row.original as Customer,
    );
    toast.promise(sleep(2000), {
      loading: "Updating status...",
      success: () => {
        table.resetRowSelection();
        return `Status updated to "${status}" for ${selectedCustomers.length} customer${selectedCustomers.length > 1 ? "s" : ""}.`;
      },
      error: "Error",
    });
    table.resetRowSelection();
  };

  const handleBulkPriorityChange = (priority: string) => {
    const selectedCustomers = selectedRows.map(
      (row) => row.original as Customer,
    );
    toast.promise(sleep(2000), {
      loading: "Updating priority...",
      success: () => {
        table.resetRowSelection();
        return `Priority updated to "${priority}" for ${selectedCustomers.length} customer${selectedCustomers.length > 1 ? "s" : ""}.`;
      },
      error: "Error",
    });
    table.resetRowSelection();
  };

  const handleBulkExport = () => {
    const selectedCustomers = selectedRows.map(
      (row) => row.original as Customer,
    );
    toast.promise(sleep(2000), {
      loading: "Exporting customers...",
      success: () => {
        table.resetRowSelection();
        return `Exported ${selectedCustomers.length} customer${selectedCustomers.length > 1 ? "s" : ""} to CSV.`;
      },
      error: "Error",
    });
    table.resetRowSelection();
  };

  return (
    <>
      <BulkActionsToolbar table={table} entityName="customer">
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
              aria-label="Export customers"
              title="Export customers"
            >
              <Download />
              <span className="sr-only">Export customers</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export customers</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="size-8"
              aria-label="Delete selected customers"
              title="Delete selected customers"
            >
              <Trash2 />
              <span className="sr-only">Delete selected customers</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected customers</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <CustomersMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  );
}
