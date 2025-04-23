"use client";

import { Button, Drawer, Group, NumberInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { zodResolver } from "mantine-form-zod-resolver";
import type { ZodSchema } from "zod";

interface Props<T extends Record<string, number>> {
	title: string;
	initialValues: T;
	schema: ZodSchema<T>;
	onSubmit: (values: T) => void;
}

export const ReusableNumberDrawer = <T extends Record<string, number>>({
	title,
	initialValues,
	schema,
	onSubmit,
}: Props<T>) => {
	const [opened, { open, close }] = useDisclosure(false);

	const form = useForm<T>({
		mode: "uncontrolled",
		initialValues: initialValues,
		validate: zodResolver(schema),
	});

	return (
		<>
			<Button onClick={open} size="xs">
				Edit
			</Button>
			<Drawer opened={opened} onClose={close} position="right" title={title}>
				<form
					onSubmit={form.onSubmit((values) => {
						onSubmit(values);
						close();
					})}
				>
					{Object.keys(initialValues).map((key) => (
						<NumberInput
							key={key}
							label={key.charAt(0).toUpperCase() + key.slice(1)}
							{...form.getInputProps(key as keyof T)}
							mb="sm"
						/>
					))}
					<Group justify="flex-end" mt="md">
						<Button fullWidth mt="xl" type="submit">
							Confirm
						</Button>
					</Group>
				</form>
			</Drawer>
		</>
	);
};
