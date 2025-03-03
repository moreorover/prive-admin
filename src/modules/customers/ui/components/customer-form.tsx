"use client";

import { useForm } from "@mantine/form";
import { Customer, customerSchema } from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, TextInput } from "@mantine/core";
import { Trash2 } from "lucide-react";

type Props = {
  customer: Customer;
  onSubmitAction: (values: Customer) => void;
  onDelete?: () => void;
};

export const CustomerForm = ({ customer, onSubmitAction, onDelete }: Props) => {
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
      <TextInput
        label="Phone Number"
        placeholder="+44..."
        key={form.key("phoneNumber")}
        {...form.getInputProps("phoneNumber")}
      />
      <Button fullWidth mt="xl" type="submit">
        {customer.id ? "Update" : "Create"}
      </Button>
      {customer.id && (
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
