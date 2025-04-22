"use client";

import type { AppointmentNote } from "@/lib/schemas";
import { useAppointmentNoteDrawerStore } from "@/modules/appointment_notes/ui/appointment-note-drawer-store";
import { AppointmentNoteForm } from "@/modules/appointment_notes/ui/components/appointment-note-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditAppointmentNoteDrawer = () => {
	const isOpen = useAppointmentNoteDrawerStore((state) => state.isOpen);
	const appointmentNote = useAppointmentNoteDrawerStore((state) => state.note);
	const reset = useAppointmentNoteDrawerStore((state) => state.reset);
	const onUpdated = useAppointmentNoteDrawerStore((state) => state.onUpdated);

	const editAppointmentNote = trpc.appointmentNotes.update.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Appointment Note updated.",
			});
			reset();
			onUpdated?.();
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
			onClose={() => reset()}
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
