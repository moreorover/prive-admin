"use client";

import ProductForm from "@/components/dashboard/products/ProductForm";
import { Product } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { updateProduct } from "@/data-access/product";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editProductDrawerAtom } from "@/lib/atoms";

export default function EditProductDrawer() {
  const [value, setOpen] = useAtom(editProductDrawerAtom);

  async function onSubmit(data: Product) {
    const response = await updateProduct({ ...data, id: value.product.id });

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to update Product",
        message: "Please try again.",
      });
    } else {
      setOpen({ isOpen: false, product: { name: "", description: "" } });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Product updated.",
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
      onClose={() =>
        setOpen({ isOpen: false, product: { name: "", description: "" } })
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
}
