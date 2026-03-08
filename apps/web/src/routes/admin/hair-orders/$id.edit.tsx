import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { format } from "date-fns"
import { BanknoteIcon } from "lucide-react"
import { toast } from "sonner"

import { CustomerCombobox } from "@/components/customer-combobox"
import { DatePicker } from "@/components/date-picker"
import { EntityHistory } from "@/components/entity-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { queryClient, trpc } from "@/utils/trpc"

export const Route = createFileRoute("/admin/hair-orders/$id/edit")({
  staticData: { title: "Edit Order" },
  component: EditHairOrderPage,
})

function formatCents(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100)
}

const txTypeLabels: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  paypal: "PayPal",
}

function EditHairOrderPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const order = useQuery(trpc.hairOrder.getById.queryOptions({ id }))
  const customers = useQuery(trpc.customer.getAll.queryOptions())
  const transactionsQuery = useQuery(trpc.transaction.getByHairOrder.queryOptions({ hairOrderId: id }))

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
    return <div className="text-center text-muted-foreground">Loading...</div>
  }

  if (!order.data) {
    return <div className="text-center text-muted-foreground">Order not found.</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex justify-end">
        <Button asChild size="sm" variant="outline">
          <Link
            to="/admin/transactions/new"
            search={{ customerId: order.data.customerId, hairOrderId: id }}
          >
            <BanknoteIcon className="mr-2 size-4" />
            Add Transaction
          </Link>
        </Button>
      </div>

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !transactionsQuery.data?.length ? (
            <p className="text-sm text-muted-foreground">No transactions linked to this order.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsQuery.data.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{format(new Date(tx.date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{tx.description ?? "—"}</TableCell>
                      <TableCell>
                        <span
                          className={
                            tx.amount >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {formatCents(tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{txTypeLabels[tx.type] ?? tx.type}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
        <CardContent className="m-2 space-y-4">
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
