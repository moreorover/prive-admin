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
import { useStore } from "@tanstack/react-form"

type SearchParams = {
  customerId?: string
  appointmentId?: string
  hairOrderId?: string
}

export const Route = createFileRoute("/admin/transactions/new")({
  staticData: { title: "New Transaction" },
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    customerId: typeof search.customerId === "string" ? search.customerId : undefined,
    appointmentId: typeof search.appointmentId === "string" ? search.appointmentId : undefined,
    hairOrderId: typeof search.hairOrderId === "string" ? search.hairOrderId : undefined,
  }),
  component: NewTransactionPage,
})

function NewTransactionPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const customers = useQuery(trpc.customer.getAll.queryOptions())
  const appointments = useQuery(trpc.appointment.getAll.queryOptions())
  const hairOrders = useQuery(trpc.hairOrder.getAll.queryOptions())

  const createMutation = useMutation(
    trpc.transaction.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["transaction"]] })
        toast.success("Transaction created")
        navigate({ to: "/admin/transactions" })
      },
    }),
  )

  const form = useForm({
    defaultValues: {
      amount: "",
      type: "cash",
      description: "",
      date: new Date() as Date | undefined,
      customerId: search.customerId ?? "",
      appointmentId: search.appointmentId ?? "",
      hairOrderId: search.hairOrderId ?? "",
    },
    onSubmit: async ({ value }) => {
      if (!value.date) return

      const amountNum = parseFloat(value.amount)
      if (isNaN(amountNum)) return

      await createMutation.mutateAsync({
        amount: Math.round(amountNum * 100),
        type: value.type as "bank" | "cash" | "paypal",
        description: value.description || null,
        date: value.date.toISOString(),
        customerId: value.customerId,
        appointmentId: value.appointmentId || null,
        hairOrderId: value.hairOrderId || null,
      })
    },
  })

  const selectedCustomerId = useStore(form.store, (s) => s.values.customerId)

  const filteredAppointments = (appointments.data ?? []).filter(
    (a) => a.customerId === selectedCustomerId,
  )
  const filteredHairOrders = (hairOrders.data ?? []).filter(
    (h) => h.customerId === selectedCustomerId,
  )

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New Transaction</CardTitle>
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
              name="amount"
              validators={{
                onSubmit: ({ value }) => {
                  if (!value) return "Amount is required"
                  if (isNaN(parseFloat(value))) return "Amount must be a number"
                  return undefined
                },
              }}
            >
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0 || undefined}>
                  <FieldLabel>Amount (EUR)</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. 50.00 or -25.00"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError>{field.state.meta.errors.join(", ")}</FieldError>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="type">
              {(field) => (
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <Select value={field.state.value} onValueChange={(val) => field.handleChange(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
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

            {selectedCustomerId && filteredAppointments.length > 0 && (
              <form.Field name="appointmentId">
                {(field) => (
                  <Field>
                    <FieldLabel>Appointment (optional)</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val === "__none__" ? "" : val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {filteredAppointments.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>
            )}

            {selectedCustomerId && filteredHairOrders.length > 0 && (
              <form.Field name="hairOrderId">
                {(field) => (
                  <Field>
                    <FieldLabel>Hair Order (optional)</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val === "__none__" ? "" : val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {filteredHairOrders.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            #{h.uid}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>
            )}
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/transactions" })}
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
