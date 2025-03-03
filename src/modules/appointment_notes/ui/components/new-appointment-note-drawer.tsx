"use client";

import { AppointmentNote } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { AppointmentNoteForm } from "@/modules/appointment_notes/ui/components/appointment-note-form";
import { trpc } from "@/trpc/client";
import { useAppointmentNoteDrawerStore } from "@/modules/appointment_notes/ui/appointment-note-drawer-store";

export const NewAppointmentNoteDrawer = () => {
  const isOpen = useAppointmentNoteDrawerStore((state) => state.isOpen);
  const appointmentId = useAppointmentNoteDrawerStore(
    (state) => state.appointmentId,
  );
  const appointmentNote = useAppointmentNoteDrawerStore((state) => state.note);
  const reset = useAppointmentNoteDrawerStore((state) => state.reset);
  const onCreated = useAppointmentNoteDrawerStore((state) => state.onCreated);

  const newAppointmentNote = trpc.appointmentNotes.create.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Appointment Note created.",
      });
      reset();
      onCreated?.();
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to create Appointment Note",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: AppointmentNote) {
    newAppointmentNote.mutate({ appointmentId, note: data });
  }

  function onDelete() {
    console.log("onDelete");
  }

  return (
    <Drawer
      opened={isOpen && onCreated !== undefined}
      onClose={() => reset()}
      position="right"
      title="Create Appointment Note"
    >
      <AppointmentNoteForm
        onSubmitAction={onSubmit}
        onDelete={onDelete}
        appointmentNote={appointmentNote}
      />
    </Drawer>
  );
};
