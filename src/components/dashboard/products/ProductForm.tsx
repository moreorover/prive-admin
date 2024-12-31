"use client";

import { useForm } from "@mantine/form";
import { IconTrash } from "@tabler/icons-react";
import { Product, productSchema, type ActionResponse } from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, Textarea, TextInput } from "@mantine/core";

type Props = {
  product: Product;
  onSubmitAction: (values: Product) => Promise<ActionResponse>;
  onDelete?: () => void;
};

export default function ProductForm({
  product,
  onSubmitAction,
  onDelete,
}: Props) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: product,
    validate: zodResolver(productSchema),
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
      <Textarea
        resize="vertical"
        placeholder="Product description..."
        key={form.key("description")}
        {...form.getInputProps("description")}
      />
      <Button fullWidth mt="xl" type="submit">
        {product.id ? "Update" : "Create"}
      </Button>
      {product.id && (
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
