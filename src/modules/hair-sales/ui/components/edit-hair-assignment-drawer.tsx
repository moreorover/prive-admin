"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { HairAssignedToSale } from "@/lib/schemas";
import {
	useEditHairAssignmentToSaleStoreActions,
	useEditHairAssignmentToSaleStoreDrawerHairAssignmentId,
	useEditHairAssignmentToSaleStoreDrawerIsOpen,
	useEditHairAssignmentToSaleStoreDrawerOnSuccess,
} from "@/modules/hair-sales/ui/components/editHairAssignementToSaleStore";
import { HairAssignmentToSaleForm } from "@/modules/hair-sales/ui/components/hair-assignment-to-sale-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditHairAssignmentToSaleDrawer = () => {
	const isOpen = useEditHairAssignmentToSaleStoreDrawerIsOpen();
	const { reset } = useEditHairAssignmentToSaleStoreActions();
	const onSuccess = useEditHairAssignmentToSaleStoreDrawerOnSuccess();
	const hairAssignmentId =
		useEditHairAssignmentToSaleStoreDrawerHairAssignmentId();

	const { data: hairAssignment, isLoading } =
		trpc.hairSales.getHairAssignmentById.useQuery(
			{ id: hairAssignmentId },
			{
				enabled: !!hairAssignmentId,
			},
		);

	const editHairAssignment = trpc.hairSales.updateHairAssignment.useMutation({
		onSuccess: () => {
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair assignment updated.",
			});
		},
		onError: (e) => {
			console.error(e);
			notifications.show({
				color: "red",
				title: "Failed to update Hair assignment",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: HairAssignedToSale) {
		editHairAssignment.mutate({
			hairAssignment: data,
		});
	}

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={() => reset()}
				position="right"
				title="Update Hair Assignment"
			>
				{isLoading || !hairAssignment ? (
					<LoaderSkeleton />
				) : (
					<HairAssignmentToSaleForm
						onSubmitAction={onSubmit}
						hairAssignment={hairAssignment}
						maxWeight={
							hairAssignment.hairOrder.weightReceived -
							hairAssignment.hairOrder.weightUsed +
							hairAssignment.weightInGrams
						}
						disabled={editHairAssignment.isPending}
					/>
				)}
			</Drawer>
		</>
	);
};
