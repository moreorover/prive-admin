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
import { Plus, Users } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { ClientDate } from "@/components/client-date"
import { getCustomers, createCustomer } from "@/functions/customers"
import { customerKeys } from "@/lib/query-keys"

const customersQueryOptions = queryOptions({
  queryKey: customerKeys.list(),
  queryFn: () => getCustomers(),
})

export const Route = createFileRoute("/_authenticated/customers/")({
  component: CustomersPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(customersQueryOptions)
  },
})

function CustomerFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { name: string; phoneNumber: string | null }) => createCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      onOpenChange(false)
      toast.success("Customer created")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const form = useForm({
    defaultValues: { name: "", phoneNumber: "" },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        name: value.name,
        phoneNumber: value.phoneNumber || null,
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>Add a new customer to the system.</DialogDescription>
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
                {isSubmitting ? "Creating..." : "Create Customer"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CustomersPage() {
  const { data: customers, isLoading } = useQuery(customersQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4" />
            <span className="text-xs tracking-widest uppercase">Customers</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Customers</h1>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3" />
          New Customer
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Created</TableHead>
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
                : customers?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link
                          to="/customers/$customerId"
                          params={{ customerId: c.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.phoneNumber ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <ClientDate date={c.createdAt} />
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && customers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No customers yet. Create your first one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
