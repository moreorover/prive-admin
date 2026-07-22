import { Button, Stack, Text, TextInput } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { z } from "zod"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { Section } from "@/components/section"
import { trpc } from "@/utils/trpc"

import { Route } from "./hair-sales"

export const PAGE_SIZE = 25
export const AVAILABLE_HAIR_ORDERS_PAGE_SIZE = 100
export const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  search: z.string().optional(),
})

export function hairSalesQueryOptions(customerId: string, page: number, search: string) {
  return trpc.customers.hairAssigned.list.queryOptions({
    customerId,
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
  })
}

export function HairSalesRoute() {
  const { customerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const [hairCreateOpen, setHairCreateOpen] = useState(false)
  const [hairEditItem, setHairEditItem] = useState<HairAssignedRow | null>(null)
  const [hairDeleteItem, setHairDeleteItem] = useState<HairAssignedRow | null>(null)

  const page = search.page ?? 1
  const searchValue = search.search ?? ""
  const normalizedSearch = searchValue.trim()
  const queryOptions = hairSalesQueryOptions(customerId, page, searchValue)
  const { data } = useQuery(queryOptions)
  const availableHairOrdersQueryOptions = trpc.hairOrders.list.queryOptions({
    availability: "availableForAssignment",
    pageSize: AVAILABLE_HAIR_ORDERS_PAGE_SIZE,
  })
  const { data: availableHairOrdersData, isLoading: availableHairOrdersLoading } = useQuery(
    availableHairOrdersQueryOptions,
  )
  const availableHairOrders = availableHairOrdersData?.items ?? []
  const hairAssigned = (data?.items ?? []) as HairAssignedRow[]
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const hasItemsOnCurrentPage = hairAssigned.length > 0
  const customerSummaryQueryKey = trpc.customers.summary.queryOptions({ id: customerId }).queryKey
  const hairAssignedListQueryKey = trpc.hairAssigned.list.queryKey()
  const hairOrdersListQueryKey = trpc.hairOrders.list.queryKey()
  const invalidateHairAssignmentQueries = (hairOrderId?: string | null) => {
    queryClient.invalidateQueries({ queryKey: trpc.customers.hairAssigned.list.queryKey() })
    queryClient.invalidateQueries({ queryKey: customerSummaryQueryKey })
    queryClient.invalidateQueries({ queryKey: hairAssignedListQueryKey })
    queryClient.invalidateQueries({ queryKey: availableHairOrdersQueryOptions.queryKey })
    queryClient.invalidateQueries({ queryKey: hairOrdersListQueryKey })
    if (hairOrderId) {
      queryClient.invalidateQueries({ queryKey: trpc.hairOrders.get.queryOptions({ id: hairOrderId }).queryKey })
    }
  }
  const createHairAssigned = useMutation({
    ...trpc.hairAssigned.create.mutationOptions(),
    onSuccess: (_created, values) => {
      invalidateHairAssignmentQueries(values.hairOrderId)
      setHairCreateOpen(false)
      navigate({ search: { page: 1, search: searchValue }, replace: true })
      notifications.show({ color: "green", message: "Hair assigned created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
  const updateHairAssigned = useMutation({
    ...trpc.hairAssigned.update.mutationOptions(),
    onSuccess: () => {
      invalidateHairAssignmentQueries(hairEditItem?.hairOrder?.id)
      setHairEditItem(null)
      notifications.show({ color: "green", message: "Hair assigned updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })
  const deleteHairAssigned = useMutation({
    ...trpc.hairAssigned.delete.mutationOptions(),
    onSuccess: () => {
      invalidateHairAssignmentQueries(hairDeleteItem?.hairOrder?.id)
      setHairDeleteItem(null)
      navigate({ search: { page: 1, search: searchValue }, replace: true })
      notifications.show({ color: "green", message: "Hair assigned deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
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
                pageSize={PAGE_SIZE}
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
