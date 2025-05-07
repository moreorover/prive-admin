import { create } from "zustand";

type State = {
	isOpen: boolean;
	relations: {
		appointmentId?: string | null | undefined;
		orderId?: string | null | undefined;
		customerId: string;
		hairOrderId?: string | null | undefined;
	};
	onCreated: () => void;
};

type Actions = {
	openNewTransactionDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	relations: {
		customerId: "",
	},
	onCreated: () => {},
};

const useNewTransactionStore = create<State & { actions: Actions }>((set) => ({
	...initialState,
	actions: {
		openNewTransactionDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useNewTransactionStoreDrawerIsOpen = () =>
	useNewTransactionStore((state) => state.isOpen);

export const useNewTransactionStoreDrawerRelations = () =>
	useNewTransactionStore((state) => state.relations);

export const useNewTransactionStoreDrawerOnCreated = () =>
	useNewTransactionStore((state) => state.onCreated);

export const useNewTransactionStoreActions = () =>
	useNewTransactionStore((state) => state.actions);
