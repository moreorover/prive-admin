"use client";

import DrawerProvider from "@/components/providers/DrawerProvider";
import React from "react";
import { ModalsProvider } from "@mantine/modals";
import { TransactionPickerModal } from "@/modules/appointments/ui/components/transaction-picker-modal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ModalsProvider
      modals={{
        transactionPickerModal: TransactionPickerModal,
      }}
    >
      <DrawerProvider />
      {children}
    </ModalsProvider>
  );
}
