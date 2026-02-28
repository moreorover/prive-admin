import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { CustomerCombobox } from "@/components/customer-combobox"
import { DatePicker } from "@/components/date-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { queryClient, trpc } from "@/utils/trpc"

export const Route = createFileRoute("/admin/hair-orders/new")({
  staticData: { title: "New Order" },
  component: NewHairOrderPage,
})

function NewHairOrderPage() {
  const navigate = useNavigate()
  const customers = useQuery(trpc.customer.getAll.queryOptions())

  const createMutation = useMutation(
    trpc.hairOrder.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["hairOrder", "getAll"]] })
        toast.success("Order created")
        navigate({ to: "/admin/hair-orders" })
      },
    }),
  )

  const form = useForm({
    defaultValues: {
      customerId: "",
      placedAt: "",
      arrivedAt: "",
      weightReceived: 0,
      total: 0,
    },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync({
        customerId: value.customerId,
        placedAt: value.placedAt || null,
        arrivedAt: value.arrivedAt || null,
        weightReceived: value.weightReceived,
        total: value.total,
      })
    },
  })

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New Order</CardTitle>
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
                    customers={customers.data ?? []}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/hair-orders" })}
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
