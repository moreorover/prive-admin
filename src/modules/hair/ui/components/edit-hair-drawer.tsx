"use client";

import { Hair } from "@/lib/schemas";
import { Drawer } from "@mantine/core";
import { HairForm } from "@/modules/hair/ui/components/hair-form";
import { useHairDrawerStore } from "@/modules/hair/ui/hair-drawer-store";
import { notifications } from "@mantine/notifications";
import { trpc } from "@/trpc/client";

export const EditHairDrawer = () => {
  const isOpen = useHairDrawerStore((state) => state.isOpen);
  const hair = useHairDrawerStore((state) => state.hair);
  const reset = useHairDrawerStore((state) => state.reset);
  const onUpdated = useHairDrawerStore((state) => state.onUpdated);
  const openDrawer = useHairDrawerStore((state) => state.openDrawer);

  const newHair = trpc.hair.update.useMutation({
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

  async function onSubmit(data: Hair) {
    newHair.mutate({ hair: data });
  }

  return (
    <Drawer
      opened={isOpen && onUpdated !== undefined}
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
