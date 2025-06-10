"use client";

import { Icon } from "@iconify/react";
import {
	Alert,
	Button,
	Card,
	Container,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { zodResolver } from "mantine-form-zod-resolver";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { forgotPasswordSchema } from "@/lib/auth-schema";

export default function Page() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			email: "",
		},
		validate: zodResolver(forgotPasswordSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		const { email } = values;
		setIsSubmitting(true);
		try {
			await authClient.forgetPassword({
				email,
				redirectTo: "/reset-password",
			});
			setIsSubmitted(true);
			// biome-ignore lint/correctness/noUnusedVariables: <explanation>
		} catch (err) {
			notifications.show({
				color: "red",
				title: "Failed",
				message: "An error occurred. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	if (isSubmitted) {
		return (
			<Container size="xs">
				<Card shadow="sm" padding="lg" radius="md" withBorder>
					<Stack>
						<Text fw={500}>Check your email</Text>
						<Text size="xs">
							We've sent a password reset link to your email.
						</Text>
						<Alert
							variant="light"
							color="green"
							title="Check your email"
							icon={
								<Icon
									icon="lucide:circle-check"
									width={16}
									height={16}
									style={{ color: "green" }}
								/>
							}
						>
							If you don't see the email, check your spam folder.
						</Alert>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => setIsSubmitted(false)}
							leftSection={
								<Icon icon="lucide:arrow-left" width={16} height={16} />
							}
						>
							Back to reset password
						</Button>
					</Stack>
				</Card>
			</Container>
		);
	}

	return (
		<Container size="xs">
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack>
					<Text fw={500}>Forgot password</Text>
					<Text size="xs">Enter your email to reset your password</Text>
					<form onSubmit={form.onSubmit(handleSubmit)}>
						<TextInput
							label="Email"
							name="email"
							required
							key={form.key("email")}
							{...form.getInputProps("email")}
						/>
						<Button fullWidth mt="xl" type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Sending..." : "Send reset link"}
						</Button>
					</form>
				</Stack>
			</Card>
		</Container>
	);
}
