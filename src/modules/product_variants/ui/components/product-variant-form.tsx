"use client";

import { type ProductVariant, productVariantSchema } from "@/lib/schemas";
import { Button, NumberInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";

type Props = {
	productVariant: ProductVariant;
	onSubmitAction: (values: ProductVariant) => void;
	onDelete?: () => void;
};

export const ProductVariantForm = ({
	productVariant,
	onSubmitAction,
}: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: productVariant,
		validate: zodResolver(productVariantSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		await onSubmitAction(values);
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<Stack gap="md">
				<TextInput
					label="Size"
					placeholder="250ml"
					required
					key={form.key("size")}
					{...form.getInputProps("size")}
				/>
				<NumberInput
					label="Recommended Price (RRP)"
					placeholder="0.99"
					prefix="£"
					defaultValue={0}
					mb="md"
					key={form.key("price")}
					{...form.getInputProps("price")}
				/>
				<Button fullWidth type="submit">
					{productVariant.id ? "Update" : "Create"}
				</Button>
			</Stack>
		</form>
	);
};
