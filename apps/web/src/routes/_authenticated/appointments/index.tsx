import {
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Modal,
  NativeSelect,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconCalendar, IconPlus } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { createAppointment, getAppointments } from "@/functions/appointments"
import { getCustomers } from "@/functions/customers"
import { getActiveLegalEntityId } from "@/functions/get-active-legal-entity"
import { listLegalEntities } from "@/functions/legal-entities"
import { listSalons } from "@/functions/salons"
import { setActiveLegalEntity } from "@/functions/user-settings"
import { COUNTRY_FLAGS, type Country } from "@/lib/legal-entity"
import { appointmentKeys, customerKeys } from "@/lib/query-keys"

const appointmentsQueryOptions = queryOptions({
  queryKey: appointmentKeys.list(),
  queryFn: () => getAppointments({ data: {} }),
})

export const Route = createFileRoute("/_authenticated/appointments/")({
  component: AppointmentsPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(appointmentsQueryOptions)
  },
})

function CreateAppointmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })
  const salonsQuery = useQuery({ queryKey: ["salons"], queryFn: () => listSalons() })

  const mutation = useMutation({
    mutationFn: (data: { name: string; startsAt: string; clientId: string; salonId: string; legalEntityId: string }) =>
      createAppointment({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Appointment created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({ initialValues: { name: "", startsAt: "", clientId: "", salonId: "", legalEntityId: "" } })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Appointment">
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Date & Time" type="datetime-local" {...form.getInputProps("startsAt")} />
          <NativeSelect
            label="Client"
            data={[
              { value: "", label: "Select a client…" },
              ...(customers?.map((c) => ({ value: c.id, label: c.name })) ?? []),
            ]}
            {...form.getInputProps("clientId")}
          />
          <Select
            label="Salon"
            required
            data={(salonsQuery.data ?? []).map((s) => ({
              value: s.id,
              label: `${COUNTRY_FLAGS[s.country as Country] ?? ""} ${s.name}`,
            }))}
            value={form.values.salonId}
            onChange={(salonId) => {
              form.setFieldValue("salonId", salonId ?? "")
              const selectedSalon = salonsQuery.data?.find((s) => s.id === salonId)
              if (selectedSalon) {
                form.setFieldValue("legalEntityId", selectedSalon.defaultLegalEntityId)
              }
            }}
          />
          {(() => {
            const selectedSalon = salonsQuery.data?.find((s) => s.id === form.values.salonId)
            const country = selectedSalon?.country
            const countryLEs = (legalEntitiesQuery.data ?? []).filter((le) => le.country === country)
            const lockedToSingle = countryLEs.length === 1
            return (
              <Select
                label="Legal entity"
                required
                disabled={!country || lockedToSingle}
                data={countryLEs.map((le) => ({
                  value: le.id,
                  label: `${COUNTRY_FLAGS[le.country as Country] ?? ""} ${le.name}`,
                }))}
                value={form.values.legalEntityId}
                onChange={(v) => form.setFieldValue("legalEntityId", v ?? "")}
              />
            )
          })()}
          <Button type="submit" loading={mutation.isPending}>
            Create Appointment
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function AppointmentsPage() {
  const { data: appointments, isLoading } = useQuery(appointmentsQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const activeQuery = useQuery({ queryKey: ["active-legal-entity"], queryFn: () => getActiveLegalEntityId() })
  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })
  const setActive = useMutation({
    mutationFn: () => setActiveLegalEntity({ data: { legalEntityId: null } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["active-legal-entity"] })
      await queryClient.invalidateQueries({ queryKey: ["appointments"] })
    },
  })
  const activeName = activeQuery.data
    ? (legalEntitiesQuery.data?.find((le) => le.id === activeQuery.data)?.name ?? null)
    : null

  return (
    <Container size="lg">
      <Stack>
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Group gap="xs" c="dimmed">
              <IconCalendar size={16} />
              <Text size="xs" tt="uppercase">
                Appointments
              </Text>
            </Group>
            <Title order={2}>Appointments</Title>
          </Stack>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setDialogOpen(true)}>
            New Appointment
          </Button>
        </Group>

        {activeName ? (
          <Group gap="xs" mb="xs">
            <Text size="sm" c="dimmed">
              Filtering: {activeName}
            </Text>
            <Anchor size="sm" onClick={() => setActive.mutate()}>
              clear
            </Anchor>
          </Group>
        ) : null}

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Client</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Legal Entity</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Skeleton h={14} w={120} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={90} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={80} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={70} />
                    </Table.Td>
                  </Table.Tr>
                ))
              : appointments?.map((a) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>
                      <Text
                        renderRoot={(props) => (
                          <Link to="/appointments/$appointmentId" params={{ appointmentId: a.id }} {...props} />
                        )}
                        c="blue"
                        fw={500}
                      >
                        {a.name}
                      </Text>
                    </Table.Td>
                    <Table.Td c="dimmed">{a.client?.name ?? "—"}</Table.Td>
                    <Table.Td c="dimmed">
                      <ClientDate date={a.startsAt} showTime />
                    </Table.Td>
                    <Table.Td>
                      {a.legalEntity ? (
                        <Badge variant="light" size="sm">
                          {a.legalEntity.name}
                        </Badge>
                      ) : null}
                    </Table.Td>
                  </Table.Tr>
                ))}
            {!isLoading && appointments?.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={4} ta="center" c="dimmed">
                  No appointments yet.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <CreateAppointmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </Stack>
    </Container>
  )
}
