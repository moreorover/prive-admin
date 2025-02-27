"use client";

import { Button, Table } from "@mantine/core";
import { GetAllProducts } from "@/modules/products/types";
import Link from "next/link";

interface Props {
  products: GetAllProducts;
}

export const ProductsTable = ({ products }: Props) => {
  const rows = products.map((product) => (
    <Table.Tr key={product.id}>
      <Table.Td>{product.name}</Table.Td>
      <Table.Td>{product.description}</Table.Td>
      <Table.Td>
        <Button component={Link} href={`/dashboard/products/${product.id}`}>
          View
        </Button>
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Description</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
};
