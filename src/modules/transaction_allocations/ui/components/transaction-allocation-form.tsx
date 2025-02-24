"use client";

import { useForm } from "@mantine/form";
import {
  TransactionAllocation,
  transactionAllocationFormSchema,
} from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, NumberInput } from "@mantine/core";

type Props = {
  transactionAllocation: TransactionAllocation;
  onSubmitAction: (values: TransactionAllocation) => void;
  disabled: boolean;
  maxAmount: number;
};

export const TransactionAllocationForm = ({
  transactionAllocation,
  onSubmitAction,
  disabled,
  maxAmount,
}: Props) => {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: transactionAllocation,
    validate: zodResolver(transactionAllocationFormSchema(maxAmount)),
    validateInputOnChange: true,
  });

  return (
    <form onSubmit={form.onSubmit(onSubmitAction)}>
      {/*<TextInput*/}
      {/*  label="Name"*/}
      {/*  placeholder="Transaction Name"*/}
      {/*  key={form.key("name")}*/}
      {/*  {...form.getInputProps("name")}*/}
      {/*/>*/}
      {/*<Textarea*/}
      {/*  label="Notes"*/}
      {/*  placeholder="Transaction Notes"*/}
      {/*  key={form.key("notes")}*/}
      {/*  {...form.getInputProps("notes")}*/}
      {/*/>*/}
      <NumberInput
        label="Amount"
        placeholder="0.99"
        prefix="£"
        key={form.key("amount")}
        {...form.getInputProps("amount")}
      />
      <Button disabled={disabled} fullWidth mt="xl" type="submit">
        {transactionAllocation.id ? "Update" : "Create"}
      </Button>
    </form>
  );
};
