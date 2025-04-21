import { type ContextModalProps, modals } from "@mantine/modals";

export type ModalNames = "hairOrderTotalWeight";

export const modalTitles: Record<ModalNames, string> = {
	hairOrderTotalWeight: "Please input total weight in grams:",
};

export interface ModalPropsMap {
	hairOrderTotalWeight: {
		weight: number;
		onConfirm: (weight: number) => void;
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
	},
) {
	modals.openContextModal({
		modal: name,
		title: options.title ?? modalTitles[name],
		innerProps: options.innerProps,
		onClose: options.onClose,
	});
}
