"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { Appointment } from "@/lib/schemas";
import { AppointmentForm } from "@/modules/appointments/ui/components/appointment-form";
import {
	useEditAppointmentStoreActions,
	useEditAppointmentStoreDrawerAppointmentId,
	useEditAppointmentStoreDrawerIsOpen,
	useEditAppointmentStoreDrawerOnSuccess,
} from "@/modules/appointments/ui/components/editAppointmentStore";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditAppointmentDrawer = () => {
	const utils = trpc.useUtils();
	const isOpen = useEditAppointmentStoreDrawerIsOpen();
	const onSuccess = useEditAppointmentStoreDrawerOnSuccess();
	const { reset } = useEditAppointmentStoreActions();
	const appointmentId = useEditAppointmentStoreDrawerAppointmentId();

	const { data: appointment, isLoading } = trpc.appointments.getById.useQuery(
		{ id: appointmentId },
		{
			enabled: !!appointmentId,
		},
	);

	const editAppointment = trpc.appointments.update.useMutation({
		onSuccess: () => {
			onSuccess();
			utils.appointments.getById.invalidate({
				id: appointmentId,
			});
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Appointment updated.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to update Appointment.",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: Appointment) {
		editAppointment.mutate({ appointment: data });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={isOpen}
			onClose={reset}
			position="right"
			title="Update Appointment"
		>
			{isLoading || !appointment ? (
				<LoaderSkeleton />
			) : (
				<AppointmentForm
					onSubmitAction={onSubmit}
					onDelete={onDelete}
					appointment={appointment}
				/>
			)}
		</Drawer>
	);
};
