import type { ComponentProps } from "react"

import { Button, Group, Pagination, Stack, Table, Text, TextInput } from "@mantine/core"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"

import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { ClientDate } from "@/components/client-date"
import { Section } from "@/components/section"

import { PAGE_SIZE } from "../-data/appointments-data"

type AppointmentRow = { id: string; name: string; startsAt: string | Date }
type OptionData = { items: { id: string; name: string }[] }

export function CustomerAppointmentsPage({
  customerId,
  page,
  searchValue,
  data,
  masterSearch,
  masterCustomersData,
  salonsData,
  createPending,
  onCreateAppointment,
  onMasterSearchChange,
  onSearchChange,
  onPageChange,
}: {
  customerId: string
  page: number
  searchValue: string
  data: { items: AppointmentRow[]; totalCount: number } | undefined
  masterSearch: string
  masterCustomersData: OptionData | undefined
  salonsData: OptionData | undefined
  createPending: boolean
  onCreateAppointment: ComponentProps<typeof CreateAppointmentDialog>["onCreate"]
  onMasterSearchChange: (search: string) => void
  onSearchChange: (search: string) => void
  onPageChange: (page: number) => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const normalizedSearch = searchValue.trim()
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
                onSearchChange(event.currentTarget.value)
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
            <Pagination value={clampedPage} total={totalPages} onChange={onPageChange} />
          </Group>
        </Stack>

        <CreateAppointmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          defaultClientId={customerId}
          loading={createPending}
          onCreate={(values) => {
            onCreateAppointment(values)
            setDialogOpen(false)
          }}
          clientOptions={[]}
          masterOptions={masterOptions}
          salonOptions={salonOptions}
          clientSearch=""
          masterSearch={masterSearch}
          onClientSearchChange={() => {}}
          onMasterSearchChange={onMasterSearchChange}
        />
      </Section>
    </>
  )
}
