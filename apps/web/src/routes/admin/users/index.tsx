import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { format } from "date-fns"
import {
  BanIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react"
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
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/admin/users/")({
  component: UsersPage,
})

type UserRow = {
  id: string
  name: string
  email: string
  role?: string | undefined
  banned: boolean | null
  createdAt: Date
}

const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant={row.original.role === "admin" ? "default" : "secondary"}>
        {row.original.role ?? "user"}
      </Badge>
    ),
  },
  {
    accessorKey: "banned",
    header: "Status",
    cell: ({ row }) =>
      row.original.banned ? (
        <Badge variant="destructive">Banned</Badge>
      ) : (
        <Badge variant="outline">Active</Badge>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => format(new Date(row.original.createdAt), "dd MMM yyyy"),
  },
]

function UsersPage() {
  const navigate = useNavigate()
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await authClient.admin.listUsers({
        query: { limit: 100 },
      })
      if (res.error) throw res.error
      return res.data
    },
  })

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.banUser({ userId })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      users.refetch()
      toast.success("User banned")
    },
  })

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.unbanUser({ userId })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      users.refetch()
      toast.success("User unbanned")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.removeUser({ userId })
      if (res.error) throw res.error
    },
    onSuccess: () => {
      users.refetch()
      toast.success("User deleted")
      setDeletingUserId(null)
    },
  })

  const data = users.data?.users ?? []

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Button asChild>
          <Link to="/admin/users/new">
            <PlusIcon className="mr-2 size-4" />
            New User
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
                              to: "/admin/users/$id/edit",
                              params: { id: row.original.id },
                            })
                          }
                        >
                          <PencilIcon className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>
                        {row.original.banned ? (
                          <DropdownMenuItem
                            onSelect={() => unbanMutation.mutate(row.original.id)}
                          >
                            <ShieldCheckIcon className="mr-2 size-4" />
                            Unban
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onSelect={() => banMutation.mutate(row.original.id)}
                          >
                            <BanIcon className="mr-2 size-4" />
                            Ban
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeletingUserId(row.original.id)}
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
                  {users.isLoading ? "Loading..." : "No users yet."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deletingUserId}
        onOpenChange={(open) => {
          if (!open) setDeletingUserId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deletingUserId) {
                  deleteMutation.mutate(deletingUserId)
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
