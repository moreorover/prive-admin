import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"

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

export const Route = createFileRoute("/_authenticated/customers/$customerId/appointments")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps, params }) => {
    const [data] = await Promise.all([
      context.queryClient.ensureQueryData(appointmentsQueryOptions(params.customerId, deps.page, deps.search)),
      context.queryClient.prefetchQuery(appointmentMasterOptionsQueryOptions("")),
      context.queryClient.prefetchQuery(appointmentSalonOptionsQueryOptions()),
    ])
    const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/customers/$customerId/appointments",
        params: { customerId: params.customerId },
        search: { page: totalPages, search: deps.search },
      })
    }
  },
  component: routeComponent,
})

function routeComponent() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const [masterSearch, setMasterSearch] = useState("")
  const data = useQuery(appointmentsQueryOptions(customerId, page, searchValue)).data
  const masterCustomersData = useQuery(appointmentMasterOptionsQueryOptions(masterSearch)).data
  const salonsData = useQuery(appointmentSalonOptionsQueryOptions()).data
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

  return (
    <CustomerAppointmentsPage
      customerId={customerId}
      page={page}
      searchValue={searchValue}
      data={data}
      masterSearch={masterSearch}
      masterCustomersData={masterCustomersData}
      salonsData={salonsData}
      createPending={createAppointment.isPending}
      onCreateAppointment={(values) => createAppointment.mutate(values)}
      onMasterSearchChange={setMasterSearch}
      onSearchChange={(nextSearch) => navigate({ search: { page: 1, search: nextSearch }, replace: true })}
      onPageChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
    />
  )
}
