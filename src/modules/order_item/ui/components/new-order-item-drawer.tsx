"use client";

import { newOrderItemDrawerAtom } from "@/lib/atoms";
import type { OrderItem } from "@/lib/schemas";
import { OrderItemForm } from "@/modules/order_item/ui/components/order-item-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";

export const NewOrderItemDrawer = () => {
	const [value, setOpen] = useAtom(newOrderItemDrawerAtom);

	const newOrderItem = trpc.orderItems.create.useMutation({
		onSuccess: () => {
			value.onCreated();
			setOpen({
				isOpen: false,
				orderId: "",
				productOptions: [],
				onCreated: () => {},
			});
			notifications.show({
				color: "green",
				title: "Success!",
				message: "OrderItem created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create OrderItem",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: OrderItem) {
		newOrderItem.mutate({ orderItem: data });
	}

	return (
		<Drawer
			opened={value.isOpen}
			onClose={() =>
				setOpen({
					isOpen: false,
					orderId: "",
					productOptions: [],
					onCreated: () => {},
				})
			}
			position="right"
			title="Create Order Item"
		>
			<OrderItemForm
				onSubmitAction={onSubmit}
				orderItem={{
					orderId: value.orderId,
					productVariantId: "",
					quantity: 0,
					unitPrice: 0,
					totalPrice: 0,
				}}
				productOptions={value.productOptions}
			/>
		</Drawer>
	);
};
