import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { EyeIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { queryClient, trpc } from "@/utils/trpc"

export const Route = createFileRoute("/admin/transactions/")({
  component: TransactionsPage,
})

type TransactionRow = {
  id: string
  amount: number
  type: string
  description: string | null
  date: string
  customerId: string
  customerName: string | null
  appointmentId: string | null
  appointmentName: string | null
  hairOrderId: string | null
  hairOrderUid: number | null
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100)
}

const typeLabels: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  paypal: "PayPal",
}

const columns: ColumnDef<TransactionRow>[] = [
  {
    id: "date",
    header: "Date",
    cell: ({ row }) => format(new Date(row.original.date), "dd MMM yyyy"),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description ?? "—",
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => row.original.customerName ?? "—",
  },
  {
    id: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.original.amount
      return (
        <span className={amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
          {formatCents(amount)}
        </span>
      )
    },
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">{typeLabels[row.original.type] ?? row.original.type}</Badge>
    ),
  },
]

const EMPTY_DATA: TransactionRow[] = []

function TransactionsPage() {
  const navigate = useNavigate()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const transactions = useQuery(trpc.transaction.getAll.queryOptions())

  const deleteMutation = useMutation(
    trpc.transaction.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["transaction"]] })
        toast.success("Transaction deleted")
        setDeletingId(null)
      },
    }),
  )

  const data = (transactions.data as TransactionRow[] | undefined) ?? EMPTY_DATA

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Button asChild>
          <Link to="/admin/transactions/new">
            <PlusIcon className="mr-2 size-4" />
            New Transaction
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
                              to: "/admin/transactions/$id",
                              params: { id: row.original.id },
                            })
                          }
                        >
                          <EyeIcon className="mr-2 size-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            navigate({
                              to: "/admin/transactions/$id/edit",
                              params: { id: row.original.id },
                            })
                          }
                        >
                          <PencilIcon className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeletingId(row.original.id)}
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
                  {transactions.isLoading ? "Loading..." : "No transactions yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deletingId) {
                  deleteMutation.mutate({ id: deletingId })
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
