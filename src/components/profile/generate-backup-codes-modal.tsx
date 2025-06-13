"use client";

import {
	Button,
	Code,
	Container,
	CopyButton,
	Grid,
	PasswordInput,
	Stack,
	Text,
} from "@mantine/core";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import type { TypedContextModalProps } from "@/lib/modal-helper";

export const GenerateBackupCodes = ({
	context,
	id,
}: TypedContextModalProps<"generateBackupCodes">) => {
	const [password, setPassword] = useState<string>("");
	const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
	const [isGenerating, setIsGenerating] = useState<boolean>(false);

	return (
		<Container>
			<Stack gap="sm">
				<Text size="sm">Generate new set of your backup codes</Text>
				{backupCodes ? (
					<>
						<Grid gutter="sm">
							{backupCodes.map((code) => (
								<Grid.Col span={{ base: 12, sm: 6 }} key={code}>
									<Code block p="xs" fw={500}>
										{code}
									</Code>
								</Grid.Col>
							))}
						</Grid>
						<CopyButton value={backupCodes.join("\n")}>
							{({ copied, copy }) => (
								<Button
									color={copied ? "teal" : "bright_orange"}
									onClick={copy}
								>
									{copied ? "Copied Codes" : "Copy codes"}
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
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						<Button
							loading={isGenerating}
							onClick={async () => {
								setIsGenerating(true);
								const { data } = await authClient.twoFactor.generateBackupCodes(
									{
										password: password,
									},
								);
								setPassword("");
								setIsGenerating(false);
								data && setBackupCodes(data.backupCodes);
							}}
						>
							Generate
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
