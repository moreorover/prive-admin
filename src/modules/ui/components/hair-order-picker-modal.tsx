"use client";

import {
	Button,
	Checkbox,
	Container,
	Group,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { useState } from "react";

import { formatAmount } from "@/lib/helpers";
import type { TypedContextModalProps } from "@/lib/modal-helper";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";

export const HairOrderPickerModal = ({
	context,
	id,
	innerProps,
}: TypedContextModalProps<"hairOrderPicker">) => {
	const [selectedRows, setSelectedRows] = useState<string[]>([]);
	const [selectedRow, setSelectedRow] = useState<string>();

	const hairOrderOptions = trpc.hairOrders.getAll.useQuery();

	const toggleRowSelection = (id: string) => {
		if (innerProps.multiple) {
			setSelectedRows((prevSelected) =>
				prevSelected.includes(id)
					? prevSelected.filter((selectedId) => selectedId !== id)
					: [...prevSelected, id],
			);
		} else {
			setSelectedRow(id);
		}
	};

	function onConfirmAction() {
		if (innerProps.multiple && selectedRows.length > 0) {
			innerProps.onConfirm(selectedRows);
			context.closeModal(id);
		}
		if (!innerProps.multiple && selectedRow) {
			innerProps.onConfirm([selectedRow]);
			context.closeModal(id);
		}
	}

	const rows = hairOrderOptions.data?.map((hairOrder) => (
		<Table.Tr
			key={hairOrder.id}
			style={{
				backgroundColor: selectedRows.includes(hairOrder.id as string)
					? "var(--mantine-color-blue-light)"
					: undefined,
				cursor: "pointer",
			}}
			onClick={() => toggleRowSelection(hairOrder.id as string)}
		>
			<Table.Td style={{ width: 40 }}>
				<Checkbox
					aria-label="Select Hair Order"
					checked={
						selectedRows.includes(hairOrder.id as string) ||
						selectedRow === hairOrder.id
					}
					onClick={(e) => e.stopPropagation()}
					onChange={() => toggleRowSelection(hairOrder.id as string)}
				/>
			</Table.Td>
			<Table.Td>
				<Text>{hairOrder.id}</Text>
			</Table.Td>
			<Table.Td>
				<Text>{hairOrder.customer?.name}</Text>
			</Table.Td>
			<Table.Td>
				<Text>
					{hairOrder.placedAt
						? dayjs(hairOrder.placedAt).format("ddd MMM YYYY")
						: ""}
				</Text>
			</Table.Td>
			<Table.Td>
				<Text>
					{hairOrder.arrivedAt
						? dayjs(hairOrder.arrivedAt).format("ddd MMM YYYY")
						: ""}
				</Text>
			</Table.Td>
			<Table.Td>
				<Text>{formatAmount(hairOrder.pricePerGram)}</Text>
			</Table.Td>
			<Table.Td>
				<Text>{hairOrder.weightReceived}g</Text>
			</Table.Td>
			<Table.Td>
				<Text>{hairOrder.weightUsed}g</Text>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Container>
			<Stack gap="sm">
				<Text size="xs">Select Hair Order</Text>
				<Table striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th style={{ width: 40 }} />
							<Table.Th>ID</Table.Th>
							<Table.Th>Customer Name</Table.Th>
							<Table.Th>Placed At</Table.Th>
							<Table.Th>Arrived At</Table.Th>
							<Table.Th>Price per Gram</Table.Th>
							<Table.Th>Weight received</Table.Th>
							<Table.Th>Weight Used</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>{rows}</Table.Tbody>
				</Table>
				<Group justify="flex-end" mt="md">
					<Button
						onClick={() => {
							onConfirmAction();
							setSelectedRows([]);
							setSelectedRow("");
						}}
					>
						Confirm
					</Button>
				</Group>
				<Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
					Cancel
				</Button>
			</Stack>
		</Container>
	);
};
