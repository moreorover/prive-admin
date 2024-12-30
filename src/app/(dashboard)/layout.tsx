import DrawerProvider from "@/components/providers/DrawerProvider";

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
