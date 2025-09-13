import { type ContextModalProps, modals } from "@mantine/modals";

import { BanUser } from "@/components/profile/ban-user-modal";
import { ChangePassword } from "@/components/profile/change-password";
import { CreateUser } from "@/components/profile/create-user-modal";
import { EditUser } from "@/components/profile/edit-user";
import { Enable2Fa } from "@/components/profile/enable-2fa-modal";
import { GenerateBackupCodes } from "@/components/profile/generate-backup-codes-modal";
import { ShowTwoFactorQrCode } from "@/components/profile/show-2fa-modal";
import { ShowBackupCodes } from "@/components/profile/show-backup-codes";
import { TotpVerification } from "@/components/profile/totp-verification";
import type { Session } from "@/lib/auth-schema";

export type ModalNames =
	| "totpVerification"
	| "showBackupCodes"
	| "changePassword"
	| "enable2fa"
	| "editUser"
	| "showTwoFactorQrCode"
	| "generateBackupCodes"
	| "createUser"
	| "banUser";

export const modalTitles: Record<ModalNames, string> = {
	totpVerification: "Verify TOTP",
	showBackupCodes: "Your Backup Codes",
	changePassword: "Change Password",
	enable2fa: "Enable 2FA",
	editUser: "Edit User",
	showTwoFactorQrCode: "Show Two Factor QrCode",
	generateBackupCodes: "Generate New Backup Codes",
	createUser: "Create User",
	banUser: "Ban User",
};

export interface ModalPropsMap {
	totpVerification: {
		onVerified: () => void;
	};
	showBackupCodes: object;
	changePassword: object;
	enable2fa: { session: Session };
	editUser: { fullName: string };
	showTwoFactorQrCode: object;
	generateBackupCodes: object;
	createUser: { onCreated: () => void };
	banUser: { userId: string; onBan?: () => void };
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
	},
) {
	modals.openContextModal({
		modal: name,
		title: options.title ?? modalTitles[name],
		innerProps: options.innerProps,
		onClose: options.onClose,
	});
}

export const providerModals = {
	banUser: BanUser,
	changePassword: ChangePassword,
	createUser: CreateUser,
	editUser: EditUser,
	enable2fa: Enable2Fa,
	generateBackupCodes: GenerateBackupCodes,
	showBackupCodes: ShowBackupCodes,
	showTwoFactorQrCode: ShowTwoFactorQrCode,
	totpVerification: TotpVerification,
};
