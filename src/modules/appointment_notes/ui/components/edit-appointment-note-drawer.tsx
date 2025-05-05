"use client";

import type { AppointmentNote } from "@/lib/schemas";
import {
	useAppointmentNoteDrawerStoreActions,
	useAppointmentNoteDrawerStoreIsOpen,
	useAppointmentNoteDrawerStoreNote,
	useAppointmentNoteDrawerStoreOnUpdated,
} from "@/modules/appointment_notes/ui/appointment-note-drawer-store";
import { AppointmentNoteForm } from "@/modules/appointment_notes/ui/components/appointment-note-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditAppointmentNoteDrawer = () => {
	const isOpen = useAppointmentNoteDrawerStoreIsOpen();
	const appointmentNote = useAppointmentNoteDrawerStoreNote();
	const { reset } = useAppointmentNoteDrawerStoreActions();
	const onUpdated = useAppointmentNoteDrawerStoreOnUpdated();

	const editAppointmentNote = trpc.appointmentNotes.update.useMutation({
		onSuccess: () => {
			reset();
			onUpdated?.();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Appointment Note updated.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to update Appointment Note",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: AppointmentNote) {
		editAppointmentNote.mutate({ note: data });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={isOpen && onUpdated !== undefined}
			onClose={reset}
			position="right"
			title="Update Appointment Note"
		>
			<AppointmentNoteForm
				onSubmitAction={onSubmit}
				onDelete={onDelete}
				appointmentNote={appointmentNote}
			/>
		</Drawer>
	);
};
