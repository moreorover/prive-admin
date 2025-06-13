"use client";

import { Button, Container, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import type { TypedContextModalProps } from "@/lib/modal-helper";

export const TotpVerification = ({
	context,
	id,
	innerProps,
}: TypedContextModalProps<"totpVerification">) => {
	const [isPendingTwoFa, setIsPendingTwoFa] = useState<boolean>(false);
	const [twoFaPassword, setTwoFaPassword] = useState<string>("");

	const handleVerify = async () => {
		await authClient.twoFactor.verifyTotp({
			code: twoFaPassword,
			trustDevice: true,
			fetchOptions: {
				onError() {
					setIsPendingTwoFa(false);
					setTwoFaPassword("");
					notifications.show({
						color: "red",
						title: "Failed",
						message: "Invalid TOTP code",
					});
				},
				onSuccess() {
					notifications.show({
						color: "green",
						title: "Success",
						message: "TOTP Verified",
					});
					setIsPendingTwoFa(false);
					setTwoFaPassword("");
					context.closeModal(id);
					innerProps.onVerified();
				},
			},
		});
		setIsPendingTwoFa(false);
		setTwoFaPassword("");
	};

	return (
		<Container>
			<Stack gap="sm">
				<Text size="sm">Enter your 6-digit TOTP code to verify</Text>

				<TextInput
					label="TOTP code"
					value={twoFaPassword}
					onChange={(e) => setTwoFaPassword(e.target.value)}
					placeholder="Enter TOTP"
				/>
				<Button
					loading={isPendingTwoFa}
					disabled={isPendingTwoFa}
					onClick={handleVerify}
				>
					Verify
				</Button>
				<Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
					Cancel
				</Button>
			</Stack>
		</Container>
	);
};
