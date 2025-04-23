"use client";

import { newOrderDrawerAtom } from "@/lib/atoms";
import type { Order } from "@/lib/schemas";
import { OrderForm } from "@/modules/orders/ui/components/order-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useAtom } from "jotai";

export const NewOrderDrawer = () => {
	const [value, setOpen] = useAtom(newOrderDrawerAtom);

	const newOrder = trpc.orders.create.useMutation({
		onSuccess: () => {
			value.onCreated();
			setOpen({ isOpen: false, customerId: "", onCreated: () => {} });
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Order created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create Order",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: Order) {
		newOrder.mutate({ order: data, customerId: value.customerId });
	}

	return (
		<Drawer
			opened={value.isOpen}
			onClose={() =>
				setOpen({ isOpen: false, customerId: "", onCreated: () => {} })
			}
			position="right"
			title="Create Order"
		>
			<OrderForm
				onSubmitAction={onSubmit}
				order={{
					customerId: value.customerId,
					status: "PENDING",
					type: "SALE",
					placedAt: dayjs().toDate(),
				}}
			/>
		</Drawer>
	);
};
