import theme from "@/app/theme";
import {
	ColorSchemeScript,
	MantineProvider,
	mantineHtmlProps,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { Metadata } from "next";
import "./globals.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { providerModals } from "@/lib/modal-helper";
import { TRPCProvider } from "@/trpc/client";
import { ModalsProvider } from "@mantine/modals";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";

export const metadata: Metadata = {
	title: "PRIVÉ Admin dashboard",
	description: "PRIVÉ Admin dashboard",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			{...mantineHtmlProps}
			className={`${GeistSans.variable} ${GeistMono.variable}`}
		>
			<head>
				<ColorSchemeScript />
			</head>
			<body className="antialiased">
				<TRPCProvider>
					<MantineProvider defaultColorScheme="light" theme={theme}>
						<ModalsProvider modals={providerModals}>
							<NuqsAdapter>{children}</NuqsAdapter>
							<Notifications />
						</ModalsProvider>
					</MantineProvider>
				</TRPCProvider>
			</body>
		</html>
	);
}
