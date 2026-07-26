import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"

import { type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { trpc } from "@/utils/trpc"

import { useHairAssignmentActions } from "../../-actions/hair-assignment-actions"
import { HairSalesPage } from "./-components/hair-sales-page"
import {
  HAIR_SALES_PAGE_SIZE,
  availableHairOrdersListQueryOptions,
  hairSalesQueryOptions,
  searchSchema,
  useHairSalesData,
} from "./-data/hair-sales-data"

export const Route = createFileRoute("/_authenticated/customers/$customerId/hair-sales")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps, params }) => {
    const [data] = await Promise.all([
      context.queryClient.ensureQueryData(hairSalesQueryOptions(params.customerId, deps.page, deps.search)),
      context.queryClient.prefetchQuery(availableHairOrdersListQueryOptions()),
    ])
    const totalPages = Math.max(1, Math.ceil(data.totalCount / HAIR_SALES_PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/customers/$customerId/hair-sales",
        params: { customerId: params.customerId },
        search: { page: totalPages, search: deps.search },
      })
    }
  },
})

function RouteComponent() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [hairEditItem, setHairEditItem] = useState<HairAssignedRow | null>(null)
  const [hairDeleteItem, setHairDeleteItem] = useState<HairAssignedRow | null>(null)
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const data = useHairSalesData({ customerId, page, search: searchValue })
  const customerSummaryQueryKey = trpc.customers.summary.queryOptions({ id: customerId }).queryKey
  const { createHairAssigned, updateHairAssigned, deleteHairAssigned } = useHairAssignmentActions({
    invalidateKeys: [{ queryKey: trpc.customers.hairAssigned.list.queryKey() }, { queryKey: customerSummaryQueryKey }],
    selectedEditItem: hairEditItem,
    selectedDeleteItem: hairDeleteItem,
  })

  return (
    <HairSalesPage
      customerId={customerId}
      searchValue={searchValue}
      data={data}
      hairEditItem={hairEditItem}
      hairDeleteItem={hairDeleteItem}
      createPending={createHairAssigned.isPending}
      updatePending={updateHairAssigned.isPending}
      deletePending={deleteHairAssigned.isPending}
      onHairEditItemChange={setHairEditItem}
      onHairDeleteItemChange={setHairDeleteItem}
      onSearchChange={(nextSearch) => navigate({ search: { page: 1, search: nextSearch }, replace: true })}
      onPageChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
      onCreate={(values) => {
        createHairAssigned.mutate(values)
        navigate({ search: { page: 1, search: searchValue }, replace: true })
      }}
      onUpdate={(values) => updateHairAssigned.mutate(values)}
      onDelete={(id) => {
        deleteHairAssigned.mutate({ id })
        navigate({ search: { page: 1, search: searchValue }, replace: true })
      }}
    />
  )
}
