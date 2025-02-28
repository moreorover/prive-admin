"use client";

import DrawerProvider from "@/components/providers/DrawerProvider";
import React from "react";
import { ModalsProvider } from "@mantine/modals";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ModalsProvider modals={{}}>
      <DrawerProvider />
      {children}
    </ModalsProvider>
  );
}
