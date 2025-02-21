"use client";

import { Transaction } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { useAtom } from "jotai/index";
import { newTransactionDrawerAtom } from "@/lib/atoms";
import { TransactionForm } from "@/modules/transactions/ui/components/transaction-form";

export const NewTransactionDrawer = () => {
  const [value, setOpen] = useAtom(newTransactionDrawerAtom);

  const newTransaction = trpc.transactions.createTransaction.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transaction created.",
      });
      value.onCreated();
      setOpen({
        isOpen: false,
        orderId: null,
        appointmentId: null,
        customerId: null,
        onCreated: () => {},
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to create Transaction",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: Transaction) {
    newTransaction.mutate({ transaction: data });
  }

  return (
    <>
      <Drawer
        opened={value.isOpen}
        onClose={() =>
          setOpen({
            isOpen: false,
            orderId: null,
            appointmentId: null,
            customerId: null,
            onCreated: () => {},
          })
        }
        position="right"
        title="Create Transaction"
      >
        <TransactionForm
          onSubmitAction={onSubmit}
          transaction={{
            appointmentId: value.appointmentId,
            orderId: value.orderId,
            customerId: value.customerId,
            name: "",
            notes: "",
            amount: 0,
            type: "CASH",
          }}
          disabled={newTransaction.isPending}
        />
      </Drawer>
    </>
  );
};
