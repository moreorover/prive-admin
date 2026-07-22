import { Button, Group, Pagination, Stack, Table, Text, TextInput } from "@mantine/core"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"

import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { ClientDate } from "@/components/client-date"
import { Section } from "@/components/section"
import { trpc } from "@/utils/trpc"

import { useCreateAppointmentAction } from "../../-appointment-actions"
import { Route } from "./appointments"

export const PAGE_SIZE = 25
const APPOINTMENT_OPTION_PAGE_SIZE = 100
export const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
})

export function appointmentsQueryOptions(customerId: string, page: number, search: string) {
  return trpc.customers.appointments.list.queryOptions({
    customerId,
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

export function appointmentMasterOptionsQueryOptions(search: string) {
  return trpc.customers.list.queryOptions({
    page: 1,
    pageSize: APPOINTMENT_OPTION_PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

export function appointmentSalonOptionsQueryOptions() {
  return trpc.salons.list.queryOptions({ page: 1, pageSize: APPOINTMENT_OPTION_PAGE_SIZE })
}

export function CustomerAppointmentsRoute() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [masterSearch, setMasterSearch] = useState("")

  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const normalizedSearch = searchValue.trim()
  const queryOptions = appointmentsQueryOptions(customerId, page, searchValue)
  const { data } = useQuery(queryOptions)
  const { data: masterCustomersData } = useQuery(appointmentMasterOptionsQueryOptions(masterSearch))
  const { data: salonsData } = useQuery(appointmentSalonOptionsQueryOptions())
  const masterOptions = (masterCustomersData?.items ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }))
  const salonOptions = (salonsData?.items ?? []).map((salon) => ({ value: salon.id, label: salon.name }))
  const appointments = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const hasItemsOnCurrentPage = appointments.length > 0
  const createAppointment = useCreateAppointmentAction({
    invalidateKeys: [
      { queryKey: trpc.customers.appointments.list.queryKey() },
      { queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey },
    ],
    onCreated: (created) => {
      setDialogOpen(false)
      if (created?.id) {
        navigate({ to: "/appointments/$appointmentId", params: { appointmentId: created.id } })
      }
    },
  })

  return (
    <>
      <BreadcrumbItem label="Appointments" order={30} />
      <Section
        title="Appointments"
        description="Appointment history for this customer."
        actions={
          <>
            <TextInput
              label="Search"
              placeholder="Search appointments"
              leftSection={<IconSearch size={16} />}
              value={searchValue}
              onChange={(event) => {
                navigate({ search: { page: 1, search: event.currentTarget.value }, replace: true })
              }}
              w={260}
            />
            <Button
              variant="default"
              size="sm"
              leftSection={<IconPlus size={12} />}
              onClick={() => setDialogOpen(true)}
            >
              New
            </Button>
          </>
        }
        padding={hasItemsOnCurrentPage ? 0 : "lg"}
      >
        <Stack gap="md">
          {hasItemsOnCurrentPage ? (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {appointments.map((appointment) => (
                  <Table.Tr key={appointment.id}>
                    <Table.Td>
                      <Text
                        renderRoot={(props) => (
                          <Link
                            to="/appointments/$appointmentId"
                            params={{ appointmentId: appointment.id }}
                            {...props}
                          />
                        )}
                        c="blue"
                      >
                        {appointment.name}
                      </Text>
                    </Table.Td>
                    <Table.Td c="dimmed">
                      <ClientDate date={appointment.startsAt} />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text size="sm" c="dimmed" p="lg">
              {normalizedSearch ? "No appointments match your search." : "No appointments on this page."}
            </Text>
          )}

          <Group justify="space-between" px="md" pb="md">
            <Text size="sm" c="dimmed">
              {totalCount} appointment{totalCount === 1 ? "" : "s"} · Page {clampedPage} of {totalPages}
            </Text>
            <Pagination
              value={clampedPage}
              total={totalPages}
              onChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
            />
          </Group>
        </Stack>

        <CreateAppointmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          defaultClientId={customerId}
          loading={createAppointment.isPending}
          onCreate={(values) => createAppointment.mutate(values)}
          clientOptions={[]}
          masterOptions={masterOptions}
          salonOptions={salonOptions}
          clientSearch=""
          masterSearch={masterSearch}
          onClientSearchChange={() => {}}
          onMasterSearchChange={setMasterSearch}
        />
      </Section>
    </>
  )
}
