"use client";

import { Button, Drawer, NumberInput } from "@mantine/core";
import { useHairComponentDrawerStore } from "@/modules/hair/ui/hair-component-drawer-store";
import { notifications } from "@mantine/notifications";
import { trpc } from "@/trpc/client";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { z } from "zod";

export const EditHairComponentDrawer = () => {
  const isOpen = useHairComponentDrawerStore((state) => state.isOpen);
  const component = useHairComponentDrawerStore((state) => state.hairComponent);
  const maxWeight = useHairComponentDrawerStore((state) => state.maxWeight);
  const reset = useHairComponentDrawerStore((state) => state.reset);
  const onUpdated = useHairComponentDrawerStore((state) => state.onUpdated);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: { weight: component.weight },
    validate: zodResolver(
      z.object({
        weight: z.number().nonnegative().max(maxWeight),
      }),
    ),
  });

  const updateHairComponent = trpc.hair.updateHairComponent.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Hair updated.",
      });
      reset();
      onUpdated?.();
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to update Hair",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: { weight: number }) {
    updateHairComponent.mutate({
      id: component.id,
      weight: data.weight,
      hairId: component.hairId,
      parentId: component.parentId,
    });
  }

  return (
    <Drawer
      opened={isOpen && onUpdated !== undefined}
      onClose={() => {
        reset();
        form.reset();
      }}
      position="right"
      title="Update Hair Component"
    >
      <form onSubmit={form.onSubmit(onSubmit)}>
        <NumberInput
          label="Weight"
          placeholder="60"
          suffix="g"
          key={form.key("weight")}
          {...form.getInputProps("weight")}
        />
        <Button disabled={false} fullWidth mt="xl" type="submit">
          {component.id ? "Update" : "Create"}
        </Button>
      </form>
    </Drawer>
  );
};
