import { Button, Stack, Text, TextInput } from "@mantine/core"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { Section } from "@/components/section"
import { trpc } from "@/utils/trpc"

import { useHairAssignmentActions } from "../../-hair-assignment-actions"
import {
  HAIR_SALES_PAGE_SIZE,
  availableHairOrdersListQueryOptions,
  hairSalesQueryOptions,
  useHairSalesData,
} from "./-hair-sales-data"

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
})

export const Route = createFileRoute("/_authenticated/customers/$customerId/hair-sales")({
  component: HairSalesRoute,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    search: search.search ?? "",
  }),
  loader: async ({ context, deps, params }) => {
    const [data] = await Promise.all([
      context.queryClient.ensureQueryData(hairSalesQueryOptions(params.customerId, deps.page, deps.search)),
      context.queryClient.prefetchQuery(availableHairOrdersListQueryOptions()),
    ])
    const totalPages = Math.max(1, Math.ceil(data.totalCount / HAIR_SALES_PAGE_SIZE))
    if (deps.page > totalPages) {
      throw redirect({
        to: "/customers/$customerId/hair-sales",
        params: { customerId: params.customerId },
        search: { page: totalPages, search: deps.search },
      })
    }
  },
})

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
  const {
    availableHairOrders,
    availableHairOrdersLoading,
    availableHairOrdersQueryOptions,
    hairAssigned,
    totalCount,
    totalPages,
    clampedPage,
    hasItemsOnCurrentPage,
  } = useHairSalesData({ customerId, page, search: searchValue })
  const customerSummaryQueryKey = trpc.customers.summary.queryOptions({ id: customerId }).queryKey
  const { createHairAssigned, updateHairAssigned, deleteHairAssigned } = useHairAssignmentActions({
    invalidateKeys: [{ queryKey: trpc.customers.hairAssigned.list.queryKey() }, { queryKey: customerSummaryQueryKey }],
    availableHairOrdersQueryKey: availableHairOrdersQueryOptions.queryKey,
    selectedEditItem: hairEditItem,
    selectedDeleteItem: hairDeleteItem,
    onCreated: () => {
      setHairCreateOpen(false)
      navigate({ search: { page: 1, search: searchValue }, replace: true })
    },
    onUpdated: () => setHairEditItem(null),
    onDeleted: () => {
      setHairDeleteItem(null)
      navigate({ search: { page: 1, search: searchValue }, replace: true })
    },
  })

  return (
    <>
      <BreadcrumbItem label="Hair sales" order={30} />
      <Section
        title="Hair Sales"
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
              w={260}
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
        padding={hasItemsOnCurrentPage ? 0 : "lg"}
      >
        <Stack gap="md">
          {hasItemsOnCurrentPage ? (
            <HairAssignedTable items={hairAssigned}>
              <HairAssignedTable.Client />
              <HairAssignedTable.Source />
              <HairAssignedTable.HairOrder />
              <HairAssignedTable.Weight />
              <HairAssignedTable.SoldFor />
              <HairAssignedTable.Profit />
              <HairAssignedTable.PricePerGram />
              <HairAssignedTable.Actions onEdit={setHairEditItem} onDelete={setHairDeleteItem} />
              <HairAssignedTable.Pagination
                page={clampedPage}
                pageSize={HAIR_SALES_PAGE_SIZE}
                itemCount={hairAssigned.length}
                totalCount={totalCount}
                onChange={(nextPage) => navigate({ search: { page: nextPage, search: searchValue } })}
                label={`${totalCount} hair sale${totalCount === 1 ? "" : "s"} · Page ${clampedPage} of ${totalPages}`}
                px="md"
                pb="md"
              />
            </HairAssignedTable>
          ) : (
            <Text size="sm" c="dimmed" p="lg">
              {normalizedSearch ? "No hair sales match your search." : "No hair sales on this page."}
            </Text>
          )}
        </Stack>

        <CreateHairAssignedDialog
          open={hairCreateOpen}
          onOpenChange={setHairCreateOpen}
          clientId={customerId}
          appointmentId={null}
          loading={createHairAssigned.isPending}
          onCreate={(values) => createHairAssigned.mutate(values)}
          availableOrders={availableHairOrders}
          availableOrdersLoading={availableHairOrdersLoading}
        />
        {hairEditItem && (
          <EditHairAssignedDialog
            open={!!hairEditItem}
            onOpenChange={(open) => !open && setHairEditItem(null)}
            hairAssigned={hairEditItem}
            loading={updateHairAssigned.isPending}
            onUpdate={(values) => updateHairAssigned.mutate(values)}
          />
        )}
        {hairDeleteItem && (
          <DeleteHairAssignedDialog
            open={!!hairDeleteItem}
            onOpenChange={(open) => !open && setHairDeleteItem(null)}
            hairAssigned={hairDeleteItem}
            loading={deleteHairAssigned.isPending}
            onDelete={(id) => deleteHairAssigned.mutate({ id })}
          />
        )}
      </Section>
    </>
  )
}
