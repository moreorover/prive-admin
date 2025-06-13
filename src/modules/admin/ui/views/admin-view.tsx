"use client";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { authClient } from "@/lib/auth-client";
import { openTypedContextModal } from "@/lib/modal-helper";
import { Icon } from "@iconify/react";
import {
	ActionIcon,
	Avatar,
	Badge,
	Button,
	Card,
	Container,
	Group,
	Loader,
	Menu,
	Stack,
	Table,
	Text,
	Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const AdminView = () => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isLoading, setIsLoading] = useState<string | undefined>();
	const { data: users, isLoading: isUsersLoading } = useQuery({
		queryKey: ["users"],
		queryFn: async () => {
			const data = await authClient.admin.listUsers(
				{
					query: {
						limit: 10,
						sortBy: "createdAt",
						sortDirection: "desc",
					},
				},
				{
					throw: true,
				},
			);
			return data?.users || [];
		},
	});

	const handleCreateUser = async () => {
		setIsLoading("create");
		let wasVerified = false;
		openTypedContextModal("totpVerification", {
			innerProps: {
				onVerified: () => {
					wasVerified = true;
					openTypedContextModal("createUser", {
						innerProps: {
							onCreated: () => {
								setIsLoading(undefined);
								queryClient.invalidateQueries({
									queryKey: ["users"],
								});
							},
						},
						onClose: () => {
							setTimeout(() => setIsLoading(undefined), 0);
						},
					});
				},
			},
			onClose: () => {
				if (!wasVerified) {
					setTimeout(() => setIsLoading(undefined), 0);
				}
			},
		});
	};

	const handleBanUser = async (userId: string) => {
		setIsLoading(`ban-${userId}`);
		let wasVerified = false;
		openTypedContextModal("totpVerification", {
			innerProps: {
				onVerified: () => {
					wasVerified = true;
					openTypedContextModal("banUser", {
						innerProps: {
							userId,
							onBan: () => {
								setIsLoading(undefined);
								queryClient.invalidateQueries({
									queryKey: ["users"],
								});
							},
						},
						onClose: () => {
							setTimeout(() => setIsLoading(undefined), 0);
						},
					});
				},
			},
			onClose: () => {
				if (!wasVerified) {
					setTimeout(() => setIsLoading(undefined), 0);
				}
			},
		});
	};

	const handleUnbanUser = async (userId: string) => {
		setIsLoading(`unban-${userId}`);
		let wasVerified = false;
		openTypedContextModal("totpVerification", {
			innerProps: {
				onVerified: async () => {
					wasVerified = true;
					await authClient.admin.unbanUser(
						{
							userId,
						},
						{
							onSuccess: () => {
								notifications.show({
									color: "teal",
									title: "Success",
									message: "User unbanned",
								});
								queryClient.invalidateQueries({
									queryKey: ["users"],
								});
							},
							onError: (err) => {
								notifications.show({
									color: "red",
									title: "Failed",
									message: err.error.message,
								});
							},
						},
					);
					setIsLoading(undefined);
				},
			},
			onClose: () => {
				if (!wasVerified) {
					setTimeout(() => setIsLoading(undefined), 0);
				}
			},
		});
	};

	const handleRevokeSessions = async (id: string) => {
		setIsLoading(`revoke-${id}`);
		try {
			await authClient.admin.revokeUserSessions({ userId: id });
			notifications.show({
				color: "green",
				title: "Success",
				message: "Sessions revoked for user",
			});
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (error: any) {
			notifications.show({
				color: "red",
				title: "Failed",
				message: error.message || "Failed to revoke sessions",
			});
		} finally {
			setIsLoading(undefined);
		}
	};

	const handleImpersonateUser = async (id: string) => {
		setIsLoading(`impersonate-${id}`);
		try {
			await authClient.admin.impersonateUser({ userId: id });
			notifications.show({
				color: "green",
				title: "Success",
				message: "Impersonating user",
			});
			router.push("/profile");
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (error: any) {
			notifications.show({
				color: "red",
				title: "Failed",
				message: error.message || "Failed to impersonate sessions",
			});
		} finally {
			setIsLoading(undefined);
		}
	};

	const rows = users?.map((user) => (
		<Table.Tr key={user.id}>
			<Table.Td>
				<Group gap="sm">
					<Avatar name={user.name} color="initials" />
					<div>
						<Text fz="sm" fw={500}>
							{user.name}
						</Text>
						<Text c="dimmed" fz="xs">
							{user.role}
						</Text>
					</div>
				</Group>
			</Table.Td>
			<Table.Td>
				<Text fz="sm">{user.email}</Text>
				<Text fz="xs" c="dimmed">
					Email
				</Text>
			</Table.Td>
			<Table.Td>
				{user.banned ? (
					<Badge color="red" fullWidth variant="light">
						Banned
					</Badge>
				) : (
					<Badge color="teal" fullWidth variant="light">
						Active
					</Badge>
				)}
			</Table.Td>
			<Table.Td>
				<Group gap={0} justify="flex-end">
					{/*<ActionIcon variant="subtle" color="gray">*/}
					{/*	<Icon icon={"lucide:pencil"} height={16} width={16} />*/}
					{/*</ActionIcon>*/}
					<Menu
						transitionProps={{ transition: "pop" }}
						withArrow
						position="bottom-end"
						withinPortal
					>
						<Menu.Target>
							<ActionIcon variant="subtle" color="gray">
								<Icon icon={"lucide:more-horizontal"} height={16} width={16} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item
								onClick={() => handleRevokeSessions(user.id)}
								disabled={isLoading?.startsWith("revoke")}
								leftSection={
									isLoading === `revoke-${user.id}` ? (
										<Loader size="xs" />
									) : (
										<Icon icon={"lucide:refresh-cw"} height={16} width={16} />
									)
								}
							>
								Revoke Sessions
							</Menu.Item>
							<Menu.Item
								onClick={() => handleImpersonateUser(user.id)}
								disabled={isLoading?.startsWith("impersonate")}
								leftSection={
									isLoading === `revoke-${user.id}` ? (
										<Loader size="xs" />
									) : (
										<Icon icon={"lucide:circle-user"} height={16} width={16} />
									)
								}
							>
								Impersonate
							</Menu.Item>
							{!user.banned && (
								<Menu.Item
									onClick={() => handleBanUser(user.id)}
									disabled={isLoading?.startsWith("ban")}
									leftSection={
										<Icon icon={"lucide:user-x"} height={16} width={16} />
									}
									color="red"
								>
									Ban User
								</Menu.Item>
							)}
							{user.banned && (
								<Menu.Item
									onClick={() => handleUnbanUser(user.id)}
									disabled={isLoading?.startsWith("unban")}
									leftSection={
										<Icon icon={"lucide:user-x"} height={16} width={16} />
									}
									color="violet"
								>
									Unban User
								</Menu.Item>
							)}
						</Menu.Dropdown>
					</Menu>
				</Group>
			</Table.Td>
		</Table.Tr>
	));

	return (
		<Container size={"md"} py={12}>
			<Card shadow="sm" padding="lg" radius="md" withBorder>
				<Stack gap="sm">
					<Group justify="space-between">
						<Title order={3}>Users</Title>
						<Button
							loading={isLoading === "create"}
							disabled={isUsersLoading}
							leftSection={<Icon icon={"lucide:plus"} />}
							onClick={handleCreateUser}
						>
							Create User
						</Button>
					</Group>
					{isUsersLoading ? (
						<LoaderSkeleton />
					) : (
						<Table.ScrollContainer minWidth={800}>
							<Table verticalSpacing="sm">
								<Table.Tbody>{rows}</Table.Tbody>
							</Table>
						</Table.ScrollContainer>
					)}
				</Stack>
			</Card>
		</Container>
	);
};
