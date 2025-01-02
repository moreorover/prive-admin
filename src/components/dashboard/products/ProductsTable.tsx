"use client";

import { Table } from "@mantine/core";
import { Product } from "@/lib/schemas";
import { useRouter } from "next/navigation";

interface Props {
  products: Product[];
}

export default function ProductsTable({ products }: Props) {
  const router = useRouter();
  const rows = products.map((product) => (
    <Table.Tr
      key={product.id}
      onClick={() => {
        router.push(`/dashboard/products/${product.id}`);
      }}
    >
      <Table.Td>{product.id}</Table.Td>
      <Table.Td>{product.name}</Table.Td>
      <Table.Td>{product.description}</Table.Td>
    </Table.Tr>
  ));
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>ID</Table.Th>
          <Table.Th>Name</Table.Th>
          <Table.Th>Description</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
