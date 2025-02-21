"use client";

import { Button, ScrollArea, Table, Text } from "@mantine/core";
import { GetAllOrders } from "@/modules/orders/types";
import dayjs from "dayjs";
import Link from "next/link";

interface Props {
  orders: GetAllOrders;
}

export const OrdersTable = ({ orders }: Props) => {
  const rows = orders.map((order) => (
    <Table.Tr key={order.id}>
      <Table.Td>
        <Text>{order.customer?.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{order.type}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{order.status}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{dayjs(order.placedAt).format("DD MMM YYYY HH:mm")}</Text>
      </Table.Td>
      <Table.Td>
        <Button component={Link} href={`/dashboard/orders/${order.id}`}>
          View
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Customer Name</Table.Th>
            <Table.Th>Order Type</Table.Th>
            <Table.Th>Order Status</Table.Th>
            <Table.Th>Placed At</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
};
