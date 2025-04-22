"use client";

import { editOrderItemDrawerAtom } from "@/lib/atoms";
import type { GetOrderItems } from "@/modules/order_item/types";
import { Button, Table } from "@mantine/core";
import { useSetAtom } from "jotai";

interface Props {
	orderItems: GetOrderItems;
	productOptions: { value: string; label: string }[];
	onUpdatedAction: () => void;
}

export const OrderItemsTable = ({ orderItems, onUpdatedAction }: Props) => {
	const showEditOrderItemDrawer = useSetAtom(editOrderItemDrawerAtom);

	const rows = orderItems.map((orderItem) => (
		<Table.Tr key={orderItem.id}>
			<Table.Td>{orderItem.productVariant.product.name}</Table.Td>
			<Table.Td>{orderItem.productVariant.size}</Table.Td>
			<Table.Td>{orderItem.quantity}</Table.Td>
			<Table.Td>£ {orderItem.unitPrice}</Table.Td>
			<Table.Td>£ {orderItem.totalPrice}</Table.Td>
			<Table.Td>
				<Button
					onClick={() => {
						showEditOrderItemDrawer({
							isOpen: true,
							orderItem: orderItem,
							productOptions: [
								{
									value: orderItem.productVariant.id,
									label: `${orderItem.productVariant.product.name} ${orderItem.productVariant.size}`,
								},
							],
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
					<Table.Th>Product</Table.Th>
					<Table.Th>Product Variant</Table.Th>
					<Table.Th>Quantity</Table.Th>
					<Table.Th>Unit Price</Table.Th>
					<Table.Th>Total Price</Table.Th>
					<Table.Th />
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>{rows}</Table.Tbody>
		</Table>
	);
};
