"use client";

import { Button, Drawer, Group } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { z } from "zod";

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
}

export const DatePickerDrawer = ({ date, onSelected }: Props) => {
	const [open, setOpen] = useState(false);

	const form = useForm({
		mode: "uncontrolled",
		initialValues: { date },
		validate: zodResolver(schema),
	});

	async function handleSubmit(values: typeof form.values) {
		const date = values.date;
		onSelected(date);
		setOpen(false);
	}

	return (
		<>
			<Button onClick={() => setOpen(true)}>Pick</Button>
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
