"use client";

import { type Transaction, transactionSchema } from "@/lib/schemas";
import {
	Button,
	NumberInput,
	Select,
	TextInput,
	Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";

type Props = {
	transaction: Transaction;
	onSubmitAction: (values: Transaction) => void;
	disabled: boolean;
};

export const TransactionForm = ({
	transaction,
	onSubmitAction,
	disabled,
}: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: transaction,
		validate: zodResolver(transactionSchema),
		onValuesChange: (values) => {
			if (values.status === "COMPLETED") {
				setDateLabel("When was it completed?");
			}
			if (values.status === "PENDING") {
				setDateLabel("When should it be completed by?");
			}
		},
	});

	const [dateLabel, setDateLabel] = useState<string>(
		form.getValues().status === "COMPLETED"
			? "When was it completed?"
			: "When should it be completed by?",
	);

	return (
		<form onSubmit={form.onSubmit(onSubmitAction)}>
			<TextInput
				label="Name"
				placeholder="Transaction Name"
				key={form.key("name")}
				{...form.getInputProps("name")}
			/>
			<Textarea
				label="Notes"
				placeholder="Transaction Notes"
				key={form.key("notes")}
				{...form.getInputProps("notes")}
			/>
			<Select
				label="Transaction Type"
				placeholder="Select type"
				data={["BANK", "CASH", "PAYPAL"]}
				key={form.key("type")}
				{...form.getInputProps("type")}
			/>
			<Select
				label="Transaction Status"
				placeholder="Select status"
				data={["PENDING", "COMPLETED"]}
				key={form.key("status")}
				{...form.getInputProps("status")}
			/>
			<DateInput
				label={dateLabel}
				placeholder="Pick date and time"
				required
				key={form.key("completedDateBy")}
				{...form.getInputProps("completedDateBy")}
			/>
			<NumberInput
				label="Amount"
				placeholder="0.99"
				prefix="£"
				key={form.key("amount")}
				{...form.getInputProps("amount")}
			/>
			<Button disabled={disabled} fullWidth mt="xl" type="submit">
				{transaction.id ? "Update" : "Create"}
			</Button>
		</form>
	);
};
