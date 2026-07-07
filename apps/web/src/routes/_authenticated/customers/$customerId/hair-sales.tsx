import { Button, Divider, Group, Pagination, Stack, Text, TextInput, Title } from "@mantine/core"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"

import { CustomerSubsection } from "@/components/customer-subsection"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { trpc } from "@/utils/trpc"

const PAGE_SIZE = 25
const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
})

function hairSalesQueryOptions(customerId: string, page: number, search: string) {
  return trpc.customers.hairAssigned.list.queryOptions({
    customerId,
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

export const Route = createFileRoute("/_authenticated/customers/$customerId/hair-sales")({
  component: HairSalesRoute,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps, params }) => {
    const data = await context.queryClient.ensureQueryData(
      hairSalesQueryOptions(params.customerId, deps.page, deps.search),
    )
    const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/customers/$customerId/hair-sales",
        params: { customerId: params.customerId },
        search: { page: totalPages, search: deps.search },
      })
    }
  },
})

type HairAssignedItem = HairAssignedRow & { appointmentId?: string | null }

function HairSalesRoute() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [hairCreateOpen, setHairCreateOpen] = useState(false)
  const [hairEditItem, setHairEditItem] = useState<HairAssignedRow | null>(null)
  const [hairDeleteItem, setHairDeleteItem] = useState<HairAssignedRow | null>(null)

  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const normalizedSearch = searchValue.trim()
  const queryOptions = hairSalesQueryOptions(customerId, page, searchValue)
  const { data } = useQuery(queryOptions)
  const hairAssigned = (data?.items ?? []) as HairAssignedItem[]
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const hasItemsOnCurrentPage = hairAssigned.length > 0

  const throughAppointment = hairAssigned.filter((ha) => !!ha.appointmentId)
  const individual = hairAssigned.filter((ha) => !ha.appointmentId)

  return (
    <CustomerSubsection
      title="Hair sales"
      description="Hair sales tied to this customer."
      actions={
        <>
          <TextInput
            label="Search"
            placeholder="Search hair sales"
            leftSection={<IconSearch size={16} />}
            value={searchValue}
            onChange={(event) => {
              navigate({ search: { page: 1, search: event.currentTarget.value }, replace: true })
            }}
            w={300}
          />
          <Button
            variant="default"
            size="sm"
            leftSection={<IconPlus size={12} />}
            onClick={() => setHairCreateOpen(true)}
          >
            New
          </Button>
        </>
      }
      bodyPadding={hasItemsOnCurrentPage ? 0 : "lg"}
    >
      <Stack gap="md">
        {hasItemsOnCurrentPage ? (
          <Stack gap="lg">
            <Stack gap="xs">
              <Title order={5} fw={600}>
                Hair sales through appointment
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
            </Stack>

            <Divider />

            <Stack gap="xs">
              <Title order={5} fw={600}>
                Hair sales individual
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
            </Stack>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed" p="lg">
            {normalizedSearch ? "No hair sales match your search." : "No hair sales on this page."}
          </Text>
        )}

        <Group justify="space-between" px="md" pb="md">
          <Text size="sm" c="dimmed">
            {totalCount} hair sale{totalCount === 1 ? "" : "s"} · Page {clampedPage} of {totalPages}
          </Text>
          <Pagination
            value={clampedPage}
            total={totalPages}
            onChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
          />
        </Group>
      </Stack>

      <CreateHairAssignedDialog
        open={hairCreateOpen}
        onOpenChange={setHairCreateOpen}
        clientId={customerId}
        appointmentId={null}
        invalidateKeys={[
          { queryKey: trpc.customers.hairAssigned.list.queryKey() },
          { queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey },
        ]}
        onSuccess={() => navigate({ search: { page: 1, search: searchValue }, replace: true })}
      />
      {hairEditItem && (
        <EditHairAssignedDialog
          open={!!hairEditItem}
          onOpenChange={(open) => !open && setHairEditItem(null)}
          hairAssigned={hairEditItem}
          invalidateKeys={[
            { queryKey: trpc.customers.hairAssigned.list.queryKey() },
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
            { queryKey: trpc.customers.hairAssigned.list.queryKey() },
            { queryKey: trpc.customers.summary.queryOptions({ id: customerId }).queryKey },
          ]}
          onSuccess={() => navigate({ search: { page: 1, search: searchValue }, replace: true })}
        />
      )}
    </CustomerSubsection>
  )
}
