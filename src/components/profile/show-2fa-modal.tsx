"use client";

import {
	Box,
	Button,
	Center,
	Container,
	CopyButton,
	PasswordInput,
	Stack,
	Text,
} from "@mantine/core";
import { useState } from "react";
import QRCode from "react-qr-code";

import { authClient } from "@/lib/auth-client";
import type { TypedContextModalProps } from "@/lib/modal-helper";

export const ShowTwoFactorQrCode = ({
	context,
	id,
}: TypedContextModalProps<"showTwoFactorQrCode">) => {
	const [twoFaPassword, setTwoFaPassword] = useState<string>("");
	const [twoFactorVerifyURI, setTwoFactorVerifyURI] = useState<string>("");

	return (
		<Container>
			<Stack gap="sm">
				<Text size="sm">Scan the QR code with your TOTP app</Text>
				{twoFactorVerifyURI ? (
					<>
						<Center p={12} bg="#ffffff">
							<Box p={16} bg="white" style={{ borderRadius: 8 }}>
								<QRCode value={twoFactorVerifyURI} />
							</Box>
						</Center>

						<CopyButton value={twoFactorVerifyURI}>
							{({ copied, copy }) => (
								<Button
									color={copied ? "teal" : "bright_orange"}
									onClick={copy}
								>
									{copied ? "Copied URI" : "Copy URI"}
								</Button>
							)}
						</CopyButton>
					</>
				) : (
					<>
						<div className="flex flex-col gap-2">
							<PasswordInput
								label="Password"
								id="password"
								placeholder="Password"
								autoComplete="current-password"
								value={twoFaPassword}
								onChange={(e) => setTwoFaPassword(e.target.value)}
							/>
						</div>
						<Button
							onClick={async () => {
								await authClient.twoFactor.getTotpUri(
									{
										password: twoFaPassword,
									},
									{
										onSuccess(context) {
											setTwoFactorVerifyURI(context.data.totpURI);
										},
									},
								);
								setTwoFaPassword("");
							}}
						>
							Show QR Code
						</Button>
					</>
				)}
				<Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
					Cancel
				</Button>
			</Stack>
		</Container>
	);
};
