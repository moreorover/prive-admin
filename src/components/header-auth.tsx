"use client";

import { Icon } from "@iconify/react";
import {
	Button,
	Group,
	Indicator,
	Menu,
	Text,
	UnstyledButton,
} from "@mantine/core";
import cx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";

import classes from "@/components/header-auth.module.css";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { authClient } from "@/lib/auth-client";

export function HeaderAuth() {
	const router = useRouter();
	const { data, isPending } = authClient.useSession();

	if (isPending) return <LoaderSkeleton />;

	if (!data?.user)
		return (
			<Group visibleFrom="sm">
				<Button component={Link} variant="default" href={"/sign-in"}>
					Sign in
				</Button>
				<Button>Sign up</Button>
			</Group>
		);

	return (
		<>
			{data.user.role === "admin" && (
				<Button component={Link} href="/admin" variant="light" size="xs">
					admin
				</Button>
			)}
			<Menu>
				<Menu.Target>
					{!data.user.emailVerified ? (
						<Indicator inline processing color="red" size={6}>
							<UnstyledButton className={cx(classes.user)}>
								<Group gap={7}>
									{/*<Avatar name={data.user.name} color="initials" />*/}
									<Text fw={500} size="sm" lh={1} mr={3}>
										{data.user.name}
									</Text>
								</Group>
							</UnstyledButton>
						</Indicator>
					) : (
						<UnstyledButton className={cx(classes.user)}>
							<Group gap={7}>
								{/*<Avatar name={data.user.name} color="initials" />*/}
								<Text fw={500} size="sm" lh={1} mr={3}>
									{data.user.name}
								</Text>
							</Group>
						</UnstyledButton>
					)}
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Item
						component={Link}
						href={"/profile"}
						leftSection={
							<Icon icon={"lucide:settings"} width={16} height={16} />
						}
					>
						Account settings
					</Menu.Item>
					<Menu.Item
						leftSection={
							<Icon icon={"lucide:log-out"} width={16} height={16} />
						}
						onClick={async () => {
							await authClient.signOut({
								fetchOptions: {
									onSuccess() {
										router.push("/sign-in");
										router.refresh();
									},
								},
							});
						}}
					>
						Logout
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>
		</>
	);
}
