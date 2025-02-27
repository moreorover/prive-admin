"use client";

import { useState } from "react";
import { ActionIcon, Badge, Button, Group, Table, Text } from "@mantine/core";
import { GetAllTransactionsWithAllocations } from "@/modules/transactions/types";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { ChevronRight, Trash2 } from "lucide-react";
import dayjs from "dayjs";

interface Props {
  transactions: GetAllTransactionsWithAllocations;
  onUpdateAction: () => void;
}

export default function TransactionsTable({
  transactions,
  onUpdateAction,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (transactionId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [transactionId]: !prev[transactionId],
    }));
  };

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
    const isExpanded = expanded[transaction.id];

    return [
      /* Main Transaction Row */
      <Table.Tr
        key={transaction.id}
        bg={transaction.remainingAmount !== 0 ? "pink.0" : "transparent"}
      >
        <Table.Td>
          <ActionIcon
            onClick={() => toggleExpand(transaction.id)}
            variant="transparent"
            style={{
              transition: "transform 0.2s ease-in-out",
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            <ChevronRight size={16} />
          </ActionIcon>
        </Table.Td>
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
          <Text>{formatAmount(transaction.allocatedAmount)}</Text>
        </Table.Td>
        <Table.Td>
          <Text>{formatAmount(transaction.remainingAmount)}</Text>
        </Table.Td>
        <Table.Td>
          {transaction.type === "CASH" && (
            <Button
              color="red"
              size="xs"
              onClick={() => openDeleteModal(transaction.id)}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </Table.Td>
      </Table.Tr>,

      /* Allocation Rows - Only Rendered if Expanded */
      ...(isExpanded
        ? transaction.allocations.map((allocation) => (
            <Table.Tr key={allocation.id} bg="gray.0">
              <Table.Td />
              <Table.Td>
                {dayjs(allocation.createdAt).format("DD MMM YYYY HH:mm")}
              </Table.Td>
              <Table.Td colSpan={3}>
                <Group>
                  <Text size="sm">Customer: {allocation.customer.name}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text>{formatAmount(allocation.amount)}</Text>
              </Table.Td>
              <Table.Td>
                {/*<Text>Customer ID: {allocation.customer.name}</Text>*/}
              </Table.Td>
              <Table.Td />
            </Table.Tr>
          ))
        : []),
    ];
  });

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th />
          <Table.Th>Created At</Table.Th>
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
