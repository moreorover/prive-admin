"use client";

import { type Order, orderSchema } from "@/lib/schemas";
import { Button, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";

type Props = {
	order: Order;
	onSubmitAction: (values: Order) => void;
};

export const OrderForm = ({ order, onSubmitAction }: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: order,
		validate: zodResolver(orderSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		onSubmitAction(values);
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<DateInput
				label="Order Placed At"
				placeholder="When was the order placed at?"
				key={form.key("placedAt")}
				{...form.getInputProps("placedAt")}
			/>
			<Select
				label="Order Type"
				placeholder="Purchase or Sale?"
				limit={2}
				data={["PURCHASE", "SALE"]}
				key={form.key("type")}
				{...form.getInputProps("type")}
			/>
			<Button fullWidth mt="xl" type="submit">
				{order.id ? "Update" : "Create"}
			</Button>
		</form>
	);
};
