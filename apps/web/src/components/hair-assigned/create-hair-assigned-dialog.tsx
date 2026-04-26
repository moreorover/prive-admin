import { Button, Group, Modal, Radio, Stack, Table, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { createHairAssigned, getAvailableHairOrders } from "@/functions/hair-assigned"
import { hairOrderKeys } from "@/lib/query-keys"

type CreateHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  appointmentId?: string | null
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function CreateHairAssignedDialog({
  open,
  onOpenChange,
  clientId,
  appointmentId,
  invalidateKeys,
}: CreateHairAssignedDialogProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: availableOrders, isLoading } = useQuery({
    queryKey: [...hairOrderKeys.all, "available"],
    queryFn: () => getAvailableHairOrders(),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (hairOrderId: string) =>
      createHairAssigned({ data: { hairOrderId, clientId, appointmentId: appointmentId ?? null } }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      onOpenChange(false)
      setSelectedOrderId(null)
      notifications.show({ color: "green", message: "Hair assigned created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const handleClose = () => {
    setSelectedOrderId(null)
    onOpenChange(false)
  }

  return (
    <Modal opened={open} onClose={handleClose} title="Assign Hair" size="lg">
      <Stack>
        <Text size="sm" c="dimmed">
          Select a hair order with available stock.
        </Text>
        {isLoading ? (
          <Text size="sm" c="dimmed">
            Loading…
          </Text>
        ) : availableOrders && availableOrders.length > 0 ? (
          <Radio.Group value={selectedOrderId} onChange={setSelectedOrderId}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th />
                  <Table.Th>UID</Table.Th>
                  <Table.Th>Customer</Table.Th>
                  <Table.Th>Received</Table.Th>
                  <Table.Th>Remaining</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {availableOrders.map((order) => (
                  <Table.Tr key={order.id} onClick={() => setSelectedOrderId(order.id)} style={{ cursor: "pointer" }}>
                    <Table.Td>
                      <Radio value={order.id} />
                    </Table.Td>
                    <Table.Td>#{order.uid}</Table.Td>
                    <Table.Td>{order.customer.name}</Table.Td>
                    <Table.Td>{order.weightReceived}g</Table.Td>
                    <Table.Td>{order.weightReceived - order.weightUsed}g</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Radio.Group>
        ) : (
          <Text size="sm" c="dimmed">
            No hair orders with available stock.
          </Text>
        )}
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedOrderId}
            loading={mutation.isPending}
            onClick={() => selectedOrderId && mutation.mutate(selectedOrderId)}
          >
            Assign
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
