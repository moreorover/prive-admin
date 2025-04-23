"use client";

import { Logo } from "@/components/logo/Logo";
import { ThemeSwitcher } from "@/components/theme_switcher/ThemeSwitcher";
import { ActionIcon, Box, Drawer, Stack, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Search, Settings } from "lucide-react";
import type React from "react";
import classes from "./AdminHeader.module.css";

interface Props {
	burger?: React.ReactNode;
}

export function AdminHeader({ burger }: Props) {
	const [opened, { close, open }] = useDisclosure(false);

	return (
		<header className={classes.header}>
			{burger && burger}
			<Logo />
			<Box style={{ flex: 1 }} />
			<TextInput
				placeholder="Search"
				variant="filled"
				leftSection={<Search size="0.8rem" />}
				style={{}}
			/>
			<ActionIcon onClick={open} variant="subtle">
				<Settings size="1.25rem" />
			</ActionIcon>

			<Drawer
				opened={opened}
				onClose={close}
				title="Settings"
				position="right"
				transitionProps={{ duration: 0 }}
			>
				<Stack gap="lg">
					<ThemeSwitcher />
				</Stack>
			</Drawer>
		</header>
	);
}
