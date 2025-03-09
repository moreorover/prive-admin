"use client";

import { useForm } from "@mantine/form";
import { Hair, hairSchema } from "@/lib/schemas";
import { zodResolver } from "mantine-form-zod-resolver";
import { Button, NumberInput, Textarea, TextInput } from "@mantine/core";

type Props = {
  hair: Hair;
  onSubmitAction: (values: Hair) => void;
  disabled: boolean;
};

export const HairForm = ({ hair, onSubmitAction, disabled }: Props) => {
  const form = useForm({
    mode: "uncontrolled",
    initialValues: hair,
    validate: zodResolver(hairSchema),
  });

  return (
    <form onSubmit={form.onSubmit(onSubmitAction)}>
      <TextInput
        label="Color"
        placeholder="Red"
        key={form.key("color")}
        {...form.getInputProps("color")}
      />
      <TextInput
        label="UPC"
        placeholder="347631"
        key={form.key("upc")}
        {...form.getInputProps("upc")}
      />
      <Textarea
        label="Description"
        key={form.key("description")}
        {...form.getInputProps("description")}
      />
      <NumberInput
        label="Length"
        placeholder="60"
        suffix="cm"
        key={form.key("length")}
        {...form.getInputProps("length")}
      />
      <NumberInput
        label="Weight"
        placeholder="150"
        suffix="g"
        key={form.key("weight")}
        {...form.getInputProps("weight")}
      />
      <Button disabled={disabled} fullWidth mt="xl" type="submit">
        {hair.id ? "Update" : "Create"}
      </Button>
    </form>
  );
};
