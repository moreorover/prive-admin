import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { trpc } from "@/utils/trpc"

import { useUpdateCustomerAction } from "./-actions/customer-detail-actions"
import { CustomerDetailPage } from "./-components/route-page"

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(trpc.customers.get.queryOptions({ id: params.customerId })),
      context.queryClient.ensureQueryData(trpc.customers.summary.queryOptions({ id: params.customerId })),
    ])
  },
})

function RouteComponent() {
  const { customerId } = Route.useParams()
  const navigate = Route.useNavigate()
  const customer = useQuery(trpc.customers.get.queryOptions({ id: customerId })).data
  const summary = useQuery(trpc.customers.summary.queryOptions({ id: customerId })).data
  const [editOpen, setEditOpen] = useState(false)
  const updateCustomer = useUpdateCustomerAction({ customerId, onUpdated: () => setEditOpen(false) })

  return (
    <CustomerDetailPage
      customerId={customerId}
      customer={customer}
      summary={summary}
      editOpen={editOpen}
      updatePending={updateCustomer.isPending}
      onEditOpenChange={setEditOpen}
      onUpdateCustomer={(values) => updateCustomer.mutateAsync(values)}
      onTabChange={(activeTab, value) => {
        if (!value || value === activeTab) return
        if (value === "appointments") {
          navigate({ to: "/customers/$customerId/appointments", params: { customerId } })
          return
        }
        if (value === "notes") {
          navigate({ to: "/customers/$customerId/notes", params: { customerId } })
          return
        }
        if (value === "hair-sales") {
          navigate({ to: "/customers/$customerId/hair-sales", params: { customerId } })
        }
      }}
    />
  )
}
