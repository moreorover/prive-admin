import { Button, Container, Group, Modal, NativeSelect, Skeleton, Stack, Table, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconCalendar, IconPlus } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { createAppointment, getAppointments } from "@/functions/appointments"
import { getCustomers } from "@/functions/customers"
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

  const mutation = useMutation({
    mutationFn: (data: { name: string; startsAt: string; clientId: string }) => createAppointment({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Appointment created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({ initialValues: { name: "", startsAt: "", clientId: "" } })

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

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Client</Table.Th>
              <Table.Th>Date</Table.Th>
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
                  </Table.Tr>
                ))
              : appointments?.map((a) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>
                      <Text
                        renderRoot={(props) => <Link to="/appointments/$appointmentId" params={{ appointmentId: a.id }} {...props} />}
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
                  </Table.Tr>
                ))}
            {!isLoading && appointments?.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3} ta="center" c="dimmed">
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
