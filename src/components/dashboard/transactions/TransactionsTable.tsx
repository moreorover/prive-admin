"use client";

import { Table } from "@mantine/core";
import { Transaction } from "@/lib/schemas";
import { useRouter } from "next/navigation";

interface Props {
  transactions: Transaction[];
}

export default function TransactionsTable({ transactions }: Props) {
  const router = useRouter();
  const rows = transactions.map((transaction) => (
    <Table.Tr
      key={transaction.id}
      onClick={() => {
        router.push(`/dashboard/transactions/${transaction.id}`);
      }}
    >
      <Table.Td>{transaction.id}</Table.Td>
      <Table.Td>{transaction.name}</Table.Td>
      {/*<Table.Td>{transaction.description}</Table.Td>*/}
    </Table.Tr>
  ));
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>ID</Table.Th>
          <Table.Th>Name</Table.Th>
          {/*<Table.Th>Description</Table.Th>*/}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
