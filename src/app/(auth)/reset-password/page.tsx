"use client";

import { Button, Card, Container, PasswordInput, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { zodResolver } from "mantine-form-zod-resolver";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema } from "@/lib/auth-schema";

export default function Page() {
	return (
		<Suspense fallback={<LoaderSkeleton />}>
			<ErrorBoundary fallback={<p>Error</p>}>
				<SuspensePage />
			</ErrorBoundary>
		</Suspense>
	);
}

function SuspensePage() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const searchParams = useSearchParams();
	const token = searchParams.get("token") || undefined;
	const router = useRouter();

	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			password: "",
			confirmPassword: "",
		},
		validate: zodResolver(resetPasswordSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		const { password } = values;
		setIsSubmitting(true);

		await authClient.resetPassword(
			{
				newPassword: password,
				token,
			},
			{
				onSuccess: () => {
					setIsSubmitting(false);
					router.push("/sign-in");
				},
				onError: (err) => {
					console.log(err);
					setIsSubmitting(false);
					notifications.show({
						color: "red",
						title: "Failed",
						message: "An error occurred. Please try again.",
					});
				},
			},
		);
	}

	return (
		<Container py={12} size="xs">
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Text fw={500}>Reset password</Text>
				<Text size="xs">
					Enter new password and confirm it to reset your password
				</Text>
				<form onSubmit={form.onSubmit(handleSubmit)}>
					<PasswordInput
						label="New Password"
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
					<Button fullWidth mt="xl" type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Resetting..." : "Reset password"}
					</Button>
				</form>
			</Card>
		</Container>
	);
}
