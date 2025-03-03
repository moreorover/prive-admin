"use client";

import { Button, Menu, ScrollArea, Table, Text } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { GetAppointmentNotes } from "@/modules/appointments/types";
import dayjs from "dayjs";
import { useAppointmentNoteDrawerStore } from "@/modules/appointment_notes/ui/appointment-note-drawer-store";

interface Props {
  appointmentId: string;
  notes: GetAppointmentNotes;
}

export default function AppointmentNotesTable({ appointmentId, notes }: Props) {
  const utils = trpc.useUtils();

  const openDrawer = useAppointmentNoteDrawerStore((state) => state.openDrawer);

  const deleteAppointmentNote = trpc.appointmentNotes.delete.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Appointment Note deleted.",
      });
      utils.appointmentNotes.getNotesByAppointmentId.invalidate({
        appointmentId,
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to delete appointmentNote",
        message: "Please try again.",
      });
    },
  });

  const openDeleteModal = (appointmentNoteId: string) =>
    modals.openConfirmModal({
      title: "Delete Appointment Note?",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this Appointment Note?
        </Text>
      ),
      labels: { confirm: "Delete Appointment Note", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () =>
        deleteAppointmentNote.mutate({
          noteId: appointmentNoteId,
        }),
    });

  const rows = notes.map((appointmentNote) => (
    <Table.Tr key={appointmentNote.id}>
      <Table.Td>
        <Text>
          {dayjs(appointmentNote.createdAt).format("DD MMM YYYY HH:mm")}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text>{appointmentNote.note}</Text>
      </Table.Td>
      <Table.Td>
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button>Manage</Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Appointment Notes</Menu.Label>
            <Menu.Item
              onClick={() => {
                openDrawer({
                  isOpen: true,
                  note: appointmentNote,
                  onUpdated: () => {
                    utils.appointmentNotes.getNotesByAppointmentId.invalidate({
                      appointmentId,
                    });
                  },
                });
              }}
            >
              Edit
            </Menu.Item>
            <Menu.Item
              onClick={() => {
                openDeleteModal(appointmentNote.id);
              }}
            >
              Delete
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Created At</Table.Th>
            <Table.Th>Note</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
