"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { AppointmentNote } from "@/lib/schemas";
import { AppointmentNoteForm } from "@/modules/appointment_notes/ui/components/appointment-note-form";
import {
	useEditAppointmentNoteStoreActions,
	useEditAppointmentNoteStoreDrawerAppointmentNoteId,
	useEditAppointmentNoteStoreDrawerIsOpen,
	useEditAppointmentNoteStoreDrawerOnSuccess,
} from "@/modules/appointment_notes/ui/components/editAppointmentNoteDrawerStore";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditAppointmentNoteDrawer = () => {
	const isOpen = useEditAppointmentNoteStoreDrawerIsOpen();
	const appointmentNoteId =
		useEditAppointmentNoteStoreDrawerAppointmentNoteId();
	const { reset } = useEditAppointmentNoteStoreActions();
	const onSuccess = useEditAppointmentNoteStoreDrawerOnSuccess();

	const { data: appointmentNote, isLoading } =
		trpc.appointmentNotes.getById.useQuery(
			{ id: appointmentNoteId },
			{
				enabled: !!appointmentNoteId,
			},
		);

	const editAppointmentNote = trpc.appointmentNotes.update.useMutation({
		onSuccess: () => {
			reset();
			onSuccess?.();
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
			opened={isOpen}
			onClose={reset}
			position="right"
			title="Update Appointment Note"
		>
			{isLoading || !appointmentNote ? (
				<LoaderSkeleton />
			) : (
				<AppointmentNoteForm
					onSubmitAction={onSubmit}
					onDelete={onDelete}
					appointmentNote={appointmentNote}
				/>
			)}
		</Drawer>
	);
};
