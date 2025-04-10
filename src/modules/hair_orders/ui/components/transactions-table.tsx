"use client";

import {
  Badge,
  Button,
  Group,
  Menu,
  ScrollArea,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import Link from "next/link";
import { useSetAtom } from "jotai/index";
import { editTransactionDrawerAtom } from "@/lib/atoms";
import dayjs, { Dayjs } from "dayjs";
import { AlertTriangle, Check, Clock } from "lucide-react";
import { HairOrderTransactions } from "@/modules/hair_orders/types";

interface Props {
  hairOrderId: string;
  transactions: HairOrderTransactions;
}

export default function TransactionsTable({
  hairOrderId,
  transactions,
}: Props) {
  const utils = trpc.useUtils();

  const showEditTransactionDrawer = useSetAtom(editTransactionDrawerAtom);

  const recalculatePrices = trpc.hair.recalculatePrices.useMutation({
    onSuccess: () => {
      utils.hairOrders.getById.invalidate({ id: hairOrderId });
      utils.hair.getByHairOrderId.invalidate({ hairOrderId });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Prices recalculated.",
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed!",
        message: "Something went wrong recalculating prices.",
      });
    },
  });

  const deleteTransaction = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transaction deleted.",
      });
      utils.transactions.getByHairOrderId.invalidate({
        hairOrderId,
        includeCustomer: true,
      });
      recalculatePrices.mutate({ hairOrderId });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to delete transaction",
        message: "Please try again.",
      });
    },
  });

  const getStatusProps = (status: string) => {
    return status === "COMPLETED"
      ? { color: "green", icon: <Check size={14} /> }
      : { color: "pink", icon: <Clock size={14} /> };
  };

  const getCompletedDate = (date: string): Dayjs => dayjs(date);

  const isPastDue = (status: string, date: string): boolean => {
    return (
      status === "PENDING" && getCompletedDate(date).isBefore(dayjs(), "day")
    );
  };

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
        <Group gap={"sm"} align="center">
          <Badge
            color={getStatusProps(transaction.status).color}
            leftSection={getStatusProps(transaction.status).icon}
            radius="sm"
            size="sm"
            variant="light"
          >
            {transaction.status}
          </Badge>

          <Group gap={"sm"}>
            <Text
              size="xs"
              fw={500}
              c={
                isPastDue(
                  transaction.status,
                  transaction.completedDateBy.toString(),
                )
                  ? "red"
                  : "dimmed"
              }
            >
              {getCompletedDate(transaction.completedDateBy.toString()).format(
                "DD MMM YYYY",
              )}
            </Text>
            {isPastDue(
              transaction.status,
              transaction.completedDateBy.toString(),
            ) && (
              <Tooltip label="This pending transaction is overdue" withArrow>
                <AlertTriangle size={14} color="red" />
              </Tooltip>
            )}
          </Group>
        </Group>
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
                    utils.transactions.getByHairOrderId.invalidate({
                      hairOrderId,
                      includeCustomer: true,
                    });
                    recalculatePrices.mutate({ hairOrderId });
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
            <Table.Th>Completed At</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
