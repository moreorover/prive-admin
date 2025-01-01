"use client";

import { useForm } from "@mantine/form";
import {
  ProductVariant,
  productVariantSchema,
  type ActionResponse,
} from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, Stack, NumberInput, TextInput } from "@mantine/core";

type Props = {
  productVariant: ProductVariant;
  onSubmitAction: (values: ProductVariant) => Promise<ActionResponse>;
  onDelete?: () => void;
};

export default function ProductVariantForm({
  productVariant,
  onSubmitAction,
}: Props) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: productVariant,
    validate: zodResolver(productVariantSchema),
  });

  async function handleSubmit(values: typeof form.values) {
    await onSubmitAction(values);
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <TextInput
          label="Size"
          placeholder="250ml"
          required
          key={form.key("size")}
          {...form.getInputProps("size")}
        />
        <NumberInput
          label="Recommended Price (RRP)"
          placeholder="0.99"
          prefix="£"
          defaultValue={0}
          mb="md"
          key={form.key("price")}
          {...form.getInputProps("price")}
        />
        <Button fullWidth type="submit">
          {productVariant.id ? "Update" : "Create"}
        </Button>
      </Stack>
    </form>
  );
}
