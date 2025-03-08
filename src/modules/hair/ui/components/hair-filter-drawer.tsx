"use client";

import {
  Button,
  Drawer,
  Group,
  Menu,
  NumberInput,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const schema = z.object({
  color: z.string().nullish(),
  description: z.string().nullish(),
  upc: z.string().nullish(),
  weight: z
    .union([z.string(), z.number()])
    .transform((val) => (val === "" ? undefined : Number(val)))
    .optional(),
  length: z
    .union([z.string(), z.number()])
    .transform((val) => (val === "" ? undefined : Number(val)))
    .optional(),
});

interface Props {
  filters: {
    color?: string;
    description?: string;
    upc?: string;
    length?: number;
    weight?: number;
  };
  label: string;
  onSelected: (filters: {
    color?: string;
    description?: string;
    upc?: string;
    length?: number;
    weight?: number;
  }) => void;
}

export const HairFilterDrawer = ({ filters, label, onSelected }: Props) => {
  const [open, setOpen] = useState(false);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: filters,
    validate: zodResolver(schema),
  });

  async function handleSubmit(values: typeof form.values) {
    const formattedValues = {
      ...values,
      color: values.color?.toLowerCase() || undefined,
      description: values.description?.toLowerCase() || undefined,
      upc: values.upc?.toLowerCase() || undefined,
    };
    onSelected(formattedValues);
    setOpen(false);
  }

  return (
    <>
      <Menu shadow="md" width={120}>
        <Menu.Target>
          <Button variant="subtle" rightSection={<ChevronDown size={14} />}>
            {label}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item onClick={() => setOpen(true)}>Select</Menu.Item>
          <Menu.Item
            onClick={() => {
              onSelected({});
              form.setValues({
                color: undefined,
                description: undefined,
                upc: undefined,
                length: undefined,
                weight: undefined,
              });
            }}
          >
            Reset
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <Drawer
        opened={open}
        onClose={() => setOpen(false)}
        position="right"
        title="Change filters"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Color"
            placeholder="red"
            key={form.key("color")}
            {...form.getInputProps("color")}
          />
          <TextInput
            label="Description"
            placeholder=""
            key={form.key("description")}
            {...form.getInputProps("description")}
          />
          <TextInput
            label="UPC"
            placeholder=""
            key={form.key("upc")}
            {...form.getInputProps("upc")}
          />
          <NumberInput
            label="Weight"
            placeholder="110"
            allowDecimal={false}
            key={form.key("weight")}
            {...form.getInputProps("weight")}
          />
          <NumberInput
            label="Length"
            placeholder="50"
            allowDecimal={false}
            key={form.key("length")}
            {...form.getInputProps("length")}
          />
          <Group justify="flex-end" mt="md">
            <Button fullWidth mt="xl" type="submit">
              Confirm
            </Button>
          </Group>
        </form>
      </Drawer>
    </>
  );
};
