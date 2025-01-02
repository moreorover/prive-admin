"use client";

import { Table, Paper } from "@mantine/core";
import { Customer } from "@/lib/schemas";
import { useRouter } from "next/navigation";

interface Props {
  customers: Customer[];
}

export default function CustomersTable({ customers }: Props) {
  const router = useRouter();
  const rows = customers.map((customer) => (
    <Table.Tr
      key={customer.id}
      onClick={() => {
        router.push(`/dashboard/customers/${customer.id}`);
      }}
    >
      <Table.Td>{customer.id}</Table.Td>
      <Table.Td>{customer.name}</Table.Td>
    </Table.Tr>
  ));
  return (
    <Paper shadow="xs" p="sm">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}
