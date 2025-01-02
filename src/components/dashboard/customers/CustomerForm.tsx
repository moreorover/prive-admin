"use client";

import { useForm } from "@mantine/form";
import { IconTrash } from "@tabler/icons-react";
import { Customer, customerSchema, type ActionResponse } from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, TextInput } from "@mantine/core";

type Props = {
  customer: Customer;
  onSubmitAction: (values: Customer) => Promise<ActionResponse>;
  onDelete?: () => void;
};

export default function CustomerForm({
  customer,
  onSubmitAction,
  onDelete,
}: Props) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: customer,
    validate: zodResolver(customerSchema),
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
        placeholder="Jon Doe"
        required
        key={form.key("name")}
        {...form.getInputProps("name")}
      />
      <Button fullWidth mt="xl" type="submit">
        {customer.id ? "Update" : "Create"}
      </Button>
      {customer.id && (
        <Button
          leftSection={<IconTrash />}
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
}
