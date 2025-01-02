"use client";

import ProductForm from "@/components/dashboard/products/ProductForm";
import { Product } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { createProduct } from "@/data-access/product";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { newProductDrawerAtom } from "@/lib/atoms";

export default function NewProductDrawer() {
  const [value, setOpen] = useAtom(newProductDrawerAtom);

  async function onSubmit(data: Product) {
    const response = await createProduct(data);

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to create Product",
        message: "Please try again.",
      });
    } else {
      setOpen({ isOpen: false });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Product created.",
      });
    }
    return response;
  }

  function onDelete() {
    console.log("onDelete");
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() => setOpen({ isOpen: false })}
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
}
