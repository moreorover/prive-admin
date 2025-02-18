"use client";

import {
  Table,
  Text,
  Badge,
  ScrollArea,
  Paper,
  Menu,
  Button,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { Transaction } from "@/lib/schemas";

interface Props {
  appointmentId: string;
}

export default function TransactionsTable({ appointmentId }: Props) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [transactions] =
    trpc.transactions.getManyByAppointmentId.useSuspenseQuery({
      appointmentId,
      includeCustomer: true,
    });

  const unassignTransaction = trpc.transactions.setAppointmentId.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transaction unassigned.",
      });
      utils.transactions.getManyByAppointmentId.invalidate({
        appointmentId,
        includeCustomer: true,
      });
      utils.transactions.getManyByAppointmentId.invalidate({
        appointmentId: null,
        includeCustomer: false,
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
      title: "Unassign Transaction from this Appointment?",
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
        unassignTransaction.mutate({
          transactionId: transaction.id!,
          appointmentId: null,
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
            <Menu.Item
              onClick={() =>
                router.push(`/dashboard/transactions/${transaction.id}`)
              }
            >
              View
            </Menu.Item>
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
      <Paper shadow="sm" radius="md" withBorder>
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
      </Paper>
    </ScrollArea>
  );
}
