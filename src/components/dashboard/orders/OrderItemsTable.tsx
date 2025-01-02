"use client";

import { Table, Paper } from "@mantine/core";
import { editOrderItemDrawerAtom } from "@/lib/atoms";
import { useSetAtom } from "jotai";
import { OrderItem } from "@/lib/schemas";

interface Props {
  orderItems: {
    id: string;
    product: string;
    productVariant: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    orderItem: OrderItem;
  }[];
  productOptions: { value: string; label: string }[];
}

export default function OrderItemsTable({ orderItems, productOptions }: Props) {
  const showEditOrderItemDrawer = useSetAtom(editOrderItemDrawerAtom);

  const rows = orderItems.map((orderItem) => (
    <Table.Tr
      key={orderItem.id}
      onClick={() => {
        showEditOrderItemDrawer({
          isOpen: true,
          orderItem: orderItem.orderItem,
          productOptions,
        });
      }}
    >
      <Table.Td>{orderItem.id}</Table.Td>
      <Table.Td>{orderItem.product}</Table.Td>
      <Table.Td>{orderItem.productVariant}</Table.Td>
      <Table.Td>{orderItem.quantity}</Table.Td>
      <Table.Td>£ {orderItem.unitPrice}</Table.Td>
      <Table.Td>£ {orderItem.totalPrice}</Table.Td>
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
            <Table.Th>Unit Price</Table.Th>
            <Table.Th>Total Price</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}
