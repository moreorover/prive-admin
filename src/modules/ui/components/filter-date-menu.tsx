"use client";

import { Button, Drawer, Group, Menu } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { ChevronDown } from "lucide-react";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { z } from "zod";

const dateSchema = z.date({
	required_error: "Date is required",
	invalid_type_error: "Expected a valid Date",
});

const schema = z.object({
	dateRange: z.tuple([dateSchema, dateSchema]),
});

interface Props {
	range: [Date, Date];
	rangeInText: string;
	onSelected: (dateRange: [Date, Date]) => void;
}

export const FilterDateMenu = ({ range, rangeInText, onSelected }: Props) => {
	const [open, setOpen] = useState(false);

	const form = useForm({
		mode: "uncontrolled",
		initialValues: { dateRange: range },
		validate: zodResolver(schema),
	});

	async function handleSubmit(values: typeof form.values) {
		const [start, end] = values.dateRange;
		onSelected([start, end]);
		setOpen(false);
	}

	const handleError = (errors: typeof form.errors) => {
		if (errors["dateRange.0"] || errors["dateRange.1"]) {
			notifications.show({
				message: "Please select full date range.",
				color: "yellow",
			});
		}
	};

	return (
		<>
			<Menu shadow="md" width={120}>
				<Menu.Target>
					<Button variant="subtle" rightSection={<ChevronDown size={14} />}>
						{rangeInText}
					</Button>
				</Menu.Target>

				<Menu.Dropdown>
					<Menu.Item
						onClick={() => {
							onSelected([
								dayjs().startOf("day").toDate(),
								dayjs().endOf("day").toDate(),
							]);
						}}
					>
						Today
					</Menu.Item>
					<Menu.Item
						onClick={() => {
							onSelected([
								dayjs().add(1, "day").startOf("day").toDate(),
								dayjs().add(1, "day").endOf("day").toDate(),
							]);
						}}
					>
						Tomorrow
					</Menu.Item>
					<Menu.Item
						onClick={() => {
							onSelected([
								dayjs().subtract(1, "day").startOf("day").toDate(),
								dayjs().subtract(1, "day").endOf("day").toDate(),
							]);
						}}
					>
						Yesterday
					</Menu.Item>
					<Menu.Item onClick={() => setOpen(true)}>Custom</Menu.Item>
				</Menu.Dropdown>
			</Menu>
			<Drawer
				opened={open}
				onClose={() => setOpen(false)}
				position="right"
				title="Change filters"
			>
				<form onSubmit={form.onSubmit(handleSubmit, handleError)}>
					<DatePicker
						key={form.key("dateRange")}
						{...form.getInputProps("dateRange")}
						type="range"
						allowSingleDateInRange={true}
						withWeekNumbers
						firstDayOfWeek={0}
						weekendDays={[0, 1]}
					/>
					<Group justify="flex-end" mt="md">
						<Button fullWidth mt="xl" type="submit">
							Confirm
						</Button>
					</Group>
				</form>
			</Drawer>
		</>
	);
};
