import { Button, Container, Group, Modal, NumberInput, Select, Stack } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { HairOrdersTable } from "@/components/hair-orders-table"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { trpc } from "@/utils/trpc"

const defaultCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }

export const Route = createFileRoute("/_authenticated/hair-orders/")({
  component: HairOrdersPage,
})

function CreateHairOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const { data: customersData } = useQuery(trpc.customers.list.queryOptions(defaultCustomersListInput))
  const customers = customersData?.items ?? []
  const hairOrdersQueryOptions = trpc.hairOrders.list.queryOptions()

  const mutation = useMutation({
    ...trpc.hairOrders.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hairOrdersQueryOptions.queryKey })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Hair order created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

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
            data={customers.map((c) => ({ value: c.id, label: c.name }))}
            {...form.getInputProps("customerId")}
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
  const { data: hairOrders, isLoading } = useQuery(trpc.hairOrders.list.queryOptions())
  const [dialogOpen, setDialogOpen] = useState(false)

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
        <HairOrdersTable hairOrders={hairOrders} isLoading={isLoading} />
      </Section>

      <CreateHairOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Container>
  )
}
