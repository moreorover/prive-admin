import { create } from "zustand";

type State = {
	isOpen: boolean;
	onSuccess: () => void;
};

type Actions = {
	openNewHairOrderDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	onSuccess: () => {},
};

const useNewHairOrderStore = create<State & { actions: Actions }>((set) => ({
	...initialState,
	actions: {
		openNewHairOrderDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useNewHairOrderStoreDrawerIsOpen = () =>
	useNewHairOrderStore((state) => state.isOpen);

export const useNewHairOrderStoreDrawerOnSuccess = () =>
	useNewHairOrderStore((state) => state.onSuccess);

export const useNewHairOrderStoreActions = () =>
	useNewHairOrderStore((state) => state.actions);
