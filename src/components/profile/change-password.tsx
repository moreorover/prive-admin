"use client";

import {
	Button,
	Checkbox,
	Container,
	PasswordInput,
	Stack,
	Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { changePasswordSchema } from "@/lib/auth-schema";
import type { TypedContextModalProps } from "@/lib/modal-helper";

export const ChangePassword = ({
	context,
	id,
}: TypedContextModalProps<"changePassword">) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			currentPassword: "",
			password: "",
			confirmPassword: "",
			signOut: true,
		},
		validate: zodResolver(changePasswordSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		const { currentPassword, password, signOut } = values;
		setIsLoading(true);
		await authClient.changePassword({
			newPassword: password,
			currentPassword: currentPassword,
			revokeOtherSessions: signOut,
			fetchOptions: {
				onSuccess: () => {
					notifications.show({
						color: "green",
						title: "Success",
						message: "Password changed",
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
				<Text size="xs">Change your password</Text>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<PasswordInput
						label="Current Password"
						placeholder="Your current password"
						required
						name="currentPassword"
						autoComplete="current-password"
						mt="md"
						key={form.key("currentPassword")}
						{...form.getInputProps("currentPassword")}
					/>
					<PasswordInput
						label="New Password"
						placeholder="Your new password"
						required
						name="password"
						autoComplete="new-password"
						mt="md"
						key={form.key("password")}
						{...form.getInputProps("password")}
					/>
					<PasswordInput
						label="Confirm Password"
						placeholder="Confirm password"
						required
						name="confirmPassword"
						autoComplete="new-password"
						mt="md"
						key={form.key("confirmPassword")}
						{...form.getInputProps("confirmPassword")}
					/>
					<Checkbox
						label="Sign out from other devices"
						name="signOut"
						key={form.key("signOut")}
						{...form.getInputProps("signOut", { type: "checkbox" })}
					/>
					<Button disabled={isLoading} fullWidth mt="xl" type="submit">
						Change
					</Button>
				</form>
				<Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
					Cancel
				</Button>
			</Stack>
		</Container>
	);
};
