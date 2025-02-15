"use client";

import { Table, Paper, Button } from "@mantine/core";
import { Customer } from "@/lib/schemas";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai/index";
import { newTransactionDrawerAtom } from "@/lib/atoms";

interface Props {
  personnel: Customer[];
  appointmentId: string;
}

export default function PersonnelTable({ personnel, appointmentId }: Props) {
  const router = useRouter();
  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);
  const rows = personnel.map((customer) => (
    <Table.Tr
      key={customer.id}
      // onClick={() => {
      //   router.push(`/dashboard/customers/${customer.id}`);
      // }}
    >
      <Table.Td>{customer.name}</Table.Td>
      <Table.Td>
        <Button
          onClick={() => {
            showNewTransactionDrawer({
              isOpen: true,
              appointmentId,
            });
          }}
        >
          New Transaction
        </Button>
      </Table.Td>
    </Table.Tr>
  ));
  return (
    <Paper shadow="xs" p="sm">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}
