"use client";

import { type HairOrder, hairOrderFormSchema } from "@/lib/schemas";
import { Button, NumberInput, Select } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { Trash2 } from "lucide-react";
import { zodResolver } from "mantine-form-zod-resolver";

type Props = {
	hairOrder: HairOrder;
	customerOptions: { label: string; value: string }[];
	onSubmitAction: (values: HairOrder) => void;
	onDelete?: () => void;
};

export const HairOrderForm = ({
	hairOrder,
	customerOptions,
	onSubmitAction,
	onDelete,
}: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: hairOrder,
		validate: zodResolver(hairOrderFormSchema(hairOrder.weightUsed)),
	});

	async function handleSubmit(values: typeof form.values) {
		await onSubmitAction(values);
	}

	function handleDelete() {
		onDelete?.();
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<DatePickerInput
				label="Placed At"
				key={form.key("placedAt")}
				{...form.getInputProps("placedAt")}
				withWeekNumbers
				firstDayOfWeek={0}
				weekendDays={[0, 1]}
				allowDeselect
			/>
			<DatePickerInput
				label="Arrived At"
				key={form.key("arrivedAt")}
				{...form.getInputProps("arrivedAt")}
				withWeekNumbers
				firstDayOfWeek={0}
				weekendDays={[0, 1]}
				allowDeselect
			/>
			<NumberInput
				label="Total Weight in grams"
				key={form.key("weightReceived")}
				{...form.getInputProps("weightReceived")}
				required
				name="weight"
				suffix="g"
			/>
			<NumberInput
				label="Total Price for Order"
				placeholder="0.99"
				prefix="£"
				key={form.key("total")}
				{...form.getInputProps("total")}
			/>
			<Select
				checkIconPosition="left"
				data={customerOptions}
				pb={150}
				limit={5}
				label="Customer"
				placeholder="Pick customer"
				searchable
				key={form.key("customerId")}
				{...form.getInputProps("customerId")}
			/>
			<Button fullWidth mt="xl" type="submit">
				{hairOrder.id ? "Update" : "Create"}
			</Button>
			{hairOrder.id && (
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
