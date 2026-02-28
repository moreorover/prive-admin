import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/hair-orders/")({
  component: HairOrdersPage,
});

type HairOrderRow = {
  id: string;
  uid: number;
  placedAt: string | null;
  arrivedAt: string | null;
  status: string;
  weightReceived: number;
  weightUsed: number;
  total: number;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  createdByName: string | null;
  createdAt: string;
};

const columns: ColumnDef<HairOrderRow>[] = [
  {
    accessorKey: "uid",
    header: "#",
    cell: ({ row }) => `#${String(row.original.uid).padStart(3, "0")}`,
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => row.original.customerName ?? "—",
  },
  {
    accessorKey: "placedAt",
    header: "Placed At",
    cell: ({ row }) =>
      row.original.placedAt ? format(new Date(row.original.placedAt), "dd MMM yyyy") : "—",
  },
  {
    accessorKey: "arrivedAt",
    header: "Arrived At",
    cell: ({ row }) =>
      row.original.arrivedAt ? format(new Date(row.original.arrivedAt), "dd MMM yyyy") : "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.status === "completed" ? "default" : "secondary"}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "weightReceived",
    header: "Weight",
    cell: ({ row }) => `${row.original.weightReceived}g`,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => `£${row.original.total.toFixed(2)}`,
  },
];

function HairOrdersPage() {
  const navigate = useNavigate();
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const orders = useQuery(trpc.hairOrder.getAll.queryOptions());

  const deleteMutation = useMutation(
    trpc.hairOrder.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["hairOrder", "getAll"]] });
        toast.success("Order deleted");
        setDeletingOrderId(null);
      },
    }),
  );

  const data = (orders.data ?? []) as HairOrderRow[];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hair Orders</h1>
        <Button asChild>
          <Link to="/admin/hair-orders/new">
            <PlusIcon className="mr-2 size-4" />
            New Order
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
                <TableHead className="w-10" />
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() =>
                            navigate({
                              to: "/admin/hair-orders/$id/edit",
                              params: { id: row.original.id },
                            })
                          }
                        >
                          <PencilIcon className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeletingOrderId(row.original.id)}
                        >
                          <Trash2Icon className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  {orders.isLoading ? "Loading..." : "No orders yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deletingOrderId}
        onOpenChange={(open) => {
          if (!open) setDeletingOrderId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deletingOrderId) {
                  deleteMutation.mutate({ id: deletingOrderId });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
