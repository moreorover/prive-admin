import { Container, Stack, Title } from "@mantine/core"
import { Schedule, type ScheduleEventData, type ScheduleViewLevel } from "@mantine/schedule"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useState } from "react"

import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { getAppointments } from "@/functions/appointments"
import { appointmentKeys } from "@/lib/query-keys"

const appointmentsQueryOptions = queryOptions({
  queryKey: appointmentKeys.list(),
  queryFn: () => getAppointments({ data: {} }),
})

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(appointmentsQueryOptions)
  },
})

function CalendarPage() {
  const { data: appointments } = useQuery(appointmentsQueryOptions)
  const navigate = useNavigate()
  const [view, setView] = useState<ScheduleViewLevel>("month")
  const [date, setDate] = useState<string>(dayjs().format("YYYY-MM-DD"))
  const [createOpen, setCreateOpen] = useState(false)
  const [defaultStartsAt, setDefaultStartsAt] = useState<string | null>(null)

  const openCreate = useCallback((startsAt: string | null) => {
    setDefaultStartsAt(startsAt)
    setCreateOpen(true)
  }, [])

  const events = useMemo<ScheduleEventData[]>(() => {
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
  }, [appointments])

  const goToAppointment = useCallback(
    (id: string) => {
      navigate({ to: "/appointments/$appointmentId", params: { appointmentId: id } })
    },
    [navigate],
  )

  // Mantine Schedule v9.1.0 doesn't forward onClick to events rendered inside the
  // "+N more" overflow popover (see node_modules/@mantine/schedule/.../MoreEvents.mjs:33).
  // Document-level delegation on data-event-id catches those popover clicks too.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const node = target?.closest("[data-event-id]")
      if (!node) return
      const id = node.getAttribute("data-event-id")
      if (id) {
        e.preventDefault()
        goToAppointment(id)
      }
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [goToAppointment])

  return (
    <Container size="xl">
      <Stack>
        <Title order={2}>Calendar</Title>
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
        <CreateAppointmentDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultStartsAt={defaultStartsAt}
          invalidateKeys={[{ queryKey: appointmentKeys.list() }]}
          navigateOnSuccess
        />
      </Stack>
    </Container>
  )
}
