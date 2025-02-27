"use client";

import { useForm } from "@mantine/form";
import { Product, productSchema } from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, Stack, Textarea, TextInput } from "@mantine/core";
import { Trash2 } from "lucide-react";

type Props = {
  product: Product;
  onSubmitAction: (values: Product) => void;
  onDelete?: () => void;
};

export const ProductForm = ({ product, onSubmitAction, onDelete }: Props) => {
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
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="Jon Doe"
          required
          key={form.key("name")}
          {...form.getInputProps("name")}
        />
        <Textarea
          label="Description"
          resize="vertical"
          placeholder="Product description..."
          key={form.key("description")}
          {...form.getInputProps("description")}
        />
        <Button fullWidth type="submit">
          {product.id ? "Update" : "Create"}
        </Button>
        {product.id && (
          <Button
            leftSection={<Trash2 />}
            fullWidth
            color="red"
            type="button"
            onClick={() => handleDelete()}
          >
            Delete
          </Button>
        )}
      </Stack>
    </form>
  );
};
