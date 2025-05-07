import { create } from "zustand";

type State = {
	isOpen: boolean;
	onSuccess: () => void;
};

type Actions = {
	openNewCustomerDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	onSuccess: () => {},
};

const useNewCustomerStore = create<State & { actions: Actions }>((set) => ({
	...initialState,
	actions: {
		openNewCustomerDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useNewCustomerStoreDrawerIsOpen = () =>
	useNewCustomerStore((state) => state.isOpen);

export const useNewCustomerStoreDrawerOnSuccess = () =>
	useNewCustomerStore((state) => state.onSuccess);

export const useNewCustomerStoreActions = () =>
	useNewCustomerStore((state) => state.actions);
