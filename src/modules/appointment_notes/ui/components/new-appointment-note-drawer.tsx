"use client";

import type { AppointmentNote } from "@/lib/schemas";
import { AppointmentNoteForm } from "@/modules/appointment_notes/ui/components/appointment-note-form";
import {
	useNewAppointmentNoteStoreActions,
	useNewAppointmentNoteStoreDrawerIsOpen,
	useNewAppointmentNoteStoreDrawerOnSuccess,
	useNewAppointmentNoteStoreDrawerRelations,
} from "@/modules/appointment_notes/ui/components/newAppointmentNoteDrawerStore";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const NewAppointmentNoteDrawer = () => {
	const isOpen = useNewAppointmentNoteStoreDrawerIsOpen();
	const relations = useNewAppointmentNoteStoreDrawerRelations();
	const { reset } = useNewAppointmentNoteStoreActions();
	const onSuccess = useNewAppointmentNoteStoreDrawerOnSuccess();

	const newAppointmentNote = trpc.appointmentNotes.create.useMutation({
		onSuccess: () => {
			onSuccess?.();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Appointment Note created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create Appointment Note",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: AppointmentNote) {
		newAppointmentNote.mutate({ note: data, ...relations });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={isOpen}
			onClose={reset}
			position="right"
			title="Create Appointment Note"
		>
			<AppointmentNoteForm
				onSubmitAction={onSubmit}
				onDelete={onDelete}
				appointmentNote={{ note: "" }}
			/>
		</Drawer>
	);
};
