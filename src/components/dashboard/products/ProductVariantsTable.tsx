"use client";

import { Table, Paper } from "@mantine/core";
import { ProductVariant } from "@/lib/schemas";

interface Props {
  productVariants: ProductVariant[];
}

export default function ProductsVariantsTable({ productVariants }: Props) {
  const rows = productVariants.map((product) => (
    <Table.Tr key={product.id}>
      <Table.Td>{product.id}</Table.Td>
      <Table.Td>{product.size}</Table.Td>
      <Table.Td>{product.price}</Table.Td>
      <Table.Td>{product.stock}</Table.Td>
    </Table.Tr>
  ));
  return (
    <Paper shadow="xs" p="sm">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Size</Table.Th>
            <Table.Th>Price</Table.Th>
            <Table.Th>Stock</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}
