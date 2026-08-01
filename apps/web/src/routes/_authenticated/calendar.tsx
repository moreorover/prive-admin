import type { ScheduleViewLevel } from "@mantine/schedule"

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

export const Route = createFileRoute("/_authenticated/calendar")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(calendarAppointmentsQueryOptions(dayjs().format("YYYY-MM-DD"), "month"))
  },
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const [view, setView] = useState<ScheduleViewLevel>("month")
  const [date, setDate] = useState<string>(() => dayjs().format("YYYY-MM-DD"))
  const [createOpen, setCreateOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [masterSearch, setMasterSearch] = useState("")
  const appointmentsQueryOptions = calendarAppointmentsQueryOptions(date, view)
  const appointmentsData = useQuery(appointmentsQueryOptions).data
  const clientCustomersData = useQuery({
    ...appointmentCustomerOptionsQueryOptions(clientSearch),
    enabled: createOpen,
  }).data
  const masterCustomersData = useQuery({
    ...appointmentCustomerOptionsQueryOptions(masterSearch),
    enabled: createOpen,
  }).data
  const salonsData = useQuery({
    ...appointmentSalonOptionsQueryOptions(),
    enabled: createOpen,
  }).data
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
      createOpen={createOpen}
      clientSearch={clientSearch}
      masterSearch={masterSearch}
      appointmentsData={appointmentsData}
      clientCustomersData={clientCustomersData}
      masterCustomersData={masterCustomersData}
      salonsData={salonsData}
      createPending={createAppointment.isPending}
      onViewChange={setView}
      onDateChange={setDate}
      onCreateOpenChange={setCreateOpen}
      onClientSearchChange={setClientSearch}
      onMasterSearchChange={setMasterSearch}
      onCreateAppointment={(values) => createAppointment.mutate(values)}
      onOpenAppointment={(appointmentId) => navigate({ to: "/appointments/$appointmentId", params: { appointmentId } })}
    />
  )
}
