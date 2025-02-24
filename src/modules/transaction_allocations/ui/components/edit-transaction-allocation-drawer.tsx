"use client";

import { TransactionAllocation } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editTransactionAllocationDrawerAtom } from "@/lib/atoms";
import { trpc } from "@/trpc/client";
import { TransactionAllocationForm } from "@/modules/transaction_allocations/ui/components/transaction-allocation-form";

export const EditTransactionAllocationDrawer = () => {
  const [value, setOpen] = useAtom(editTransactionAllocationDrawerAtom);

  const editTransactionAllocation =
    trpc.transactionAllocations.update.useMutation({
      onSuccess: () => {
        value.onUpdated();
        notifications.show({
          color: "green",
          title: "Success!",
          message: "Transaction updated.",
        });
        setOpen({
          isOpen: false,
          transactionAllocation: {
            amount: 0,
            customerId: "",
            transactionId: "",
          },
          onUpdated: () => {},
        });
      },
      onError: () => {
        notifications.show({
          color: "red",
          title: "Failed to update Transaction.",
          message: "Please try again.",
        });
      },
    });

  async function onSubmit(data: TransactionAllocation) {
    editTransactionAllocation.mutate({ transactionAllocation: data });
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() =>
        setOpen({
          isOpen: false,
          transactionAllocation: {
            amount: 0,
            customerId: "",
            transactionId: "",
          },
          onUpdated: () => {},
        })
      }
      position="right"
      title="Update Transaction"
    >
      <TransactionAllocationForm
        onSubmitAction={onSubmit}
        transactionAllocation={value.transactionAllocation}
        disabled={editTransactionAllocation.isPending}
        maxAmount={value.maxAmount}
      />
    </Drawer>
  );
};
