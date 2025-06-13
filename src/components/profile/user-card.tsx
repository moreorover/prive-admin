"use client";

import { Icon } from "@iconify/react";
import {
	Alert,
	Avatar,
	Button,
	Card,
	Container,
	Divider,
	Group,
	Loader,
	Stack,
	Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UAParser } from "ua-parser-js";

import { LoaderSkeleton } from "@/components/loader-skeleton";
import { authClient } from "@/lib/auth-client";
import type { Session } from "@/lib/auth-schema";

import { openTypedContextModal } from "@/lib/modal-helper";

interface Props {
	session: Session | null;
	activeSessions: Session["session"][];
}

export default function UserCard(props: Props) {
	const [isTerminating, setIsTerminating] = useState<string>();
	const router = useRouter();
	const { data } = authClient.useSession();
	const session = data || props.session;
	const [emailVerificationPending, setEmailVerificationPending] =
		useState<boolean>(false);

	if (!session) {
		return <LoaderSkeleton />;
	}

	return (
		<Container size={"xs"} py={12}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="sm">
					<Text fw={500}>User</Text>
					<Group gap="sm" justify="space-between">
						<Group gap="sm">
							<Avatar name={session?.user.name} color={"initials"} />
							<div>
								<Text fz="sm" fw={500}>
									{session?.user.name}
								</Text>
								<Text fz="xs" c="dimmed">
									{session?.user.email}
								</Text>
							</div>
						</Group>
						<Group gap="sm">
							<Button
								onClick={() =>
									openTypedContextModal("editUser", {
										innerProps: { fullName: session.user.name },
									})
								}
							>
								Edit
							</Button>
							<Button
								onClick={() => {
									if (session?.user.twoFactorEnabled) {
										openTypedContextModal("totpVerification", {
											innerProps: {
												onVerified: () =>
													openTypedContextModal("changePassword", {
														innerProps: {},
													}),
											},
										});
									} else {
										openTypedContextModal("changePassword", {
											innerProps: {},
										});
									}
								}}
							>
								Change Password
							</Button>
						</Group>
					</Group>

					<Divider />

					{!props.session?.user.emailVerified && (
						<Alert
							variant="light"
							color="red"
							title="Verify Your Email Address"
							icon={<Icon icon="lucide:info" width={16} height={16} />}
						>
							<Stack>
								Please verify your email address. Check your inbox for the
								verification email. If you haven't received the email, click the
								button below to resend.
								<Button
									loading={emailVerificationPending}
									variant="outline"
									color="red"
									onClick={async () => {
										await authClient.sendVerificationEmail(
											{
												email: session?.user.email || "",
											},
											{
												onRequest() {
													setEmailVerificationPending(true);
												},
												onError(context) {
													notifications.show({
														color: "red",
														title: "Failed",
														message: context.error.message,
													});
												},
												onSuccess() {
													notifications.show({
														color: "green",
														title: "Success",
														message: "Verification email sent successfully",
													});
												},
											},
										);
										setEmailVerificationPending(false);
									}}
								>
									Resend Verification Email
								</Button>
							</Stack>
						</Alert>
					)}

					<Text size="xs">Sessions</Text>

					{props.activeSessions
						.filter((s) => s.userAgent)
						.map((s) => {
							const parser = new UAParser(s.userAgent || "");
							const deviceType = parser.getDevice().type;
							const osName = parser.getOS().name;
							const browserName = parser.getBrowser().name;

							return (
								<Group key={s.id}>
									{deviceType === "mobile" ? (
										<Icon icon="lucide:smartphone" width={16} height={16} />
									) : (
										<Icon icon="lucide:laptop" width={16} height={16} />
									)}
									<Text size="sm">
										{s.ipAddress && `${s.ipAddress}, `}
										{osName}, {browserName}
									</Text>
									<Button
										size="xs"
										variant="subtle"
										color="red"
										onClick={async () => {
											setIsTerminating(s.id);
											const res = await authClient.revokeSession({
												token: s.token,
											});

											if (res.error) {
												notifications.show({
													color: "red",
													title: "Failed",
													message: res.error.message,
												});
											} else {
												notifications.show({
													color: "emerald",
													title: "Success",
													message: "Session terminated successfully",
												});
											}

											router.refresh();
											setIsTerminating(undefined);
										}}
									>
										{isTerminating === s.id ? (
											<Loader size={14} />
										) : s.id === session?.session.id ? (
											"Sign Out"
										) : (
											"Terminate"
										)}
									</Button>
								</Group>
							);
						})}

					<Divider />

					<Text size="xs">Two Factor</Text>

					{session?.user.twoFactorEnabled && (
						<Button
							leftSection={
								<Icon
									icon="lucide:scroll-text"
									width={14}
									height={14}
									// style={{ color: "green" }}
								/>
							}
							variant="default"
							onClick={() =>
								openTypedContextModal("totpVerification", {
									innerProps: {
										onVerified: () =>
											openTypedContextModal("showBackupCodes", {
												innerProps: {},
											}),
									},
								})
							}
						>
							Show Backup Codes
						</Button>
					)}

					{session?.user.twoFactorEnabled && (
						<Button
							leftSection={
								<Icon
									icon="lucide:package-open"
									width={14}
									height={14}
									// style={{ color: "green" }}
								/>
							}
							variant="default"
							onClick={() =>
								openTypedContextModal("totpVerification", {
									innerProps: {
										onVerified: () =>
											openTypedContextModal("generateBackupCodes", {
												innerProps: {},
											}),
									},
								})
							}
						>
							Generate New Backup Codes
						</Button>
					)}

					{session?.user.twoFactorEnabled && (
						<Button
							leftSection={
								<Icon
									icon="lucide:qr-code"
									width={14}
									height={14}
									// style={{ color: "green" }}
								/>
							}
							variant="default"
							onClick={() =>
								openTypedContextModal("showTwoFactorQrCode", { innerProps: {} })
							}
						>
							Scan QR Code
						</Button>
					)}

					<Button
						leftSection={
							session?.user.twoFactorEnabled ? (
								<Icon
									icon="lucide:shield-off"
									width={14}
									height={14}
									style={{ color: "red" }}
								/>
							) : (
								<Icon
									icon="lucide:shield-check"
									width={14}
									height={14}
									style={{ color: "green" }}
								/>
							)
						}
						variant="default"
						onClick={() => {
							if (session?.user.twoFactorEnabled) {
								openTypedContextModal("totpVerification", {
									innerProps: {
										onVerified: () => {
											openTypedContextModal("enable2fa", {
												title: "Disable 2FA",
												innerProps: { session },
											});
										},
									},
								});
							} else {
								openTypedContextModal("enable2fa", {
									title: "Enable 2FA",
									innerProps: { session },
								});
							}
						}}
					>
						{session?.user.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
					</Button>
				</Stack>
			</Card>
		</Container>
	);
}
