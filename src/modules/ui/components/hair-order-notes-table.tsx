import { useDeleteHairOrderNoteStoreActions } from "@/modules/hair_order_notes/ui/components/deleteHairOrderNoteStore";
import { useEditHairOrderNoteStoreActions } from "@/modules/hair_order_notes/ui/components/editHairOrderNoteDrawerStore";
import { ActionIcon, Menu, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import { GripVertical } from "lucide-react";
import { type ReactNode, createContext, useContext } from "react";

type Note = {
	id: string;
	createdAt: Date;
	note: string;
	createdBy: { name: string | null };
};

interface Props {
	notes: Note[];
	columns: string[];
	row: ReactNode;
}

const HairOrderNotesTableRowContext = createContext<{
	note: Note;
} | null>(null);

function useHairOrderNotesTableRowContext() {
	const context = useContext(HairOrderNotesTableRowContext);
	if (!context) {
		throw new Error(
			"HairOrderNotesTableRow.* component must be rendered as child of HairOrderNotesTableRow component",
		);
	}
	return context;
}

function HairOrderNotesTable({ notes, columns, row }: Props) {
	return (
		<Table striped highlightOnHover>
			<Table.Thead>
				<Table.Tr>
					{columns.map((column) => (
						<Table.Th key={column}>{column}</Table.Th>
					))}
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{notes.map((h) => (
					<HairOrderNotesTableRowContext.Provider
						key={h.id}
						value={{ note: h }}
					>
						<Table.Tr>{row}</Table.Tr>
					</HairOrderNotesTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

function HairOrderNotesTableRowCreatedAt() {
	const { note } = useHairOrderNotesTableRowContext();
	return (
		<Table.Td>
			<Text>{dayjs(note.createdAt).format("DD MMM YYYY HH:mm")}</Text>
		</Table.Td>
	);
}

function HairOrderNotesTableRowNote() {
	const { note } = useHairOrderNotesTableRowContext();
	return (
		<Table.Td>
			<Text>{note.note}</Text>
		</Table.Td>
	);
}

function HairOrderNotesTableRowCreatedBy() {
	const { note } = useHairOrderNotesTableRowContext();
	return (
		<Table.Td>
			<Text>{note.createdBy.name}</Text>
		</Table.Td>
	);
}

function HairOrderNotesTableRowActions({ children }: { children: ReactNode }) {
	return (
		<Table.Td>
			<Menu shadow="md" width={200}>
				<Menu.Target>
					<ActionIcon variant="transparent">
						<GripVertical size={18} />
					</ActionIcon>
				</Menu.Target>

				<Menu.Dropdown>{children}</Menu.Dropdown>
			</Menu>
		</Table.Td>
	);
}

function HairOrderNotesTableRowActionUpdate({
	onSuccess,
}: { onSuccess: () => void }) {
	const { note } = useHairOrderNotesTableRowContext();
	const { openEditHairOrderNoteDrawer } = useEditHairOrderNoteStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openEditHairOrderNoteDrawer({
					hairOrderNoteId: note.id,
					onSuccess,
				})
			}
		>
			Update
		</Menu.Item>
	);
}

function HairOrderNotesTableRowActionDelete({
	onSuccess,
}: { onSuccess: () => void }) {
	const { note } = useHairOrderNotesTableRowContext();
	const { openDeleteHairOrderNoteDrawer } =
		useDeleteHairOrderNoteStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openDeleteHairOrderNoteDrawer({
					hairOrderNoteId: note.id,
					onSuccess,
				})
			}
		>
			Delete
		</Menu.Item>
	);
}

HairOrderNotesTable.RowCreatedAt = HairOrderNotesTableRowCreatedAt;
HairOrderNotesTable.RowNote = HairOrderNotesTableRowNote;
HairOrderNotesTable.RowCreatedBy = HairOrderNotesTableRowCreatedBy;
HairOrderNotesTable.RowActions = HairOrderNotesTableRowActions;
HairOrderNotesTable.RowActionUpdate = HairOrderNotesTableRowActionUpdate;
HairOrderNotesTable.RowActionDelete = HairOrderNotesTableRowActionDelete;

export default HairOrderNotesTable;
