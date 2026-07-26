import { type ScheduleViewLevel } from "@mantine/schedule"
import dayjs from "dayjs"

import { trpc } from "@/utils/trpc"

const CALENDAR_APPOINTMENTS_PAGE_SIZE = 100
const APPOINTMENT_OPTION_PAGE_SIZE = 100

function getVisibleDateRange(date: string, view: ScheduleViewLevel) {
  const current = dayjs(date)
  if (view === "day") {
    return {
      startDate: current.startOf("day").toISOString(),
      endDate: current.endOf("day").toISOString(),
    }
  }

  if (view === "week") {
    const start = current.startOf("day").subtract((current.day() + 6) % 7, "day")
    return {
      startDate: start.toISOString(),
      endDate: start.add(6, "day").endOf("day").toISOString(),
    }
  }

  return {
    startDate: current.startOf("month").toISOString(),
    endDate: current.endOf("month").toISOString(),
  }
}

export function calendarAppointmentsQueryOptions(date: string, view: ScheduleViewLevel) {
  return trpc.appointments.list.queryOptions({
    page: 1,
    pageSize: CALENDAR_APPOINTMENTS_PAGE_SIZE,
    ...getVisibleDateRange(date, view),
  })
}

export function appointmentCustomerOptionsQueryOptions(search: string) {
  return trpc.customers.list.queryOptions({
    page: 1,
    pageSize: APPOINTMENT_OPTION_PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

export function appointmentSalonOptionsQueryOptions() {
  return trpc.salons.list.queryOptions({ page: 1, pageSize: APPOINTMENT_OPTION_PAGE_SIZE })
}
