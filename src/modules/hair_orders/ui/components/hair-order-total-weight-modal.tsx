"use client";

import { Button, Container, NumberInput, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";

import type { TypedContextModalProps } from "@/lib/modal-helper";
import { z } from "zod";

export const HairOrderTotalWeightModal = ({
	context,
	id,
	innerProps,
}: TypedContextModalProps<"hairOrderTotalWeight">) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			weight: innerProps.weight,
		},
		validate: zodResolver(z.object({ weight: z.number().positive() })),
	});

	async function handleSubmit(values: typeof form.values) {
		const { weight } = values;
		setIsLoading(true);
		innerProps.onConfirm(weight);
		setIsLoading(false);
		context.closeModal(id);
	}

	return (
		<Container>
			<Stack gap="sm">
				<Text size="xs">Update total weight</Text>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<NumberInput
						label="Weight in grams"
						placeholder={innerProps.weight.toString()}
						required
						name="weight"
						suffix="g"
						key={form.key("weight")}
						{...form.getInputProps("weight")}
					/>
					<Button disabled={isLoading} fullWidth mt="xl" type="submit">
						Confirm
					</Button>
				</form>
				<Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
					Cancel
				</Button>
			</Stack>
		</Container>
	);
};
