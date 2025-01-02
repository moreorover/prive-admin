"use client";

import { useForm } from "@mantine/form";
import { orderItemSchema, type ActionResponse, OrderItem } from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, NumberInput, Select } from "@mantine/core";

type Props = {
  orderItem: OrderItem;
  productOptions: { value: string; label: string }[];
  onSubmitAction: (values: OrderItem) => Promise<ActionResponse>;
  isItemSelectDisabled?: boolean;
};

export default function OrderItemForm({
  orderItem,
  productOptions,
  onSubmitAction,
  isItemSelectDisabled = false,
}: Props) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: orderItem,
    validate: zodResolver(orderItemSchema),
  });

  async function handleSubmit(values: OrderItem) {
    await onSubmitAction(values);
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Select
        label="Product"
        placeholder="Product variant"
        disabled={isItemSelectDisabled}
        searchable
        limit={5}
        data={productOptions}
        key={form.key("productVariantId")}
        {...form.getInputProps("productVariantId")}
      />
      <NumberInput
        label="Quantity"
        placeholder="Quantity"
        min={1}
        key={form.key("quantity")}
        {...form.getInputProps("quantity")}
      />
      <NumberInput
        label="Price per Unit"
        placeholder="0.99"
        prefix="£"
        key={form.key("unitPrice")}
        {...form.getInputProps("unitPrice")}
      />
      <Button fullWidth mt="xl" type="submit">
        {orderItem.id ? "Update" : "Create"}
      </Button>
    </form>
  );
}
