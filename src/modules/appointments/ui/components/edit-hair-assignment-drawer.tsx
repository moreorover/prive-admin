"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { HairAssignedToAppointment } from "@/lib/schemas";
import { HairAssignmentToAppointmentForm } from "@/modules/appointments/ui/components/hair-assignment-to-appointment-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useEditHairAssignmentToAppointmentStoreActions,
	useEditHairAssignmentToAppointmentStoreDrawerHairAssignmentId,
	useEditHairAssignmentToAppointmentStoreDrawerIsOpen,
	useEditHairAssignmentToAppointmentStoreDrawerOnUpdated,
} from "./editHairAssignementToAppointmentStore";

export const EditHairAssignmentToAppointmentDrawer = () => {
	const utils = trpc.useUtils();
	const isOpen = useEditHairAssignmentToAppointmentStoreDrawerIsOpen();
	const { reset } = useEditHairAssignmentToAppointmentStoreActions();
	const onUpdated = useEditHairAssignmentToAppointmentStoreDrawerOnUpdated();
	const hairAssignmentId =
		useEditHairAssignmentToAppointmentStoreDrawerHairAssignmentId();

	const { data: hairAssignment, isLoading } =
		trpc.appointments.getHairAssignmentById.useQuery(
			{ hairAssignmentId },
			{
				enabled: !!hairAssignmentId,
			},
		);

	const editHairAssignment = trpc.appointments.updateHairAssignment.useMutation(
		{
			onSuccess: () => {
				utils.appointments.getHairAssignmentById.invalidate({
					hairAssignmentId,
				});
				onUpdated();
				reset();
				notifications.show({
					color: "green",
					title: "Success!",
					message: "Hair assignment updated.",
				});
			},
			onError: () => {
				notifications.show({
					color: "red",
					title: "Failed to update Hair assignment",
					message: "Please try again.",
				});
			},
		},
	);

	async function onSubmit(data: HairAssignedToAppointment) {
		editHairAssignment.mutate({
			hairAssignment: data,
		});
	}

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Update Hair Assignment"
			>
				{isLoading || !hairAssignment ? (
					<LoaderSkeleton />
				) : (
					<HairAssignmentToAppointmentForm
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
