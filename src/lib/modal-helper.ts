import { ChangePassword } from "@/components/profile/change-password";
import { EditUser } from "@/components/profile/edit-user";
import { HairOrderTotalWeightModal } from "@/modules/hair_orders/ui/components/hair-order-total-weight-modal";
import { HairOrderPickerModal } from "@/modules/ui/components/hair-order-picker-modal";
import { HairSalePickerModal } from "@/modules/ui/components/hair-sale-picker-modal";
import { type ContextModalProps, modals } from "@mantine/modals";

export type ModalNames =
	| "hairOrderTotalWeight"
	| "hairOrderPicker"
	| "hairSalePicker"
	| "changePassword"
	| "editUser";

export const modalTitles: Record<ModalNames, string> = {
	hairOrderTotalWeight: "Please input total weight in grams:",
	hairOrderPicker: "Please select hair order:",
	hairSalePicker: "Please select hair order:",
	changePassword: "Change Password",
	editUser: "Edit User",
};

export interface ModalPropsMap {
	hairOrderTotalWeight: {
		weight: number;
		onConfirm: (weight: number) => void;
	};
	hairOrderPicker: {
		appointmentId: string;
		onConfirm: (id: string[]) => void;
		multiple: boolean;
	};
	hairSalePicker: {
		hairSaleId: string;
		onConfirm: (id: string[]) => void;
		multiple: boolean;
	};
	changePassword: object;
	editUser: { fullName: string };
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
	hairSalePicker: HairSalePickerModal,
	changePassword: ChangePassword,
	editUser: EditUser,
};
