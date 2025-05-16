"use client";

import {
	type CSSProperties,
	Group,
	type ImageProps,
	Text,
} from "@mantine/core";
import Link from "next/link";

type Props = {
	href?: string;
	textStyle?: CSSProperties;
	imageProps?: Partial<ImageProps>;
};

export function LogoGradient({ href }: Props) {
	const logoText = (
		<Group justify="space-between">
			<Text
				size="xl"
				fw={900}
				variant="gradient"
				component="span"
				gradient={{ from: "pink", to: "yellow" }}
			>
				PRIVÉ
			</Text>
			<Text
				size="lg"
				fw={500}
				variant="gradient"
				component="span"
				gradient={{ from: "blue", to: "green" }}
			>
				Admin
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
