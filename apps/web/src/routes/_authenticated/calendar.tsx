import { Alert, Container, Stack, Text } from "@mantine/core"
import { Schedule, type ScheduleEventData, type ScheduleViewLevel } from "@mantine/schedule"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import dayjs from "dayjs"
import { useCallback, useMemo, useState } from "react"

import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { trpc } from "@/utils/trpc"

const CALENDAR_APPOINTMENTS_PAGE_SIZE = 100

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

function calendarAppointmentsQueryOptions(date: string, view: ScheduleViewLevel) {
  return trpc.appointments.list.queryOptions({
    page: 1,
    pageSize: CALENDAR_APPOINTMENTS_PAGE_SIZE,
    ...getVisibleDateRange(date, view),
  })
}

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(calendarAppointmentsQueryOptions(dayjs().format("YYYY-MM-DD"), "month"))
  },
})

function CalendarPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<ScheduleViewLevel>("month")
  const [date, setDate] = useState<string>(() => dayjs().format("YYYY-MM-DD"))
  const [createOpen, setCreateOpen] = useState(false)
  const [defaultStartsAt, setDefaultStartsAt] = useState<string | null>(null)
  const appointmentsQueryOptions = calendarAppointmentsQueryOptions(date, view)
  const { data: appointmentsData } = useQuery(appointmentsQueryOptions)
  const visibleAppointmentCount = appointmentsData?.items.length ?? 0
  const appointmentTotalCount = appointmentsData?.totalCount ?? 0
  const hasHiddenAppointments = appointmentTotalCount > visibleAppointmentCount

  const openCreate = useCallback((startsAt: string | null) => {
    setDefaultStartsAt(startsAt)
    setCreateOpen(true)
  }, [])

  const events = useMemo<ScheduleEventData[]>(() => {
    const appointments = appointmentsData?.items ?? []
    return (appointments ?? []).map((a) => {
      const start = dayjs(a.startsAt)
      const end = start.add(1, "hour")
      return {
        id: a.id,
        title: a.client?.name ? `${a.name} — ${a.client.name}` : a.name,
        start: start.format("YYYY-MM-DD HH:mm:ss"),
        end: end.format("YYYY-MM-DD HH:mm:ss"),
        color: "blue",
      }
    })
  }, [appointmentsData])

  const goToAppointment = useCallback(
    (id: string) => {
      navigate({ to: "/appointments/$appointmentId", params: { appointmentId: id } })
    },
    [navigate],
  )

  return (
    <Container size="xl">
      <PageHeader title="Calendar" description="Click a slot to book or open an existing appointment." />
      <Stack>
        {hasHiddenAppointments && (
          <Alert color="yellow" variant="light">
            <Text size="sm">
              Showing first {visibleAppointmentCount} of {appointmentTotalCount} appointments in this range. Narrow the
              view or date range.
            </Text>
          </Alert>
        )}
        <Section padding="md">
          <Schedule
            events={events}
            view={view}
            onViewChange={setView}
            date={date}
            onDateChange={setDate}
            layout="responsive"
            onEventClick={(event) => goToAppointment(String(event.id))}
            onTimeSlotClick={({ slotStart }) => openCreate(slotStart)}
            onDayClick={(d) => openCreate(`${d} 09:00:00`)}
            dayViewProps={{
              startTime: "09:00:00",
              endTime: "19:00:00",
              intervalMinutes: 30,
            }}
            weekViewProps={{
              startTime: "09:00:00",
              endTime: "19:00:00",
              intervalMinutes: 30,
              withWeekendDays: true,
            }}
            monthViewProps={{
              firstDayOfWeek: 1,
            }}
          />
        </Section>
        <CreateAppointmentDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultStartsAt={defaultStartsAt}
          invalidateKeys={[{ queryKey: appointmentsQueryOptions.queryKey }]}
          navigateOnSuccess
        />
      </Stack>
    </Container>
  )
}
