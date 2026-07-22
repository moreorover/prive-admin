import { createFileRoute } from "@tanstack/react-router"
import dayjs from "dayjs"

import {
  appointmentCustomerOptionsQueryOptions,
  appointmentSalonOptionsQueryOptions,
  calendarAppointmentsQueryOptions,
} from "./-calendar-data"
import { CalendarPage } from "./-calendar-page"

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(calendarAppointmentsQueryOptions(dayjs().format("YYYY-MM-DD"), "month")),
      context.queryClient.prefetchQuery(appointmentCustomerOptionsQueryOptions("")),
      context.queryClient.prefetchQuery(appointmentSalonOptionsQueryOptions()),
    ])
  },
})
