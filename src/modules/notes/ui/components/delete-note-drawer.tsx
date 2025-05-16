"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { trpc } from "@/trpc/client";
import { Button, Drawer, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useDeleteNoteStoreActions,
	useDeleteNoteStoreDrawerIsOpen,
	useDeleteNoteStoreDrawerNoteId,
	useDeleteNoteStoreDrawerOnSuccess,
} from "./deleteNoteStore";

export const DeleteNoteDrawer = () => {
	const isOpen = useDeleteNoteStoreDrawerIsOpen();
	const { reset } = useDeleteNoteStoreActions();
	const onSuccess = useDeleteNoteStoreDrawerOnSuccess();
	const noteId = useDeleteNoteStoreDrawerNoteId();

	const { data: note, isLoading } = trpc.notes.getById.useQuery(
		{ id: noteId },
		{
			enabled: !!noteId,
		},
	);

	const deleteNote = trpc.notes.delete.useMutation({
		onSuccess: () => {
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Note deleted.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to delete Note",
				message: "Please try again.",
			});
		},
	});

	const handleConfirmDelete = () => {
		if (note) {
			deleteNote.mutate({ id: note.id });
		}
	};

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Delete Note"
			>
				{isLoading || !note ? (
					<LoaderSkeleton />
				) : (
					<Stack>
						<Title order={4}>Are you sure?</Title>
						<Text>
							This will permanently delete the note for:{" "}
							<strong>{note.id}</strong>
						</Text>

						<Group mt="md">
							<Button variant="outline" onClick={reset}>
								Cancel
							</Button>
							<Button
								color="red"
								onClick={handleConfirmDelete}
								loading={deleteNote.isPending}
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
