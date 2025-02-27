"use client";

import { useForm } from "@mantine/form";
import { Transaction, transactionSchema } from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import {
  Button,
  NumberInput,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core";

type Props = {
  transaction: Transaction;
  onSubmitAction: (values: Transaction) => void;
  disabled: boolean;
};

export const TransactionForm = ({
  transaction,
  onSubmitAction,
  disabled,
}: Props) => {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: transaction,
    validate: zodResolver(transactionSchema),
  });

  return (
    <form onSubmit={form.onSubmit(onSubmitAction)}>
      <TextInput
        label="Name"
        placeholder="Transaction Name"
        key={form.key("name")}
        {...form.getInputProps("name")}
      />
      <Textarea
        label="Notes"
        placeholder="Transaction Notes"
        key={form.key("notes")}
        {...form.getInputProps("notes")}
      />
      <Select
        label="Transaction Type"
        placeholder="Select type"
        data={["BANK", "CASH"]}
        key={form.key("type")}
        {...form.getInputProps("type")}
        disabled={transaction.type === "CASH"}
      />
      <NumberInput
        label="Amount"
        placeholder="0.99"
        prefix="£"
        key={form.key("amount")}
        {...form.getInputProps("amount")}
      />
      <Button disabled={disabled} fullWidth mt="xl" type="submit">
        {transaction.id ? "Update" : "Create"}
      </Button>
    </form>
  );
};
