"use client";

import { Product } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { newProductDrawerAtom } from "@/lib/atoms";
import { trpc } from "@/trpc/client";
import { ProductForm } from "@/modules/products/ui/components/product-form";

export const NewProductDrawer = () => {
  const [value, setOpen] = useAtom(newProductDrawerAtom);

  const newProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      value.onCreated();
      setOpen({ isOpen: false, onCreated: () => {} });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Product created.",
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to create Product",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: Product) {
    newProduct.mutate({ product: data });
  }

  function onDelete() {
    console.log("onDelete");
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() => setOpen({ isOpen: false, onCreated: () => {} })}
      position="right"
      title="Create Product"
    >
      <ProductForm
        onSubmitAction={onSubmit}
        onDelete={onDelete}
        product={{ name: "", description: "" }}
      />
    </Drawer>
  );
};
