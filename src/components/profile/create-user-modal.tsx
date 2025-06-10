"use client";

import {
	Button,
	Container,
	PasswordInput,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/auth-schema";
import type { TypedContextModalProps } from "@/lib/modal-helper";
import { notifications } from "@mantine/notifications";

export const CreateUser = ({
	context,
	id,
	innerProps,
}: TypedContextModalProps<"createUser">) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		validate: zodResolver(signUpSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		const { firstName, lastName, email, password } = values;
		setIsLoading(true);
		await authClient.admin.createUser(
			{
				name: `${firstName} ${lastName}`,
				email,
				password,
				role: "user",
			},
			{
				onSuccess: () => {
					notifications.show({
						color: "teal",
						title: "Success",
						message: "User created",
					});
					innerProps.onCreated();
					context.closeModal(id);
				},
				onError: (err) => {
					notifications.show({
						color: "red",
						title: "Failed",
						message: err.error.message,
					});
				},
			},
		);
		setIsLoading(false);
	}

	return (
		<Container>
			<Stack gap="sm">
				<Text size="xs">Edit user information</Text>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<TextInput
						label="First Name"
						placeholder="Joane"
						required
						name="firstName"
						autoComplete="given-name"
						key={form.key("firstName")}
						{...form.getInputProps("firstName")}
					/>
					<TextInput
						label="Last Name"
						placeholder="Jones"
						required
						name="lastName"
						autoComplete="family-name"
						key={form.key("lastName")}
						{...form.getInputProps("lastName")}
					/>
					<TextInput
						label="Email"
						placeholder="test@example.com"
						required
						name="email"
						autoComplete="email"
						key={form.key("email")}
						{...form.getInputProps("email")}
					/>
					<PasswordInput
						label="Password"
						placeholder="Password"
						required
						name="password"
						autoComplete="new-password"
						mt="md"
						key={form.key("password")}
						{...form.getInputProps("password")}
					/>
					<PasswordInput
						label="Confirm Password"
						placeholder="Confirm Password"
						required
						name="confirmPassword"
						autoComplete="new-password"
						mt="md"
						key={form.key("confirmPassword")}
						{...form.getInputProps("confirmPassword")}
					/>
					<Button disabled={isLoading} fullWidth mt="xl" type="submit">
						Create
					</Button>
				</form>
				<Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
					Cancel
				</Button>
			</Stack>
		</Container>
	);
};
