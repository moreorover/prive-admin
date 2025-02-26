"use client";

import { Badge, Button, Menu, ScrollArea, Table, Text } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { GetTransactionAllocationsByAppointmentAndOrder } from "@/modules/appointments/types";
import Link from "next/link";
import { useSetAtom } from "jotai/index";
import { editTransactionAllocationDrawerAtom } from "@/lib/atoms";

interface Props {
  appointmentId: string;
  transactionAllocations: GetTransactionAllocationsByAppointmentAndOrder;
}

export default function TransactionsTable({
  appointmentId,
  transactionAllocations,
}: Props) {
  const utils = trpc.useUtils();

  const showEditTransactionAllocationDrawer = useSetAtom(
    editTransactionAllocationDrawerAtom,
  );

  const deleteTransaction = trpc.transactionAllocations.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transaction deleted.",
      });
      utils.transactionAllocations.getByAppointmentAndOrderId.invalidate({
        appointmentId,
        includeCustomer: true,
      });
      utils.transactions.getTransactionOptions.invalidate();
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

  const openDeleteModal = (transactionAllocationId: string) =>
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
          transactionAllocationId,
        }),
    });

  const rows = transactionAllocations.map((transactionAllocation) => (
    <Table.Tr key={transactionAllocation.id}>
      <Table.Td>
        <Text>{transactionAllocation.customer?.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{transactionAllocation.transaction.name}</Text>
      </Table.Td>
      <Table.Td>
        <Badge
          color={
            transactionAllocation.transaction.type === "CASH" ? "blue" : "green"
          }
          variant="light"
        >
          {transactionAllocation.transaction.type}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text>{formatAmount(transactionAllocation.amount)}</Text>
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
                showEditTransactionAllocationDrawer({
                  isOpen: true,
                  transactionAllocation,
                  maxAmount: transactionAllocation.remainingAllocation,
                  onUpdated: () => {
                    utils.transactionAllocations.getByAppointmentAndOrderId.invalidate(
                      {
                        appointmentId,
                        includeCustomer: true,
                      },
                    );
                    utils.transactions.getTransactionOptions.invalidate();
                  },
                });
              }}
            >
              Edit
            </Menu.Item>
            <Link href={`/dashboard/transactions/${transactionAllocation.id}`}>
              <Menu.Item>View</Menu.Item>
            </Link>
            <Link
              href={`/dashboard/transactions/${transactionAllocation.transaction.id}`}
            >
              <Menu.Item>View Parent Transaction</Menu.Item>
            </Link>
            <Menu.Item
              onClick={() => {
                openDeleteModal(transactionAllocation.id);
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
