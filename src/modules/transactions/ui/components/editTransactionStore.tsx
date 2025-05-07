import { create } from "zustand";

type State = {
	isOpen: boolean;
	transactionId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openEditTransactionDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	transactionId: null,
	onSuccess: () => {},
};

export const useEditTransactionStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openEditTransactionDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useEditTransactionStoreDrawerIsOpen = () =>
	useEditTransactionStore((state) => state.isOpen);

export const useEditTransactionStoreDrawerTransactionId = () =>
	useEditTransactionStore((state) => state.transactionId);

export const useEditTransactionStoreDrawerOnUpdated = () =>
	useEditTransactionStore((state) => state.onSuccess);

export const useEditTransactionStoreActions = () =>
	useEditTransactionStore((state) => state.actions);
