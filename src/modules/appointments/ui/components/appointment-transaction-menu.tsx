"use client";

import { Button, Menu } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { useSetAtom } from "jotai/index";
import {
  newTransactionDrawerAtom,
  transactionPickerModalAtom,
} from "@/lib/atoms";
import { notifications } from "@mantine/notifications";

interface Props {
  appointmentId: string;
  customerId: string;
}

export const AppointmentTransactionMenu = ({
  appointmentId,
  customerId,
}: Props) => {
  const utils = trpc.useUtils();

  const [transactionOptions] =
    trpc.transactions.getManyByAppointmentId.useSuspenseQuery({
      appointmentId: null,
      includeCustomer: false,
    });

  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);
  const showPickTransactionModal = useSetAtom(transactionPickerModalAtom);

  const pickTransactions =
    trpc.transactions.linkTransactionsWithAppointment.useMutation({
      onSuccess: () => {
        notifications.show({
          color: "green",
          title: "Success!",
          message: "Transactions picked.",
        });
        onSuccess();
        showPickTransactionModal({
          isOpen: false,
          transactions: [],
          onConfirmAction: () => {},
        });
      },
      onError: () => {
        notifications.show({
          color: "red",
          title: "Failed to pick Transactions",
          message: "Please try again.",
        });
      },
    });

  async function onConfirmActionTransactions(selectedRows: string[]) {
    if (selectedRows.length > 0) {
      pickTransactions.mutate({
        transactions: selectedRows,
        appointmentId,
        customerId,
      });
    } else {
      notifications.show({
        color: "red",
        title: "Failed to pick Transactions",
        message: "Make sure you select some transactions",
      });
    }
  }

  const onSuccess = () => {
    utils.transactions.getManyByAppointmentId.invalidate({
      appointmentId,
      includeCustomer: true,
    });
    utils.transactions.getManyByAppointmentId.invalidate({
      appointmentId: null,
      includeCustomer: false,
    });
  };

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Button>Manage</Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Transactions</Menu.Label>
        <Menu.Item
          onClick={() => {
            showNewTransactionDrawer({
              isOpen: true,
              orderId: null,
              appointmentId,
              customerId,
              onCreated: onSuccess,
            });
          }}
        >
          New Cash Transaction
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            showPickTransactionModal({
              isOpen: true,
              transactions: transactionOptions,
              onConfirmAction: onConfirmActionTransactions,
            });
          }}
        >
          Pick Transaction
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
