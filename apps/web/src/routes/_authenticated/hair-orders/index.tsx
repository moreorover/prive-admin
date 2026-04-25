import {
  Badge,
  Button,
  Container,
  Group,
  Modal,
  NativeSelect,
  NumberInput,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconScissors } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { getCustomers } from "@/functions/customers"
import { createHairOrder, getHairOrders } from "@/functions/hair-orders"
import { customerKeys, hairOrderKeys } from "@/lib/query-keys"

const hairOrdersQueryOptions = queryOptions({
  queryKey: hairOrderKeys.list(),
  queryFn: () => getHairOrders(),
})

export const Route = createFileRoute("/_authenticated/hair-orders/")({
  component: HairOrdersPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(hairOrdersQueryOptions)
  },
})

function CreateHairOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const mutation = useMutation({
    mutationFn: (data: {
      customerId: string
      placedAt: string | null
      arrivedAt: string | null
      status: "PENDING" | "COMPLETED"
      weightReceived: number
      weightUsed: number
      total: number
    }) => createHairOrder({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
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
      total: values.total,
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
            <NumberInput label="Total (cents)" min={0} {...form.getInputProps("total")} />
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
  const { data: hairOrders, isLoading } = useQuery(hairOrdersQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Container size="lg">
      <Stack>
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Group gap="xs" c="dimmed">
              <IconScissors size={16} />
              <Text size="xs" tt="uppercase">
                Hair Orders
              </Text>
            </Group>
            <Title order={2}>Hair Orders</Title>
          </Stack>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setDialogOpen(true)}>
            New Order
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Weight (g)</Table.Th>
              <Table.Th>Placed</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Skeleton h={14} w={30} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={90} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={60} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={50} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={70} />
                    </Table.Td>
                  </Table.Tr>
                ))
              : hairOrders?.map((ho) => (
                  <Table.Tr key={ho.id}>
                    <Table.Td>
                      <Text
                        renderRoot={(props) => (
                          <Link to="/hair-orders/$hairOrderId" params={{ hairOrderId: ho.id }} {...props} />
                        )}
                        c="blue"
                        fw={500}
                      >
                        #{ho.uid}
                      </Text>
                    </Table.Td>
                    <Table.Td c="dimmed">{ho.customer?.name ?? "—"}</Table.Td>
                    <Table.Td>
                      <Badge variant={ho.status === "COMPLETED" ? "light" : "outline"}>{ho.status}</Badge>
                    </Table.Td>
                    <Table.Td c="dimmed">{ho.weightReceived}g</Table.Td>
                    <Table.Td c="dimmed">{ho.placedAt ? <ClientDate date={ho.placedAt} /> : "—"}</Table.Td>
                  </Table.Tr>
                ))}
            {!isLoading && hairOrders?.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5} ta="center" c="dimmed">
                  No hair orders yet.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <CreateHairOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </Stack>
    </Container>
  )
}
