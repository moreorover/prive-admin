"use client";

import { editAppointmentDrawerAtom } from "@/lib/atoms";
import type { Appointment } from "@/lib/schemas";
import { AppointmentForm } from "@/modules/appointments/ui/components/appointment-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useAtom } from "jotai";

export const EditAppointmentDrawer = () => {
	const [value, setOpen] = useAtom(editAppointmentDrawerAtom);

	const utils = trpc.useUtils();

	const editAppointment = trpc.appointments.update.useMutation({
		onSuccess: () => {
			utils.appointments.getOne.invalidate({
				id: value.appointment.id,
			});
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Appointment updated.",
			});
			setOpen({
				isOpen: false,
				appointment: { name: "", startsAt: dayjs().toDate() },
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
			opened={value.isOpen}
			onClose={() =>
				setOpen({
					isOpen: false,
					appointment: { name: "", startsAt: dayjs().toDate() },
				})
			}
			position="right"
			title="Update Appointment"
		>
			<AppointmentForm
				onSubmitAction={onSubmit}
				onDelete={onDelete}
				appointment={{ ...value.appointment }}
			/>
		</Drawer>
	);
};
