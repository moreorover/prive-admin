import { Button, Group, Pagination, Stack, Table, Text, TextInput } from "@mantine/core"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { z } from "zod"

import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { ClientDate } from "@/components/client-date"
import { Section } from "@/components/section"
import { trpc } from "@/utils/trpc"

const PAGE_SIZE = 25
const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
})

function appointmentsQueryOptions(customerId: string, page: number, search: string) {
  return trpc.customers.appointments.list.queryOptions({
    customerId,
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

export const Route = createFileRoute("/_authenticated/customers/$customerId/appointments")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps, params }) => {
    await context.queryClient.ensureQueryData(appointmentsQueryOptions(params.customerId, deps.page, deps.search))
  },
  component: CustomerAppointmentsRoute,
})

function CustomerAppointmentsRoute() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)

  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const normalizedSearch = searchValue.trim()
  const queryOptions = appointmentsQueryOptions(customerId, page, searchValue)
  const { data } = useQuery(queryOptions)
  const appointments = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const hasItemsOnCurrentPage = appointments.length > 0

  useEffect(() => {
    if (page !== clampedPage) {
      navigate({ search: { page: clampedPage, search: searchValue }, replace: true })
    }
  }, [clampedPage, navigate, page, searchValue])

  return (
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
          <Button variant="default" size="sm" leftSection={<IconPlus size={12} />} onClick={() => setDialogOpen(true)}>
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
                        <Link to="/appointments/$appointmentId" params={{ appointmentId: appointment.id }} {...props} />
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
        invalidateKeys={[
          { queryKey: trpc.customers.appointments.list.queryKey() },
          { queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey },
        ]}
        navigateOnSuccess
      />
    </Section>
  )
}
