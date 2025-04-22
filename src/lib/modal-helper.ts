import { HairOrderTotalWeightModal } from "@/modules/hair_orders/ui/components/hair-order-total-weight-modal";
import { HairOrderPickerModal } from "@/modules/ui/components/hair-order-picker-modal";
import { type ContextModalProps, modals } from "@mantine/modals";

export type ModalNames = "hairOrderTotalWeight" | "hairOrderPicker";

export const modalTitles: Record<ModalNames, string> = {
	hairOrderTotalWeight: "Please input total weight in grams:",
	hairOrderPicker: "Please select hair order:",
};

export interface ModalPropsMap {
	hairOrderTotalWeight: {
		weight: number;
		onConfirm: (weight: number) => void;
	};
	hairOrderPicker: {
		appointmentId: string;
		onConfirm: (id: number[]) => void;
		multiple: boolean;
	};
}

export type TypedContextModalProps<K extends ModalNames> = ContextModalProps<
	ModalPropsMap[K]
>;

export function openTypedContextModal<N extends ModalNames>(
	name: N,
	options: {
		title?: string;
		innerProps: ModalPropsMap[N];
		onClose?: () => void;
		size?: "xs" | "sm" | "md" | "lg" | "xl" | "auto";
	},
) {
	modals.openContextModal({
		modal: name,
		size: options.size ?? "auto",
		title: options.title ?? modalTitles[name],
		innerProps: options.innerProps,
		onClose: options.onClose,
	});
}

export const providerModals = {
	hairOrderTotalWeight: HairOrderTotalWeightModal,
	hairOrderPicker: HairOrderPickerModal,
};
