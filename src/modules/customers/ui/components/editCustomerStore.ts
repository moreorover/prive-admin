import { create } from "zustand";

type State = {
	isOpen: boolean;
	customerId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openEditCustomerDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	customerId: null,
	onSuccess: () => {},
};

export const useEditCustomerStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openEditCustomerDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useEditCustomerStoreDrawerIsOpen = () =>
	useEditCustomerStore((state) => state.isOpen);

export const useEditCustomerStoreDrawerCustomerId = () =>
	useEditCustomerStore((state) => state.customerId);

export const useEditCustomerStoreDrawerOnSuccess = () =>
	useEditCustomerStore((state) => state.onSuccess);

export const useEditCustomerStoreActions = () =>
	useEditCustomerStore((state) => state.actions);
