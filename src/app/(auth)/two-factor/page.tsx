"use client";

import {
	Anchor,
	Button,
	Card,
	Container,
	Group,
	PinInput,
	Stack,
	Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { zodResolver } from "mantine-form-zod-resolver";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { twoFactorSchema } from "@/lib/auth-schema";

export default function Page() {
	const router = useRouter();
	const form = useForm({
		mode: "uncontrolled",
		initialValues: {
			totp: "",
		},
		validate: zodResolver(twoFactorSchema),
	});

	async function handleSubmit(values: typeof form.values) {
		const { totp } = values;
		await authClient.twoFactor.verifyTotp(
			{
				code: totp,
				trustDevice: true,
			},
			{
				onRequest: () => {
					// toast({
					//   title: "Please wait...",
					// });
				},
				onSuccess: () => {
					form.reset();
					router.push("/profile");
				},
				onError: () => {
					notifications.show({
						color: "red",
						title: "Sign In Failed",
						message: "Please make sure TOTP code is correct.",
					});
				},
			},
		);
	}

	return (
		<Container size="xs">
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack>
					<Text fw={500}>TOTP Verification</Text>
					<Text size="xs">Enter your 6-digit TOTP code to authenticate</Text>
					<form onSubmit={form.onSubmit(handleSubmit)}>
						<PinInput
							oneTimeCode
							type="number"
							length={6}
							key={form.key("totp")}
							{...form.getInputProps("totp")}
						/>
						<Group>
							<Anchor size="sm" href="/backup-code">
								Can't access your 2FA?
							</Anchor>
						</Group>
						<Button fullWidth mt="xl" type="submit">
							Verify
						</Button>
					</form>
				</Stack>
			</Card>
		</Container>
	);
}
