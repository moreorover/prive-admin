"use client";

import { newAppointmentDrawerAtom } from "@/lib/atoms";
import type { Appointment } from "@/lib/schemas";
import { AppointmentForm } from "@/modules/appointments/ui/components/appointment-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useAtom } from "jotai";

export const NewAppointmentDrawer = () => {
	const [value, setOpen] = useAtom(newAppointmentDrawerAtom);

	const newAppointment = trpc.appointments.create.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Appointment created.",
			});
			value.onCreated();
			setOpen({
				isOpen: false,
				clientId: "",
				onCreated: () => {},
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
		newAppointment.mutate({ appointment: data, clientId: value.clientId });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={value.isOpen}
			onClose={() =>
				setOpen({ isOpen: false, clientId: "", onCreated: () => {} })
			}
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
