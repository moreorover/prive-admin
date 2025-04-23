"use client";

import { editOrderItemDrawerAtom } from "@/lib/atoms";
import type { OrderItem } from "@/lib/schemas";
import { OrderItemForm } from "@/modules/order_item/ui/components/order-item-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";

export const EditOrderItemDrawer = () => {
	const [value, setOpen] = useAtom(editOrderItemDrawerAtom);

	const updateOrderItem = trpc.orderItems.update.useMutation({
		onSuccess: () => {
			value.onUpdated();
			setOpen({
				isOpen: false,
				orderItem: {
					orderId: "",
					quantity: 0,
					totalPrice: 0,
					unitPrice: 0,
					productVariantId: "",
				},
				productOptions: [],
				onUpdated: () => {},
			});
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Order Item created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create Order Item",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: OrderItem) {
		updateOrderItem.mutate({ orderItem: data });
	}

	return (
		<Drawer
			opened={value.isOpen}
			onClose={() =>
				setOpen({
					isOpen: false,
					orderItem: {
						orderId: "",
						quantity: 0,
						totalPrice: 0,
						unitPrice: 0,
						productVariantId: "",
					},
					productOptions: [],
					onUpdated: () => {},
				})
			}
			position="right"
			title="Create Order Item"
		>
			<OrderItemForm
				onSubmitAction={onSubmit}
				orderItem={{
					id: value.orderItem.id,
					orderId: value.orderItem.orderId,
					productVariantId: value.orderItem.productVariantId,
					quantity: value.orderItem.quantity,
					unitPrice: value.orderItem.unitPrice,
					totalPrice: value.orderItem.totalPrice,
				}}
				productOptions={value.productOptions}
				isItemSelectDisabled={true}
			/>
		</Drawer>
	);
};
