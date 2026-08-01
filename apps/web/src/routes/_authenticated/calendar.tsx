import type { ScheduleViewLevel } from "@mantine/schedule"

import { useDebouncedValue } from "@mantine/hooks"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import dayjs from "dayjs"
import { useState } from "react"

import { useCreateAppointmentAction } from "./-actions/appointment-actions"
import { CalendarPage } from "./-components/calendar-page"
import {
  appointmentCustomerOptionsQueryOptions,
  appointmentSalonOptionsQueryOptions,
  calendarAppointmentsQueryOptions,
} from "./-data/calendar-data"

const searchDebounceMs = 300

export const Route = createFileRoute("/_authenticated/calendar")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(calendarAppointmentsQueryOptions(dayjs().format("YYYY-MM-DD"), "month")),
      context.queryClient.prefetchQuery(appointmentCustomerOptionsQueryOptions("")),
      context.queryClient.prefetchQuery(appointmentSalonOptionsQueryOptions()),
    ])
  },
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const [view, setView] = useState<ScheduleViewLevel>("month")
  const [date, setDate] = useState<string>(() => dayjs().format("YYYY-MM-DD"))
  const [clientSearch, setClientSearch] = useState("")
  const [masterSearch, setMasterSearch] = useState("")
  const [debouncedClientSearch] = useDebouncedValue(clientSearch, searchDebounceMs)
  const [debouncedMasterSearch] = useDebouncedValue(masterSearch, searchDebounceMs)
  const appointmentsQueryOptions = calendarAppointmentsQueryOptions(date, view)
  const appointmentsData = useQuery(appointmentsQueryOptions).data
  const clientCustomersData = useQuery(appointmentCustomerOptionsQueryOptions(debouncedClientSearch)).data
  const masterCustomersData = useQuery(appointmentCustomerOptionsQueryOptions(debouncedMasterSearch)).data
  const salonsData = useQuery(appointmentSalonOptionsQueryOptions()).data
  const createAppointment = useCreateAppointmentAction({
    invalidateKeys: [{ queryKey: appointmentsQueryOptions.queryKey }],
    onCreated: (created) => {
      if (created?.id) {
        navigate({ to: "/appointments/$appointmentId", params: { appointmentId: created.id } })
      }
    },
  })

  return (
    <CalendarPage
      view={view}
      date={date}
      clientSearch={clientSearch}
      masterSearch={masterSearch}
      appointmentsData={appointmentsData}
      clientCustomersData={clientCustomersData}
      masterCustomersData={masterCustomersData}
      salonsData={salonsData}
      createPending={createAppointment.isPending}
      onViewChange={setView}
      onDateChange={setDate}
      onClientSearchChange={setClientSearch}
      onMasterSearchChange={setMasterSearch}
      onCreateAppointment={(values) => createAppointment.mutate(values)}
      onOpenAppointment={(appointmentId) => navigate({ to: "/appointments/$appointmentId", params: { appointmentId } })}
    />
  )
}
