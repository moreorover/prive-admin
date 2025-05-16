import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairOrderId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openEditHairOrderDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	hairOrderId: null,
	onSuccess: () => {},
};

const useEditHairOrderStore = create<State & { actions: Actions }>((set) => ({
	...initialState,
	actions: {
		openEditHairOrderDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useEditHairOrderStoreDrawerIsOpen = () =>
	useEditHairOrderStore((state) => state.isOpen);

export const useEditHairOrderStoreDrawerHairOrderId = () =>
	useEditHairOrderStore((state) => state.hairOrderId);

export const useEditHairOrderStoreDrawerOnSuccess = () =>
	useEditHairOrderStore((state) => state.onSuccess);

export const useEditHairOrderStoreActions = () =>
	useEditHairOrderStore((state) => state.actions);
