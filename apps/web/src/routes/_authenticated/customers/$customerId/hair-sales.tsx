import { Button, Card, Group, Pagination, Stack, Text, TextInput, Title } from "@mantine/core"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { Section } from "@/components/section"
import { clampPage } from "@/lib/resource-pagination"
import { trpc } from "@/utils/trpc"

import {
  CUSTOMER_DETAIL_PAGE_SIZE,
  customerDetailQueryInput,
  customerDetailSearchSchema,
  customerHairSalesQueryArgs,
} from "./customer-detail-queries"

type HairAssignedItem = HairAssignedRow & { appointmentId?: string | null }

export const Route = createFileRoute("/_authenticated/customers/$customerId/hair-sales")({
  validateSearch: customerDetailSearchSchema,
  loaderDeps: ({ search }) => customerDetailQueryInput(search),
  loader: async ({ context, deps, params }) => {
    await context.queryClient.ensureQueryData(
      trpc.customers.hairAssigned.list.queryOptions(customerHairSalesQueryArgs(params.customerId, deps)),
    )
  },
  component: CustomerHairSalesRoute,
})

function CustomerHairSalesRoute() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryInput = customerHairSalesQueryArgs(customerId, search)
  const { data } = useQuery(trpc.customers.hairAssigned.list.queryOptions(queryInput))
  const [hairCreateOpen, setHairCreateOpen] = useState(false)
  const [hairEditItem, setHairEditItem] = useState<HairAssignedRow | null>(null)
  const [hairDeleteItem, setHairDeleteItem] = useState<HairAssignedRow | null>(null)

  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const hairAssigned = (data?.items ?? []) as HairAssignedItem[]
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

  const throughAppointment = hairAssigned.filter((ha) => !!ha.appointmentId)
  const individual = hairAssigned.filter((ha) => !ha.appointmentId)

  return (
    <Section
      title="Hair Sales"
      actions={
        <Button
          variant="default"
          size="sm"
          leftSection={<IconPlus size={12} />}
          onClick={() => setHairCreateOpen(true)}
        >
          New
        </Button>
      }
      padding={hairAssigned.length > 0 || totalCount > 0 ? 0 : "lg"}
    >
      <Group p="md" justify="space-between" align="flex-end">
        <TextInput
          label="Search"
          placeholder="Search hair sales"
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(event) => updateSearch(event.currentTarget.value)}
          miw={260}
          flex={1}
        />
        <Text size="sm" c="dimmed">
          {totalCount} hair sale{totalCount === 1 ? "" : "s"}
        </Text>
      </Group>

      {hairAssigned.length > 0 ? (
        <Stack>
          <Card withBorder>
            <Title order={5} mb="sm">
              Hair Sales through Appointment
            </Title>
            {throughAppointment.length > 0 ? (
              <HairAssignedTable
                items={throughAppointment}
                showHairOrderColumn
                onEdit={setHairEditItem}
                onDelete={setHairDeleteItem}
              />
            ) : (
              <Text size="sm" c="dimmed">
                No appointment-tied hair sales on this page.
              </Text>
            )}
          </Card>

          <Card withBorder>
            <Title order={5} mb="sm">
              Hair Sales Individual
            </Title>
            {individual.length > 0 ? (
              <HairAssignedTable
                items={individual}
                showHairOrderColumn
                onEdit={setHairEditItem}
                onDelete={setHairDeleteItem}
              />
            ) : (
              <Text size="sm" c="dimmed">
                No individual hair sales on this page.
              </Text>
            )}
          </Card>

          {totalCount > 0 && (
            <Group justify="space-between" px="md" pb="md">
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
        </Stack>
      ) : (
        <Card withBorder>
          <Text size="sm" c="dimmed">
            {searchValue.trim() ? "No hair sales match your search." : "No hair sales yet."}
          </Text>
        </Card>
      )}

      <CreateHairAssignedDialog
        open={hairCreateOpen}
        onOpenChange={setHairCreateOpen}
        clientId={customerId}
        appointmentId={null}
        invalidateKeys={[
          { queryKey: trpc.customers.hairAssigned.list.queryKey(queryInput) },
          { queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey },
        ]}
        onSuccess={() => setHairCreateOpen(false)}
      />
      {hairEditItem && (
        <EditHairAssignedDialog
          open={!!hairEditItem}
          onOpenChange={(open) => !open && setHairEditItem(null)}
          hairAssigned={hairEditItem}
          invalidateKeys={[
            { queryKey: trpc.customers.hairAssigned.list.queryKey(queryInput) },
            { queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey },
          ]}
        />
      )}
      {hairDeleteItem && (
        <DeleteHairAssignedDialog
          open={!!hairDeleteItem}
          onOpenChange={(open) => !open && setHairDeleteItem(null)}
          hairAssigned={hairDeleteItem}
          invalidateKeys={[
            { queryKey: trpc.customers.hairAssigned.list.queryKey(queryInput) },
            { queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey },
          ]}
          onSuccess={() => setHairDeleteItem(null)}
        />
      )}
    </Section>
  )
}
