"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { trpc } from "@/trpc/client";
import { Button, Drawer, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
	useDeleteHairOrderNoteStoreActions,
	useDeleteHairOrderNoteStoreDrawerHairOrderNoteId,
	useDeleteHairOrderNoteStoreDrawerIsOpen,
	useDeleteHairOrderNoteStoreDrawerOnSuccess,
} from "./deleteHairOrderNoteStore";

export const DeleteHairOrderNoteDrawer = () => {
	const isOpen = useDeleteHairOrderNoteStoreDrawerIsOpen();
	const { reset } = useDeleteHairOrderNoteStoreActions();
	const onSuccess = useDeleteHairOrderNoteStoreDrawerOnSuccess();
	const hairOrderNoteId = useDeleteHairOrderNoteStoreDrawerHairOrderNoteId();

	const { data: hairOrderNote, isLoading } =
		trpc.hairOrderNotes.getById.useQuery(
			{ id: hairOrderNoteId },
			{
				enabled: !!hairOrderNoteId,
			},
		);

	const deleteHairOrderNote = trpc.hairOrderNotes.delete.useMutation({
		onSuccess: () => {
			onSuccess();
			reset();
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair Order Note deleted.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to delete Hair Order Note",
				message: "Please try again.",
			});
		},
	});

	const handleConfirmDelete = () => {
		if (hairOrderNote) {
			deleteHairOrderNote.mutate({ id: hairOrderNote.id });
		}
	};

	return (
		<>
			<Drawer
				opened={isOpen}
				onClose={reset}
				position="right"
				title="Delete Hair Order Note"
			>
				{isLoading || !hairOrderNote ? (
					<LoaderSkeleton />
				) : (
					<Stack>
						<Title order={4}>Are you sure?</Title>
						<Text>
							This will permanently delete the hairOrderNote for:{" "}
							<strong>{hairOrderNote.id}</strong>
						</Text>

						<Group mt="md">
							<Button variant="outline" onClick={reset}>
								Cancel
							</Button>
							<Button
								color="red"
								onClick={handleConfirmDelete}
								loading={deleteHairOrderNote.isPending}
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
