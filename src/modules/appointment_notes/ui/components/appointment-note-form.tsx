"use client";

import { useForm } from "@mantine/form";
import { AppointmentNote, appointmentNoteSchema } from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, Textarea } from "@mantine/core";
import { Trash2 } from "lucide-react";

type Props = {
  appointmentNote: AppointmentNote;
  onSubmitAction: (values: AppointmentNote) => void;
  onDelete?: () => void;
};

export const AppointmentNoteForm = ({
  appointmentNote,
  onSubmitAction,
  onDelete,
}: Props) => {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: appointmentNote,
    validate: zodResolver(appointmentNoteSchema),
  });

  async function handleSubmit(values: typeof form.values) {
    await onSubmitAction(values);
  }

  function handleDelete() {
    if (!!onDelete) onDelete();
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Textarea
        label="Note"
        placeholder="Your appointment note"
        required
        key={form.key("note")}
        {...form.getInputProps("note")}
      />
      <Button fullWidth mt="xl" type="submit">
        {appointmentNote.id ? "Update" : "Create"}
      </Button>
      {appointmentNote.id && (
        <Button
          disabled
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
