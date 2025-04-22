"use client";

import { useHairOrderNoteDrawerStore } from "@/modules/hair_order_notes/ui/hair-order-note-drawer-store";
import type { HairOrderNotes } from "@/modules/hair_orders/types";
import { trpc } from "@/trpc/client";
import { Button, Menu, ScrollArea, Table, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";

interface Props {
	hairOrderId: number;
	notes: HairOrderNotes;
}

export default function HairOrderNotesTable({ hairOrderId, notes }: Props) {
	const utils = trpc.useUtils();

	const openDrawer = useHairOrderNoteDrawerStore((state) => state.openDrawer);

	const deleteHairOrderNote = trpc.hairOrderNotes.delete.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "HairOrder Note deleted.",
			});
			utils.hairOrderNotes.getNotesByHairOrderId.invalidate({
				hairOrderId,
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to delete hairOrderNote",
				message: "Please try again.",
			});
		},
	});

	const openDeleteModal = (hairOrderNoteId: string) =>
		modals.openConfirmModal({
			title: "Delete HairOrder Note?",
			centered: true,
			children: (
				<Text size="sm">
					Are you sure you want to delete this HairOrder Note?
				</Text>
			),
			labels: { confirm: "Delete HairOrder Note", cancel: "Cancel" },
			confirmProps: { color: "red" },
			onCancel: () => {},
			onConfirm: () =>
				deleteHairOrderNote.mutate({
					noteId: hairOrderNoteId,
				}),
		});

	const rows = notes.map((hairOrderNote) => (
		<Table.Tr key={hairOrderNote.id}>
			<Table.Td>
				<Text>
					{dayjs(hairOrderNote.createdAt).format("DD MMM YYYY HH:mm")}
				</Text>
			</Table.Td>
			<Table.Td>
				<Text>{hairOrderNote.note}</Text>
			</Table.Td>
			<Table.Td>
				<Text>{hairOrderNote.createdBy.name}</Text>
			</Table.Td>
			<Table.Td>
				<Menu shadow="md" width={200}>
					<Menu.Target>
						<Button>Manage</Button>
					</Menu.Target>

					<Menu.Dropdown>
						<Menu.Label>HairOrder Notes</Menu.Label>
						<Menu.Item
							onClick={() => {
								openDrawer({
									isOpen: true,
									note: hairOrderNote,
									onUpdated: () => {
										utils.hairOrderNotes.getNotesByHairOrderId.invalidate({
											hairOrderId,
										});
									},
								});
							}}
						>
							Edit
						</Menu.Item>
						<Menu.Item
							onClick={() => {
								openDeleteModal(hairOrderNote.id);
							}}
						>
							Delete
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<ScrollArea>
			<Table striped highlightOnHover>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Created At</Table.Th>
						<Table.Th>Note</Table.Th>
						<Table.Th>Creator</Table.Th>
						<Table.Th />
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>
		</ScrollArea>
	);
}
