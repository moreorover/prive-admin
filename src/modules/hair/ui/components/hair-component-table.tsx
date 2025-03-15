"use client";

import { Button, Menu, ScrollArea, Table, Text } from "@mantine/core";
import Link from "next/link";
import { GetHairComponents } from "@/modules/hair/types";
import { useHairComponentDrawerStore } from "@/modules/hair/ui/hair-component-drawer-store";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

interface Props {
  hairComponents: GetHairComponents;
  onUpdate: () => void;
  onDelete: () => void;
}

export default function HairComponentTable({
  hairComponents,
  onUpdate,
  onDelete,
}: Props) {
  // Helper to format the amount (assuming amount is stored in cents)
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-UK", {
      style: "currency",
      currency: "GBP",
    }).format(amount);

  const openEditHairComponentDrawer = useHairComponentDrawerStore(
    (state) => state.openDrawer,
  );

  const deleteHairComponent = trpc.hair.deleteHairComponent.useMutation({
    onSuccess: () => {
      onDelete?.();
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Hair Component deleted.",
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to delete Hair Component",
        message: "Please try again.",
      });
    },
  });

  const openDeleteModal = (hairComponentId: string) =>
    modals.openConfirmModal({
      title: "Delete Hair Component?",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this hair component?
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () => deleteHairComponent.mutate({ id: hairComponentId }),
    });

  const rows = hairComponents.map((component) => (
    <Table.Tr key={component.id}>
      <Table.Td>
        <Text>{component.parent.color}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{component.parent.upc}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{component.parent.length}</Text>
      </Table.Td>
      <Table.Td
        style={{
          backgroundColor: component.weight > 0 ? "transparent" : "pink",
        }}
      >
        <Text>{component.weight}</Text>
      </Table.Td>
      <Table.Td>
        {component.weight > 0 && component.parent.hairOrder?.pricePerGram ? (
          <Text>
            {formatAmount(
              (component.weight * component.parent.hairOrder.pricePerGram) /
                100,
            )}
          </Text>
        ) : (
          <Text></Text>
        )}
      </Table.Td>
      <Table.Td>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button>Manage</Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Hair</Menu.Label>
            <Link href={`/dashboard/hair/${component.parent.id}`}>
              <Menu.Item>View</Menu.Item>
            </Link>
            <Menu.Item
              onClick={() =>
                openEditHairComponentDrawer({
                  isOpen: true,
                  maxWeight: component.weight + component.parent.weight,
                  hairComponent: component,
                  onUpdated: onUpdate,
                })
              }
            >
              Update
            </Menu.Item>
            <Menu.Item
              disabled={component.weight > 0}
              onClick={() => openDeleteModal(component.id)}
            >
              Delete
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
