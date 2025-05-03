"use client";

import { Button, Drawer, Group } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { zodResolver } from "mantine-form-zod-resolver";
import { type ReactNode, cloneElement, isValidElement, useState } from "react";
import { z } from "zod";

dayjs.extend(utc);

const dateSchema = z.date({
	required_error: "Date is required",
	invalid_type_error: "Expected a valid Date",
});

const schema = z.object({
	date: z.union([dateSchema, z.null()]),
});

interface Props {
	date: Date | null;
	onSelected: (date: Date | null) => void;
	children?: ReactNode;
}

export const DatePickerDrawer = ({ date, onSelected, children }: Props) => {
	const [open, setOpen] = useState(false);

	const form = useForm({
		mode: "uncontrolled",
		initialValues: { date },
		validate: zodResolver(schema),
	});

	async function handleSubmit(values: typeof form.values) {
		const selectedDate = values.date;

		let normalizedDate: Date | null = null;

		if (selectedDate) {
			// Create a new Date set to UTC midnight for this date
			normalizedDate = new Date(
				Date.UTC(
					selectedDate.getFullYear(),
					selectedDate.getMonth(),
					selectedDate.getDate(),
				),
			);
		}

		onSelected(normalizedDate);
		setOpen(false);
	}

	// Since we know children will always be a valid React element (ActionIcon or Button),
	// we can simplify the logic to just clone the element with the onClick handler
	const triggerElement = children ? (
		cloneElement(isValidElement(children) ? children : <Button>Pick</Button>, {
			onClick: () => setOpen(true),
		})
	) : (
		<Button onClick={() => setOpen(true)}>Pick</Button>
	);

	return (
		<>
			{triggerElement}
			<Drawer
				opened={open}
				onClose={() => setOpen(false)}
				position="right"
				title="Pick Date"
			>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<DatePicker
						key={form.key("date")}
						{...form.getInputProps("date")}
						withWeekNumbers
						firstDayOfWeek={0}
						weekendDays={[0, 1]}
						allowDeselect
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
