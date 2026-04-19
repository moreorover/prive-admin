import { Badge } from "@prive-admin-tanstack/ui/components/badge"
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
import { Plus, Scissors } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ClientDate } from "@/components/client-date"
import { getCustomers } from "@/functions/customers"
import { getHairOrders, createHairOrder } from "@/functions/hair-orders"
import { hairOrderKeys, customerKeys } from "@/lib/query-keys"

const hairOrdersQueryOptions = queryOptions({
  queryKey: hairOrderKeys.list(),
  queryFn: () => getHairOrders(),
})

export const Route = createFileRoute("/_authenticated/hair-orders/")({
  component: HairOrdersPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(hairOrdersQueryOptions)
  },
})

function CreateHairOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const mutation = useMutation({
    mutationFn: (data: {
      customerId: string
      placedAt: string | null
      arrivedAt: string | null
      status: "PENDING" | "COMPLETED"
      weightReceived: number
      weightUsed: number
      total: number
    }) => createHairOrder({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      onOpenChange(false)
      toast.success("Hair order created")
    },
    onError: (error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: {
      customerId: "",
      placedAt: "",
      weightReceived: 0,
      total: 0,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        customerId: value.customerId,
        placedAt: value.placedAt || null,
        arrivedAt: null,
        status: "PENDING",
        weightReceived: value.weightReceived,
        weightUsed: 0,
        total: value.total,
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Hair Order</DialogTitle>
          <DialogDescription>Create a new hair order.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="customerId">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Customer</Label>
                <select
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="">Select a customer...</option>
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>
          <form.Field name="placedAt">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Placed At</Label>
                <Input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="weightReceived">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Weight (g)</Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="total">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Total (cents)</Label>
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                </div>
              )}
            </form.Field>
          </div>
          <form.Subscribe selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}>
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Hair Order"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HairOrdersPage() {
  const { data: hairOrders, isLoading } = useQuery(hairOrdersQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scissors className="size-4" />
            <span className="text-xs tracking-widest uppercase">Hair Orders</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Hair Orders</h1>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3" />
          New Order
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Weight (g)</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                : hairOrders?.map((ho) => (
                    <TableRow key={ho.id}>
                      <TableCell>
                        <Link
                          to="/hair-orders/$hairOrderId"
                          params={{ hairOrderId: ho.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          #{ho.uid}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ho.customer?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={ho.status === "COMPLETED" ? "default" : "outline"}>{ho.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ho.weightReceived}g</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ho.placedAt ? <ClientDate date={ho.placedAt} /> : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && hairOrders?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hair orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateHairOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
