"use client";

import type { AppointmentNote } from "@/lib/schemas";
import {
	useAppointmentNoteDrawerStoreActions,
	useAppointmentNoteDrawerStoreAppointmentId,
	useAppointmentNoteDrawerStoreIsOpen,
	useAppointmentNoteDrawerStoreNote,
	useAppointmentNoteDrawerStoreOnCreated,
} from "@/modules/appointment_notes/ui/appointment-note-drawer-store";
import { AppointmentNoteForm } from "@/modules/appointment_notes/ui/components/appointment-note-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const NewAppointmentNoteDrawer = () => {
	const isOpen = useAppointmentNoteDrawerStoreIsOpen();
	const appointmentId = useAppointmentNoteDrawerStoreAppointmentId();
	const appointmentNote = useAppointmentNoteDrawerStoreNote();
	const { reset } = useAppointmentNoteDrawerStoreActions();
	const onCreated = useAppointmentNoteDrawerStoreOnCreated();

	const newAppointmentNote = trpc.appointmentNotes.create.useMutation({
		onSuccess: () => {
			reset();
			onCreated?.();
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
		newAppointmentNote.mutate({ appointmentId, note: data });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={isOpen && onCreated !== undefined}
			onClose={reset}
			position="right"
			title="Create Appointment Note"
		>
			<AppointmentNoteForm
				onSubmitAction={onSubmit}
				onDelete={onDelete}
				appointmentNote={appointmentNote}
			/>
		</Drawer>
	);
};
