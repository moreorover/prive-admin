import {
	ColorSchemeScript,
	DEFAULT_THEME,
	MantineProvider,
	createTheme,
	mergeMantineTheme,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Head from "next/head";
import "./globals.css";
import "@mantine/charts/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import { providerModals } from "@/lib/modal-helper";
import { TRPCProvider } from "@/trpc/client";
import { ModalsProvider } from "@mantine/modals";
import type React from "react";
import { breakpoints, colors } from "./theme";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "PRIVÉ Admin dashboard",
	description: "PRIVÉ Admin dashboard",
};

const theme = mergeMantineTheme(
	DEFAULT_THEME,
	createTheme({
		fontFamily: geistSans.style.fontFamily,
		fontFamilyMonospace: geistMono.style.fontFamily,
		breakpoints,
		colors,
	}),
);

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<Head>
				<ColorSchemeScript />
			</Head>
			<body className="antialiased">
				<TRPCProvider>
					<MantineProvider theme={theme}>
						<ModalsProvider modals={providerModals}>
							{children}
							<Notifications />
						</ModalsProvider>
					</MantineProvider>
				</TRPCProvider>
			</body>
		</html>
	);
}
