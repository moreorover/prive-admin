"use client";

import { editHairAssignmentToAppointmentDrawerAtom } from "@/lib/atoms";
import type { HairAssignedToAppointment } from "@/lib/schemas";
import { HairAssignmentToAppointmentForm } from "@/modules/appointments/ui/components/hair-assignment-to-appointment-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai/index";

export const EditHairAssignmentToAppointmentDrawer = () => {
	const [value, setOpen] = useAtom(editHairAssignmentToAppointmentDrawerAtom);

	const editHairAssignment = trpc.appointments.updateHairAssignment.useMutation(
		{
			onSuccess: () => {
				notifications.show({
					color: "green",
					title: "Success!",
					message: "Hair assignment updated.",
				});
				value.onUpdated();
				setOpen({
					isOpen: false,
					hairAssignment: {
						id: "",
						hairOrderId: "",
						appointmentId: "",
						weightInGrams: 0,
						soldFor: 0,
					},
					maxWeight: 0,
					onUpdated: () => {},
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
				opened={value.isOpen}
				onClose={() =>
					setOpen({
						isOpen: false,
						hairAssignment: {
							id: "",
							hairOrderId: "",
							appointmentId: "",
							weightInGrams: 0,
							soldFor: 0,
						},
						maxWeight: 0,
						onUpdated: () => {},
					})
				}
				position="right"
				title="Update Hair Assignment"
			>
				<HairAssignmentToAppointmentForm
					onSubmitAction={onSubmit}
					hairAssignment={value.hairAssignment}
					maxWeight={value.maxWeight}
					disabled={editHairAssignment.isPending}
				/>
			</Drawer>
		</>
	);
};
