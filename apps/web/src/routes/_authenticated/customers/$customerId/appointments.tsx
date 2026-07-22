import { createFileRoute, redirect } from "@tanstack/react-router"

import {
  CustomerAppointmentsRoute,
  PAGE_SIZE,
  appointmentMasterOptionsQueryOptions,
  appointmentSalonOptionsQueryOptions,
  appointmentsQueryOptions,
  searchSchema,
} from "./-appointments-page"

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
  component: CustomerAppointmentsRoute,
})
