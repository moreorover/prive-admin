import type { ComponentProps } from "react"

import { Alert, Container, Stack, Text } from "@mantine/core"
import { Schedule, type ScheduleEventData, type ScheduleViewLevel } from "@mantine/schedule"
import dayjs from "dayjs"
import { useCallback, useMemo, useState } from "react"

import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"

type OptionData = { items: { id: string; name: string }[] }
type AppointmentData = {
  items: {
    id: string
    name: string
    startsAt: string | Date
    client?: { name: string } | null
  }[]
  totalCount: number
}

export function CalendarPage({
  view,
  date,
  clientSearch,
  masterSearch,
  appointmentsData,
  clientCustomersData,
  masterCustomersData,
  salonsData,
  createPending,
  onViewChange,
  onDateChange,
  onClientSearchChange,
  onMasterSearchChange,
  onCreateAppointment,
  onOpenAppointment,
}: {
  view: ScheduleViewLevel
  date: string
  clientSearch: string
  masterSearch: string
  appointmentsData: AppointmentData | undefined
  clientCustomersData: OptionData | undefined
  masterCustomersData: OptionData | undefined
  salonsData: OptionData | undefined
  createPending: boolean
  onViewChange: (view: ScheduleViewLevel) => void
  onDateChange: (date: string) => void
  onClientSearchChange: (search: string) => void
  onMasterSearchChange: (search: string) => void
  onCreateAppointment: ComponentProps<typeof CreateAppointmentDialog>["onCreate"]
  onOpenAppointment: (appointmentId: string) => void
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [defaultStartsAt, setDefaultStartsAt] = useState<string | null>(null)
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
            onViewChange={onViewChange}
            date={date}
            onDateChange={onDateChange}
            layout="responsive"
            onEventClick={(event) => onOpenAppointment(String(event.id))}
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
          loading={createPending}
          onCreate={(values) => {
            onCreateAppointment(values)
            setCreateOpen(false)
          }}
          clientOptions={clientOptions}
          masterOptions={masterOptions}
          salonOptions={salonOptions}
          clientSearch={clientSearch}
          masterSearch={masterSearch}
          onClientSearchChange={onClientSearchChange}
          onMasterSearchChange={onMasterSearchChange}
        />
      </Stack>
    </Container>
  )
}
