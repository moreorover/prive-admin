"use client";

import TransactionForm from "@/components/dashboard/transactions/TransactionForm";
import { Transaction } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { createTransaction } from "@/data-access/transaction";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { newTransactionDrawerAtom } from "@/lib/atoms";

export default function NewTransactionDrawer() {
  const [value, setOpen] = useAtom(newTransactionDrawerAtom);

  async function onSubmit(data: Transaction) {
    const response = await createTransaction(data);

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to create Transaction",
        message: "Please try again.",
      });
    } else {
      setOpen({ isOpen: false, orderId: "" });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transaction created.",
      });
    }
    return response;
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() => setOpen({ isOpen: false, orderId: "" })}
      position="right"
      title="Create Transaction"
    >
      <TransactionForm
        onSubmitAction={onSubmit}
        transaction={{
          orderId: value.orderId,
          name: "",
          type: "BANK",
          direction: "IN",
          total: 0,
          isProductCost: false,
        }}
      />
    </Drawer>
  );
}
