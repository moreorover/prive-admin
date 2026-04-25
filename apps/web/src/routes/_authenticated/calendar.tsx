import { Container, Stack, Title } from "@mantine/core"
import { Schedule, type ScheduleEventData, type ScheduleViewLevel } from "@mantine/schedule"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import dayjs from "dayjs"
import { useCallback, useMemo, useState } from "react"

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
  const [view, setView] = useState<ScheduleViewLevel>("week")
  const [date, setDate] = useState<string>(dayjs().format("YYYY-MM-DD"))

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
    (id: string | number) => {
      navigate({ to: "/appointments/$appointmentId", params: { appointmentId: String(id) } })
    },
    [navigate],
  )

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
          onEventClick={(event) => goToAppointment(event.id)}
          renderEventBody={(event) => (
            <span
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer", display: "block", width: "100%", height: "100%" }}
              onClick={(e) => {
                e.stopPropagation()
                goToAppointment(event.id)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  goToAppointment(event.id)
                }
              }}
            >
              {event.title}
            </span>
          )}
        />
      </Stack>
    </Container>
  )
}
