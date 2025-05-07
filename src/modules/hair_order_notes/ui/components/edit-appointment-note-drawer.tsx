"use client";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import type { HairOrderNote } from "@/lib/schemas";
import { HairOrderNoteForm } from "@/modules/hair_order_notes/ui/components/hair-order-note-form";
import {
	useEditHairOrderNoteStoreActions,
	useEditHairOrderNoteStoreDrawerHairOrderNoteId,
	useEditHairOrderNoteStoreDrawerIsOpen,
	useEditHairOrderNoteStoreDrawerOnSuccess,
} from "@/modules/hair_order_notes/ui/editHairOrderNoteDrawerStore";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export const EditHairOrderNoteDrawer = () => {
	const utils = trpc.useUtils();
	const isOpen = useEditHairOrderNoteStoreDrawerIsOpen();
	const onSuccess = useEditHairOrderNoteStoreDrawerOnSuccess();
	const { reset } = useEditHairOrderNoteStoreActions();
	const hairOrderNoteId = useEditHairOrderNoteStoreDrawerHairOrderNoteId();

	const { data: hairOrderNote, isLoading } =
		trpc.hairOrderNotes.getById.useQuery(
			{ id: hairOrderNoteId },
			{
				enabled: !!hairOrderNoteId,
			},
		);

	const editHairOrderNote = trpc.hairOrderNotes.update.useMutation({
		onSuccess: () => {
			utils.hairOrderNotes.getById.invalidate({ id: hairOrderNoteId });
			onSuccess?.();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair Order Note updated.",
			});
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
			opened={isOpen}
			onClose={reset}
			position="right"
			title="Update Hair Order Note"
		>
			{isLoading || !hairOrderNote ? (
				<LoaderSkeleton />
			) : (
				<HairOrderNoteForm
					onSubmitAction={onSubmit}
					onDelete={onDelete}
					hairOrderNote={hairOrderNote}
				/>
			)}
		</Drawer>
	);
};
