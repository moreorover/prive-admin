import { useDeleteNoteStoreActions } from "@/modules/notes/ui/components/deleteNoteStore";
import { useEditNoteStoreActions } from "@/modules/notes/ui/components/editNoteStore";
import { ActionIcon, Menu, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { type ReactNode, createContext, useContext } from "react";

type Note = {
	id: string;
	createdAt: Date;
	note: string;
	appointmentId: string | null;
	hairOrderId: string | null;
	customerId: string;
	createdBy: { name: string | null };
};

interface Props {
	notes: Note[];
	columns: string[];
	row: ReactNode;
}

const NotesTableRowContext = createContext<{
	note: Note;
} | null>(null);

function useNotesTableRowContext() {
	const context = useContext(NotesTableRowContext);
	if (!context) {
		throw new Error(
			"NotesTableRow.* component must be rendered as child of NotesTableRow component",
		);
	}
	return context;
}

function NotesTable({ notes, columns, row }: Props) {
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
					<NotesTableRowContext.Provider key={h.id} value={{ note: h }}>
						<Table.Tr>{row}</Table.Tr>
					</NotesTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

function NotesTableRowCreatedAt() {
	const { note } = useNotesTableRowContext();
	return (
		<Table.Td>
			<Text>{dayjs(note.createdAt).format("DD MMM YYYY HH:mm")}</Text>
		</Table.Td>
	);
}

function NotesTableRowNote() {
	const { note } = useNotesTableRowContext();
	return (
		<Table.Td>
			<Text>{note.note}</Text>
		</Table.Td>
	);
}

function NotesTableRowCreatedBy() {
	const { note } = useNotesTableRowContext();
	return (
		<Table.Td>
			<Text>{note.createdBy.name}</Text>
		</Table.Td>
	);
}

function NotesTableRowActions({ children }: { children: ReactNode }) {
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

function NotesTableRowActionViewAppointment() {
	const { note } = useNotesTableRowContext();
	if (!note.appointmentId) return null;
	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/appointments/${note.appointmentId}`}
		>
			View Appointment
		</Menu.Item>
	);
}

function NotesTableRowActionViewHairOrder() {
	const { note } = useNotesTableRowContext();
	if (!note.hairOrderId) return null;
	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/hair-orders/${note.hairOrderId}`}
		>
			View Appointment
		</Menu.Item>
	);
}

function NotesTableRowActionViewCustomer() {
	const { note } = useNotesTableRowContext();
	if (!note.hairOrderId) return null;
	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/customers/${note.customerId}`}
		>
			View Appointment
		</Menu.Item>
	);
}

function NotesTableRowActionUpdate({ onSuccess }: { onSuccess: () => void }) {
	const { note } = useNotesTableRowContext();
	const { openEditNoteDrawer } = useEditNoteStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openEditNoteDrawer({
					noteId: note.id,
					onSuccess,
				})
			}
		>
			Update
		</Menu.Item>
	);
}

function NotesTableRowActionDelete({ onSuccess }: { onSuccess: () => void }) {
	const { note } = useNotesTableRowContext();
	const { openDeleteNoteDrawer } = useDeleteNoteStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openDeleteNoteDrawer({
					noteId: note.id,
					onSuccess,
				})
			}
		>
			Delete
		</Menu.Item>
	);
}

NotesTable.RowCreatedAt = NotesTableRowCreatedAt;
NotesTable.RowNote = NotesTableRowNote;
NotesTable.RowCreatedBy = NotesTableRowCreatedBy;
NotesTable.RowActions = NotesTableRowActions;
NotesTable.RowActionViewAppointment = NotesTableRowActionViewAppointment;
NotesTable.RowActionViewHairOrder = NotesTableRowActionViewHairOrder;
NotesTable.RowActionViewCustomer = NotesTableRowActionViewCustomer;
NotesTable.RowActionUpdate = NotesTableRowActionUpdate;
NotesTable.RowActionDelete = NotesTableRowActionDelete;

export default NotesTable;
