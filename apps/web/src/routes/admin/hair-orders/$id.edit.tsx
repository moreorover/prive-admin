import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { EntityHistory } from "@/components/entity-history"
import { CustomerCombobox } from "@/components/customer-combobox"
import { DatePicker } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { queryClient, trpc } from "@/utils/trpc"

export const Route = createFileRoute("/admin/hair-orders/$id/edit")({
  staticData: { title: "Edit Order" },
  component: EditHairOrderPage,
})

function EditHairOrderPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const order = useQuery(trpc.hairOrder.getById.queryOptions({ id }))
  const customers = useQuery(trpc.customer.getAll.queryOptions())

  const updateMutation = useMutation(
    trpc.hairOrder.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["hairOrder", "getAll"]] })
        toast.success("Order updated")
        navigate({ to: "/admin/hair-orders" })
      },
    }),
  )

  if (order.isLoading) {
    return <div className="text-muted-foreground text-center">Loading...</div>
  }

  if (!order.data) {
    return <div className="text-muted-foreground text-center">Order not found.</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <HairOrderEditForm
        order={order.data}
        customers={customers.data ?? []}
        onSubmit={async (value) => {
          await updateMutation.mutateAsync({
            id,
            customerId: value.customerId,
            placedAt: value.placedAt || null,
            arrivedAt: value.arrivedAt || null,
            weightReceived: value.weightReceived,
            total: value.total,
          })
        }}
        isPending={updateMutation.isPending}
        onCancel={() => navigate({ to: "/admin/hair-orders" })}
      />

      <EntityHistory entityType="hair_order" entityId={id} />
    </div>
  )
}

function HairOrderEditForm({
  order,
  customers,
  onSubmit,
  isPending,
  onCancel,
}: {
  order: {
    customerId: string
    placedAt: string | null
    arrivedAt: string | null
    weightReceived: number
    total: number
  }
  customers: { id: string; name: string; email: string }[]
  onSubmit: (value: {
    customerId: string
    placedAt: string
    arrivedAt: string
    weightReceived: number
    total: number
  }) => Promise<void>
  isPending: boolean
  onCancel: () => void
}) {
  const form = useForm({
    defaultValues: {
      customerId: order.customerId,
      placedAt: order.placedAt ?? "",
      arrivedAt: order.arrivedAt ?? "",
      weightReceived: order.weightReceived,
      total: order.total,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Order</CardTitle>
      </CardHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <CardContent className="space-y-4 m-2">
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

          <form.Field name="placedAt">
            {(field) => (
              <Field>
                <FieldLabel>Placed At</FieldLabel>
                <DatePicker
                  value={field.state.value ? new Date(field.state.value) : undefined}
                  onChange={(date) => field.handleChange(date ? date.toISOString() : "")}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="arrivedAt">
            {(field) => (
              <Field>
                <FieldLabel>Arrived At</FieldLabel>
                <DatePicker
                  value={field.state.value ? new Date(field.state.value) : undefined}
                  onChange={(date) => field.handleChange(date ? date.toISOString() : "")}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="weightReceived">
            {(field) => (
              <Field>
                <FieldLabel>Weight Received (g)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="total">
            {(field) => (
              <Field>
                <FieldLabel>Total (£)</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
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
