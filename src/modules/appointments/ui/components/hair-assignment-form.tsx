"use client";

import {
	type HairAssignedToAppointment,
	hairAssignedToAppointmentShcema,
} from "@/lib/schemas";
import { Button, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";

type Props = {
	hairAssignment: HairAssignedToAppointment;
	onSubmitAction: (values: HairAssignedToAppointment) => void;
	disabled: boolean;
};

export const HairAssignmentForm = ({
	hairAssignment,
	onSubmitAction,
	disabled,
}: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: hairAssignment,
		validate: zodResolver(hairAssignedToAppointmentShcema),
	});

	return (
		<form onSubmit={form.onSubmit(onSubmitAction)}>
			<NumberInput
				label="Weight in grams"
				placeholder="99"
				suffix="g"
				key={form.key("weightInGrams")}
				{...form.getInputProps("weightInGrams")}
			/>
			<Button disabled={disabled} fullWidth mt="xl" type="submit">
				{hairAssignment.id ? "Update" : "Create"}
			</Button>
		</form>
	);
};
