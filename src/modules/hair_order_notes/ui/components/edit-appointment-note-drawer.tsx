"use client";

import type { HairOrderNote } from "@/lib/schemas";
import { HairOrderNoteForm } from "@/modules/hair_order_notes/ui/components/hair-order-note-form";
import { useHairOrderNoteDrawerStore } from "@/modules/hair_order_notes/ui/hair-order-note-drawer-store";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditHairOrderNoteDrawer = () => {
	const isOpen = useHairOrderNoteDrawerStore((state) => state.isOpen);
	const hairOrderNote = useHairOrderNoteDrawerStore((state) => state.note);
	const reset = useHairOrderNoteDrawerStore((state) => state.reset);
	const onUpdated = useHairOrderNoteDrawerStore((state) => state.onUpdated);

	const editHairOrderNote = trpc.hairOrderNotes.update.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair Order Note updated.",
			});
			reset();
			onUpdated?.();
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to update Hair Order Note",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: HairOrderNote) {
		editHairOrderNote.mutate({ note: data });
	}

	function onDelete() {
		console.log("onDelete");
	}

	return (
		<Drawer
			opened={isOpen && onUpdated !== undefined}
			onClose={() => reset()}
			position="right"
			title="Update Hair Order Note"
		>
			<HairOrderNoteForm
				onSubmitAction={onSubmit}
				onDelete={onDelete}
				hairOrderNote={hairOrderNote}
			/>
		</Drawer>
	);
};
