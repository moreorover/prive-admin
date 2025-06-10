"use client";

import { Button, Container, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { banUserSchema } from "@/lib/auth-schema";
import type { TypedContextModalProps } from "@/lib/modal-helper";
import { notifications } from "@mantine/notifications";

export const BanUser = ({
	context,
	id,
	innerProps,
}: TypedContextModalProps<"banUser">) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			banReason: "",
		},
		validate: zodResolver(banUserSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		const { banReason } = values;
		setIsLoading(true);
		await authClient.admin.banUser(
			{
				userId: innerProps.userId,
				banReason,
			},
			{
				onSuccess: () => {
					notifications.show({
						color: "teal",
						title: "Success",
						message: "User banned",
					});
					innerProps.onBan?.();
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
						label="Ban reason"
						placeholder="Spamming"
						required
						name="banReason"
						key={form.key("banReason")}
						{...form.getInputProps("banReason")}
					/>
					<Button disabled={isLoading} fullWidth mt="xl" type="submit">
						Ban
					</Button>
				</form>
				<Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
					Cancel
				</Button>
			</Stack>
		</Container>
	);
};
