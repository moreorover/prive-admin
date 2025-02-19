"use client";

import {
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useState } from "react";
import { GetPersonnelOptions } from "@/modules/appointments/types";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";

interface Props {
  appointmentId: string;
  personnelOptions: GetPersonnelOptions;
}

export const PersonnelPickerModal = ({
  appointmentId,
  personnelOptions,
}: Props) => {
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = personnelOptions.filter((p) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.id && p.id.toLowerCase() === searchLower)
    );
  });

  // Toggle selection for a given personnel ID
  const toggleRowSelection = (id: string) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id],
    );
  };

  const pickPersonnel =
    trpc.appointments.linkPersonnelWithAppointment.useMutation({
      onSuccess: () => {
        notifications.show({
          color: "green",
          title: "Success!",
          message: "Personnel picked.",
        });
        setIsOpen(false);
        utils.customers.getAvailablePersonnelByAppointmentId.invalidate({
          appointmentId,
        });
        utils.customers.getPersonnelByAppointmentId.invalidate({
          appointmentId,
        });
      },
      onError: () => {
        notifications.show({
          color: "red",
          title: "Failed to pick Transactions",
          message: "Please try again.",
        });
      },
    });

  function onConfirmActionPersonnel(selectedRows: string[]) {
    pickPersonnel.mutate({
      personnel: selectedRows,
      appointmentId,
    });
  }

  const rows = filteredTransactions.map((client) => (
    <Table.Tr
      key={client.id}
      style={{
        backgroundColor: selectedRows.includes(client.id as string)
          ? "var(--mantine-color-blue-light)"
          : undefined,
        cursor: "pointer",
      }}
      onClick={() => toggleRowSelection(client.id as string)}
    >
      <Table.Td style={{ width: 40 }}>
        <Checkbox
          aria-label="Select personnel"
          checked={selectedRows.includes(client.id as string)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleRowSelection(client.id as string)}
        />
      </Table.Td>
      <Table.Td>
        <Text>{client.name}</Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Pick
      </Button>
      <Modal
        opened={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSelectedRows([]);
          setSearchTerm("");
        }}
        title="Pick personnel"
        size="lg"
      >
        <Paper shadow="sm" radius="md" withBorder p="md">
          {/* Search field with bottom margin for spacing */}
          <TextInput
            size="sm"
            radius="sm"
            label="Search"
            description="Search by personnel name"
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
                onConfirmActionPersonnel(selectedRows);
                setSelectedRows([]);
                setSearchTerm("");
              }}
            >
              Confirm
            </Button>
          </Group>
        </Paper>
      </Modal>
    </>
  );
};
