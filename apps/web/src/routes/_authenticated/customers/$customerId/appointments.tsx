import { Button, Group, Pagination, Table, Text, TextInput } from "@mantine/core"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { CreateAppointmentDialog } from "@/components/appointments/create-appointment-dialog"
import { ClientDate } from "@/components/client-date"
import { Section } from "@/components/section"
import { clampPage } from "@/lib/resource-pagination"
import { trpc } from "@/utils/trpc"

import {
  CUSTOMER_DETAIL_PAGE_SIZE,
  customerAppointmentsQueryArgs,
  customerDetailQueryInput,
  customerDetailSearchSchema,
} from "./customer-detail-queries"

export const Route = createFileRoute("/_authenticated/customers/$customerId/appointments")({
  validateSearch: customerDetailSearchSchema,
  loaderDeps: ({ search }) => customerDetailQueryInput(search),
  loader: async ({ context, deps, params }) => {
    await context.queryClient.ensureQueryData(
      trpc.customers.appointments.list.queryOptions(customerAppointmentsQueryArgs(params.customerId, deps)),
    )
  },
  component: CustomerAppointmentsRoute,
})

function CustomerAppointmentsRoute() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryInput = customerAppointmentsQueryArgs(customerId, search)
  const { data } = useQuery(trpc.customers.appointments.list.queryOptions(queryInput))
  const [dialogOpen, setDialogOpen] = useState(false)

  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const appointments = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / CUSTOMER_DETAIL_PAGE_SIZE))
  const clampedPage = clampPage({ page, pageSize: CUSTOMER_DETAIL_PAGE_SIZE, totalCount })

  useEffect(() => {
    if (page !== clampedPage) {
      navigate({ search: { page: clampedPage, search: searchValue }, replace: true })
    }
  }, [clampedPage, navigate, page, searchValue])

  const updateSearch = (value: string) => {
    navigate({ search: { page: 1, search: value }, replace: true })
  }

  return (
    <Section
      title="Appointments"
      actions={
        <Button variant="default" size="sm" leftSection={<IconPlus size={12} />} onClick={() => setDialogOpen(true)}>
          New
        </Button>
      }
      padding={appointments.length > 0 || totalCount > 0 ? 0 : "lg"}
    >
      <Group p="md" justify="space-between" align="flex-end">
        <TextInput
          label="Search"
          placeholder="Search appointments"
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(event) => updateSearch(event.currentTarget.value)}
          miw={260}
          flex={1}
        />
        <Text size="sm" c="dimmed">
          {totalCount} appointment{totalCount === 1 ? "" : "s"}
        </Text>
      </Group>

      {appointments.length > 0 ? (
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
          {searchValue.trim() ? "No appointments match your search." : "No appointments yet."}
        </Text>
      )}

      {totalCount > 0 && (
        <Group justify="space-between" p="md">
          <Text size="sm" c="dimmed">
            Page {clampedPage} of {totalPages}
          </Text>
          <Pagination
            value={clampedPage}
            total={totalPages}
            onChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
          />
        </Group>
      )}

      <CreateAppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultClientId={customerId}
        invalidateKeys={[
          { queryKey: trpc.customers.appointments.list.queryKey(queryInput) },
          { queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey },
        ]}
        navigateOnSuccess
      />
    </Section>
  )
}
