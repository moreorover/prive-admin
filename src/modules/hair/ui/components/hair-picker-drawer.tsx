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
import { GetAllHairOptions } from "@/modules/hair/types";
import { useDisclosure } from "@mantine/hooks";

interface Props<T extends boolean> {
  hair: GetAllHairOptions;
  onSubmit: T extends true
    ? (hairId: string[]) => void
    : (hairId: string) => void;
  multiple: T;
}

export const HairPickerDrawer = <T extends boolean>({
  hair,
  onSubmit,
  multiple,
}: Props<T>) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHair = hair.filter((h) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (h.color && h.color.toLowerCase().includes(searchLower)) ||
      (h.description && h.description.toLowerCase().includes(searchLower)) ||
      (h.upc && h.upc.toLowerCase().includes(searchLower)) ||
      (h.id && h.id.toLowerCase() === searchLower)
    );
  });

  const toggleRowSelection = (id: string) => {
    if (multiple) {
      setSelectedRows((prevSelected) =>
        prevSelected.includes(id)
          ? prevSelected.filter((selectedId) => selectedId !== id)
          : [...prevSelected, id],
      );
    } else {
      setSelectedRow(id);
    }
  };

  function onConfirmActionPersonnel() {
    if (multiple && selectedRows.length > 0) {
      (onSubmit as (hairId: string[]) => void)(selectedRows);
    } else if (!multiple && selectedRow) {
      (onSubmit as (hairId: string) => void)(selectedRow);
    }
    close();
  }

  const rows = filteredHair.map((hair) => (
    <Table.Tr
      key={hair.id}
      style={{
        backgroundColor: selectedRows.includes(hair.id as string)
          ? "var(--mantine-color-blue-light)"
          : undefined,
        cursor: "pointer",
      }}
      onClick={() => toggleRowSelection(hair.id as string)}
    >
      <Table.Td style={{ width: 40 }}>
        <Checkbox
          aria-label="Select hair"
          checked={
            selectedRows.includes(hair.id as string) || selectedRow === hair.id
          }
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleRowSelection(hair.id as string)}
        />
      </Table.Td>
      <Table.Td>
        <Text>{hair.color}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{hair.upc}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{hair.weight} (g)</Text>
      </Table.Td>
      <Table.Td>
        <Text>{hair.length} (cm)</Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Button onClick={open}>Pick</Button>
      <Modal
        opened={opened}
        onClose={() => {
          close();
          setSelectedRows([]);
          setSelectedRow(null);
          setSearchTerm("");
        }}
        title="Pick hair"
        size="lg"
      >
        <Paper shadow="sm" radius="md" withBorder p="md">
          <TextInput
            size="sm"
            radius="sm"
            label="Search"
            description="Search by hair name"
            placeholder="Search..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            mb="md"
          />

          <ScrollArea style={{ height: 300 }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 40 }} />
                  <Table.Th>Color</Table.Th>
                  <Table.Th>UPC</Table.Th>
                  <Table.Th>Weight</Table.Th>
                  <Table.Th>Length</Table.Th>
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

          <Group justify="flex-end" mt="md">
            <Button
              disabled={!selectedRows.length && !selectedRow}
              onClick={() => {
                onConfirmActionPersonnel();
                setSelectedRows([]);
                setSelectedRow(null);
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
