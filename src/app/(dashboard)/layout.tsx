import { Header } from "@/components/header";
import DrawerProvider from "@/components/providers/DrawerProvider";
import { getSession } from "@/lib/auth-helper";
import type { ReactNode } from "react";

export default async function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const session = await getSession();

	return (
		<>
			<DrawerProvider />
			<Header session={session} />
			{children}
		</>
	);
}
