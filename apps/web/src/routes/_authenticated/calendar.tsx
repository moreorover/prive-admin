import { createFileRoute } from "@tanstack/react-router"
import dayjs from "dayjs"

import { CalendarPage } from "./-components/calendar-page"
import {
  appointmentCustomerOptionsQueryOptions,
  appointmentSalonOptionsQueryOptions,
  calendarAppointmentsQueryOptions,
} from "./-data/calendar-data"

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
