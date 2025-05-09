"use client";

import { type HairAssigned, hairAssignedFormSchema } from "@/lib/schemas";
import { Button, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";

type Props = {
	hairAssigned: HairAssigned;
	maxWeight: number;
	onSubmitAction: (values: HairAssigned) => void;
	disabled: boolean;
};

export const HairAssignedForm = ({
	hairAssigned,
	maxWeight,
	onSubmitAction,
	disabled,
}: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: hairAssigned,
		validate: zodResolver(hairAssignedFormSchema(maxWeight)),
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
				{hairAssigned.id ? "Update" : "Create"}
			</Button>
		</form>
	);
};
