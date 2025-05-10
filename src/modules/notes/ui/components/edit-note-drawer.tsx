"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { Note } from "@/lib/schemas";
import {
	useEditNoteStoreActions,
	useEditNoteStoreDrawerIsOpen,
	useEditNoteStoreDrawerNoteId,
	useEditNoteStoreDrawerOnSuccess,
} from "@/modules/notes/ui/components/editNoteStore";
import { NoteForm } from "@/modules/notes/ui/components/note-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditNoteDrawer = () => {
	const isOpen = useEditNoteStoreDrawerIsOpen();
	const { reset } = useEditNoteStoreActions();
	const onSuccess = useEditNoteStoreDrawerOnSuccess();
	const noteId = useEditNoteStoreDrawerNoteId();

	const { data: note, isLoading } = trpc.notes.getById.useQuery(
		{ id: noteId },
		{
			enabled: !!noteId,
		},
	);

	const editNote = trpc.notes.update.useMutation({
		onSuccess: () => {
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Note updated.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to update Note",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: Note) {
		editNote.mutate({ note: { ...data } });
	}

	return (
		<Drawer
			opened={isOpen}
			onClose={reset}
			position="right"
			title="Update Note"
		>
			{isLoading || !note ? (
				<LoaderSkeleton />
			) : (
				<NoteForm onSubmitAction={onSubmit} note={note} />
			)}
		</Drawer>
	);
};
