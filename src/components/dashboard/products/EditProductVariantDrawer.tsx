"use client";

import ProductVariantForm from "@/components/dashboard/products/ProductVariantForm";
import { ProductVariant } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { updateProductVariant } from "@/data-access/productVariant";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editProductVariantDrawerAtom } from "@/lib/atoms";

export default function EditProductVariantDrawer() {
  const [value, setOpen] = useAtom(editProductVariantDrawerAtom);

  async function onSubmit(data: ProductVariant) {
    const response = await updateProductVariant({
      ...data,
      id: value.productVariant.id,
    });

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to update Product Variant",
        message: "Please try again.",
      });
    } else {
      setOpen({
        isOpen: false,
        productVariant: { productId: "", size: "", price: 0, stock: 0 },
      });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Product Variant updated.",
      });
    }
    return response;
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() =>
        setOpen({
          isOpen: false,
          productVariant: { productId: "", size: "", price: 0, stock: 0 },
        })
      }
      position="right"
      title="Update ProductVariant"
    >
      <ProductVariantForm
        onSubmitAction={onSubmit}
        productVariant={{
          ...value.productVariant,
        }}
      />
    </Drawer>
  );
}
