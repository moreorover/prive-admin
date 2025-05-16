"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { HairOrder } from "@/lib/schemas";
import { HairOrderForm } from "@/modules/hair_orders/ui/components/hairOrder-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useEditHairOrderStoreActions,
	useEditHairOrderStoreDrawerHairOrderId,
	useEditHairOrderStoreDrawerIsOpen,
	useEditHairOrderStoreDrawerOnSuccess,
} from "./editHairOrderStore";

export const EditHairOrderDrawer = () => {
	const utils = trpc.useUtils();
	const isOpen = useEditHairOrderStoreDrawerIsOpen();
	const onSuccess = useEditHairOrderStoreDrawerOnSuccess();
	const { reset } = useEditHairOrderStoreActions();
	const hairOrderId = useEditHairOrderStoreDrawerHairOrderId();

	const { data: hairOrder, isLoading } = trpc.hairOrders.getById.useQuery(
		{ id: hairOrderId },
		{
			enabled: !!hairOrderId,
		},
	);

	const { data: customerOptions, isLoading: isLoadingCustomerOptions } =
		trpc.customers.getAll.useQuery(undefined, {
			enabled: !!hairOrderId,
		});

	const editHairOrder = trpc.hairOrders.update.useMutation({
		onSuccess: () => {
			utils.hairOrders.getById.invalidate({ id: hairOrderId });
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "HairOrder updated.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to update HairOrder",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: HairOrder) {
		editHairOrder.mutate({ hairOrder: data });
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
			{isLoading ||
			isLoadingCustomerOptions ||
			!hairOrder ||
			!customerOptions ? (
				<LoaderSkeleton />
			) : (
				<HairOrderForm
					onSubmitAction={onSubmit}
					onDelete={onDelete}
					hairOrder={hairOrder}
					customerOptions={customerOptions.map((c) => ({
						value: c.id,
						label: c.name,
					}))}
				/>
			)}
		</Drawer>
	);
};
