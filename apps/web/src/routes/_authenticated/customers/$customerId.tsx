import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@prive-admin-tanstack/ui/components/dialog"
import { Input } from "@prive-admin-tanstack/ui/components/input"
import { Label } from "@prive-admin-tanstack/ui/components/label"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prive-admin-tanstack/ui/components/table"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, Edit, Phone, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ClientDate } from "@/components/client-date"
import { getAppointmentsByCustomerId } from "@/functions/appointments"
import { getCustomer, updateCustomer } from "@/functions/customers"
import { getNotes, createNote, deleteNote } from "@/functions/notes"
import { customerKeys, appointmentKeys, noteKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  component: CustomerDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: customerKeys.detail(params.customerId),
          queryFn: () => getCustomer({ data: { id: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: appointmentKeys.byCustomer(params.customerId),
          queryFn: () => getAppointmentsByCustomerId({ data: { customerId: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: noteKeys.list({ customerId: params.customerId }),
          queryFn: () => getNotes({ data: { customerId: params.customerId } }),
        }),
      ),
    ])
  },
})

function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: { id: string; name: string; phoneNumber: string | null }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { id: string; name: string; phoneNumber?: string | null }) =>
      updateCustomer({ data: { id: data.id, name: data.name, phoneNumber: data.phoneNumber } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      onOpenChange(false)
      toast.success("Customer updated")
    },
    onError: (error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: { name: customer.name, phoneNumber: customer.phoneNumber ?? "" },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ id: customer.id, name: value.name, phoneNumber: value.phoneNumber || null })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Update customer details.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="phoneNumber">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Phone Number</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddNoteDialog({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { note: string; customerId: string }) => createNote({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
      onOpenChange(false)
      toast.success("Note added")
    },
    onError: (error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: { note: "" },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ note: value.note, customerId })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="note">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Note</Label>
                <textarea
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  placeholder="Write a note..."
                />
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Note"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CustomerDetailPage() {
  const { customerId } = Route.useParams()
  const [editOpen, setEditOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: customer, isLoading } = useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => getCustomer({ data: { id: customerId } }),
  })

  const { data: appointments } = useQuery({
    queryKey: appointmentKeys.byCustomer(customerId),
    queryFn: () => getAppointmentsByCustomerId({ data: { customerId } }),
  })

  const { data: notes } = useQuery({
    queryKey: noteKeys.list({ customerId }),
    queryFn: () => getNotes({ data: { customerId } }),
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteNote({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
      toast.success("Note deleted")
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!customer) {
    return <div className="px-6 py-8 text-muted-foreground">Customer not found.</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            to="/customers"
            className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to customers
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{customer.name}</h1>
          {customer.phoneNumber && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="size-3" />
              {customer.phoneNumber}
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Edit className="size-3" />
          Edit
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments && appointments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Link
                          to="/appointments/$appointmentId"
                          params={{ appointmentId: a.id }}
                          className="text-primary hover:underline"
                        >
                          {a.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <ClientDate date={a.startsAt} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No appointments yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Notes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setNoteOpen(true)}>
              <Plus className="size-3" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {notes && notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="flex items-start justify-between rounded-md border p-3">
                    <div className="space-y-1">
                      <p className="text-sm">{n.note}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.createdBy?.name ?? "Unknown"} &middot; <ClientDate date={n.createdAt} />
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteNoteMutation.mutate(n.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
      <AddNoteDialog customerId={customerId} open={noteOpen} onOpenChange={setNoteOpen} />
    </div>
  )
}
