"use client";
import type { HairAssignedToAppointment } from "@/lib/schemas";
import { HairAssignmentToAppointmentForm } from "@/modules/appointments/ui/components/hair-assignment-to-appointment-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useEditHairAssignmentToAppointmentStoreActions,
	useEditHairAssignmentToAppointmentStoreDrawerHairAssignment,
	useEditHairAssignmentToAppointmentStoreDrawerIsOpen,
	useEditHairAssignmentToAppointmentStoreDrawerMaxWeight,
	useEditHairAssignmentToAppointmentStoreDrawerOnUpdated,
} from "./editHairAssignementToAppointmentStore";

export const EditHairAssignmentToAppointmentDrawer = () => {
	const isOpen = useEditHairAssignmentToAppointmentStoreDrawerIsOpen();
	const { reset } = useEditHairAssignmentToAppointmentStoreActions();
	const onUpdated = useEditHairAssignmentToAppointmentStoreDrawerOnUpdated();
	const hairAssignment =
		useEditHairAssignmentToAppointmentStoreDrawerHairAssignment();
	const maxWeight = useEditHairAssignmentToAppointmentStoreDrawerMaxWeight();

	const editHairAssignment = trpc.appointments.updateHairAssignment.useMutation(
		{
			onSuccess: () => {
				notifications.show({
					color: "green",
					title: "Success!",
					message: "Hair assignment updated.",
				});
				onUpdated();
				reset();
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
				onClose={() => reset()}
				position="right"
				title="Update Hair Assignment"
			>
				<HairAssignmentToAppointmentForm
					onSubmitAction={onSubmit}
					hairAssignment={hairAssignment}
					maxWeight={maxWeight}
					disabled={editHairAssignment.isPending}
				/>
			</Drawer>
		</>
	);
};
