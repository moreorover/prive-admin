import type { ComponentProps } from "react"

import { Button, Stack, Text, TextInput } from "@mantine/core"
import { IconPlus, IconSearch } from "@tabler/icons-react"
import { useState } from "react"

import { BreadcrumbItem } from "@/components/breadcrumbs"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { Section } from "@/components/section"

import { HAIR_SALES_PAGE_SIZE, useHairSalesData } from "../-data/hair-sales-data"

type HairSalesData = ReturnType<typeof useHairSalesData>

export function HairSalesPage({
  customerId,
  searchValue,
  data,
  hairEditItem,
  hairDeleteItem,
  createPending,
  updatePending,
  deletePending,
  onHairEditItemChange,
  onHairDeleteItemChange,
  onSearchChange,
  onPageChange,
  onCreate,
  onUpdate,
  onDelete,
}: {
  customerId: string
  searchValue: string
  data: HairSalesData
  hairEditItem: HairAssignedRow | null
  hairDeleteItem: HairAssignedRow | null
  createPending: boolean
  updatePending: boolean
  deletePending: boolean
  onHairEditItemChange: (item: HairAssignedRow | null) => void
  onHairDeleteItemChange: (item: HairAssignedRow | null) => void
  onSearchChange: (search: string) => void
  onPageChange: (page: number) => void
  onCreate: ComponentProps<typeof CreateHairAssignedDialog>["onCreate"]
  onUpdate: ComponentProps<typeof EditHairAssignedDialog>["onUpdate"]
  onDelete: (id: string) => void
}) {
  const [hairCreateOpen, setHairCreateOpen] = useState(false)

  const normalizedSearch = searchValue.trim()
  const {
    availableHairOrders,
    availableHairOrdersLoading,
    hairAssigned,
    totalCount,
    totalPages,
    clampedPage,
    hasItemsOnCurrentPage,
  } = data

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
                onSearchChange(event.currentTarget.value)
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
              <HairAssignedTable.Actions onEdit={onHairEditItemChange} onDelete={onHairDeleteItemChange} />
              <HairAssignedTable.Pagination
                page={clampedPage}
                pageSize={HAIR_SALES_PAGE_SIZE}
                itemCount={hairAssigned.length}
                totalCount={totalCount}
                onChange={onPageChange}
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
          loading={createPending}
          onCreate={(values) => {
            onCreate(values)
            setHairCreateOpen(false)
          }}
          availableOrders={availableHairOrders}
          availableOrdersLoading={availableHairOrdersLoading}
        />
        {hairEditItem && (
          <EditHairAssignedDialog
            open={!!hairEditItem}
            onOpenChange={(open) => !open && onHairEditItemChange(null)}
            hairAssigned={hairEditItem}
            loading={updatePending}
            onUpdate={(values) => {
              onUpdate(values)
              onHairEditItemChange(null)
            }}
          />
        )}
        {hairDeleteItem && (
          <DeleteHairAssignedDialog
            open={!!hairDeleteItem}
            onOpenChange={(open) => !open && onHairDeleteItemChange(null)}
            hairAssigned={hairDeleteItem}
            loading={deletePending}
            onDelete={(id) => {
              onDelete(id)
              onHairDeleteItemChange(null)
            }}
          />
        )}
      </Section>
    </>
  )
}
