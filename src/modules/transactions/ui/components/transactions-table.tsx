"use client";

import { Badge, Button, Table, Text } from "@mantine/core";
import { GetAllTransactionsWithAllocations } from "@/modules/transactions/types";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";

interface Props {
  transactions: GetAllTransactionsWithAllocations;
  onUpdateAction: () => void;
}

export default function TransactionsTable({
  transactions,
  onUpdateAction,
}: Props) {
  // Helper to format the amount (assuming amount is stored in cents)
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-UK", {
      style: "currency",
      currency: "GBP",
    }).format(amount);

  const deleteTransaction = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      onUpdateAction();
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transaction deleted.",
      });
    },
    onError: (e) => {
      notifications.show({
        color: "red",
        title: "Failed to delete transaction",
        message: e.message,
      });
    },
  });

  const openDeleteModal = (transactionId: string) =>
    modals.openConfirmModal({
      title: "Delete Transaction?",
      centered: true,
      children: (
        <Text size="sm">Are you sure you want to delete this transaction?</Text>
      ),
      labels: { confirm: "Delete Transactions", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () =>
        deleteTransaction.mutate({
          id: transactionId,
        }),
    });

  const rows = transactions.map((transaction) => (
    <Table.Tr
      key={transaction.id}
      bg={transaction.remainingAmount !== 0 ? "pink.0" : "transparent"}
    >
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
        <Text>{formatAmount(transaction.allocatedAmount)}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{formatAmount(transaction.remainingAmount)}</Text>
      </Table.Td>
      <Table.Td>
        {transaction.type === "CASH" && (
          <Button onClick={() => openDeleteModal(transaction.id)}>
            Delete
          </Button>
        )}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover stickyHeader stickyHeaderOffset={60}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Transaction Name</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Amount</Table.Th>
          <Table.Th>Allocated</Table.Th>
          <Table.Th>Remaining</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
