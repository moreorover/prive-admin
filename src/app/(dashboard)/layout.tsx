import { Header } from "@/components/header";
import DrawerProvider from "@/components/providers/DrawerProvider";
import { getSession } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const session = await getSession();

	if (!session) {
		return redirect("/");
	}
	return (
		<>
			<DrawerProvider />
			<Header session={session} />
			{children}
		</>
	);
}
