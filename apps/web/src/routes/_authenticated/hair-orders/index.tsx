import { Button, Container, Group, Modal, NativeSelect, NumberInput, Select, Stack, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { HairOrdersTable } from "@/components/hair-orders-table"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { getCustomers } from "@/functions/customers"
import { createHairOrder, getHairOrders } from "@/functions/hair-orders"
import { listLegalEntities } from "@/functions/legal-entities"
import { COUNTRY_FLAGS, type Country } from "@/lib/legal-entity"
import { customerKeys, hairOrderKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/hair-orders/")({
  component: HairOrdersPage,
})

function CreateHairOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })

  const mutation = useMutation({
    mutationFn: (data: {
      customerId: string
      placedAt: string | null
      arrivedAt: string | null
      status: "PENDING" | "COMPLETED"
      weightReceived: number
      weightUsed: number
      total: number
      legalEntityId: string
    }) => createHairOrder({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Hair order created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: { customerId: "", placedAt: "", weightReceived: 0, total: 0, legalEntityId: "" },
  })

  const handleSubmit = async (values: {
    customerId: string
    placedAt: string
    weightReceived: number
    total: number
    legalEntityId: string
  }) => {
    await mutation.mutateAsync({
      customerId: values.customerId,
      placedAt: values.placedAt || null,
      arrivedAt: null,
      status: "PENDING",
      weightReceived: values.weightReceived,
      weightUsed: 0,
      total: Math.round(values.total * 100),
      legalEntityId: values.legalEntityId,
    })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Hair Order">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <NativeSelect
            label="Customer"
            data={[
              { value: "", label: "Select a customer…" },
              ...(customers?.map((c) => ({ value: c.id, label: c.name })) ?? []),
            ]}
            {...form.getInputProps("customerId")}
          />
          <TextInput label="Placed At" type="date" {...form.getInputProps("placedAt")} />
          <Group grow>
            <NumberInput label="Weight (g)" min={0} {...form.getInputProps("weightReceived")} />
            <NumberInput label="Total" min={0} decimalScale={2} step={0.01} {...form.getInputProps("total")} />
          </Group>
          <Select
            label="Legal entity (payer)"
            required
            data={(legalEntitiesQuery.data ?? []).map((le) => ({
              value: le.id,
              label: `${COUNTRY_FLAGS[le.country as Country] ?? ""} ${le.name}`,
            }))}
            value={form.values.legalEntityId}
            onChange={(v) => form.setFieldValue("legalEntityId", v ?? "")}
          />
          <Button type="submit" loading={mutation.isPending}>
            Create Hair Order
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function HairOrdersPage() {
  const [legalEntityFilter, setLegalEntityFilter] = useState<string>("")
  const legalEntitiesQuery = useQuery({ queryKey: ["legal-entities"], queryFn: () => listLegalEntities() })
  const { data: hairOrders, isLoading } = useQuery({
    queryKey: ["hair-orders", legalEntityFilter],
    queryFn: () => getHairOrders({ data: { legalEntityId: legalEntityFilter || undefined } }),
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Container size="xl">
      <PageHeader
        title="Hair orders"
        description="Track inbound hair stock by customer and legal entity."
        actions={
          <>
            <Select
              data={[
                { value: "", label: "All entities" },
                ...(legalEntitiesQuery.data ?? []).map((le) => ({ value: le.id, label: le.name })),
              ]}
              value={legalEntityFilter}
              onChange={(v) => setLegalEntityFilter(v ?? "")}
              w={200}
              size="sm"
            />
            <Button leftSection={<IconPlus size={14} />} onClick={() => setDialogOpen(true)}>
              New order
            </Button>
          </>
        }
      />
      <Section padding="lg">
        <HairOrdersTable hairOrders={hairOrders} isLoading={isLoading} />
      </Section>

      <CreateHairOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Container>
  )
}
