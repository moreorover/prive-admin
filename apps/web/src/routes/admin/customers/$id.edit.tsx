import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { queryClient, trpc } from "@/utils/trpc"

export const Route = createFileRoute("/admin/customers/$id/edit")({
  staticData: { title: "Edit Customer" },
  component: EditCustomerPage,
})

function EditCustomerPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const customer = useQuery(trpc.user.getById.queryOptions({ id }))

  const updateMutation = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["user", "getAll"]] })
        toast.success("Customer updated")
        navigate({ to: "/admin/customers" })
      },
    }),
  )

  if (customer.isLoading) {
    return <div className="text-muted-foreground text-center">Loading...</div>
  }

  if (!customer.data) {
    return <div className="text-muted-foreground text-center">Customer not found.</div>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <CustomerEditForm
        customer={customer.data}
        onSubmit={async (value) => {
          await updateMutation.mutateAsync({
            id,
            name: value.name,
            email: value.email,
          })
        }}
        isPending={updateMutation.isPending}
        onCancel={() => navigate({ to: "/admin/customers" })}
      />
    </div>
  )
}

function CustomerEditForm({
  customer,
  onSubmit,
  isPending,
  onCancel,
}: {
  customer: { name: string; email: string }
  onSubmit: (value: { name: string; email: string }) => Promise<void>
  isPending: boolean
  onCancel: () => void
}) {
  const form = useForm({
    defaultValues: {
      name: customer.name,
      email: customer.email,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Customer</CardTitle>
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
                  placeholder="Full name"
                />
              </Field>
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onSubmit: ({ value }) => (!value ? "Email is required" : undefined),
            }}
          >
            {(field) => (
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="email@example.com"
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
