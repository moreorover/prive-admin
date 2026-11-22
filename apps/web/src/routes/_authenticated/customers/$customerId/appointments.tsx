import { useDebouncedCallback, useDebouncedValue } from "@mantine/hooks"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { trpc } from "@/utils/trpc"

import { useCreateAppointmentAction } from "../../-actions/appointment-actions"
import { CustomerAppointmentsPage } from "./-components/appointments-page"
import {
  PAGE_SIZE,
  appointmentMasterOptionsQueryOptions,
  appointmentSalonOptionsQueryOptions,
  appointmentsQueryOptions,
  searchSchema,
} from "./-data/appointments-data"

const searchNavigationDebounceMs = 300
const searchDebounceMs = 300

export const Route = createFileRoute("/_authenticated/customers/$customerId/appointments")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps, params }) => {
    const data = await context.queryClient.ensureQueryData(
      appointmentsQueryOptions(params.customerId, deps.page, deps.search),
    )
    const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/customers/$customerId/appointments",
        params: { customerId: params.customerId },
        search: { page: totalPages, search: deps.search },
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [draftSearch, setDraftSearch] = useState(searchValue)
  const [masterSearch, setMasterSearch] = useState("")
  const [debouncedMasterSearch] = useDebouncedValue(masterSearch, searchDebounceMs)
  const data = useQuery(appointmentsQueryOptions(customerId, page, searchValue)).data
  const masterCustomersData = useQuery({
    ...appointmentMasterOptionsQueryOptions(debouncedMasterSearch),
    enabled: createDialogOpen,
  }).data
  const salonsData = useQuery({
    ...appointmentSalonOptionsQueryOptions(),
    enabled: createDialogOpen,
  }).data
  const createAppointment = useCreateAppointmentAction({
    invalidateKeys: [
      { queryKey: trpc.customers.appointments.list.queryKey() },
      { queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey },
    ],
    onCreated: (created) => {
      if (created?.id) {
        navigate({ to: "/appointments/$appointmentId", params: { appointmentId: created.id } })
      }
    },
  })
  const navigateToSearch = useDebouncedCallback((nextSearch: string) => {
    navigate({ search: { page: 1, search: nextSearch }, replace: true })
  }, searchNavigationDebounceMs)

  useEffect(() => {
    setDraftSearch(searchValue)
  }, [searchValue])

  return (
    <CustomerAppointmentsPage
      customerId={customerId}
      page={page}
      searchValue={draftSearch}
      data={data}
      createDialogOpen={createDialogOpen}
      masterSearch={masterSearch}
      masterCustomersData={masterCustomersData}
      salonsData={salonsData}
      createPending={createAppointment.isPending}
      onCreateAppointment={(values) => createAppointment.mutate(values)}
      onCreateDialogOpenChange={setCreateDialogOpen}
      onMasterSearchChange={setMasterSearch}
      onSearchChange={(nextSearch) => {
        setDraftSearch(nextSearch)
        navigateToSearch(nextSearch)
      }}
      onPageChange={(nextPage) => {
        navigateToSearch.cancel()
        navigate({ search: { page: nextPage, search: searchValue } })
      }}
    />
  )
}
