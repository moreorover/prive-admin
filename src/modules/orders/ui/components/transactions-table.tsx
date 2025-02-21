"use client";

import { Badge, Button, Menu, ScrollArea, Table, Text } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { Transaction } from "@/lib/schemas";
import Link from "next/link";
import { GetOrderTransactions } from "@/modules/orders/types";

interface Props {
  transactions: GetOrderTransactions;
  onUpdateAction: () => void;
}

export default function TransactionsTable({
  transactions,
  onUpdateAction,
}: Props) {
  const updateTransaction = trpc.transactions.update.useMutation({
    onSuccess: () => {
      onUpdateAction();
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transaction unassigned.",
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to unassign transaction",
        message: "Please try again.",
      });
    },
  });

  // Helper to format the amount (assuming amount is stored in cents)
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-UK", {
      style: "currency",
      currency: "GBP",
    }).format(amount / 100);

  const openDeleteModal = (transaction: Transaction) =>
    modals.openConfirmModal({
      title: "Unassign Transaction from this Order?",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to unassign this transaction?
        </Text>
      ),
      labels: { confirm: "Unassign Transactions", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () =>
        updateTransaction.mutate({
          transaction: { ...transaction, orderId: null },
        }),
    });

  const rows = transactions.map((transaction) => (
    <Table.Tr key={transaction.id}>
      <Table.Td>
        <Text>{transaction.customer?.name}</Text>
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
            <Link href={`/dashboard/transactions/${transaction.id}`}>
              <Menu.Item>View</Menu.Item>
            </Link>
            <Menu.Item
              onClick={() => {
                openDeleteModal(transaction);
              }}
            >
              Unassign
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
