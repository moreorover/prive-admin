"use client";

import { useForm } from "@mantine/form";
import { Appointment, appointmentSchema } from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, TextInput } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { Trash2 } from "lucide-react";

type Props = {
  appointment: Appointment;
  onSubmitAction: (values: Appointment) => void;
  onDelete?: () => void;
};

export const AppointmentForm = ({
  appointment,
  onSubmitAction,
  onDelete,
}: Props) => {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: appointment,
    validate: zodResolver(appointmentSchema),
  });

  async function handleSubmit(values: typeof form.values) {
    await onSubmitAction(values);
  }

  function handleDelete() {
    if (!!onDelete) onDelete();
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Name"
        placeholder="Consultation"
        required
        key={form.key("name")}
        {...form.getInputProps("name")}
      />
      <DateTimePicker
        label="Starts at"
        placeholder="Pick date and time"
        required
        key={form.key("startsAt")}
        {...form.getInputProps("startsAt")}
      />
      <Button fullWidth mt="xl" type="submit">
        {appointment.id ? "Update" : "Create"}
      </Button>
      {appointment.id && (
        <Button
          leftSection={<Trash2 />}
          fullWidth
          mt="xl"
          type="button"
          onClick={() => handleDelete()}
        >
          Delete
        </Button>
      )}
    </form>
  );
};
