"use client";

import {
	type CSSProperties,
	Group,
	Image,
	type ImageProps,
	Text,
	useMantineColorScheme,
} from "@mantine/core";
import Link from "next/link";

type Props = {
	href?: string;
	textStyle?: CSSProperties;
	imageProps?: Partial<ImageProps>;
};

export function Logo({ href, textStyle, imageProps = {} }: Props) {
	const { colorScheme } = useMantineColorScheme();

	const logoText = (
		<Group justify="space-between">
			<Image
				src={"/android-chrome-192x192.png"}
				alt="Logo"
				fit="contain"
				style={{ width: "auto", height: "auto", ...imageProps.style }}
				{...imageProps}
			/>
			<Text
				fw={700}
				size="xl"
				style={{
					color: colorScheme === "dark" ? "white" : "black",
					...textStyle,
				}}
			>
				Privé Hair House
			</Text>
		</Group>
	);

	return href ? (
		<Link
			href={href}
			style={{ display: "inline-block", textDecoration: "none" }}
		>
			{logoText}
		</Link>
	) : (
		logoText
	);
}
