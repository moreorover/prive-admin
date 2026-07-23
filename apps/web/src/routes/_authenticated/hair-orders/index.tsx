import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { trpc } from "@/utils/trpc"

import { useCreateHairOrderAction } from "./-actions/hair-order-actions"
import { HairOrdersPage } from "./-components/index-page"

const hairOrdersPageSize = 25
const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }

export const Route = createFileRoute("/_authenticated/hair-orders/")({
  component: RouteComponent,
})

function RouteComponent() {
  const [page, setPage] = useState(1)
  const [customerSearch, setCustomerSearch] = useState("")
  const hairOrdersQuery = useQuery(trpc.hairOrders.list.queryOptions({ page, pageSize: hairOrdersPageSize }))
  const customersData = useQuery(
    trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: customerSearch.trim() || undefined,
    }),
  ).data
  const createHairOrder = useCreateHairOrderAction({})

  return (
    <HairOrdersPage
      page={page}
      pageSize={hairOrdersPageSize}
      hairOrdersData={hairOrdersQuery.data}
      isLoading={hairOrdersQuery.isLoading}
      customerSearch={customerSearch}
      customersData={customersData}
      createPending={createHairOrder.isPending}
      onPageChange={setPage}
      onCustomerSearchChange={setCustomerSearch}
      onCreateHairOrder={(values) => createHairOrder.mutateAsync(values)}
    />
  )
}
