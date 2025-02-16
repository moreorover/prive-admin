"use client";

import AppointmentForm from "@/components/dashboard/appointments/AppointmentForm";
import { Appointment } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { createAppointment } from "@/data-access/appointment";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { newAppointmentDrawerAtom } from "@/lib/atoms";
import dayjs from "dayjs";

export default function NewAppointmentDrawer() {
  const [value, setOpen] = useAtom(newAppointmentDrawerAtom);

  async function onSubmit(data: Appointment) {
    const response = await createAppointment(data, value.clientId);

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to create Appointment",
        message: response.message,
      });
    } else {
      setOpen({ isOpen: false, clientId: "" });
      notifications.show({
        color: "green",
        title: "Success!",
        message: response.message,
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
      onClose={() => setOpen({ isOpen: false, clientId: "" })}
      position="right"
      title="Create Appointment"
    >
      <AppointmentForm
        onSubmitAction={onSubmit}
        onDelete={onDelete}
        appointment={{ name: "", notes: "", startsAt: dayjs().toDate() }}
      />
    </Drawer>
  );
}
