import { useDebouncedCallback } from "@mantine/hooks"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useEffect, useState } from "react"

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

const searchNavigationDebounceMs = 300

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
  const [draftSearch, setDraftSearch] = useState(searchValue)
  const data = useHairSalesData({ customerId, page, search: searchValue })
  const customerSummaryQueryKey = trpc.customers.summary.queryOptions({ id: customerId }).queryKey
  const { createHairAssigned, updateHairAssigned, deleteHairAssigned } = useHairAssignmentActions({
    invalidateKeys: [{ queryKey: trpc.customers.hairAssigned.list.queryKey() }, { queryKey: customerSummaryQueryKey }],
    selectedEditItem: hairEditItem,
    selectedDeleteItem: hairDeleteItem,
  })
  const navigateToSearch = useDebouncedCallback((nextSearch: string) => {
    navigate({ search: { page: 1, search: nextSearch }, replace: true })
  }, searchNavigationDebounceMs)

  useEffect(() => {
    setDraftSearch(searchValue)
  }, [searchValue])

  return (
    <HairSalesPage
      customerId={customerId}
      searchValue={draftSearch}
      data={data}
      hairEditItem={hairEditItem}
      hairDeleteItem={hairDeleteItem}
      createPending={createHairAssigned.isPending}
      updatePending={updateHairAssigned.isPending}
      deletePending={deleteHairAssigned.isPending}
      onHairEditItemChange={setHairEditItem}
      onHairDeleteItemChange={setHairDeleteItem}
      onSearchChange={(nextSearch) => {
        setDraftSearch(nextSearch)
        navigateToSearch(nextSearch)
      }}
      onPageChange={(nextPage) => {
        navigateToSearch.cancel()
        navigate({ search: { page: nextPage, search: searchValue } })
      }}
      onCreate={(values) => {
        navigateToSearch.cancel()
        createHairAssigned.mutate(values)
        navigate({ search: { page: 1, search: searchValue }, replace: true })
      }}
      onUpdate={(values) => updateHairAssigned.mutate(values)}
      onDelete={(id) => {
        navigateToSearch.cancel()
        deleteHairAssigned.mutate({ id })
        navigate({ search: { page: 1, search: searchValue }, replace: true })
      }}
    />
  )
}
