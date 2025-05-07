"use client";

import type { HairOrderNote } from "@/lib/schemas";
import { HairOrderNoteForm } from "@/modules/hair_order_notes/ui/components/hair-order-note-form";
import {
	useNewHairOrderNoteStoreActions,
	useNewHairOrderNoteStoreDrawerIsOpen,
	useNewHairOrderNoteStoreDrawerOnSuccess,
	useNewHairOrderNoteStoreDrawerRelations,
} from "@/modules/hair_order_notes/ui/newHairOrderNoteDrawerStore";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const NewHairOrderNoteDrawer = () => {
	const isOpen = useNewHairOrderNoteStoreDrawerIsOpen();
	const relations = useNewHairOrderNoteStoreDrawerRelations();
	const { reset } = useNewHairOrderNoteStoreActions();
	const onSuccess = useNewHairOrderNoteStoreDrawerOnSuccess();

	const newHairOrderNote = trpc.hairOrderNotes.create.useMutation({
		onSuccess: () => {
			onSuccess?.();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair Order Note created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create Hair Order Note",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: HairOrderNote) {
		newHairOrderNote.mutate({ note: data, ...relations });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={isOpen}
			onClose={() => reset()}
			position="right"
			title="Create Hair Order Note"
		>
			<HairOrderNoteForm
				onSubmitAction={onSubmit}
				onDelete={onDelete}
				hairOrderNote={{ note: "" }}
			/>
		</Drawer>
	);
};
