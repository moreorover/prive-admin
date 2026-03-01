import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { EntityHistory } from "@/components/entity-history"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { queryClient, trpc } from "@/utils/trpc"

export const Route = createFileRoute("/admin/customers/$id/edit")({
  staticData: { title: "Edit Customer" },
  component: EditCustomerPage,
})

function EditCustomerPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const customer = useQuery(trpc.customer.getById.queryOptions({ id }))
  const allUsers = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await authClient.admin.listUsers({ query: { limit: 100 } })
      if (res.error) throw res.error
      return res.data.users
    },
  })

  const updateMutation = useMutation(
    trpc.customer.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["customer"]] })
        toast.success("Customer updated")
        navigate({ to: "/admin/customers" })
      },
    }),
  )

  const assignMutation = useMutation(
    trpc.customer.assignUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["customer", "getById"]] })
        toast.success("User assigned")
      },
    }),
  )

  const unassignMutation = useMutation(
    trpc.customer.unassignUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [["customer", "getById"]] })
        toast.success("User unassigned")
      },
    }),
  )

  if (customer.isLoading) {
    return <div className="text-muted-foreground text-center">Loading...</div>
  }

  if (!customer.data) {
    return <div className="text-muted-foreground text-center">Customer not found.</div>
  }

  const assignedUserIds = new Set(customer.data.users.map((u) => u.id))
  const availableUsers = (allUsers.data ?? []).filter((u) => !assignedUserIds.has(u.id))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Assigned Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customer.data.users.length > 0 ? (
            <ul className="space-y-2">
              {customer.data.users.map((u) => (
                <li key={u.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-muted-foreground text-xs">{u.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      unassignMutation.mutate({ customerId: id, userId: u.id })
                    }
                    disabled={unassignMutation.isPending}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No users assigned.</p>
          )}

          <AssignUserSection
            users={availableUsers}
            onAssign={(userId) => assignMutation.mutate({ customerId: id, userId })}
            isPending={assignMutation.isPending}
          />
        </CardContent>
      </Card>

      <EntityHistory entityType="customer" entityId={id} />
    </div>
  )
}

type UserOption = { value: string; label: string }

function AssignUserSection({
  users,
  onAssign,
  isPending,
}: {
  users: { id: string; name: string; email: string }[]
  onAssign: (userId: string) => void
  isPending: boolean
}) {
  const [selectedUserId, setSelectedUserId] = useState("")

  const options: UserOption[] = users.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }))

  const selected = options.find((o) => o.value === selectedUserId) ?? null

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <FieldLabel>Assign User</FieldLabel>
        <Combobox<UserOption>
          value={selected}
          onValueChange={(val) => setSelectedUserId(val?.value ?? "")}
          isItemEqualToValue={(a, b) => a.value === b.value}
          items={options}
        >
          <ComboboxInput placeholder="Search users..." />
          <ComboboxContent>
            <ComboboxEmpty>No users found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <Button
        type="button"
        disabled={!selectedUserId || isPending}
        onClick={() => {
          onAssign(selectedUserId)
          setSelectedUserId("")
        }}
      >
        Assign
      </Button>
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
