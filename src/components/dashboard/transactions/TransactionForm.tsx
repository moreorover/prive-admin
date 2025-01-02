"use client";

import { useForm } from "@mantine/form";
import {
  type ActionResponse,
  Transaction,
  transactionSchema,
} from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, NumberInput, Select, Switch, TextInput } from "@mantine/core";

type Props = {
  transaction: Transaction;
  onSubmitAction: (values: Transaction) => Promise<ActionResponse>;
};

export default function OrderItemForm({ transaction, onSubmitAction }: Props) {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: transaction,
    validate: zodResolver(transactionSchema),
  });

  async function handleSubmit(values: Transaction) {
    await onSubmitAction(values);
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Title"
        placeholder="Transaction Title"
        required
        key={form.key("name")}
        {...form.getInputProps("name")}
      />
      <Select
        label="Transaction Type"
        placeholder="Select type"
        data={["BANK", "CASH"]}
        key={form.key("type")}
        {...form.getInputProps("type")}
      />
      <Select
        label="Transaction Direction"
        placeholder="Select direction"
        data={["IN", "OUT"]}
        key={form.key("direction")}
        {...form.getInputProps("direction")}
      />
      <NumberInput
        label="Total"
        placeholder="0.99"
        prefix="£"
        key={form.key("total")}
        {...form.getInputProps("total")}
      />
      <Switch
        label="Add the total of the transaction to product cost?"
        key={form.key("isProductCost")}
        {...form.getInputProps("isProductCost")}
      />
      <Button fullWidth mt="xl" type="submit">
        {transaction.id ? "Update" : "Create"}
      </Button>
    </form>
  );
}
