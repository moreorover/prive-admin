import { Button, Container, Group, Modal, NumberInput, Select, Stack, Table, Text } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { IconPlus } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { HairOrdersTable } from "@/components/hair-orders-table"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { type SelectOption, withPinnedOption } from "@/lib/resource-pagination"
import { trpc } from "@/utils/trpc"

import { useCreateHairOrderAction } from "./-hair-order-actions"

const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }
const HAIR_ORDERS_PAGE_SIZE = 25

export const Route = createFileRoute("/_authenticated/hair-orders/")({
  component: HairOrdersPage,
})

function CreateHairOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomerOption, setSelectedCustomerOption] = useState<SelectOption | null>(null)

  const { data: customersData } = useQuery(
    trpc.customers.list.queryOptions({
      ...defaultCustomersListInput,
      search: customerSearch.trim() || undefined,
    }),
  )
  const customers = customersData?.items ?? []
  const customerOptions = withPinnedOption(
    customers.map((c) => ({ value: c.id, label: c.name })),
    selectedCustomerOption,
  )
  const mutation = useCreateHairOrderAction({ onCreated: () => onOpenChange(false) })

  const form = useForm({
    initialValues: { customerId: "", placedAt: "", weightReceived: 0, total: 0 },
  })

  const handleSubmit = async (values: {
    customerId: string
    placedAt: string
    weightReceived: number
    total: number
  }) => {
    await mutation.mutateAsync({
      customerId: values.customerId,
      placedAt: values.placedAt || null,
      arrivedAt: null,
      status: "PENDING",
      weightReceived: values.weightReceived,
      weightUsed: 0,
      total: Math.round(values.total * 100),
    })
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
            onSearchChange={setCustomerSearch}
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
          <Button type="submit" loading={mutation.isPending}>
            Create Hair Order
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function HairOrdersPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const { data: hairOrdersData, isLoading } = useQuery(
    trpc.hairOrders.list.queryOptions({ page, pageSize: HAIR_ORDERS_PAGE_SIZE }),
  )
  const hairOrders = hairOrdersData?.items ?? []
  const totalCount = hairOrdersData?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / HAIR_ORDERS_PAGE_SIZE))
  const showPagination = totalCount > HAIR_ORDERS_PAGE_SIZE

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
              <Button
                variant="default"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button variant="default" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </Group>
          </Group>
        )}
      </Section>

      <CreateHairOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Container>
  )
}
