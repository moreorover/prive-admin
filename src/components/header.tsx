"use client";

import { Icon } from "@iconify/react";
import {
	ActionIcon,
	Burger,
	Container,
	Divider,
	Drawer,
	Group,
	ScrollArea,
	Stack,
	useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HeaderAuth } from "@/components/header-auth";
import classes from "@/components/header.module.css";
import { LogoGradient } from "./logo-gradient";

const links = [
	{ link: "/dashboard/customers", label: "Customers" },
	{ link: "/dashboard/appointments", label: "Appointments" },
	{ link: "/dashboard/hair-orders", label: "Hair Orders" },
	{ link: "/dashboard/transactions", label: "Transactions" },
	// { link: "/", label: "" },
];

export function Header() {
	const [opened, { toggle }] = useDisclosure(false);
	const pathname = usePathname();
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	const logo = <LogoGradient href="/" />;

	const items = links.map((link) => (
		<Link
			key={link.label}
			href={link.link}
			className={classes.link}
			data-active={pathname.startsWith(link.link) || undefined}
		>
			{link.label}
		</Link>
	));

	const toggleColorScheme = () => {
		setColorScheme(colorScheme === "light" ? "dark" : "light");
	};

	return (
		<header className={classes.header}>
			<Container size="md" className={classes.inner}>
				{logo}

				{/* Desktop nav */}
				<Group gap={5} visibleFrom="sm">
					{...items}
				</Group>

				<Group gap="md" visibleFrom="sm">
					<HeaderAuth />
					<ActionIcon
						variant="default"
						size="sm"
						onClick={toggleColorScheme}
						title="Toggle color scheme"
					>
						{colorScheme === "light" ? (
							<Icon icon={"lucide:sun"} width={14} height={14} />
						) : (
							<Icon icon={"lucide:moon"} width={14} height={14} />
						)}
					</ActionIcon>
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
									<HeaderAuth />
									<ActionIcon
										variant="default"
										size="sm"
										onClick={toggleColorScheme}
										title="Toggle color scheme"
									>
										{colorScheme === "light" ? (
											<Icon icon={"lucide:sun"} width={14} height={14} />
										) : (
											<Icon icon={"lucide:moon"} width={14} height={14} />
										)}
									</ActionIcon>
								</Stack>
							</ScrollArea>
						</Drawer.Body>
					</Drawer.Content>
				</Drawer.Root>
			</Container>
		</header>
	);
}
