"use client";

import { editHairAssignmentToSaleDrawerAtom } from "@/lib/atoms";
import type { HairAssignedToSale } from "@/lib/schemas";
import { HairAssignmentToSaleForm } from "@/modules/hair-sales/ui/components/hair-assignment-to-sale-form";
import { trpc } from "@/trpc/client";
import { Drawer } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai/index";

export const EditHairAssignmentToSaleDrawer = () => {
	const [value, setOpen] = useAtom(editHairAssignmentToSaleDrawerAtom);

	const editHairAssignment = trpc.hairSales.updateHairAssignment.useMutation({
		onSuccess: () => {
			notifications.show({
				color: "green",
				title: "Success!",
				message: "Hair assignment updated.",
			});
			value.onUpdated();
			setOpen({
				isOpen: false,
				hairAssignment: {
					id: "",
					hairOrderId: "",
					hairSaleId: "",
					weightInGrams: 0,
					soldFor: 0,
				},
				maxWeight: 0,
				onUpdated: () => {},
			});
		},
		onError: (e) => {
			console.error(e);
			notifications.show({
				color: "red",
				title: "Failed to update Hair assignment",
				message: "Please try again.",
			});
		},
	});

	async function onSubmit(data: HairAssignedToSale) {
		editHairAssignment.mutate({
			hairAssignment: data,
		});
	}

	return (
		<>
			<Drawer
				opened={value.isOpen}
				onClose={() =>
					setOpen({
						isOpen: false,
						hairAssignment: {
							id: "",
							hairOrderId: "",
							hairSaleId: "",
							weightInGrams: 0,
							soldFor: 0,
						},
						maxWeight: 0,
						onUpdated: () => {},
					})
				}
				position="right"
				title="Update Hair Assignment"
			>
				<HairAssignmentToSaleForm
					onSubmitAction={onSubmit}
					hairAssignment={value.hairAssignment}
					maxWeight={value.maxWeight}
					disabled={editHairAssignment.isPending}
				/>
			</Drawer>
		</>
	);
};
