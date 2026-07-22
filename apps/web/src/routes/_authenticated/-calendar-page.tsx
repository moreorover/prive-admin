import { Alert, Container, Stack, Text } from "@mantine/core"
import { Schedule, type ScheduleEventData, type ScheduleViewLevel } from "@mantine/schedule"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import dayjs from "dayjs"
import { useCallback, useMemo, useState } from "react"

import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"

import { useCreateAppointmentAction } from "./-appointment-actions"
import {
  appointmentCustomerOptionsQueryOptions,
  appointmentSalonOptionsQueryOptions,
  calendarAppointmentsQueryOptions,
} from "./-calendar-data"

export function CalendarPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<ScheduleViewLevel>("month")
  const [date, setDate] = useState<string>(() => dayjs().format("YYYY-MM-DD"))
  const [createOpen, setCreateOpen] = useState(false)
  const [defaultStartsAt, setDefaultStartsAt] = useState<string | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [masterSearch, setMasterSearch] = useState("")
  const appointmentsQueryOptions = calendarAppointmentsQueryOptions(date, view)
  const { data: appointmentsData } = useQuery(appointmentsQueryOptions)
  const { data: clientCustomersData } = useQuery(appointmentCustomerOptionsQueryOptions(clientSearch))
  const { data: masterCustomersData } = useQuery(appointmentCustomerOptionsQueryOptions(masterSearch))
  const { data: salonsData } = useQuery(appointmentSalonOptionsQueryOptions())
  const clientOptions = (clientCustomersData?.items ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }))
  const masterOptions = (masterCustomersData?.items ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }))
  const salonOptions = (salonsData?.items ?? []).map((salon) => ({ value: salon.id, label: salon.name }))
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
  const createAppointment = useCreateAppointmentAction({
    invalidateKeys: [{ queryKey: appointmentsQueryOptions.queryKey }],
    onCreated: (created) => {
      setCreateOpen(false)
      if (created?.id) {
        navigate({ to: "/appointments/$appointmentId", params: { appointmentId: created.id } })
      }
    },
  })

  return (
    <Container size="xl">
      <BreadcrumbItem label="Calendar" order={10} />
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
          loading={createAppointment.isPending}
          onCreate={(values) => createAppointment.mutate(values)}
          clientOptions={clientOptions}
          masterOptions={masterOptions}
          salonOptions={salonOptions}
          clientSearch={clientSearch}
          masterSearch={masterSearch}
          onClientSearchChange={setClientSearch}
          onMasterSearchChange={setMasterSearch}
        />
      </Stack>
    </Container>
  )
}
