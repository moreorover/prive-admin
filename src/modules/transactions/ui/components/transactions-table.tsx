"use client";

import { Badge, Button, Table, Text } from "@mantine/core";
import { GetAllTransactions } from "@/modules/transactions/types";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { Trash2 } from "lucide-react";
import dayjs from "dayjs";

interface Props {
  transactions: GetAllTransactions;
  onUpdateAction: () => void;
}

export default function TransactionsTable({
  transactions,
  onUpdateAction,
}: Props) {
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
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () => deleteTransaction.mutate({ id: transactionId }),
    });

  // Generate table rows
  const rows = transactions.map((transaction) => {
    return [
      /* Main Transaction Row */
      <Table.Tr key={transaction.id}>
        <Table.Td>
          {dayjs(transaction.createdAt).format("DD MMM YYYY HH:mm")}
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
          <Text>{transaction.customer.name}</Text>
        </Table.Td>
        <Table.Td>
          <Button
            color="red"
            size="xs"
            onClick={() => openDeleteModal(transaction.id)}
          >
            <Trash2 size={14} />
          </Button>
        </Table.Td>
      </Table.Tr>,
    ];
  });

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Created At</Table.Th>
          <Table.Th>Transaction Name</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Amount</Table.Th>
          <Table.Th>Customer</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
