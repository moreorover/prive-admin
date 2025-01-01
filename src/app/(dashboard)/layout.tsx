import DrawerProvider from "@/components/providers/DrawerProvider";
import React from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <DrawerProvider />
      {children}
    </>
  );
}
