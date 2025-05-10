import { ChangePassword } from "@/components/profile/change-password";
import { EditUser } from "@/components/profile/edit-user";
import { type ContextModalProps, modals } from "@mantine/modals";

export type ModalNames = "changePassword" | "editUser";

export const modalTitles: Record<ModalNames, string> = {
	changePassword: "Change Password",
	editUser: "Edit User",
};

export interface ModalPropsMap {
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
	changePassword: ChangePassword,
	editUser: EditUser,
};
