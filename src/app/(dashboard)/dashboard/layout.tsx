import DashboardShell from "@/components/dashboard/DashboardShell";
import { auth } from "@/lib/auth";
import { Container } from "@mantine/core";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type React from "react";

interface Props {
	children: React.ReactNode;
}

export default async function DashboardLayout({ children }: Props) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return redirect("/signin");
	}

	const user = session.user;

	const version = process.env.VERSION;

	return (
		<DashboardShell
			profile={{ name: user.name, email: user.email }}
			version={version}
		>
			<Container fluid>{children}</Container>
		</DashboardShell>
	);
}
