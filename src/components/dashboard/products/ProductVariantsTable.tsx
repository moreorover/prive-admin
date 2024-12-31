"use client";

import { Table } from "@mantine/core";
import { ProductVariant } from "@/lib/schemas";
import { useSetAtom } from "jotai/index";
import { editProductVariantDrawerAtom } from "@/lib/atoms";

interface Props {
  productVariants: ProductVariant[];
}

export default function ProductsVariantsTable({ productVariants }: Props) {
  const showEditProductVariantDrawer = useSetAtom(editProductVariantDrawerAtom);
  const rows = productVariants.map((productVariant) => (
    <Table.Tr
      key={productVariant.id}
      onClick={() => {
        showEditProductVariantDrawer({ isOpen: true, productVariant });
      }}
    >
      <Table.Td>{productVariant.id}</Table.Td>
      <Table.Td>{productVariant.size}</Table.Td>
      <Table.Td>£ {productVariant.price}</Table.Td>
      <Table.Td>{productVariant.stock}</Table.Td>
    </Table.Tr>
  ));
  return (
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
  );
}
