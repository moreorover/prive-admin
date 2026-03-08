import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { CustomerCombobox } from "@/components/customer-combobox"
import { DatePicker } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
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

export const Route = createFileRoute("/admin/appointments/new")({
  staticData: { title: "New Appointment" },
  component: NewAppointmentPage,
})

function combineDateAndTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const combined = new Date(date)
  combined.setHours(hours, minutes, 0, 0)
  return combined.toISOString()
}

function NewAppointmentPage() {
  const navigate = useNavigate()
  const customers = useQuery(trpc.customer.getAll.queryOptions())

  const createMutation = useMutation(
    trpc.appointment.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["appointment"]] })
        toast.success("Appointment created")
        navigate({ to: "/admin/appointments" })
      },
    }),
  )

  const form = useForm({
    defaultValues: {
      name: "",
      customerId: "",
      date: new Date() as Date | undefined,
      startTime: "",
      endTime: "",
      status: "scheduled",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      if (!value.date || !value.startTime) return

      const startsAt = combineDateAndTime(value.date, value.startTime)
      const endsAt = value.endTime ? combineDateAndTime(value.date, value.endTime) : null

      await createMutation.mutateAsync({
        name: value.name,
        startsAt,
        endsAt,
        customerId: value.customerId,
        status: value.status as "scheduled" | "completed" | "cancelled" | "no_show",
        notes: value.notes || null,
      })
    },
  })

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New Appointment</CardTitle>
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
                <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Appointment name"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  )}
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
                <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                  <FieldLabel>Customer</FieldLabel>
                  <CustomerCombobox
                    customers={customers.data ?? []}
                    value={field.state.value}
                    onChange={(val) => field.handleChange(val)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  )}
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
                <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                  <FieldLabel>Date</FieldLabel>
                  <DatePicker
                    value={field.state.value}
                    onChange={(date) => field.handleChange(date)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  )}
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
                  <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                    <FieldLabel>Start Time</FieldLabel>
                    <Input
                      type="time"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                    )}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/appointments" })}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
