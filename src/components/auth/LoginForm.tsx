"use client";
import { authClient } from "@/lib/auth-client";
import { signInFormSchema } from "@/lib/auth-schema";
import {
	Anchor,
	Button,
	Card,
	Checkbox,
	Group,
	PasswordInput,
	TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { zodResolver } from "mantine-form-zod-resolver";

export function LoginForm() {
	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			email: process.env.NODE_ENV === "development" ? "x@x.com" : "",
			password: process.env.NODE_ENV === "development" ? "password123" : "",
		},

		validate: zodResolver(signInFormSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		const { email, password } = values;
		await authClient.signIn.email(
			{
				email,
				password,
				callbackURL: "/dashboard/customers",
			},
			{
				onSuccess: () => {
					form.reset();
				},
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				onError: (_ctx) => {
					notifications.show({
						color: "red",
						title: "Sign In Failed",
						message: "Please make sure your email and password is correct.",
					});
				},
			},
		);
	}

	return (
		<Card withBorder shadow="md" p={30} mt={30} radius="md">
			<form onSubmit={form.onSubmit(handleSubmit)}>
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
					placeholder="Your password"
					required
					name="password"
					autoComplete="current-password"
					mt="md"
					key={form.key("password")}
					{...form.getInputProps("password")}
				/>
				<Group mt="md" justify="space-between">
					<Checkbox label="Remember me" />
					<Anchor size="sm" href="#">
						Forgot Password？
					</Anchor>
				</Group>
				<Button fullWidth mt="xl" type="submit">
					Sign In
				</Button>
			</form>
		</Card>
	);
}
