import { createFileRoute } from "@tanstack/react-router"

import { trpc } from "@/utils/trpc"

import { APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE, availableHairOrdersListQueryOptions } from "./-appointment-detail-data"
import { AppointmentDetailRoute } from "./-appointment-detail-page"

export const Route = createFileRoute("/_authenticated/appointments/$appointmentId")({
  component: AppointmentDetailRoute,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(trpc.appointments.get.queryOptions({ id: params.appointmentId })),
      context.queryClient.ensureQueryData(
        trpc.hairAssigned.list.queryOptions({
          page: 1,
          pageSize: APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE,
          appointmentId: params.appointmentId,
        }),
      ),
      context.queryClient.ensureQueryData(
        trpc.transactions.list.queryOptions({
          page: 1,
          pageSize: APPOINTMENT_DETAIL_RESOURCE_PAGE_SIZE,
          appointmentId: params.appointmentId,
        }),
      ),
      context.queryClient.ensureQueryData(trpc.userSettings.get.queryOptions()),
      context.queryClient.prefetchQuery(availableHairOrdersListQueryOptions()),
    ])
  },
})
