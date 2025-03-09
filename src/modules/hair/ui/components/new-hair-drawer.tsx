"use client";

import { Hair } from "@/lib/schemas";
import { Drawer } from "@mantine/core";
import { HairForm } from "@/modules/hair/ui/components/hair-form";
import { useHairDrawerStore } from "@/modules/hair/ui/hair-drawer-store";
import { notifications } from "@mantine/notifications";
import { trpc } from "@/trpc/client";

export const NewHairDrawer = () => {
  const isOpen = useHairDrawerStore((state) => state.isOpen);
  const hair = useHairDrawerStore((state) => state.hair);
  const hairOrderId = useHairDrawerStore((state) => state.hairOrderId);
  const reset = useHairDrawerStore((state) => state.reset);
  const onCreated = useHairDrawerStore((state) => state.onCreated);
  const openDrawer = useHairDrawerStore((state) => state.openDrawer);

  const newHair = trpc.hair.create.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Hair created.",
      });
      reset();
      onCreated?.();
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to create Hair",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: Hair) {
    newHair.mutate({ hair: data, hairOrderId });
  }

  return (
    <Drawer
      opened={isOpen && onCreated !== undefined}
      onClose={() => openDrawer({ onCreated: () => {} })}
      position="right"
      title="Create Hair"
    >
      <HairForm
        onSubmitAction={onSubmit}
        hair={hair}
        disabled={newHair.isPending}
      />
    </Drawer>
  );
};
