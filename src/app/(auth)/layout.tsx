import { Anchor, Box, Center, Text } from "@mantine/core";
import type React from "react";
import classes from "./layout.module.css";

interface Props {
	children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
	return (
		<Center className={classes.wrapper}>
			<Box>
				<Text
					inherit
					variant="gradient"
					component="span"
					gradient={{ from: "pink", to: "yellow" }}
				>
					PRIVÉ
				</Text>{" "}
				<Text
					inherit
					variant="gradient"
					component="span"
					gradient={{ from: "blue", to: "green" }}
				>
					Admin
				</Text>
				<Text c="dimmed" size="sm" mt={5}>
					Don&apos;t have an account?{" "}
					<Anchor size="sm" href="/register">
						Sign Up
					</Anchor>
				</Text>
				<Box w={400}>{children}</Box>
			</Box>
		</Center>
	);
}
