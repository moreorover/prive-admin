"use client";

import { Button, Menu, ScrollArea, Table, Text } from "@mantine/core";
import Link from "next/link";
import { Hairs } from "@/modules/hair_orders/types";

interface Props {
  hair: Hairs;
}

export default function HairTable({ hair }: Props) {
  // Helper to format the amount (assuming amount is stored in cents)
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-UK", {
      style: "currency",
      currency: "GBP",
    }).format(amount);

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
        <Text>{h.weightReceived}</Text>
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
              <Menu.Item>View</Menu.Item>
            </Link>
            {h.appointmentId && (
              <Link href={`/dashboard/appointments/${h.appointmentId}`}>
                <Menu.Item>View Appointment</Menu.Item>
              </Link>
            )}
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
            <Table.Th>Weight Received (g)</Table.Th>
            <Table.Th>Price</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
