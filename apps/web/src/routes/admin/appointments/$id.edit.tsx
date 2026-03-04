import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { format } from "date-fns"
import { toast } from "sonner"

import { CustomerCombobox } from "@/components/customer-combobox"
import { DatePicker } from "@/components/date-picker"
import { EntityHistory } from "@/components/entity-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { queryClient, trpc } from "@/utils/trpc"

export const Route = createFileRoute("/admin/appointments/$id/edit")({
  staticData: { title: "Edit Appointment" },
  component: EditAppointmentPage,
})

function combineDateAndTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const combined = new Date(date)
  combined.setHours(hours, minutes, 0, 0)
  return combined.toISOString()
}

function extractTime(dateStr: string): string {
  return format(new Date(dateStr), "HH:mm")
}

function EditAppointmentPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const appointmentQuery = useQuery(trpc.appointment.getById.queryOptions({ id }))
  const customers = useQuery(trpc.customer.getAll.queryOptions())

  const updateMutation = useMutation(
    trpc.appointment.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["appointment"]] })
        toast.success("Appointment updated")
        navigate({ to: "/admin/appointments" })
      },
    }),
  )

  if (appointmentQuery.isLoading) {
    return <div className="text-center text-muted-foreground">Loading...</div>
  }

  if (!appointmentQuery.data) {
    return <div className="text-center text-muted-foreground">Appointment not found.</div>
  }

  const appt = appointmentQuery.data

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AppointmentEditForm
        appointment={appt}
        customers={customers.data ?? []}
        onSubmit={async (value) => {
          if (!value.date || !value.startTime) return

          const startsAt = combineDateAndTime(value.date, value.startTime)
          const endsAt = value.endTime ? combineDateAndTime(value.date, value.endTime) : null

          await updateMutation.mutateAsync({
            id,
            name: value.name,
            startsAt,
            endsAt,
            customerId: value.customerId,
            status: value.status as "scheduled" | "completed" | "cancelled" | "no_show",
            notes: value.notes || null,
          })
        }}
        isPending={updateMutation.isPending}
        onCancel={() => navigate({ to: "/admin/appointments" })}
      />

      <EntityHistory entityType="appointment" entityId={id} />
    </div>
  )
}

function AppointmentEditForm({
  appointment,
  customers,
  onSubmit,
  isPending,
  onCancel,
}: {
  appointment: {
    name: string
    startsAt: string
    endsAt: string | null
    status: string
    notes: string | null
    customerId: string
  }
  customers: { id: string; name: string; email: string }[]
  onSubmit: (value: {
    name: string
    customerId: string
    date: Date | undefined
    startTime: string
    endTime: string
    status: string
    notes: string
  }) => Promise<void>
  isPending: boolean
  onCancel: () => void
}) {
  const form = useForm({
    defaultValues: {
      name: appointment.name,
      customerId: appointment.customerId,
      date: new Date(appointment.startsAt) as Date | undefined,
      startTime: extractTime(appointment.startsAt),
      endTime: appointment.endsAt ? extractTime(appointment.endsAt) : "",
      status: appointment.status,
      notes: appointment.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Appointment</CardTitle>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <CardContent className="m-2 space-y-4">
          <form.Field
            name="name"
            validators={{
              onSubmit: ({ value }) => (!value ? "Name is required" : undefined),
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Appointment name"
                />
              </Field>
            )}
          </form.Field>

          <form.Field
            name="customerId"
            validators={{
              onSubmit: ({ value }) => (!value ? "Customer is required" : undefined),
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>Customer</FieldLabel>
                <CustomerCombobox
                  customers={customers}
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                />
              </Field>
            )}
          </form.Field>

          <form.Field
            name="date"
            validators={{
              onSubmit: ({ value }) => (!value ? "Date is required" : undefined),
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>Date</FieldLabel>
                <DatePicker
                  value={field.state.value}
                  onChange={(date) => field.handleChange(date)}
                />
              </Field>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field
              name="startTime"
              validators={{
                onSubmit: ({ value }) => (!value ? "Start time is required" : undefined),
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel>Start Time</FieldLabel>
                  <Input
                    type="time"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="endTime">
              {(field) => (
                <Field>
                  <FieldLabel>End Time</FieldLabel>
                  <Input
                    type="time"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="status">
            {(field) => (
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={field.state.value} onValueChange={(val) => field.handleChange(val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <Field>
                <FieldLabel>Notes</FieldLabel>
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                />
              </Field>
            )}
          </form.Field>
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Update"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
