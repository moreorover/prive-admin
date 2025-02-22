"use client";

import {
  Badge,
  Button,
  Checkbox,
  Group,
  ScrollArea,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useState } from "react";
import { GetTransactionOptions } from "@/modules/appointments/types";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { ContextModalProps } from "@mantine/modals";

export const TransactionPickerModal = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{
  appointmentId: string | null | undefined;
  customerId: string;
  orderId: string | null | undefined;
  transactionOptions: GetTransactionOptions;
  onPicked: () => void;
}>) => {
  const utils = trpc.useUtils();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = innerProps.transactionOptions.filter(
    (transaction) => {
      const searchLower = searchTerm.toLowerCase();

      return (
        (transaction.name &&
          transaction.name.toLowerCase().includes(searchLower)) ||
        (transaction.type &&
          transaction.type.toLowerCase().includes(searchLower)) ||
        String(transaction.amount / 100)
          .toLowerCase()
          .includes(searchLower) ||
        (transaction.id && transaction.id.toLowerCase() === searchLower)
      );
    },
  );

  // Helper to format the amount (assuming amount is stored in cents)
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-UK", {
      style: "currency",
      currency: "GBP",
    }).format(amount / 100);

  // Toggle selection for a given transaction ID
  const toggleRowSelection = (id: string) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id],
    );
  };

  const pickTransactions = trpc.transactions.assignTransactions.useMutation({
    onSuccess: () => {
      innerProps.onPicked();
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transactions picked.",
      });
      context.closeModal(id);
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to pick Transactions",
        message: "Please try again.",
      });
    },
  });

  function onConfirmAction(selectedRows: string[]) {
    if (selectedRows.length > 0) {
      pickTransactions.mutate({
        transactions: selectedRows,
        appointmentId: innerProps.appointmentId,
        orderId: innerProps.orderId,
        customerId: innerProps.customerId,
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
      appointmentId: innerProps.appointmentId,
      includeCustomer: true,
    });
    utils.transactions.getManyByAppointmentId.invalidate({
      appointmentId: null,
      includeCustomer: false,
    });
  };

  const rows = filteredTransactions.map((transaction) => (
    <Table.Tr
      key={transaction.id}
      style={{
        backgroundColor: selectedRows.includes(transaction.id as string)
          ? "var(--mantine-color-blue-light)"
          : undefined,
        cursor: "pointer",
      }}
      onClick={() => toggleRowSelection(transaction.id as string)}
    >
      <Table.Td style={{ width: 40 }}>
        <Checkbox
          aria-label="Select transaction"
          checked={selectedRows.includes(transaction.id as string)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleRowSelection(transaction.id as string)}
        />
      </Table.Td>
      <Table.Td>
        <Text>{transaction.name}</Text>
      </Table.Td>
      <Table.Td>
        <Badge
          color={transaction.type === "BANK" ? "blue" : "green"}
          variant="light"
        >
          {transaction.type}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text>{formatAmount(transaction.amount)}</Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <TextInput
        size="sm"
        radius="sm"
        label="Search"
        description="Search by transaction name"
        placeholder="Search..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.currentTarget.value)}
        mb="md"
      />

      {/* Wrap only the table in the ScrollArea with a fixed height */}
      <ScrollArea style={{ height: 300 }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 40 }} />
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Amount</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length > 0 ? (
              rows
            ) : (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text>No match found...</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {/* Confirm button always visible outside of the ScrollArea */}
      <Group justify="flex-end" mt="md">
        <Button
          onClick={() => {
            onConfirmAction(selectedRows);
            setSelectedRows([]);
            setSearchTerm("");
          }}
        >
          Confirm
        </Button>
      </Group>
    </>
  );
};
