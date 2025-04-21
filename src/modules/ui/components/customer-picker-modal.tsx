"use client";

import type { Customers } from "@/modules/ui/types";
import {
	Button,
	Checkbox,
	Group,
	Modal,
	Paper,
	ScrollArea,
	Table,
	Text,
	TextInput,
} from "@mantine/core";
import { useState } from "react";

interface Props {
	customers: Customers;
	onSubmit: (customerId: string | string[]) => void;
	multiple: boolean;
}

export const CustomerPickerModal = ({
	customers,
	onSubmit,
	multiple,
}: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedRows, setSelectedRows] = useState<string[]>([]);
	const [selectedRow, setSelectedRow] = useState<string>();
	const [searchTerm, setSearchTerm] = useState("");

	const filteredCustomers = customers.filter((p) => {
		const searchLower = searchTerm.toLowerCase();

		return (
			p.name?.toLowerCase().includes(searchLower) ||
			p.id.toLowerCase() === searchLower
		);
	});

	// Toggle selection for a given customer ID
	const toggleRowSelection = (id: string) => {
		if (multiple) {
			setSelectedRows((prevSelected) =>
				prevSelected.includes(id)
					? prevSelected.filter((selectedId) => selectedId !== id)
					: [...prevSelected, id],
			);
		} else {
			setSelectedRow(id);
		}
	};

	function onConfirmActionPersonnel() {
		if (multiple && selectedRows.length > 0) onSubmit(selectedRows);
		if (!multiple && selectedRow) onSubmit(selectedRow);
	}

	const rows = filteredCustomers.map((client) => (
		<Table.Tr
			key={client.id}
			style={{
				backgroundColor: selectedRows.includes(client.id as string)
					? "var(--mantine-color-blue-light)"
					: undefined,
				cursor: "pointer",
			}}
			onClick={() => toggleRowSelection(client.id as string)}
		>
			<Table.Td style={{ width: 40 }}>
				<Checkbox
					aria-label="Select customer"
					checked={
						selectedRows.includes(client.id as string) ||
						selectedRow === client.id
					}
					onClick={(e) => e.stopPropagation()}
					onChange={() => toggleRowSelection(client.id as string)}
				/>
			</Table.Td>
			<Table.Td>
				<Text>{client.name}</Text>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<>
			<Button
				onClick={() => {
					setIsOpen(true);
				}}
			>
				Pick
			</Button>
			<Modal
				opened={isOpen}
				onClose={() => {
					setIsOpen(false);
					setSelectedRows([]);
					setSelectedRow("");
					setSearchTerm("");
				}}
				title="Pick customer"
				size="lg"
			>
				<Paper shadow="sm" radius="md" withBorder p="md">
					{/* Search field with bottom margin for spacing */}
					<TextInput
						size="sm"
						radius="sm"
						label="Search"
						description="Search by customer name"
						placeholder="Search..."
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.currentTarget.value)}
						mb="md"
					/>

					{/* Wrap only the table in the ScrollArea with a fixed height */}
					<ScrollArea style={{ height: 300 }}>
						<Table striped highlightOnHover>
							<Table.Thead>
								<Table.Tr>
									<Table.Th style={{ width: 40 }} />
									<Table.Th>Name</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{rows.length > 0 ? (
									rows
								) : (
									<Table.Tr>
										<Table.Td colSpan={4}>
											<Text>No match found...</Text>
										</Table.Td>
									</Table.Tr>
								)}
							</Table.Tbody>
						</Table>
					</ScrollArea>

					{/* Confirm button always visible outside of the ScrollArea */}
					<Group justify="flex-end" mt="md">
						<Button
							onClick={() => {
								onConfirmActionPersonnel();
								setSelectedRows([]);
								setSelectedRow("");
								setSearchTerm("");
							}}
						>
							Confirm
						</Button>
					</Group>
				</Paper>
			</Modal>
		</>
	);
};
