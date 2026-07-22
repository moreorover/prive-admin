import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import {
  appointmentDetailQueryOptions,
  appointmentHairAssignedQueryOptions,
  appointmentTransactionsQueryOptions,
  availableHairOrdersListQueryOptions,
} from "./-appointment-detail-data"
import { AppointmentDetailPage } from "./-appointment-detail-page"

export const Route = createFileRoute("/_authenticated/appointments/$appointmentId")({
  component: AppointmentDetailRoute,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(appointmentDetailQueryOptions(params.appointmentId)),
      context.queryClient.ensureQueryData(appointmentHairAssignedQueryOptions(params.appointmentId, 1)),
      context.queryClient.ensureQueryData(appointmentTransactionsQueryOptions(params.appointmentId, 1)),
      context.queryClient.ensureQueryData(trpc.userSettings.get.queryOptions()),
      context.queryClient.prefetchQuery(availableHairOrdersListQueryOptions()),
    ])
  },
})

function AppointmentDetailRoute() {
  const { appointmentId } = Route.useParams()
  return <AppointmentDetailPage key={appointmentId} appointmentId={appointmentId} />
}
