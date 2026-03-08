import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"
import { endOfDay, format, startOfDay } from "date-fns"
import { EyeIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { DatePicker } from "@/components/date-picker"
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
import { queryClient, trpc, trpcClient } from "@/utils/trpc"

export const Route = createFileRoute("/admin/appointments/")({
  component: AppointmentsPage,
})

type AppointmentRow = {
  id: string
  name: string
  startsAt: string
  endsAt: string | null
  status: string
  notes: string | null
  customerId: string
  customerName: string | null
  customerEmail: string | null
  createdByName: string | null
}

const statusStyles: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  no_show: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
}

function formatDuration(startsAt: string, endsAt: string | null): string {
  if (!endsAt) return "—"
  const diffMs = new Date(endsAt).getTime() - new Date(startsAt).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
}

const columns: ColumnDef<AppointmentRow>[] = [
  {
    id: "time",
    header: "Time",
    cell: ({ row }) => format(new Date(row.original.startsAt), "HH:mm"),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        to="/admin/appointments/$id"
        params={{ id: row.original.id }}
        className="font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => row.original.customerName ?? "—",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={statusStyles[row.original.status]} variant="outline">
        {statusLabels[row.original.status] ?? row.original.status}
      </Badge>
    ),
  },
  {
    id: "duration",
    header: "Duration",
    cell: ({ row }) => formatDuration(row.original.startsAt, row.original.endsAt),
  },
]

const EMPTY_DATA: AppointmentRow[] = []

function AppointmentsPage() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const startDate = startOfDay(selectedDate).toISOString()
  const endDate = endOfDay(selectedDate).toISOString()

  const appointments = useQuery({
    queryKey: ["appointments", "byDate", startDate, endDate],
    queryFn: () =>
      trpcClient.appointment.getBetweenDates.query({
        startDate,
        endDate,
      }),
  })

  const deleteMutation = useMutation(
    trpc.appointment.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["appointments"] })
        toast.success("Appointment deleted")
        setDeletingId(null)
      },
    }),
  )

  const data = (appointments.data as AppointmentRow[] | undefined) ?? EMPTY_DATA

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <Button asChild>
          <Link to="/admin/appointments/new">
            <PlusIcon className="mr-2 size-4" />
            New Appointment
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              if (date) setSelectedDate(date)
            }}
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {format(selectedDate, "EEEE, dd MMMM yyyy")}
        </span>
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
                              to: "/admin/appointments/$id",
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
                              to: "/admin/appointments/$id/edit",
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
                  {appointments.isLoading ? "Loading..." : "No appointments for this date."}
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
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
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
