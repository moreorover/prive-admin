"use client";

import type { Appointment } from "@/lib/schemas";
import { AppointmentForm } from "@/modules/appointments/ui/components/appointment-form";
import {
	useNewAppointmentStoreActions,
	useNewAppointmentStoreDrawerIsOpen,
	useNewAppointmentStoreDrawerOnSuccess,
	useNewAppointmentStoreDrawerRelations,
} from "@/modules/appointments/ui/components/newAppointmentStore";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";

export const NewAppointmentDrawer = () => {
	const isOpen = useNewAppointmentStoreDrawerIsOpen();
	const relations = useNewAppointmentStoreDrawerRelations();
	const { reset } = useNewAppointmentStoreActions();
	const onSuccess = useNewAppointmentStoreDrawerOnSuccess();

	const newAppointment = trpc.appointments.create.useMutation({
		onSuccess: () => {
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Appointment created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create Appointment.",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: Appointment) {
		newAppointment.mutate({ appointment: data, ...relations });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={isOpen}
			onClose={reset}
			position="right"
			title="Create Appointment"
		>
			<AppointmentForm
				onSubmitAction={onSubmit}
				onDelete={onDelete}
				appointment={{ name: "", startsAt: dayjs().toDate() }}
			/>
		</Drawer>
	);
};
