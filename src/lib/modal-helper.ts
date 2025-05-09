import { ChangePassword } from "@/components/profile/change-password";
import { EditUser } from "@/components/profile/edit-user";
import { HairOrderPickerModal } from "@/modules/ui/components/hair-order-picker-modal";
import { type ContextModalProps, modals } from "@mantine/modals";

export type ModalNames = "hairOrderPicker" | "changePassword" | "editUser";

export const modalTitles: Record<ModalNames, string> = {
	hairOrderPicker: "Please select hair order:",
	changePassword: "Change Password",
	editUser: "Edit User",
};

export interface ModalPropsMap {
	hairOrderPicker: {
		appointmentId: string;
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
	hairOrderPicker: HairOrderPickerModal,
	changePassword: ChangePassword,
	editUser: EditUser,
};
