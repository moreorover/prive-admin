"use client";

import { Product } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editProductDrawerAtom } from "@/lib/atoms";
import { trpc } from "@/trpc/client";
import { ProductForm } from "@/modules/products/ui/components/product-form";

export const EditProductDrawer = () => {
  const [value, setOpen] = useAtom(editProductDrawerAtom);

  const editProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      value.onUpdated();
      setOpen({
        isOpen: false,
        product: { name: "", description: "" },
        onUpdated: () => {},
      });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Product created.",
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to update Product",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: Product) {
    editProduct.mutate({ product: data });
  }

  function onDelete() {
    console.log("onDelete");
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() =>
        setOpen({
          isOpen: false,
          product: { name: "", description: "" },
          onUpdated: () => {},
        })
      }
      position="right"
      title="Update Product"
    >
      <ProductForm
        onSubmitAction={onSubmit}
        onDelete={onDelete}
        product={{
          ...value.product,
        }}
      />
    </Drawer>
  );
};
