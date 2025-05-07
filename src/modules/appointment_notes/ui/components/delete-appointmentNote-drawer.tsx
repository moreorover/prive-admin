"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { trpc } from "@/trpc/client";
import { Button, Drawer, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useDeleteAppointmentNoteStoreActions,
	useDeleteAppointmentNoteStoreDrawerAppointmentNoteId,
	useDeleteAppointmentNoteStoreDrawerIsOpen,
	useDeleteAppointmentNoteStoreDrawerOnSuccess,
} from "./deleteAppointmentNoteStore";

export const DeleteAppointmentNoteDrawer = () => {
	const isOpen = useDeleteAppointmentNoteStoreDrawerIsOpen();
	const { reset } = useDeleteAppointmentNoteStoreActions();
	const onSuccess = useDeleteAppointmentNoteStoreDrawerOnSuccess();
	const appointmentNoteId =
		useDeleteAppointmentNoteStoreDrawerAppointmentNoteId();

	const { data: appointmentNote, isLoading } =
		trpc.appointmentNotes.getById.useQuery(
			{ id: appointmentNoteId },
			{
				enabled: !!appointmentNoteId,
			},
		);

	const deleteAppointmentNote = trpc.appointmentNotes.delete.useMutation({
		onSuccess: () => {
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Appointment Note deleted.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to delete Appointment Note",
				message: "Please try again.",
			});
		},
	});

	const handleConfirmDelete = () => {
		if (appointmentNote) {
			deleteAppointmentNote.mutate({ id: appointmentNote.id });
		}
	};

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Delete Appointment Note"
			>
				{isLoading || !appointmentNote ? (
					<LoaderSkeleton />
				) : (
					<Stack>
						<Title order={4}>Are you sure?</Title>
						<Text>
							This will permanently delete the appointment note for:{" "}
							<strong>{appointmentNote.id}</strong>
						</Text>

						<Group mt="md">
							<Button variant="outline" onClick={reset}>
								Cancel
							</Button>
							<Button
								color="red"
								onClick={handleConfirmDelete}
								loading={deleteAppointmentNote.isPending}
							>
								Confirm Delete
							</Button>
						</Group>
					</Stack>
				)}
			</Drawer>
		</>
	);
};
