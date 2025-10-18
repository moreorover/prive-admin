import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Customer {
  id: string;
  name: string;
  phoneNumber?: string | null;
  createdAt: string;
}

interface CustomerActionsProps {
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export const createColumns = ({
  onEdit,
  onDelete,
}: CustomerActionsProps = {}): ColumnDef<Customer>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer ID" />
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "phoneNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone number" />
    ),
    cell: ({ row }) => <div>{row.getValue("phoneNumber")}</div>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(customer.id)}
            >
              Copy customer ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(customer)}>
              Edit customer
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(customer)}
              className="text-destructive"
            >
              Delete customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Export default columns for backward compatibility
export const columns = createColumns();
