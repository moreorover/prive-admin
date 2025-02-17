"use client";

import { Table, Text, Badge, ScrollArea, Paper } from "@mantine/core";
import { useRouter } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";
import { trpc } from "@/trpc/client";

interface Props {
  appointmentId: string;
}

export default function TransactionsTable({ appointmentId }: Props) {
  const router = useRouter();

  const [transactions] =
    trpc.transactions.getManyByAppointmentId.useSuspenseQuery({
      appointmentId,
      includeCustomer: true,
    });

  // Helper to format the amount (assuming amount is stored in cents)
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-UK", {
      style: "currency",
      currency: "GBP",
    }).format(amount / 100);

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
