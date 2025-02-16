"use client";

import { Table, Paper, Button, Menu } from "@mantine/core";
import { Customer, Transaction } from "@/lib/schemas";
import { useSetAtom } from "jotai/index";
import {
  newTransactionDrawerAtom,
  transactionPickerModalAtom,
} from "@/lib/atoms";
import { linkTransactionsWithAppointment } from "@/data-access/transaction";
import { notifications } from "@mantine/notifications";

interface Props {
  personnel: Customer[];
  transactionOptions: Transaction[];
  orderId?: string | null;
  appointmentId: string;
}

export default function PersonnelTable({
  personnel,
  transactionOptions,
  orderId,
  appointmentId,
}: Props) {
  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);
  const showPickTransactionModal = useSetAtom(transactionPickerModalAtom);

  async function onConfirmActionTransactions(
    selectedRows: string[],
    customerId: string | null,
  ) {
    const response = await linkTransactionsWithAppointment(
      selectedRows,
      appointmentId,
      customerId,
    );

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to link Transactions",
        message: response.message,
      });
    } else {
      notifications.show({
        color: "green",
        title: "Success!",
        message: response.message,
      });
    }
  }

  const rows = personnel.map((customer) => (
    <Table.Tr
      key={customer.id}
      // onClick={() => {
      //   router.push(`/dashboard/customers/${customer.id}`);
      // }}
    >
      <Table.Td>{customer.name}</Table.Td>
      <Table.Td>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button>Manage</Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Transactions</Menu.Label>
            <Menu.Item
              onClick={() => {
                showNewTransactionDrawer({
                  isOpen: true,
                  orderId: orderId,
                  appointmentId: appointmentId,
                  customerId: customer.id,
                });
              }}
            >
              New Cash Transaction
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                showPickTransactionModal({
                  isOpen: true,
                  transactions: transactionOptions,
                  customerId: customer.id!,
                  onConfirmAction: onConfirmActionTransactions,
                });
              }}
            >
              Pick Transaction
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
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
