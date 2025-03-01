"use client";

import { ActionIcon, Button, Drawer, Group } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { useState } from "react";
import { Settings2 } from "lucide-react";

interface Props {
  start: Date;
  end: Date;
  onConfirm: (dateRange: { start: Date; end: Date }) => void;
}

const dateSchema = z.date({
  required_error: "Date is required",
  invalid_type_error: "Expected a valid Date",
});

const schema = z.object({
  dateRange: z.tuple([dateSchema, dateSchema]),
});

export const DateRangeDrawer = ({ start, end, onConfirm }: Props) => {
  const [open, setOpen] = useState(false);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: { dateRange: [start, end] },
    validate: zodResolver(schema),
  });

  async function handleSubmit(values: typeof form.values) {
    const [start, end] = values.dateRange;
    onConfirm({ start, end });
    setOpen(false);
  }

  const handleError = (errors: typeof form.errors) => {
    if (errors["dateRange.0"] || errors["dateRange.1"]) {
      notifications.show({
        message: "Please select full date range.",
        color: "yellow",
      });
    }
  };

  return (
    <>
      <ActionIcon
        variant="filled"
        aria-label="Date Settings"
        onClick={() => setOpen(true)}
      >
        <Settings2 size={16} />
      </ActionIcon>
      <Drawer
        opened={open}
        onClose={() => setOpen(false)}
        position="right"
        title="Change filters"
      >
        <form onSubmit={form.onSubmit(handleSubmit, handleError)}>
          <DatePicker
            key={form.key("dateRange")}
            {...form.getInputProps("dateRange")}
            type="range"
            allowSingleDateInRange={true}
          />
          <Group justify="flex-end" mt="md">
            <Button fullWidth mt="xl" type="submit">
              Confirm
            </Button>
          </Group>
        </form>
      </Drawer>
    </>
  );
};
