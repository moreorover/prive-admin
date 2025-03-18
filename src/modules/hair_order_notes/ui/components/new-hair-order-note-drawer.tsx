"use client";

import { HairOrderNote } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { HairOrderNoteForm } from "@/modules/hair_order_notes/ui/components/hair-order-note-form";
import { trpc } from "@/trpc/client";
import { useHairOrderNoteDrawerStore } from "@/modules/hair_order_notes/ui/hair-order-note-drawer-store";

export const NewHairOrderNoteDrawer = () => {
  const isOpen = useHairOrderNoteDrawerStore((state) => state.isOpen);
  const hairOrderId = useHairOrderNoteDrawerStore((state) => state.hairOrderId);
  const hairOrderNote = useHairOrderNoteDrawerStore((state) => state.note);
  const reset = useHairOrderNoteDrawerStore((state) => state.reset);
  const onCreated = useHairOrderNoteDrawerStore((state) => state.onCreated);

  const newHairOrderNote = trpc.hairOrderNotes.create.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Hair Order Note created.",
      });
      reset();
      onCreated?.();
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to create Hair Order Note",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: HairOrderNote) {
    newHairOrderNote.mutate({ hairOrderId, note: data });
  }

  function onDelete() {
    console.log("onDelete");
  }

  return (
    <Drawer
      opened={isOpen && onCreated !== undefined}
      onClose={() => reset()}
      position="right"
      title="Create Hair Order Note"
    >
      <HairOrderNoteForm
        onSubmitAction={onSubmit}
        onDelete={onDelete}
        hairOrderNote={hairOrderNote}
      />
    </Drawer>
  );
};
