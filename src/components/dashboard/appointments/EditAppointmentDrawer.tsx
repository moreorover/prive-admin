"use client";

import AppointmentForm from "@/components/dashboard/appointments/AppointmentForm";
import { Appointment } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { updateAppointment } from "@/data-access/appointment";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editAppointmentDrawerAtom } from "@/lib/atoms";

export default function EditAppointmentDrawer() {
  const [value, setOpen] = useAtom(editAppointmentDrawerAtom);

  async function onSubmit(data: Appointment) {
    const response = await updateAppointment({
      ...data,
      id: value.appointment.id,
    });

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to update Appointment",
        message: "Please try again.",
      });
    } else {
      setOpen({ isOpen: false, appointment: { name: "" } });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Appointment updated.",
      });
    }
    return response;
  }

  function onDelete() {
    console.log("onDelete");
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() => setOpen({ isOpen: false, appointment: { name: "" } })}
      position="right"
      title="Update Appointment"
    >
      <AppointmentForm
        onSubmitAction={onSubmit}
        onDelete={onDelete}
        appointment={{ ...value.appointment }}
      />
    </Drawer>
  );
}
