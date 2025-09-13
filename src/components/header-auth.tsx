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
import { authClient } from "@/lib/auth-client";
import type { Session } from "@/lib/auth-schema";

interface Props {
	session: Session | null;
}

export function HeaderAuth({ session }: Props) {
	const router = useRouter();

	if (!session?.user)
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
			<Menu>
				<Menu.Target>
					{!session.user.emailVerified ? (
						<Indicator inline processing color="red" size={6}>
							<UnstyledButton className={cx(classes.user)}>
								<Group gap={7}>
									{/*<Avatar name={data.user.name} color="initials" />*/}
									<Text fw={500} size="sm" lh={1} mr={3}>
										{session.user.name}
									</Text>
								</Group>
							</UnstyledButton>
						</Indicator>
					) : (
						<UnstyledButton className={cx(classes.user)}>
							<Group gap={7}>
								{/*<Avatar name={data.user.name} color="initials" />*/}
								<Text fw={500} size="sm" lh={1} mr={3}>
									{session.user.name}
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
