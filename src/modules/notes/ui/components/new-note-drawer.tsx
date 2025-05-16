"use client";
import type { Note } from "@/lib/schemas";
import {
	useNewNoteStoreActions,
	useNewNoteStoreDrawerIsOpen,
	useNewNoteStoreDrawerOnSuccess,
	useNewNoteStoreDrawerRelations,
} from "@/modules/notes/ui/components/newNoteStore";
import { NoteForm } from "@/modules/notes/ui/components/note-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const NewNoteDrawer = () => {
	const isOpen = useNewNoteStoreDrawerIsOpen();
	const { reset } = useNewNoteStoreActions();
	const onSuccess = useNewNoteStoreDrawerOnSuccess();
	const relations = useNewNoteStoreDrawerRelations();

	const newNote = trpc.notes.create.useMutation({
		onSuccess: () => {
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Note created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create Note",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: Note) {
		newNote.mutate({ note: { ...data, ...relations } });
	}

	return (
		<Drawer
			opened={isOpen}
			onClose={reset}
			position="right"
			title="Create Note"
		>
			<NoteForm onSubmitAction={onSubmit} note={{ note: "" }} />
		</Drawer>
	);
};
