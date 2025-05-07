import { create } from "zustand";

type State = {
	isOpen: boolean;
	transactionId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openDeleteTransactionDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	transactionId: null,
	onSuccess: () => {},
};

const useDeleteTransactionStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openDeleteTransactionDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useDeleteTransactionStoreDrawerIsOpen = () =>
	useDeleteTransactionStore((state) => state.isOpen);

export const useDeleteTransactionStoreDrawerTransactionId = () =>
	useDeleteTransactionStore((state) => state.transactionId);

export const useDeleteTransactionStoreDrawerOnDeleted = () =>
	useDeleteTransactionStore((state) => state.onSuccess);

export const useDeleteTransactionStoreActions = () =>
	useDeleteTransactionStore((state) => state.actions);
