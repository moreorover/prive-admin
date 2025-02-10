"use client";

import {
  Table,
  Text,
  Badge,
  ScrollArea,
  Paper,
  Modal,
  Checkbox,
  TextInput,
} from "@mantine/core";
import { Transaction } from "@/lib/schemas";
import { useAtom } from "jotai/index";
import { transactionPickerModalAtom } from "@/lib/atoms";
import { useState } from "react";

interface Props {
  transactions: Transaction[];
  onConfirm: () => void;
}

export default function TransactionPickerModal({ transactions }: Props) {
  const [value, setOpen] = useAtom(transactionPickerModalAtom);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  // Helper to format the amount (assuming amount is stored in cents)
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-UK", {
      style: "currency",
      currency: "GBP",
    }).format(amount / 100);

  const rows = filteredTransactions.map((transaction) => (
    <Table.Tr
      key={transaction.id}
      bg={
        selectedRows.includes(transaction.id as string)
          ? "var(--mantine-color-blue-light)"
          : undefined
      }
    >
      <Table.Td>
        <Checkbox
          aria-label="Select transaction"
          checked={selectedRows.includes(transaction.id as string)}
          onChange={(event) =>
            setSelectedRows(
              event.currentTarget.checked
                ? [...selectedRows, transaction.id as string]
                : selectedRows.filter(
                    (position) => position !== transaction.id,
                  ),
            )
          }
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
    <Modal
      opened={value.isOpen}
      onClose={() => setOpen({ isOpen: false })}
      title="Pick a transaction"
    >
      <ScrollArea>
        <Paper shadow="sm" radius="md" withBorder>
          <TextInput
            size="xs"
            radius="xs"
            label="Search"
            description="Search by anything"
            placeholder="Search by anything"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
          />
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            {rows.length > 0 ? (
              <Table.Tbody>{rows}</Table.Tbody>
            ) : (
              "No match found..."
            )}
          </Table>
        </Paper>
      </ScrollArea>
    </Modal>
  );
}
