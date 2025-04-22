"use client";

import { newProductVariantDrawerAtom } from "@/lib/atoms";
import type { ProductVariant } from "@/lib/schemas";
import { ProductVariantForm } from "@/modules/product_variants/ui/components/product-variant-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";

export const NewProductVariantDrawer = () => {
	const [value, setOpen] = useAtom(newProductVariantDrawerAtom);

	const newProductVariant = trpc.productVariants.create.useMutation({
		onSuccess: () => {
			value.onCreated();
			setOpen({ isOpen: false, productId: "", onCreated: () => {} });
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Product Variant created.",
			});
		},
		onError: () => {
			notifications.show({
				color: "red",
				title: "Failed to create Product Variant",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: ProductVariant) {
		newProductVariant.mutate({
			productVariant: data,
			productId: value.productId,
		});
	}

	return (
		<Drawer
			opened={value.isOpen}
			onClose={() =>
				setOpen({ isOpen: false, productId: "", onCreated: () => {} })
			}
			position="right"
			title="Create Product Variant"
		>
			<ProductVariantForm
				onSubmitAction={onSubmit}
				productVariant={{
					size: "",
					price: 0,
					stock: 0,
				}}
			/>
		</Drawer>
	);
};
