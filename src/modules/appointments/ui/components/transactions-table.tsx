"use client";

import { Badge, Button, Menu, ScrollArea, Table, Text } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import Link from "next/link";
import { useSetAtom } from "jotai/index";
import { editTransactionDrawerAtom } from "@/lib/atoms";
import { GetTransactionsByAppointment } from "@/modules/transactions/types";

interface Props {
  appointmentId: string;
  transactions: GetTransactionsByAppointment;
}

export default function TransactionsTable({
  appointmentId,
  transactions,
}: Props) {
  const utils = trpc.useUtils();

  const showEditTransactionDrawer = useSetAtom(editTransactionDrawerAtom);

  const deleteTransaction = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transaction deleted.",
      });
      utils.transactions.getByAppointmentId.invalidate({
        appointmentId,
        includeCustomer: true,
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to delete transaction",
        message: "Please try again.",
      });
    },
  });

  // Helper to format the amount (assuming amount is stored in cents)
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-UK", {
      style: "currency",
      currency: "GBP",
    }).format(amount);

  const openDeleteModal = (transactionId: string) =>
    modals.openConfirmModal({
      title: "Delete Transaction?",
      centered: true,
      children: (
        <Text size="sm">Are you sure you want to delete this transaction?</Text>
      ),
      labels: { confirm: "Delete Transaction", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () =>
        deleteTransaction.mutate({
          id: transactionId,
        }),
    });

  const rows = transactions.map((transaction) => (
    <Table.Tr key={transaction.id}>
      <Table.Td>
        <Text>{transaction.customer.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{transaction.name}</Text>
      </Table.Td>
      <Table.Td>
        <Badge
          color={transaction.type === "CASH" ? "blue" : "green"}
          variant="light"
        >
          {transaction.type}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text>{formatAmount(transaction.amount)}</Text>
      </Table.Td>
      <Table.Td>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button>Manage</Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Transactions</Menu.Label>
            <Menu.Item
              onClick={() => {
                showEditTransactionDrawer({
                  isOpen: true,
                  transaction,
                  onUpdated: () => {
                    utils.transactions.getByAppointmentId.invalidate({
                      appointmentId,
                      includeCustomer: true,
                    });
                  },
                });
              }}
            >
              Edit
            </Menu.Item>
            <Link href={`/dashboard/transactions/${transaction.id}`}>
              <Menu.Item disabled>View</Menu.Item>
            </Link>
            <Menu.Item
              onClick={() => {
                openDeleteModal(transaction.id);
              }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Person Name</Table.Th>
            <Table.Th>Transaction Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
