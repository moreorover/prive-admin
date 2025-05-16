"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { HairOrder } from "@/lib/schemas";
import { HairOrderForm } from "@/modules/hair_orders/ui/components/hairOrder-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useNewHairOrderStoreActions,
	useNewHairOrderStoreDrawerIsOpen,
	useNewHairOrderStoreDrawerOnSuccess,
} from "./newHairOrderStore";

export const NewHairOrderDrawer = () => {
	const utils = trpc.useUtils();
	const isOpen = useNewHairOrderStoreDrawerIsOpen();
	const onSuccess = useNewHairOrderStoreDrawerOnSuccess();
	const { reset } = useNewHairOrderStoreActions();

	const { data: customerOptions, isLoading } = trpc.customers.getAll.useQuery(
		undefined,
		{
			enabled: isOpen,
		},
	);

	const newHairOrder = trpc.hairOrders.create.useMutation({
		onSuccess: () => {
			utils.hairOrders.getAll.invalidate();
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "HairOrder created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create HairOrder",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: HairOrder) {
		newHairOrder.mutate({ hairOrder: data });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={isOpen}
			onClose={reset}
			position="right"
			title="Update HairOrder"
		>
			{isLoading || !customerOptions ? (
				<LoaderSkeleton />
			) : (
				<HairOrderForm
					onSubmitAction={onSubmit}
					onDelete={onDelete}
					hairOrder={{
						placedAt: null,
						arrivedAt: null,
						weightReceived: 0,
						weightUsed: 0,
						total: 0,
						customerId: "",
					}}
					customerOptions={customerOptions.map((c) => ({
						value: c.id,
						label: c.name,
					}))}
				/>
			)}
		</Drawer>
	);
};
