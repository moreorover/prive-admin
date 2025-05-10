import { useEditAppointmentStoreActions } from "@/modules/appointments/ui/components/editAppointmentStore";
import { ActionIcon, Menu, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { type ReactNode, createContext, useContext } from "react";

dayjs.extend(isSameOrAfter);

type Appointment = {
	id: string;
	startsAt: Date;
	name: string;
	client?: { name: string };
};

interface Props {
	appointments: Appointment[];
	columns: string[];
	row: ReactNode;
}

const AppointmentsTableRowContext = createContext<{
	appointment: Appointment;
} | null>(null);

function useAppointmentsTableRowContext() {
	const context = useContext(AppointmentsTableRowContext);
	if (!context) {
		throw new Error(
			"AppointmentsTableRow.* component must be rendered as child of AppointmentsTableRow component",
		);
	}
	return context;
}

function AppointmentsTable({ appointments, columns, row }: Props) {
	const now = dayjs();

	const sortedAppointments = [...appointments].sort((a, b) => {
		const now = dayjs();
		const isAFuture = dayjs(a.startsAt).isSameOrAfter(now, "day");
		const isBFuture = dayjs(b.startsAt).isSameOrAfter(now, "day");

		if (isAFuture && !isBFuture) return -1; // Future appointments come first
		if (!isAFuture && isBFuture) return 1; // Past appointments go below
		return dayjs(a.startsAt).diff(dayjs(b.startsAt)); // Sort by date ascending
	});

	const mappedAppointments = sortedAppointments.map((appointment) => {
		const isPast = dayjs(appointment.startsAt).isBefore(now, "day");
		return { ...appointment, isPast };
	});

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
				{mappedAppointments.map((h) => (
					<AppointmentsTableRowContext.Provider
						key={h.id}
						value={{ appointment: h }}
					>
						<Table.Tr
							style={{
								opacity: h.isPast ? 0.5 : 1, // Dim past appointments
								// color: isPast ? "#888" : "inherit", // Optional: Gray text
								// backgroundColor: isPast ? "#f5f5f5" : "transparent", // Optional: Light gray background
							}}
						>
							{row}
						</Table.Tr>
					</AppointmentsTableRowContext.Provider>
				))}
			</Table.Tbody>
		</Table>
	);
}

function AppointmentsTableRowStartsAt() {
	const { appointment } = useAppointmentsTableRowContext();
	return (
		<Table.Td>
			<Text>{dayjs(appointment.startsAt).format("DD MMM YYYY HH:mm")}</Text>
		</Table.Td>
	);
}

function AppointmentsTableRowName() {
	const { appointment } = useAppointmentsTableRowContext();
	return (
		<Table.Td>
			<Text>{appointment.name}</Text>
		</Table.Td>
	);
}

function AppointmentsTableRowClientName() {
	const { appointment } = useAppointmentsTableRowContext();
	return (
		<Table.Td>
			<Text>{appointment.client?.name}</Text>
		</Table.Td>
	);
}

function AppointmentsTableRowActions({ children }: { children: ReactNode }) {
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

function AppointmentsTableRowActionViewAppointment() {
	const { appointment } = useAppointmentsTableRowContext();
	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/appointments/${appointment.id}`}
		>
			View
		</Menu.Item>
	);
}

function AppointmentsTableRowActionUpdate({
	onSuccess,
}: { onSuccess: () => void }) {
	const { appointment } = useAppointmentsTableRowContext();
	const { openEditAppointmentDrawer } = useEditAppointmentStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openEditAppointmentDrawer({
					appointmentId: appointment.id,
					onSuccess,
				})
			}
		>
			Update
		</Menu.Item>
	);
}

AppointmentsTable.RowStartsAt = AppointmentsTableRowStartsAt;
AppointmentsTable.RowName = AppointmentsTableRowName;
AppointmentsTable.RowClientName = AppointmentsTableRowClientName;
AppointmentsTable.RowActions = AppointmentsTableRowActions;
AppointmentsTable.RowActionUpdate = AppointmentsTableRowActionUpdate;
AppointmentsTable.RowActionViewAppointment =
	AppointmentsTableRowActionViewAppointment;

export default AppointmentsTable;
