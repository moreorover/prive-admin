"use client";

import { Button, Container, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { editUserSchema } from "@/lib/auth-schema";
import type { TypedContextModalProps } from "@/lib/modal-helper";

export const EditUser = ({
	context,
	id,
	innerProps,
}: TypedContextModalProps<"editUser">) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			fullName: "",
		},
		validate: zodResolver(editUserSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		const { fullName } = values;
		setIsLoading(true);
		await authClient.updateUser({
			name: fullName,
			fetchOptions: {
				onSuccess: () => {
					notifications.show({
						color: "green",
						title: "Success",
						message: "Name updated",
					});
					context.closeModal(id);
				},
				onError: (error) => {
					notifications.show({
						color: "red",
						title: "Error",
						message: error.error.message,
					});
				},
			},
		});
		setIsLoading(false);
	}

	return (
		<Container>
			<Stack gap="sm">
				<Text size="xs">Edit user information</Text>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<TextInput
						label="Full Name"
						placeholder={innerProps.fullName}
						required
						name="fullName"
						key={form.key("fullName")}
						{...form.getInputProps("fullName")}
					/>
					<Button disabled={isLoading} fullWidth mt="xl" type="submit">
						Update
					</Button>
				</form>
				<Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
					Cancel
				</Button>
			</Stack>
		</Container>
	);
};
