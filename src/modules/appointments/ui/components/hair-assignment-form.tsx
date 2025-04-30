"use client";

import {
	type HairAssignedToAppointment,
	hairAssignedToAppointmentFormSchema,
} from "@/lib/schemas";
import { Button, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";

type Props = {
	hairAssignment: HairAssignedToAppointment;
	maxWeight: number;
	onSubmitAction: (values: HairAssignedToAppointment) => void;
	disabled: boolean;
};

export const HairAssignmentForm = ({
	hairAssignment,
	maxWeight,
	onSubmitAction,
	disabled,
}: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: hairAssignment,
		validate: zodResolver(hairAssignedToAppointmentFormSchema(maxWeight)),
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
			<NumberInput
				label="Sold for"
				placeholder="99.99"
				prefix="£"
				key={form.key("soldFor")}
				{...form.getInputProps("soldFor")}
			/>
			<Button disabled={disabled} fullWidth mt="xl" type="submit">
				{hairAssignment.id ? "Update" : "Create"}
			</Button>
		</form>
	);
};
