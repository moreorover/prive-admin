"use client";

import { Table, Paper } from "@mantine/core";
import { Customer, Order } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface Props {
  orders: (Order & { customer: Customer })[];
}

export default function SimpleOrdersTable({ orders }: Props) {
  const router = useRouter();
  const rows = orders.map((order) => (
    <Table.Tr
      key={order.id}
      onClick={() => {
        router.push(`/dashboard/orders/${order.id}`);
      }}
    >
      <Table.Td>{order.id}</Table.Td>
      <Table.Td>{order.customer.name}</Table.Td>
      <Table.Td>{dayjs(order.placedAt).format("DD MMM YYYY")}</Table.Td>
      <Table.Td>{order.status}</Table.Td>
    </Table.Tr>
  ));
  return (
    <Paper shadow="xs" p="sm">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Customer</Table.Th>
            <Table.Th>Placed At</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}
