"use client";

import { Transaction } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { useAtom } from "jotai/index";
import { editTransactionDrawerAtom } from "@/lib/atoms";
import { TransactionForm } from "@/modules/transactions/ui/components/transaction-form";

export const EditTransactionDrawer = () => {
  const [value, setOpen] = useAtom(editTransactionDrawerAtom);

  const editTransaction = trpc.transactions.update.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transaction created.",
      });
      value.onUpdated();
      setOpen({
        isOpen: false,
        transaction: { name: "", notes: "", amount: 0, type: "CASH" },
        onUpdated: () => {},
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
    editTransaction.mutate({
      transaction: data,
    });
  }

  return (
    <>
      <Drawer
        opened={value.isOpen}
        onClose={() =>
          setOpen({
            isOpen: false,
            transaction: { name: "", notes: "", amount: 0, type: "CASH" },
            onUpdated: () => {},
          })
        }
        position="right"
        title="Update Transaction"
      >
        <TransactionForm
          onSubmitAction={onSubmit}
          transaction={value.transaction}
          disabled={editTransaction.isPending}
        />
      </Drawer>
    </>
  );
};
