"use client";

import {type Appointment, appointmentSchema} from "@/lib/schemas";
import {Button, Select, TextInput} from "@mantine/core";
import {DateTimePicker} from "@mantine/dates";
import {useForm} from "@mantine/form";
import {Trash2} from "lucide-react";
import {zodResolver} from "mantine-form-zod-resolver";

type Props = {
	appointment: Appointment;
	onSubmitAction: (values: Appointment) => void;
	onDelete?: () => void;
	masterOptions: {label: string, value: string}[];
};

export const AppointmentForm = ({
	appointment,
	onSubmitAction,
	onDelete,
	masterOptions,
}: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: appointment,
		validate: zodResolver(appointmentSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		await onSubmitAction(values);
	}

	function handleDelete() {
		onDelete?.();
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<TextInput
				label="Name"
				placeholder="Consultation"
				required
				key={form.key("name")}
				{...form.getInputProps("name")}
			/>
			<DateTimePicker
				label="Starts at"
				placeholder="Pick date and time"
				required
				key={form.key("startsAt")}
				{...form.getInputProps("startsAt")}
			/>
			<Select
			checkIconPosition="left"
			data={masterOptions}
			pb={150}
			limit={5}
			label="Master"
			placeholder="Pick master"
			searchable
			key={form.key("masterId")}
			{...form.getInputProps("masterId")}
			/>
			<Button fullWidth mt="xl" type="submit">
				{appointment.id ? "Update" : "Create"}
			</Button>
			{appointment.id && (
				<Button
					leftSection={<Trash2 />}
					fullWidth
					mt="xl"
					type="button"
					onClick={() => handleDelete()}
				>
					Delete
				</Button>
			)}
		</form>
	);
};
