"use client";

import { Button, Card, Container, Stack, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { backupCodeSchema } from "@/lib/auth-schema";
import { useRouter } from "next/navigation";

export default function Page() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			code: "",
		},
		validate: zodResolver(backupCodeSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		const { code } = values;
		setIsSubmitting(true);

		await authClient.twoFactor.verifyBackupCode(
			{
				code,
			},
			{
				onSuccess() {
					//redirect the user on success
					router.replace("/profile");
				},
				// biome-ignore lint/correctness/noUnusedVariables: <explanation>
				onError(ctx) {
					notifications.show({
						color: "red",
						title: "Failed",
						message: "Incorrect backup code provided",
					});
				},
			},
		);
		setIsSubmitting(false);
	}

	return (
		<Container size="xs">
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack>
					<Text fw={500}>Can't access your 2FA?</Text>
					<Text size="xs">Enter one of the backup codes to access account</Text>
					<form onSubmit={form.onSubmit(handleSubmit)}>
						<TextInput
							label="Backup code"
							name="code"
							required
							key={form.key("code")}
							{...form.getInputProps("code")}
						/>
						<Button fullWidth mt="xl" type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Submitting..." : "Submit backup code"}
						</Button>
					</form>
				</Stack>
			</Card>
		</Container>
	);
}
