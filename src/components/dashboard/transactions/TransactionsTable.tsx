"use client";

import { Table, Text, Group, Badge, ScrollArea, Paper } from "@mantine/core";
import { Transaction } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";

interface Props {
  transactions: Transaction[];
}

export default function TransactionsTable({ transactions }: Props) {
  const router = useRouter();

  // Helper to format the amount (assuming amount is stored in cents)
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-UK", {
      style: "currency",
      currency: "GBP",
    }).format(amount / 100);

  const rows = transactions.map((transaction) => (
    <Table.Tr key={transaction.id}>
      <Table.Td>
        <Group gap="sm">
          <Text>{transaction.name || "No Name"}</Text>
          <Badge
            color={transaction.type === "BANK" ? "blue" : "green"}
            variant="light"
          >
            {transaction.type}
          </Badge>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text>{formatAmount(transaction.amount)}</Text>
      </Table.Td>
      <Table.Td
        onClick={() => router.push(`/dashboard/transactions/${transaction.id}`)}
      >
        <IconArrowRight size={16} />
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea>
      <Paper shadow="sm" radius="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name / Type</Table.Th>
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
