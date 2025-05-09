"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { HairAssigned } from "@/lib/schemas";
import {
	useEditHairAssignedDrawerHairAssignedId,
	useEditHairAssignedStoreActions,
	useEditHairAssignedStoreDrawerIsOpen,
	useEditHairAssignedStoreDrawerOnSuccess,
} from "@/modules/hair-assigned/ui/components/editHairAssignedStore";
import { HairAssignedForm } from "@/modules/hair-assigned/ui/components/hair-assigned-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditHairAssignedDrawer = () => {
	const utils = trpc.useUtils();
	const isOpen = useEditHairAssignedStoreDrawerIsOpen();
	const onSuccess = useEditHairAssignedStoreDrawerOnSuccess();
	const { reset } = useEditHairAssignedStoreActions();
	const hairAssignedId = useEditHairAssignedDrawerHairAssignedId();

	const { data: hairAssigned, isLoading } = trpc.hairAssigned.getById.useQuery(
		{ id: hairAssignedId },
		{
			enabled: !!hairAssignedId,
		},
	);

	const editHairAssigned = trpc.hairAssigned.update.useMutation({
		onSuccess: () => {
			utils.hairAssigned.getById.invalidate({ id: hairAssignedId });
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair Assigned updated.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to update Hair Assigned",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: HairAssigned) {
		editHairAssigned.mutate({
			hairAssigned: data,
		});
	}

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Update Hair Assigned"
			>
				{isLoading || !hairAssigned ? (
					<LoaderSkeleton />
				) : (
					<HairAssignedForm
						onSubmitAction={onSubmit}
						hairAssigned={hairAssigned}
						disabled={editHairAssigned.isPending}
						maxWeight={
							hairAssigned.hairOrder.weightReceived -
							hairAssigned.hairOrder.weightUsed +
							hairAssigned.weightInGrams
						}
					/>
				)}
			</Drawer>
		</>
	);
};
