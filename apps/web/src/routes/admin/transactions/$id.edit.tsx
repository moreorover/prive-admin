import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { CustomerCombobox } from "@/components/customer-combobox"
import { DatePicker } from "@/components/date-picker"
import { EntityHistory } from "@/components/entity-history"
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

export const Route = createFileRoute("/admin/transactions/$id/edit")({
  staticData: { title: "Edit Transaction" },
  component: EditTransactionPage,
})

function EditTransactionPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const txQuery = useQuery(trpc.transaction.getById.queryOptions({ id }))
  const customers = useQuery(trpc.customer.getAll.queryOptions())
  const appointments = useQuery(trpc.appointment.getAll.queryOptions())
  const hairOrders = useQuery(trpc.hairOrder.getAll.queryOptions())

  const updateMutation = useMutation(
    trpc.transaction.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["transaction"]] })
        toast.success("Transaction updated")
        navigate({ to: "/admin/transactions" })
      },
    }),
  )

  if (txQuery.isLoading) {
    return <div className="text-center text-muted-foreground">Loading...</div>
  }

  if (!txQuery.data) {
    return <div className="text-center text-muted-foreground">Transaction not found.</div>
  }

  const tx = txQuery.data

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <TransactionEditForm
        transaction={tx}
        customers={customers.data ?? []}
        appointments={appointments.data ?? []}
        hairOrders={hairOrders.data ?? []}
        onSubmit={async (value) => {
          if (!value.date) return

          const amountNum = parseFloat(value.amount)
          if (isNaN(amountNum)) return

          await updateMutation.mutateAsync({
            id,
            amount: Math.round(amountNum * 100),
            type: value.type as "bank" | "cash" | "paypal",
            description: value.description || null,
            date: value.date.toISOString(),
            customerId: value.customerId,
            appointmentId: value.appointmentId || null,
            hairOrderId: value.hairOrderId || null,
          })
        }}
        isPending={updateMutation.isPending}
        onCancel={() => navigate({ to: "/admin/transactions" })}
      />

      <EntityHistory entityType="transaction" entityId={id} />
    </div>
  )
}

function TransactionEditForm({
  transaction,
  customers,
  appointments,
  hairOrders,
  onSubmit,
  isPending,
  onCancel,
}: {
  transaction: {
    amount: number
    type: string
    description: string | null
    date: string
    customerId: string
    appointmentId: string | null
    hairOrderId: string | null
  }
  customers: { id: string; name: string; email: string | null }[]
  appointments: { id: string; name: string; customerId: string }[]
  hairOrders: { id: string; uid: number; customerId: string }[]
  onSubmit: (value: {
    amount: string
    type: string
    description: string
    date: Date | undefined
    customerId: string
    appointmentId: string
    hairOrderId: string
  }) => Promise<void>
  isPending: boolean
  onCancel: () => void
}) {
  const form = useForm({
    defaultValues: {
      amount: (transaction.amount / 100).toString(),
      type: transaction.type,
      description: transaction.description ?? "",
      date: new Date(transaction.date) as Date | undefined,
      customerId: transaction.customerId,
      appointmentId: transaction.appointmentId ?? "",
      hairOrderId: transaction.hairOrderId ?? "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  const selectedCustomerId = useStore(form.store, (s) => s.values.customerId)

  const filteredAppointments = appointments.filter((a) => a.customerId === selectedCustomerId)
  const filteredHairOrders = hairOrders.filter((h) => h.customerId === selectedCustomerId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Transaction</CardTitle>
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
                  customers={customers}
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
