"use client";

import { ProductVariant } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { Drawer } from "@mantine/core";
import { useAtom } from "jotai";
import { editProductVariantDrawerAtom } from "@/lib/atoms";
import { ProductVariantForm } from "@/modules/product_variants/ui/components/product-variant-form";
import { trpc } from "@/trpc/client";

export const EditProductVariantDrawer = () => {
  const [value, setOpen] = useAtom(editProductVariantDrawerAtom);

  const updateProductVariant = trpc.productVariants.update.useMutation({
    onSuccess: () => {
      value.onUpdated();
      setOpen({
        isOpen: false,
        productVariant: { size: "", price: 0, stock: 0 },
        onUpdated: () => {},
      });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Product Variant updated.",
      });
    },
    onError: (e) => {
      console.log({ e });
      notifications.show({
        color: "red",
        title: "Failed to update Product Variant",
        message: "Please try again.",
      });
    },
  });

  async function onSubmit(data: ProductVariant) {
    updateProductVariant.mutate({ productVariant: data });
  }

  return (
    <Drawer
      opened={value.isOpen}
      onClose={() =>
        setOpen({
          isOpen: false,
          productVariant: { size: "", price: 0, stock: 0 },
          onUpdated: () => {},
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
};
