"use client";

import { Table, Paper } from "@mantine/core";
import { Customer } from "@/lib/schemas";
// import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai/index";
import { editCustomerDrawerAtom } from "@/lib/atoms";

interface Props {
  customers: Customer[];
}

export default function CustomersTable({ customers }: Props) {
  const showNewCustomerDrawer = useSetAtom(editCustomerDrawerAtom);
  // const router = useRouter();
  const rows = customers.map((customer) => (
    <Table.Tr
      key={customer.id}
      onClick={() => {
        showNewCustomerDrawer({ isOpen: true, customer: customer });
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
