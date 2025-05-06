"use client";

import { Header } from "@/components/header";
import DrawerProvider from "@/components/providers/DrawerProvider";
import type { ReactNode } from "react";

export default function RootLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<>
			<DrawerProvider />
			<Header />
			{children}
		</>
	);
}
