"use client";

import { Table, Paper } from "@mantine/core";

interface Props {
  orderItems: {
    id: string;
    product: string;
    productVariant: string;
    quantity: number;
    totalPrice: number;
  }[];
}

export default function OrderItemsTable({ orderItems }: Props) {
  const rows = orderItems.map((orderItem) => (
    <Table.Tr key={orderItem.id}>
      <Table.Td>{orderItem.id}</Table.Td>
      <Table.Td>{orderItem.product}</Table.Td>
      <Table.Td>{orderItem.productVariant}</Table.Td>
      <Table.Td>{orderItem.quantity}</Table.Td>
      <Table.Td>{orderItem.totalPrice}</Table.Td>
    </Table.Tr>
  ));
  return (
    <Paper shadow="xs" p="sm">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Product</Table.Th>
            <Table.Th>Product Variant</Table.Th>
            <Table.Th>Quantity</Table.Th>
            <Table.Th>Total Price</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}
