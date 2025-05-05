"use client";

import type { HairAssignedToSale } from "@/lib/schemas";
import {
	useEditHairAssignmentToSaleStoreActions,
	useEditHairAssignmentToSaleStoreDrawerHairAssignment,
	useEditHairAssignmentToSaleStoreDrawerIsOpen,
	useEditHairAssignmentToSaleStoreDrawerMaxWeight,
	useEditHairAssignmentToSaleStoreDrawerOnUpdated,
} from "@/modules/hair-sales/ui/components/editHairAssignementToSaleStore";
import { HairAssignmentToSaleForm } from "@/modules/hair-sales/ui/components/hair-assignment-to-sale-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditHairAssignmentToSaleDrawer = () => {
	const isOpen = useEditHairAssignmentToSaleStoreDrawerIsOpen();
	const { reset } = useEditHairAssignmentToSaleStoreActions();
	const onUpdated = useEditHairAssignmentToSaleStoreDrawerOnUpdated();
	const hairAssignment = useEditHairAssignmentToSaleStoreDrawerHairAssignment();
	const maxWeight = useEditHairAssignmentToSaleStoreDrawerMaxWeight();

	const editHairAssignment = trpc.hairSales.updateHairAssignment.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair assignment updated.",
			});
			onUpdated();
			reset();
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
				<HairAssignmentToSaleForm
					onSubmitAction={onSubmit}
					hairAssignment={hairAssignment}
					maxWeight={maxWeight}
					disabled={editHairAssignment.isPending}
				/>
			</Drawer>
		</>
	);
};
