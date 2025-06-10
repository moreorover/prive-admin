"use client";

import {
	Button,
	Code,
	Container,
	CopyButton,
	Grid,
	Stack,
} from "@mantine/core";

import type { TypedContextModalProps } from "@/lib/modal-helper";
import { trpc } from "@/trpc/client";

export const ShowBackupCodes = ({
	context,
	id,
}: TypedContextModalProps<"showBackupCodes">) => {
	const [{ backupCodes }] = trpc.auth.getBackupCodes.useSuspenseQuery();

	return (
		<Container>
			<Stack gap="sm">
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
						<Button color={copied ? "teal" : "brand"} onClick={copy}>
							{copied ? "Copied Codes" : "Copy codes"}
						</Button>
					)}
				</CopyButton>
				<Button fullWidth mt="md" onClick={() => context.closeModal(id)}>
					Cancel
				</Button>
			</Stack>
		</Container>
	);
};
