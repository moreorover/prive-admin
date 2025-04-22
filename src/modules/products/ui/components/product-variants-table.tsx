"use client";

import { editProductVariantDrawerAtom } from "@/lib/atoms";
import type { ProductVariant } from "@/lib/schemas";
import { Button, Table } from "@mantine/core";
import { useSetAtom } from "jotai/index";

interface Props {
	productVariants: ProductVariant[];
	onUpdatedAction: () => void;
}

export const ProductVariantsTable = ({
	productVariants,
	onUpdatedAction,
}: Props) => {
	const showEditProductVariantDrawer = useSetAtom(editProductVariantDrawerAtom);
	const rows = productVariants.map((productVariant) => (
		<Table.Tr key={productVariant.id}>
			<Table.Td>{productVariant.size}</Table.Td>
			<Table.Td>£ {productVariant.price}</Table.Td>
			<Table.Td>{productVariant.stock}</Table.Td>
			<Table.Td>
				<Button
					onClick={() => {
						showEditProductVariantDrawer({
							isOpen: true,
							productVariant,
							onUpdated: onUpdatedAction,
						});
					}}
				>
					Edit
				</Button>
			</Table.Td>
		</Table.Tr>
	));
	return (
		<Table striped highlightOnHover>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Size</Table.Th>
					<Table.Th>Price</Table.Th>
					<Table.Th>Stock</Table.Th>
					<Table.Th />
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>{rows}</Table.Tbody>
		</Table>
	);
};
