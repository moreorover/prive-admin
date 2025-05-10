import { useDeleteAppointmentNoteStoreActions } from "@/modules/appointment_notes/ui/components/deleteAppointmentNoteStore";
import { useEditAppointmentNoteStoreActions } from "@/modules/appointment_notes/ui/components/editAppointmentNoteDrawerStore";
import { ActionIcon, Menu, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import { GripVertical } from "lucide-react";
import { type ReactNode, createContext, useContext } from "react";

type Note = {
	id: string;
	createdAt: Date;
	note: string;
};

interface Props {
	notes: Note[];
	columns: string[];
	row: ReactNode;
}

const AppointmentNotesTableRowContext = createContext<{
	note: Note;
} | null>(null);

function useAppointmentNotesTableRowContext() {
	const context = useContext(AppointmentNotesTableRowContext);
	if (!context) {
		throw new Error(
			"AppointmentNotesTableRow.* component must be rendered as child of AppointmentNotesTableRow component",
		);
	}
	return context;
}

function AppointmentNotesTable({ notes, columns, row }: Props) {
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
					<AppointmentNotesTableRowContext.Provider
						key={h.id}
						value={{ note: h }}
					>
						<Table.Tr>{row}</Table.Tr>
					</AppointmentNotesTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

function AppointmentNotesTableRowCreatedAt() {
	const { note } = useAppointmentNotesTableRowContext();
	return (
		<Table.Td>
			<Text>{dayjs(note.createdAt).format("DD MMM YYYY HH:mm")}</Text>
		</Table.Td>
	);
}

function AppointmentNotesTableRowNote() {
	const { note } = useAppointmentNotesTableRowContext();
	return (
		<Table.Td>
			<Text>{note.note}</Text>
		</Table.Td>
	);
}

function AppointmentNotesTableRowActions({
	children,
}: { children: ReactNode }) {
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

function AppointmentNotesTableRowActionUpdate({
	onSuccess,
}: { onSuccess: () => void }) {
	const { note } = useAppointmentNotesTableRowContext();
	const { openEditAppointmentNoteDrawer } =
		useEditAppointmentNoteStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openEditAppointmentNoteDrawer({
					appointmentNoteId: note.id,
					onSuccess,
				})
			}
		>
			Update
		</Menu.Item>
	);
}

function AppointmentNotesTableRowActionDelete({
	onSuccess,
}: { onSuccess: () => void }) {
	const { note } = useAppointmentNotesTableRowContext();
	const { openDeleteAppointmentNoteDrawer } =
		useDeleteAppointmentNoteStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openDeleteAppointmentNoteDrawer({
					appointmentNoteId: note.id,
					onSuccess,
				})
			}
		>
			Delete
		</Menu.Item>
	);
}

AppointmentNotesTable.RowCreatedAt = AppointmentNotesTableRowCreatedAt;
AppointmentNotesTable.RowNote = AppointmentNotesTableRowNote;
AppointmentNotesTable.RowActions = AppointmentNotesTableRowActions;
AppointmentNotesTable.RowActionUpdate = AppointmentNotesTableRowActionUpdate;
AppointmentNotesTable.RowActionDelete = AppointmentNotesTableRowActionDelete;

export default AppointmentNotesTable;
