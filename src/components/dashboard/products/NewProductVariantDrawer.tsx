"use client";

import ProductVariantForm from "@/components/dashboard/products/ProductVariantForm";
import { ProductVariant } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { createProductVariant } from "@/data-access/productVariant";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { newProductVariantDrawerAtom } from "@/lib/atoms";

export default function NewProductVariantDrawer() {
  const [value, setOpen] = useAtom(newProductVariantDrawerAtom);

  async function onSubmit(data: ProductVariant) {
    const response = await createProductVariant(data);

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to create Product Variant",
        message: "Please try again.",
      });
    } else {
      setOpen({ isOpen: false, productId: "" });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Product Variant created.",
      });
    }
    return response;
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() => setOpen({ isOpen: false, productId: "" })}
      position="right"
      title="Create Product Variant"
    >
      <ProductVariantForm
        onSubmitAction={onSubmit}
        productVariant={{
          size: "",
          price: 0,
          stock: 0,
          productId: value.productId,
        }}
      />
    </Drawer>
  );
}
