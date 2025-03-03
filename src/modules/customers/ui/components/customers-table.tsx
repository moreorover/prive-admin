"use client";

import { Button, Table } from "@mantine/core";
import { GetAllCustomers } from "@/modules/customers/types";
import Link from "next/link";

interface Props {
  customers: GetAllCustomers;
}

export function CustomersTable({ customers }: Props) {
  const rows = customers.map((customer) => (
    <Table.Tr key={customer.id}>
      <Table.Td>{customer.name}</Table.Td>
      <Table.Td>{customer.phoneNumber}</Table.Td>
      <Table.Td>
        <Button component={Link} href={`/dashboard/customers/${customer.id}`}>
          View
        </Button>
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Phone Number</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
