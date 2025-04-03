"use client";

import { Button, Menu, ScrollArea, Table, Text } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import Link from "next/link";
import { HairOrderHair } from "@/modules/hair_orders/types";

interface Props {
  appointmentId: string;
  hair: HairOrderHair;
}

export default function HairTable({ appointmentId, hair }: Props) {
  const utils = trpc.useUtils();

  const removeHair = trpc.hair.setAppointmentId.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Hair removed.",
      });
      utils.hair.getByAppointmentId.invalidate({
        appointmentId,
      });
      utils.hair.getHairOptions.invalidate();
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to remove hair",
        message: "Please try again.",
      });
    },
  });

  // Helper to format the amount (assuming amount is stored in cents)
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-UK", {
      style: "currency",
      currency: "GBP",
    }).format(amount);

  const openRemoveModal = (hairId: string[]) =>
    modals.openConfirmModal({
      title: "Remove Hair?",
      centered: true,
      children: (
        <Text size="sm">Are you sure you want to remove this hair?</Text>
      ),
      labels: { confirm: "Remove Hair", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () =>
        removeHair.mutate({
          hairIds: hairId,
          appointmentId: null,
        }),
    });

  const rows = hair.map((h) => (
    <Table.Tr key={h.id}>
      <Table.Td>
        <Text>{h.color}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{h.description}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{h.upc}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{h.length}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{h.weight}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{formatAmount(h.price)}</Text>
      </Table.Td>
      <Table.Td>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button>Manage</Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Hair</Menu.Label>
            <Link href={`/dashboard/hair/${h.id}`}>
              <Menu.Item disabled>View</Menu.Item>
            </Link>
            <Menu.Item
              onClick={() => {
                openRemoveModal([h.id]);
              }}
            >
              Remove
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Color</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>UPC</Table.Th>
            <Table.Th>Length (cm)</Table.Th>
            <Table.Th>Weight (g)</Table.Th>
            <Table.Th>Price</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
