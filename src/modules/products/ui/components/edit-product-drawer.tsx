"use client";

import { editProductDrawerAtom } from "@/lib/atoms";
import type { Product } from "@/lib/schemas";
import { ProductForm } from "@/modules/products/ui/components/product-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";

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
