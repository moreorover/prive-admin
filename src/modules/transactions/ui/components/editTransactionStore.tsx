import type { Transaction } from "@/lib/schemas";
import dayjs from "dayjs";
import { create } from "zustand";

type State = {
	isOpen: boolean;
	transaction: Transaction;
	onUpdated: () => void;
};

type Actions = {
	openEditTransactionDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	transaction: {
		name: "",
		notes: "",
		amount: 0,
		type: "CASH",
		status: "PENDING",
		completedDateBy: dayjs().toDate(),
	},
	onUpdated: () => {},
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

export const useEditTransactionStoreDrawerTransaction = () =>
	useEditTransactionStore((state) => state.transaction);

export const useEditTransactionStoreDrawerOnUpdated = () =>
	useEditTransactionStore((state) => state.onUpdated);

export const useEditTransactionStoreActions = () =>
	useEditTransactionStore((state) => state.actions);
