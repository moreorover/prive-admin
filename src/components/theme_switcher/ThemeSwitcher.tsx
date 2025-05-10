"use client";

import { Icon } from "@iconify/react";
import {
	ActionIcon,
	type MantineColorScheme,
	useMantineColorScheme,
} from "@mantine/core";

export const ThemeSwitcher = () => {
	const { colorScheme, setColorScheme } = useMantineColorScheme();

	return (
		<ActionIcon
			variant="default"
			size="sm"
			onClick={() =>
				setColorScheme(
					colorScheme === ("light" as MantineColorScheme)
						? ("dark" as MantineColorScheme)
						: ("light" as MantineColorScheme),
				)
			}
			title="Toggle color scheme"
		>
			{colorScheme === "light" ? (
				<Icon icon={"lucide:sun"} width={14} height={14} />
			) : (
				<Icon icon={"lucide:moon"} width={14} height={14} />
			)}
		</ActionIcon>
	);
};
