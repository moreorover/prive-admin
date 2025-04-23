"use client";

import { type Product, productSchema } from "@/lib/schemas";
import { Button, Stack, TextInput, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Trash2 } from "lucide-react";
import { zodResolver } from "mantine-form-zod-resolver";

type Props = {
	product: Product;
	onSubmitAction: (values: Product) => void;
	onDelete?: () => void;
};

export const ProductForm = ({ product, onSubmitAction, onDelete }: Props) => {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: product,
		validate: zodResolver(productSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		await onSubmitAction(values);
	}

	function handleDelete() {
		onDelete?.();
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<Stack gap="md">
				<TextInput
					label="Name"
					placeholder="Jon Doe"
					required
					key={form.key("name")}
					{...form.getInputProps("name")}
				/>
				<Textarea
					label="Description"
					resize="vertical"
					placeholder="Product description..."
					key={form.key("description")}
					{...form.getInputProps("description")}
				/>
				<Button fullWidth type="submit">
					{product.id ? "Update" : "Create"}
				</Button>
				{product.id && (
					<Button
						leftSection={<Trash2 />}
						fullWidth
						color="red"
						type="button"
						onClick={() => handleDelete()}
					>
						Delete
					</Button>
				)}
			</Stack>
		</form>
	);
};
