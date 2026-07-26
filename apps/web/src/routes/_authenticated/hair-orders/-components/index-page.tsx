import type { ComponentProps } from "react"

import { Button, Container, Group, Modal, NumberInput, Select, Stack, Table, Text } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { IconPlus } from "@tabler/icons-react"
import { useState } from "react"

import { HairOrdersTable } from "@/components/hair-orders-table"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { type SelectOption, withPinnedOption } from "@/lib/resource-pagination"

type CustomerOptionsData = { items: { id: string; name: string }[] }
type HairOrderListData = {
  items: ComponentProps<typeof HairOrdersTable>["hairOrders"]
  totalCount: number
}
type HairOrderCreateValues = {
  customerId: string
  placedAt: string | null
  arrivedAt: string | null
  status: "PENDING"
  weightReceived: number
  weightUsed: number
  total: number
}

function CreateHairOrderDialog({
  open,
  onOpenChange,
  customerSearch,
  customersData,
  loading,
  onCustomerSearchChange,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerSearch: string
  customersData: CustomerOptionsData | undefined
  loading: boolean
  onCustomerSearchChange: (search: string) => void
  onCreate: (values: HairOrderCreateValues) => Promise<unknown>
}) {
  const [selectedCustomerOption, setSelectedCustomerOption] = useState<SelectOption | null>(null)

  const customers = customersData?.items ?? []
  const customerOptions = withPinnedOption(
    customers.map((c) => ({ value: c.id, label: c.name })),
    selectedCustomerOption,
  )
  const form = useForm({
    initialValues: { customerId: "", placedAt: "", weightReceived: 0, total: 0 },
  })

  const handleSubmit = async (values: {
    customerId: string
    placedAt: string
    weightReceived: number
    total: number
  }) => {
    await onCreate({
      customerId: values.customerId,
      placedAt: values.placedAt || null,
      arrivedAt: null,
      status: "PENDING",
      weightReceived: values.weightReceived,
      weightUsed: 0,
      total: Math.round(values.total * 100),
    })
    onOpenChange(false)
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Hair Order">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Select
            label="Customer"
            placeholder="Select a customer..."
            searchable
            searchValue={customerSearch}
            onSearchChange={onCustomerSearchChange}
            data={customerOptions}
            value={form.values.customerId}
            onChange={(value) => {
              form.setFieldValue("customerId", value ?? "")
              const option = customerOptions.find((candidate) => candidate.value === value)
              if (option) setSelectedCustomerOption(option)
            }}
            error={form.errors.customerId}
          />
          <DateInput label="Placed At" valueFormat="DD MMM YYYY" {...form.getInputProps("placedAt")} />
          <Group grow>
            <NumberInput label="Weight (g)" min={0} {...form.getInputProps("weightReceived")} />
            <NumberInput label="Total" min={0} decimalScale={2} step={0.01} {...form.getInputProps("total")} />
          </Group>
          <Button type="submit" loading={loading}>
            Create Hair Order
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

export function HairOrdersPage({
  page,
  pageSize,
  hairOrdersData,
  isLoading,
  customerSearch,
  customersData,
  createPending,
  onPageChange,
  onCustomerSearchChange,
  onCreateHairOrder,
}: {
  page: number
  pageSize: number
  hairOrdersData: HairOrderListData | undefined
  isLoading: boolean
  customerSearch: string
  customersData: CustomerOptionsData | undefined
  createPending: boolean
  onPageChange: (page: number) => void
  onCustomerSearchChange: (search: string) => void
  onCreateHairOrder: (values: HairOrderCreateValues) => Promise<unknown>
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const hairOrders = hairOrdersData?.items ?? []
  const totalCount = hairOrdersData?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const showPagination = totalCount > pageSize

  return (
    <Container size="xl">
      <PageHeader
        title="Hair orders"
        description="Track inbound hair stock by customer."
        actions={
          <Button leftSection={<IconPlus size={14} />} onClick={() => setDialogOpen(true)}>
            New order
          </Button>
        }
      />
      <Section padding="lg">
        <Table.ScrollContainer minWidth={760}>
          <HairOrdersTable hairOrders={hairOrders} isLoading={isLoading} />
        </Table.ScrollContainer>
        {showPagination && (
          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              {totalCount} hair order{totalCount === 1 ? "" : "s"} · Page {Math.min(page, totalPages)} of {totalPages}
            </Text>
            <Group gap="xs">
              <Button variant="default" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
                Previous
              </Button>
              <Button variant="default" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                Next
              </Button>
            </Group>
          </Group>
        )}
      </Section>

      <CreateHairOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customerSearch={customerSearch}
        customersData={customersData}
        loading={createPending}
        onCustomerSearchChange={onCustomerSearchChange}
        onCreate={onCreateHairOrder}
      />
    </Container>
  )
}
