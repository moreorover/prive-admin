import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent } from "@prive-admin-tanstack/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@prive-admin-tanstack/ui/components/dialog"
import { Input } from "@prive-admin-tanstack/ui/components/input"
import { Label } from "@prive-admin-tanstack/ui/components/label"
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
import { Calendar, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ClientDate } from "@/components/client-date"
import { getAppointments, createAppointment } from "@/functions/appointments"
import { getCustomers } from "@/functions/customers"
import { appointmentKeys, customerKeys } from "@/lib/query-keys"

const appointmentsQueryOptions = queryOptions({
  queryKey: appointmentKeys.list(),
  queryFn: () => getAppointments({ data: {} }),
})

export const Route = createFileRoute("/_authenticated/appointments/")({
  component: AppointmentsPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(appointmentsQueryOptions)
  },
})

function CreateAppointmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const mutation = useMutation({
    mutationFn: (data: { name: string; startsAt: string; clientId: string }) => createAppointment({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      onOpenChange(false)
      toast.success("Appointment created")
    },
    onError: (error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: { name: "", startsAt: "", clientId: "" },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>Schedule a new appointment.</DialogDescription>
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
          <form.Field name="startsAt">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Date & Time</Label>
                <Input
                  id={field.name}
                  type="datetime-local"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="clientId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Client</Label>
                <select
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="">Select a client...</option>
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Appointment"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AppointmentsPage() {
  const { data: appointments, isLoading } = useQuery(appointmentsQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="size-4" />
            <span className="text-xs tracking-widest uppercase">Appointments</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Appointments</h1>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3" />
          New Appointment
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                : appointments?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Link
                          to="/appointments/$appointmentId"
                          params={{ appointmentId: a.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {a.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{a.client?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground"><ClientDate date={a.startsAt} showTime /></TableCell>
                    </TableRow>
                  ))}
              {!isLoading && appointments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No appointments yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateAppointmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
