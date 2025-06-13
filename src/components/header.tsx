"use client";
import {
	Burger,
	Container,
	Divider,
	Drawer,
	Group,
	ScrollArea,
	Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HeaderAuth } from "@/components/header-auth";
import classes from "@/components/header.module.css";
import { ThemeSwitcher } from "@/components/theme_switcher/ThemeSwitcher";
import type { Session } from "@/lib/auth-schema";
import { LogoGradient } from "./logo-gradient";

const links = [
	{ link: "/dashboard", label: "Dashboard", role: "admin" },
	{ link: "/dashboard/calendar", label: "Calendar" },
	{ link: "/dashboard/customers", label: "Customers" },
	{ link: "/dashboard/hair-orders", label: "Hair Orders" },
	{ link: "/dashboard/transactions", label: "Transactions" },
	{ link: "/admin", label: "Admin", role: "admin" },
	// { link: "/", label: "" },
];

interface Props {
	session: Session | null;
}

export function Header({ session }: Props) {
	const [opened, { toggle }] = useDisclosure(false);
	const pathname = usePathname();

	const logo = <LogoGradient href="/" />;

	const items = links
		.filter((link) => {
			// Show the link if:
			// 1. It doesn't have a role requirement, OR
			// 2. It has a role requirement that matches the user's role
			return !link.role || session?.user?.role === link.role;
		})
		.map((link) => {
			const isExactMatch = pathname === link.link;
			const isNestedMatch = pathname.startsWith(`${link.link}/`);

			const isActive =
				isExactMatch || (isNestedMatch && link.link !== "/dashboard");

			return (
				<Link
					key={link.label}
					href={link.link}
					className={classes.link}
					data-active={isActive || undefined}
				>
					{link.label}
				</Link>
			);
		});

	return (
		<header className={classes.header}>
			<Container size="lg" className={classes.inner}>
				{logo}

				{/* Desktop nav */}
				<Group gap={5} visibleFrom="sm">
					{...items}
				</Group>

				<Group gap="md" visibleFrom="sm">
					<HeaderAuth session={session} />
					<ThemeSwitcher />
				</Group>

				{/* Burger button for mobile */}
				<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />

				<Drawer.Root
					opened={opened}
					onClose={toggle}
					size="100%"
					padding="md"
					hiddenFrom="sm"
					zIndex={1000000}
				>
					<Drawer.Overlay />
					<Drawer.Content>
						<Drawer.Header>
							<Drawer.Title>{logo}</Drawer.Title>
							<Drawer.CloseButton />
						</Drawer.Header>
						<Drawer.Body>
							<ScrollArea h="calc(100vh - 80px" mx="-md">
								<Stack justify="space-between">
									<Divider my="sm" />
									{...items}
									<Divider my="sm" />
									<HeaderAuth session={session} />
									<ThemeSwitcher />
								</Stack>
							</ScrollArea>
						</Drawer.Body>
					</Drawer.Content>
				</Drawer.Root>
			</Container>
		</header>
	);
}
