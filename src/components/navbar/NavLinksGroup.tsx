"use client";

import {
	Box,
	Collapse,
	Group,
	ThemeIcon,
	UnstyledButton,
	useDirection,
} from "@mantine/core";
import { ChevronLeft, ChevronRight, type LucideProps } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	type ForwardRefExoticComponent,
	type RefAttributes,
	useState,
} from "react";
import classes from "./NavLinksGroup.module.css";

interface LinksGroupProps {
	icon: ForwardRefExoticComponent<
		Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
	>;
	label: string;
	link?: string;
	initiallyOpened?: boolean;
	links?: { label: string; link: string }[];
}

export function NavLinksGroup({
	icon: Icon,
	label,
	link,
	initiallyOpened,
	links,
}: LinksGroupProps) {
	const pathname = usePathname();
	const { dir } = useDirection();

	const hasLinks = Array.isArray(links);
	const [opened, setOpened] = useState(initiallyOpened || false);
	const ChevronIcon = dir === "ltr" ? ChevronRight : ChevronLeft;
	const items = (hasLinks ? links : []).map((link) => {
		return (
			<Link
				href={link.link}
				key={link.label}
				className={`${classes.link} ${link.link === pathname && classes.activeLink}`}
			>
				{link.label}
			</Link>
		);
	});

	return (
		<>
			{link ? (
				<Link
					href={link}
					className={`${classes.control} ${link === pathname && classes.activeControl}`}
				>
					<Group gap={0} justify="space-between">
						<Box style={{ display: "flex", alignItems: "center" }}>
							<ThemeIcon variant="light" size={30}>
								<Icon size="1.1rem" />
							</ThemeIcon>
							<Box ml="md">{label}</Box>
						</Box>
					</Group>
				</Link>
			) : (
				<UnstyledButton
					onClick={() => {
						if (hasLinks) {
							setOpened((o) => !o);
							return;
						}
					}}
					className={classes.control}
				>
					<Group gap={0} justify="space-between">
						<Box style={{ display: "flex", alignItems: "center" }}>
							<ThemeIcon variant="light" size={30}>
								<Icon size="1.1rem" />
							</ThemeIcon>
							<Box ml="md">{label}</Box>
						</Box>
						{hasLinks && (
							<ChevronIcon
								className={classes.chevron}
								size="1rem"
								style={{
									transform: opened
										? `rotate(${dir === "rtl" ? -90 : 90}deg)`
										: "none",
								}}
							/>
						)}
					</Group>
				</UnstyledButton>
			)}
			{hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
		</>
	);
}
